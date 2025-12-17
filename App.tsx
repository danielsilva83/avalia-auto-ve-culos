
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const isInitializing = useRef(true);

  // Função para sincronizar sessão com tratamento de erro global
  const syncUserSession = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setAppState(AppState.FORM);
      } else {
        setUser(null);
        setAppState(AppState.LOGIN);
      }
    } catch (e) {
      console.error("Erro crítico na sincronização de sessão:", e);
      setUser(null);
      setAppState(AppState.LOGIN);
    } finally {
      isInitializing.current = false;
    }
  }, []);

  useEffect(() => {
    // 1. Timeout de segurança: Se em 6 segundos ainda estiver carregando, força Login.
    const safetyTimeout = setTimeout(() => {
      if (appState === AppState.LOADING && isInitializing.current) {
        console.warn("Auth initialization timed out. Forcing login screen.");
        setAppState(AppState.LOGIN);
        isInitializing.current = false;
      }
    }, 6000);

    // 2. Tenta recuperar sessão inicial
    syncUserSession();

    // 3. Ouve mudanças de estado (Login/Logout)
    let subscription: any = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(`Supabase Auth Event: ${event}`);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await syncUserSession();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setAppState(AppState.LOGIN);
        }
      });
      subscription = data.subscription;
    }

    return () => {
      clearTimeout(safetyTimeout);
      if (subscription) subscription.unsubscribe();
    };
  }, [syncUserSession]);

  const handleLogin = async () => {
    setError(null);
    try {
      await authService.login(); 
      // O fluxo continuará via onAuthStateChange
    } catch (e: any) {
      console.error("Login failed", e);
      setError(e.message || "Falha ao iniciar login.");
    }
  };

  const handleLogout = async () => {
    try {
      setAppState(AppState.LOADING);
      await authService.logout();
    } catch (e) {
      console.error("Erro ao deslogar", e);
    } finally {
      setUser(null);
      setResult(null);
      setError(null);
      setAppState(AppState.LOGIN);
    }
  };

  const handleUpgrade = async () => {
    if (!user) return;
    try {
      const upgradedUser = await authService.upgradeToPro(user);
      setUser(upgradedUser);
      setAppState(AppState.FORM);
    } catch (e) {
      console.error("Upgrade failed", e);
      alert("Erro ao processar pagamento. Tente novamente.");
    }
  };

  const handleFormSubmit = async (data: VehicleFormData) => {
    if (!user) return;
    if (appState === AppState.LOADING) return;

    try {
      const userWithCredits = await authService.consumeCredit(user);
      
      if (!userWithCredits) {
        setAppState(AppState.PRICING);
        return;
      }

      setUser(userWithCredits);
      setAppState(AppState.LOADING);
      setError(null);

      const response = await analyzeVehicle(data);
      setResult(response);
      setAppState(AppState.RESULT);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocorreu um erro ao analisar o veículo.");
      setAppState(AppState.ERROR);
    }
  };

  const resetApp = () => {
    setAppState(AppState.FORM);
    setResult(null);
    setError(null);
  };

  // Splash Screen de Autenticação (Apenas se não tiver usuário E estiver carregando)
  if (appState === AppState.LOADING && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <div className="bg-slate-900 p-4 rounded-2xl shadow-xl mb-6">
          <Car className="w-10 h-10 text-white" />
        </div>
        <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full mb-4"></div>
        <h2 className="text-xl font-bold text-slate-900 font-['Playfair_Display']">AvalIA AI Automóveis</h2>
        <p className="text-slate-400 text-sm mt-2 max-w-xs">Restaurando sua sessão segura...</p>
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
                  user.isPro 
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {user.isPro ? (
                  <><Star className="w-3 h-3 fill-current" /> PRO</>
                ) : (
                  <>{user.credits} CRÉDITOS</>
                )}
              </div>

              <button 
                onClick={handleLogout} 
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8 relative">
        {appState === AppState.PRICING && (
          <PricingModal onUpgrade={handleUpgrade} onClose={() => setAppState(AppState.FORM)} />
        )}

        {appState === AppState.FORM && user && (
          <div className="animate-fade-in-up">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-800">Olá, {user.name.split(' ')[0]}</h2>
              <p className="text-gray-500 mt-1 text-sm">
                {user.isPro ? "Acesso PRO liberado." : `Você tem ${user.credits} avaliações gratuitas.`}
              </p>
            </div>
            <VehicleForm onSubmit={handleFormSubmit} isLoading={false} />
          </div>
        )}

        {appState === AppState.LOADING && user && (
           <div className="flex flex-col items-center justify-center pt-20 space-y-4">
              <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
              <h3 className="text-lg font-medium text-gray-600">Analisando Mercado...</h3>
              <p className="text-sm text-gray-400 text-center max-w-xs">Comparando FIPE e anúncios ativos.</p>
           </div>
        )}

        {appState === AppState.RESULT && result && (
          <div className="animate-fade-in">
            <AnalysisResult data={result} onReset={resetApp} />
          </div>
        )}

        {appState === AppState.ERROR && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-4">
            <div className="text-red-500 text-5xl mb-2">⚠️</div>
            <h3 className="text-red-800 font-bold text-lg">Erro na Análise</h3>
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={resetApp} className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg">Tentar Novamente</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
