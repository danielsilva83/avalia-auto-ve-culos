
import React, { useState, useEffect, useCallback, useRef } from 'react';
import VehicleForm from './components/PropertyForm'; 
import AnalysisResult from './components/AnalysisResult';
import LoginScreen from './components/LoginScreen';
import PricingModal from './components/PricingModal';
import { analyzeVehicle } from './services/geminiService';
import { authService } from './services/authService';
import { supabase } from './services/supabaseClient';
import { VehicleFormData, AnalysisResponse, AppState, User } from './types';
import { Car, LogOut, Star, MapPin } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LOADING);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [selectedUf, setSelectedUf] = useState<string>(localStorage.getItem('avalia_uf') || 'SP');
  const [vehicleData, setVehicleData] = useState<VehicleFormData | null>(null);
  const isInitializing = useRef(true);

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
    const safetyTimeout = setTimeout(() => {
      if (appState === AppState.LOADING && isInitializing.current) {
        setAppState(AppState.LOGIN);
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

  const handleUpgradeSuccess = async () => {
    const updatedUser = await authService.getCurrentUser();
    if (updatedUser) {
      setUser(updatedUser);
    }
    setAppState(AppState.FORM);
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

      // Persiste a UF se ela mudou no form
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
  };

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
                  <>{user.credits} CRÉDITOS - ATIVE PRÓ</>
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
          <PricingModal onUpgrade={handleUpgradeSuccess} onClose={() => setAppState(AppState.FORM)} />
        )}

        {appState === AppState.FORM && user && (
          <div className="animate-fade-in-up">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-800">Olá, {user.name.split(' ')[0]}</h2>
              <p className="text-gray-500 mt-1 text-sm">
                Sua IA de mercado em <strong>{selectedUf}</strong> está pronta.
              </p>
            </div>
            <VehicleForm onSubmit={handleFormSubmit} isLoading={false} defaultUf={selectedUf} />
          </div>
        )}

        {appState === AppState.LOADING && user && (
           <div className="flex flex-col items-center justify-center pt-20 space-y-4 text-center">
              <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
              <h3 className="text-lg font-medium text-gray-600">Pesquisando Mercado em {selectedUf}...</h3>
              <p className="text-sm text-gray-400 max-w-xs">Cruzando Tabela FIPE com anúncios regionais ativos.</p>
           </div>
        )}

        {appState === AppState.RESULT && result && vehicleData && (
          <div className="animate-fade-in">
            <AnalysisResult data={result} onReset={resetApp} vehicleData={vehicleData} />
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
