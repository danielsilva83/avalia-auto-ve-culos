
import React, { useState, useEffect, useCallback, useRef } from 'react';
import VehicleForm from './components/PropertyForm'; 
import AnalysisResult from './components/AnalysisResult';
import LoginScreen from './components/LoginScreen';
import PricingModal from './components/PricingModal';
import SeoModelPage from './components/SeoModelPage';
import ModelDirectory from './components/ModelDirectory';
import UserDashboard from './components/UserDashboard';
import { analyzeVehicle } from './services/geminiService';
import { authService } from './services/authService';
import { historyService } from './services/historyService';
import { supabase } from './services/supabaseClient';
import { VehicleFormData, AnalysisResponse, AppState, User } from './types';
import { Car, LogOut, Star, MapPin, ChevronLeft, Loader2, AlertCircle, Sparkles, LayoutGrid } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LOADING);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [selectedUf, setSelectedUf] = useState<string>(localStorage.getItem('avalia_uf') || 'SP');
  const [vehicleData, setVehicleData] = useState<VehicleFormData | null>(null);
  const [seoInfo, setSeoInfo] = useState<{brand: string, model: string} | null>(null);
  
  const isInitializing = useRef(true);
  const APP_URL = "https://www.avaliaaiautomoveis.com/";

  // Função para detectar rotas de SEO
  const checkSeoRoutes = useCallback(() => {
    const path = window.location.pathname;
    if (path.startsWith('/modelo/')) {
      const parts = path.split('/');
      if (parts.length >= 4) {
        setSeoInfo({ brand: parts[2], model: parts[3] });
        return AppState.SEO_MODEL_PAGE;
      }
    }
    if (path === '/diretorio') {
      return AppState.SEO_DIRECTORY;
    }
    return null;
  }, []);

  const syncUserSession = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      const seoRoute = checkSeoRoutes();

      if (currentUser) {
        setUser(currentUser);
        setAppState(seoRoute || AppState.FORM);
      } else {
        setUser(null);
        setAppState(seoRoute || AppState.LOGIN);
      }
    } catch (e) {
      console.error("Erro crítico na sincronização de sessão:", e);
      setUser(null);
      setAppState(AppState.LOGIN);
    } finally {
      isInitializing.current = false;
    }
  }, [checkSeoRoutes]);

  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (appState === AppState.LOADING && isInitializing.current) {
        const seoRoute = checkSeoRoutes();
        setAppState(seoRoute || AppState.LOGIN);
        isInitializing.current = false;
      }
    }, 6000);

    syncUserSession();

    let subscription: any = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await syncUserSession();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          const seoRoute = checkSeoRoutes();
          setAppState(seoRoute || AppState.LOGIN);
        }
      });
      subscription = data.subscription;
    }

    return () => {
      clearTimeout(safetyTimeout);
      if (subscription) subscription.unsubscribe();
    };
  }, [syncUserSession, checkSeoRoutes, appState]);

  const handleLogin = async (uf: string) => {
    setError(null);
    try {
      setSelectedUf(uf);
      localStorage.setItem('avalia_uf', uf);
      await authService.login(); 
    } catch (e: any) {
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

  const handleFormSubmit = async (data: VehicleFormData) => {
    if (!user) {
      setAppState(AppState.LOGIN);
      return;
    }
    if (appState === AppState.LOADING) return;
    setIsSubmitting(true);
    try {
      const userWithCredits = await authService.consumeCredit(user);
      
      if (!userWithCredits) {
        setAppState(AppState.PRICING);
        return;
      }

      setUser(userWithCredits);
      setAppState(AppState.LOADING);
      setError(null);

      localStorage.setItem('avalia_uf', data.uf);
      setSelectedUf(data.uf);
      setVehicleData(data);

      const response = await analyzeVehicle(data);
      setResult(response);
      setAppState(AppState.RESULT);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao analisar o veículo.");
      setAppState(AppState.ERROR);
    }
  };

  const resetApp = () => {
    setAppState(AppState.FORM);
    setResult(null);
    setError(null);
    if (window.location.pathname !== '/') {
        window.history.pushState({}, '', '/');
    }
  };

  // Renderização condicional para estados públicos (SEO)
  if (appState === AppState.SEO_MODEL_PAGE && seoInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b p-4 sticky top-0 z-40">
           <div className="max-w-md mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = APP_URL}>
                <Car className="w-6 h-6 text-slate-900" />
                <h1 className="text-lg font-bold tracking-tight font-['Playfair_Display']">AvalIA AI</h1>
              </div>
              <button onClick={() => window.location.href = APP_URL} className="text-xs font-black uppercase text-blue-600">Entrar</button>
           </div>
        </header>
        <main className="max-w-md mx-auto px-6 py-10 flex-1">
          <SeoModelPage brand={seoInfo.brand} model={seoInfo.model} onStart={() => window.location.href = APP_URL} />
        </main>
      </div>
    );
  }

  if (appState === AppState.LOADING && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <div className="bg-slate-900 p-4 rounded-2xl shadow-xl mb-6">
          <Car className="w-10 h-10 text-white" />
        </div>
        <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full mb-4"></div>
        <h2 className="text-xl font-bold text-slate-900 font-['Playfair_Display']">AvalIA AI Automóveis</h2>
        <p className="text-slate-400 text-sm mt-2 max-w-xs">Restaurando sua sessão regional segura...</p>
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
                className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-[10px] font-black border border-blue-100"
                title="Região de Pesquisa Atual"
              >
                <MapPin className="w-3 h-3" /> {selectedUf}
              </div>
                 <button 
                onClick={() => setAppState(AppState.DASHBOARD)}
                className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                title="Minha Garagem"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
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
                  <>PLANOS PRÓ AQUI</>
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
         {appState === AppState.ERROR && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-4 animate-fade-in">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
            <h3 className="font-bold text-red-900 text-lg">Ops! Ocorreu um erro</h3>
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={resetApp} className="w-full bg-red-600 text-white font-bold py-3 rounded-xl uppercase text-xs tracking-widest">Tentar Novamente</button>
          </div>
        )}
        {appState === AppState.PRICING && (
          <PricingModal onUpgrade={() => setAppState(AppState.FORM)} onClose={() => setAppState(AppState.FORM)} />
        )}

        {appState === AppState.FORM && user && (
          <div className="animate-fade-in-up">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-800">AvalIA AI {user.name.split(' ')[0]}</h2>
              <p className="text-gray-500 mt-1 text-sm">
                Sua IA de mercado em <strong>{selectedUf}</strong> está pronta.
              </p>
            </div>
            <div className="bg-blue-600 p-4 rounded-2xl text-white flex items-center gap-3 shadow-lg shadow-blue-900/10 mb-6">
              <Sparkles className="w-5 h-5" />
              <p className="text-xs font-bold leading-tight">Olá, {user.name.split(' ')[0]}! Você tem {user.isPro ? 'Acesso Ilimitado' : `${user.credits} créditos`} para avaliar hoje.</p>
            </div>
            <VehicleForm onSubmit={handleFormSubmit} isLoading={false} defaultUf={selectedUf} />
            <div className="mt-8 text-center">
              <button 
                onClick={() => setAppState(AppState.SEO_DIRECTORY)}
                className="text-[10px] font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
              >
                Ver diretório de modelos populares
              </button>
            </div>
          </div>
        )}

        {appState === AppState.LOADING && user && (
           <div className="flex flex-col items-center justify-center pt-20 space-y-6 text-center">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
                <Car className="absolute inset-0 m-auto w-8 h-8 text-slate-800 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-800">Analisando {selectedUf}...</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">Cruzando Tabela FIPE atualizada com os anúncios mais recentes da sua região.</p>
              </div>
           </div>
        )}

        {appState === AppState.RESULT && result && vehicleData && (
          <div className="animate-fade-in">
            <AnalysisResult data={result} onReset={resetApp} vehicleData={vehicleData} />
          </div>
        )}

         {appState === AppState.ERROR && (
          <div className="p-8 text-center bg-white rounded-[2rem] border border-red-100 shadow-xl shadow-red-900/5 animate-fade-in">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-slate-900 font-black uppercase text-sm mb-2">Falha na Inteligência</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-8">{error}</p>
            <button 
              onClick={resetApp} 
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-black shadow-lg shadow-slate-200 active:scale-95 transition-transform"
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
function setIsSubmitting(arg0: boolean) {
  throw new Error('Function not implemented.');
}