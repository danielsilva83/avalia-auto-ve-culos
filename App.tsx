
import React, { useState, useEffect, useCallback, useRef } from 'react';
import VehicleForm from './components/PropertyForm'; 
import AnalysisResult from './components/AnalysisResult';
import LoginScreen from './components/LoginScreen';
import PricingModal from './components/PricingModal';
import SeoModelPage from './components/SeoModelPage';
import ModelDirectory from './components/ModelDirectory';
import { analyzeVehicle } from './services/geminiService';
import { authService } from './services/authService';
import { supabase } from './services/supabaseClient';
import { VehicleFormData, AnalysisResponse, AppState, User } from './types';
import { Car, LogOut, Star, MapPin, ChevronLeft, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LOADING);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [selectedUf, setSelectedUf] = useState<string>(localStorage.getItem('avalia_uf') || 'SP');
  const [vehicleData, setVehicleData] = useState<VehicleFormData | null>(null);
  const [pathParams, setPathParams] = useState<{ brand?: string, model?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isInitializing = useRef(true);

  // Router Dinâmico para SEO Programático
  const handleRouting = useCallback(() => {
    const path = window.location.pathname;
    
    if (path === '/modelos') {
      setAppState(AppState.SEO_DIRECTORY);
      return true;
    }
    
    const modelMatch = path.match(/^\/modelo\/([^/]+)\/([^/]+)/);
    if (modelMatch) {
      setPathParams({ brand: modelMatch[1], model: modelMatch[2] });
      setAppState(AppState.SEO_MODEL_PAGE);
      return true;
    }

    return false;
  }, []);

  const syncUserSession = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      
      // Checa se é uma rota pública de SEO antes de exigir login
      const isPublicPage = handleRouting();
      if (isPublicPage) return;

      if (currentUser) {
        setUser(currentUser);
        setAppState(AppState.FORM);
      } else {
        setUser(null);
        setAppState(AppState.LOGIN);
      }
    } catch (e) {
      setUser(null);
      setAppState(AppState.LOGIN);
    } finally {
      isInitializing.current = false;
    }
  }, [handleRouting]);

  useEffect(() => {
    syncUserSession();

    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await syncUserSession();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          if (!window.location.pathname.startsWith('/modelo') && window.location.pathname !== '/modelos') {
            setAppState(AppState.LOGIN);
          }
        }
      });
      return () => data.subscription.unsubscribe();
    }
  }, [syncUserSession]);

  const handleLogin = async (uf: string) => {
    setSelectedUf(uf);
    localStorage.setItem('avalia_uf', uf);
    await authService.login(); 
  };

  const handleFormSubmit = async (data: VehicleFormData) => {
    if (!user || isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const userWithCredits = await authService.consumeCredit(user);
      if (!userWithCredits) {
        setAppState(AppState.PRICING);
        setIsSubmitting(false);
        return;
      }

      setUser(userWithCredits);
      setAppState(AppState.LOADING);
      setVehicleData(data);
      
      const response = await analyzeVehicle(data);
      setResult(response);
      setAppState(AppState.RESULT);
    } catch (err: any) {
      setError(err.message || "Erro na inteligência artificial ao analisar mercado.");
      setAppState(AppState.ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetApp = () => {
    window.history.pushState({}, '', '/');
    setAppState(AppState.FORM);
    setResult(null);
    setError(null);
    setIsSubmitting(false);
  };

  const navigateToApp = () => {
    window.history.pushState({}, '', '/');
    if (user) setAppState(AppState.FORM);
    else setAppState(AppState.LOGIN);
  };

  if (appState === AppState.LOADING && !vehicleData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
        <Loader2 className="w-12 h-12 text-slate-900 animate-spin mb-4" />
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Iniciando AvalIA AI...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100">
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={resetApp}>
            <div className="bg-slate-900 p-1.5 rounded-lg group-hover:bg-blue-600 transition-colors">
              <Car className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-black tracking-tighter uppercase">AvalIA AI</h1>
          </div>
          
          {user && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-[10px] font-black border border-blue-100">
                <MapPin className="w-3 h-3" /> {selectedUf}
              </div>
              <button onClick={() => authService.logout()} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8 relative pb-24">
        {/* Camada SEO: Diretório */}
        {appState === AppState.SEO_DIRECTORY && (
          <ModelDirectory onSelect={(b, m) => window.location.href = `/modelo/${b}/${m}`} />
        )}
        
        {/* Camada SEO: Página do Modelo */}
        {appState === AppState.SEO_MODEL_PAGE && (
          <SeoModelPage 
            brand={pathParams.brand || ''} 
            model={pathParams.model || ''} 
            onStart={navigateToApp} 
          />
        )}

        {/* Camada App: Login */}
        {appState === AppState.LOGIN && <LoginScreen onLogin={handleLogin} error={error} />}
        
        {/* Camada App: Pagamento */}
        {appState === AppState.PRICING && (
          <PricingModal onUpgrade={() => syncUserSession()} onClose={() => setAppState(AppState.FORM)} />
        )}

        {/* Camada App: Formulário */}
        {appState === AppState.FORM && user && (
          <VehicleForm 
            onSubmit={handleFormSubmit} 
            isLoading={isSubmitting} 
            defaultUf={selectedUf} 
          />
        )}

        {/* Camada App: Carregamento de Análise */}
        {appState === AppState.LOADING && vehicleData && (
           <div className="flex flex-col items-center justify-center pt-20 space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
                <Car className="absolute inset-0 m-auto w-8 h-8 text-slate-800 animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Analisando Mercado Real</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest animate-pulse">Cruzando FIPE + Anúncios em {selectedUf}</p>
              </div>
           </div>
        )}

        {/* Camada App: Resultado */}
        {appState === AppState.RESULT && result && vehicleData && (
          <AnalysisResult data={result} onReset={resetApp} vehicleData={vehicleData} />
        )}

        {/* Camada App: Erro */}
        {appState === AppState.ERROR && (
          <div className="p-8 text-center bg-white rounded-[2rem] border border-red-100 shadow-xl shadow-red-900/5 animate-fade-in">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Star className="w-8 h-8" />
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
