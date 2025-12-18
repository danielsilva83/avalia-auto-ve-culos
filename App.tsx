
import React, { useState, useEffect } from 'react';
import VehicleForm from './components/PropertyForm'; 
import AnalysisResult from './components/AnalysisResult';
import LoginScreen from './components/LoginScreen';
import PricingModal from './components/PricingModal';
import { analyzeVehicle } from './services/geminiService';
import { authService } from './services/authService';
import { supabase } from './services/supabaseClient';
import { VehicleFormData, AnalysisResponse, AppState, User } from './types';
import { Car, LogOut, Star } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LOADING);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!supabase) {
      setAppState(AppState.LOGIN);
      return;
    }

    // Gerencia a sessão de forma reativa
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth State Change:", event, !!session);
      if (session?.user) {
        try {
          const profile = await authService.getProfile(session.user);
          setUser(profile);
          setAppState(AppState.FORM);
        } catch (e) {
          console.error("Erro ao carregar perfil:", e);
          setAppState(AppState.LOGIN);
        }
      } else if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setAppState(AppState.LOGIN);
      }
    });

    // Verificação inicial de sessão
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await authService.getProfile(session.user);
          setUser(profile);
          setAppState(AppState.FORM);
        } else {
          // Pequeno delay para permitir que o onAuthStateChange capture o evento de retorno do OAuth
          setTimeout(() => {
            setAppState(prev => prev === AppState.LOADING ? AppState.LOGIN : prev);
          }, 1500);
        }
      } catch (err) {
        console.error("Session check error:", err);
        setAppState(AppState.LOGIN);
      }
    };
    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    setError(null);
    try {
      await authService.login(); 
    } catch (e: any) {
      setError(e.message || "Falha ao iniciar login.");
    }
  };

  const handleLogout = async () => {
    try {
      setAppState(AppState.LOADING);
      if (supabase) {
        await authService.logout();
      }
    } catch (e) {
      console.error("Erro ao deslogar", e);
    } finally {
      setUser(null);
      setResult(null);
      setAppState(AppState.LOGIN);
    }
  };

  const handleUpgradeSuccess = async () => {
    if (supabase) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const updated = await authService.getProfile(authUser);
        setUser(updated);
      }
    }
    setAppState(AppState.FORM);
  };

  const handleFormSubmit = async (data: VehicleFormData) => {
    if (!user) return;
    setAppState(AppState.ANALYZING);
    setError(null);

    try {
      const userWithCredits = await authService.consumeCredit(user);
      if (!userWithCredits) {
        setAppState(AppState.PRICING);
        return;
      }
      setUser(userWithCredits);
      const response = await analyzeVehicle(data);
      setResult(response);
      setAppState(AppState.RESULT);
    } catch (err: any) {
      setError(err.message || "Erro ao analisar o veículo.");
      setAppState(AppState.ERROR);
    }
  };

  const resetApp = () => {
    setAppState(AppState.FORM);
    setResult(null);
    setError(null);
  };

  // Splash Screen de Carregamento Geral (Sessão / Logout)
  if (appState === AppState.LOADING) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <div className="bg-slate-900 p-4 rounded-2xl shadow-xl mb-6">
          <Car className="w-10 h-10 text-white" />
        </div>
        <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full mb-4"></div>
        <h2 className="text-xl font-bold text-slate-900 font-['Playfair_Display']">AvalIA AI Automóveis</h2>
        <p className="text-slate-400 text-sm mt-2 max-w-xs">Preparando seu ambiente seguro...</p>
      </div>
    );
  }

  if (appState === AppState.LOGIN) {
    return <LoginScreen onLogin={handleLogin} error={error} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 cursor-pointer" onClick={resetApp}>
            <Car className="w-6 h-6" />
            <h1 className="text-lg font-bold tracking-tight font-['Playfair_Display']">AvalIA AI</h1>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <div 
                onClick={() => setAppState(AppState.PRICING)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                  user.isPro ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {user.isPro ? <><Star className="w-3 h-3 fill-current" /> PRO</> : <>{user.credits} CRÉDITOS</>}
              </div>
              <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8">
        {appState === AppState.PRICING && <PricingModal onUpgrade={handleUpgradeSuccess} onClose={() => setAppState(AppState.FORM)} />}
        
        {appState === AppState.FORM && user && (
          <div className="animate-fade-in-up">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-800">Olá, {user.name.split(' ')[0]}</h2>
              <p className="text-gray-500 mt-1 text-sm">{user.isPro ? "Acesso PRO liberado." : `Você tem ${user.credits} avaliações gratuitas.`}</p>
            </div>
            <VehicleForm onSubmit={handleFormSubmit} isLoading={false} />
          </div>
        )}

        {/* Específico para Análise da IA */}
        {appState === AppState.ANALYZING && (
           <div className="flex flex-col items-center justify-center pt-20 space-y-4">
              <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
              <h3 className="text-lg font-medium text-gray-600">Analisando Mercado...</h3>
              <p className="text-sm text-gray-400 text-center max-w-xs">Comparando FIPE e anúncios ativos na web.</p>
           </div>
        )}

        {appState === AppState.RESULT && result && <AnalysisResult data={result} onReset={resetApp} />}

        {appState === AppState.ERROR && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-4">
            <h3 className="text-red-800 font-bold text-lg">Ops! Algo deu errado</h3>
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={resetApp} className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg">Tentar Novamente</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;