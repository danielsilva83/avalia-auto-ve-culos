import React, { useState, useEffect } from 'react';
import VehicleForm from './components/PropertyForm'; 
import AnalysisResult from './components/AnalysisResult';
import LoginScreen from './components/LoginScreen';
import PricingModal from './components/PricingModal';
import { analyzeVehicle } from './services/geminiService';
import { authService } from './services/authService';
import { supabase } from './services/supabaseClient'; // Import para listener
import { VehicleFormData, AnalysisResponse, AppState, User } from './types';
import { Car, User as UserIcon, LogOut, Star } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LOADING); // Começa carregando para checar sessão
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Inicialização e Listener de Auth
  useEffect(() => {
    const initAuth = async () => {
      // Verifica usuário atual ao carregar
      const currentUser = await authService.getCurrentUser();
      
      if (currentUser) {
        setUser(currentUser);
        setAppState(AppState.FORM);
      } else {
        setAppState(AppState.LOGIN);
      }
    };

    initAuth();

    // Se estiver usando Supabase, configura listener para mudanças de estado (Login/Logout em outras abas ou redirect)
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Quando logar, busca os dados atualizados do perfil (créditos)
          const updatedUser = await authService.getCurrentUser();
          setUser(updatedUser);
          setAppState(AppState.FORM);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setAppState(AppState.LOGIN);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const handleLogin = async () => {
    setError(null);
    try {
      // O authService.login com Supabase faz redirect, então o código abaixo pode não executar imediatamente
      // Se for Mock, ele retorna o usuário direto.
      const loggedUser = await authService.login(); 
      if (loggedUser) {
        setUser(loggedUser);
        setAppState(AppState.FORM);
      }
    } catch (e: any) {
      console.error("Login failed", e);
      setError(e.message || "Falha ao iniciar login.");
      // Rethrow para o LoginScreen parar o loading
      throw e;
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.error("Erro ao deslogar", e);
    } finally {
      // Força a limpeza do estado local independente do backend
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

    // 1. Consumir crédito no Backend
    // O backend (Supabase) vai validar e decrementar
    const userWithCredits = await authService.consumeCredit(user);
    
    if (!userWithCredits) {
      // Se retornou null, é porque não tem crédito ou erro
      setAppState(AppState.PRICING);
      return;
    }

    // Atualiza estado local com os créditos novos vindos do DB
    setUser(userWithCredits);

    // 2. Prosseguir com Análise
    setAppState(AppState.LOADING);
    setError(null);
    try {
      const response = await analyzeVehicle(data);
      setResult(response);
      setAppState(AppState.RESULT);
    } catch (err: any) {
      console.error(err);
      setError("Ocorreu um erro ao analisar o veículo. Seus créditos foram preservados (simulação).");
      // Idealmente, aqui chamaria uma função de estorno no backend se falhasse
      setAppState(AppState.ERROR);
    }
  };

  const resetApp = () => {
    setAppState(AppState.FORM);
    setResult(null);
    setError(null);
  };

  // Renderização condicional baseada no Loading Inicial
  if (appState === AppState.LOADING && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (appState === AppState.LOGIN) {
    return <LoginScreen onLogin={handleLogin} error={error} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900" onClick={resetApp} style={{cursor: 'pointer'}}>
            <Car className="w-6 h-6" />
            <h1 className="text-lg font-bold tracking-tight font-['Playfair_Display']">AvalIA AI Automóveis</h1>
          </div>
          
          {user && (
            <div className="flex items-center gap-2">
              {/* Credit Counter */}
              <div 
                onClick={() => setAppState(AppState.PRICING)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors mr-1 ${
                  user.isPro 
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {user.isPro ? (
                  <><Star className="w-3 h-3 fill-current" /> PRO</>
                ) : (
                  <>{user.credits} <span className="hidden sm:inline">Créditos</span></>
                )}
              </div>

              <button 
                onClick={handleLogout} 
                className="flex items-center gap-1 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-3 py-1.5 rounded-lg transition-all text-sm font-medium"
                title="Sair"
              >
                <span className="hidden sm:inline">Sair</span>
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-8 relative">
        
        {/* Render Pricing Modal Over Content if State is PRICING */}
        {appState === AppState.PRICING && (
          <PricingModal onUpgrade={handleUpgrade} onClose={() => setAppState(AppState.FORM)} />
        )}

        {appState === AppState.FORM && (
          <div className="animate-fade-in-up">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-800">
                Olá, {user?.name.split(' ')[0]}
              </h2>
              <p className="text-gray-500 mt-1 text-sm">
                {user?.isPro 
                  ? "Você tem acesso ilimitado ao consultor." 
                  : `Você tem ${user?.credits} avaliações gratuitas restantes.`}
              </p>
            </div>
            <VehicleForm onSubmit={handleFormSubmit} isLoading={false} />
          </div>
        )}

        {appState === AppState.LOADING && user && (
           <div className="flex flex-col items-center justify-center pt-20 animate-pulse space-y-4">
              <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
              <h3 className="text-lg font-medium text-gray-600">Consultando Tabela FIPE...</h3>
              <p className="text-sm text-gray-400 text-center max-w-xs">
                O AvalIA AI Automóveis está comparando o veículo com ofertas no Webmotors, OLX e iCarros.
              </p>
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
            <button 
              onClick={resetApp}
              className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;