
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

  const handleRouting = useCallback((): boolean => {
    const path = window.location.pathname;
    if (path.startsWith('/modelo/')) {
      const parts = path.split('/');
      if (parts.length >= 4) {
        setSeoInfo({ brand: parts[2], model: parts[3] });
        return true;
      }
    }
    if (path === '/diretorio') {
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
    if (!user) {
      setAppState(AppState.LOGIN);
      return;
    }
    setIsSubmitting(true);
    try {
      const userWithCredits = await authService.consumeCredit(user);
      if (!userWithCredits) {
        setAppState(AppState.PRICING);
        return;
      }
      setUser(userWithCredits);
      setAppState(AppState.LOADING);
      setVehicleData(data);
      setSelectedUf(data.uf);

      const response = await analyzeVehicle(data);
      
      // Salva no histórico automaticamente para usuários PRO
      if (userWithCredits.isPro) {
        try {
          await historyService.saveConsultation(userWithCredits.id, data, response);
        } catch (e) {
          console.error("Erro ao salvar histórico PRO:", e);
        }
      }

      setResult(response);
      setAppState(AppState.RESULT);
    } catch (err: any) {
      setError(err.message || "Erro na análise.");
      setAppState(AppState.ERROR);
    }
  };

  const openHistoryItem = (analysis: AnalysisResponse, vehicle: VehicleFormData) => {
    setResult(analysis);
    setVehicleData(vehicle);
    setAppState(AppState.RESULT);
  };

  const resetApp = () => {
    window.history.pushState({}, '', '/');
    setAppState(AppState.FORM);
    setResult(null);
    setError(null);
    setIsSubmitting(false);
  };

  const handleSelectFromDirectory = (brand: string, model: string) => {
    setSeoInfo({ brand, model });
    setAppState(AppState.SEO_MODEL_PAGE);
  };

  if (appState === AppState.LOADING && isInitializing.current) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Iniciando AvalIA AI...</p>
      </div>
    );
  }

  if (appState === AppState.LOGIN) return <LoginScreen onLogin={handleLogin} error={error} />;

  const handleLogout = async (event: React.MouseEvent<HTMLButtonElement>) => {
    await authService.logout();
    setUser(null);
    setAppState(AppState.LOGIN);
    resetApp();
  };

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
              <button 
                onClick={() => setAppState(AppState.DASHBOARD)}
                className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                title="Minha Garagem"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              
              <div 
                onClick={() => setAppState(AppState.PRICING)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black cursor-pointer transition-colors ${
                  user.isPro ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {user.isPro ? <><Star className="w-3 h-3 fill-current" /> PRO</> : 'UPGRADE'}
              </div>

              <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8">
        {appState === AppState.ERROR && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-4 animate-fade-in">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
            <h3 className="font-bold text-red-900 text-lg">Ops! Ocorreu um erro</h3>
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={resetApp} className="w-full bg-red-600 text-white font-bold py-3 rounded-xl uppercase text-xs tracking-widest">Tentar Novamente</button>
          </div>
        )}

        {appState === AppState.PRICING && <PricingModal onUpgrade={syncUserSession} onClose={resetApp} />}
        
        {appState === AppState.DASHBOARD && user && (
          <UserDashboard user={user} onSelectConsultation={openHistoryItem} onBack={resetApp} />
        )}

        {appState === AppState.FORM && user && (
          <div className="animate-fade-in-up">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold">Olá, {user.name.split(' ')[0]}</h2>
              <p className="text-gray-500 text-sm">Pronto para uma nova avaliação em <strong>{selectedUf}</strong>?</p>
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

        {appState === AppState.LOADING && (
          <div className="flex flex-col items-center justify-center pt-20 text-center animate-pulse">
            <div className="relative mb-6">
               <div className="absolute inset-0 bg-blue-600/20 blur-2xl rounded-full"></div>
               <Loader2 className="w-16 h-16 text-blue-600 animate-spin relative" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Consultando Mercado...</h3>
            <p className="text-slate-500 text-sm mt-2">Buscando Tabela FIPE e anúncios em {selectedUf}.</p>
          </div>
        )}

        {appState === AppState.RESULT && result && vehicleData && (
          <AnalysisResult data={result} onReset={resetApp} vehicleData={vehicleData} />
        )}

        {appState === AppState.SEO_DIRECTORY && (
          <ModelDirectory onSelect={handleSelectFromDirectory} />
        )}

        {appState === AppState.SEO_MODEL_PAGE && seoInfo && (
          <SeoModelPage brand={seoInfo.brand} model={seoInfo.model} onStart={resetApp} />
        )}
      </main>
    </div>
  );
};

export default App;

function setIsSubmitting(arg0: boolean) {
  throw new Error('Function not implemented.');
}

