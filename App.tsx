
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
  const [lastFormData, setLastFormData] = useState<VehicleFormData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [selectedUf, setSelectedUf] = useState<string>(localStorage.getItem('avalia_uf') || 'SP');
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
      setUser(null);
      setAppState(AppState.LOGIN);
    } finally {
      isInitializing.current = false;
    }
  }, []);

  useEffect(() => {
    syncUserSession();
    if (supabase) {
      supabase.auth.onAuthStateChange(async (event) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') await syncUserSession();
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setAppState(AppState.LOGIN);
        }
      });
    }
  }, [syncUserSession]);

  const handleLogin = async (uf: string) => {
    setSelectedUf(uf);
    localStorage.setItem('avalia_uf', uf);
    await authService.login();
  };

  const handleFormSubmit = async (data: VehicleFormData) => {
    if (!user) return;
    try {
      const userWithCredits = await authService.consumeCredit(user);
      if (!userWithCredits) {
        setAppState(AppState.PRICING);
        return;
      }
      setUser(userWithCredits);
      setAppState(AppState.LOADING);
      setLastFormData(data);
      const response = await analyzeVehicle(data);
      setResult(response);
      setAppState(AppState.RESULT);
    } catch (err: any) {
      setError(err.message);
      setAppState(AppState.ERROR);
    }
  };

  const resetApp = () => {
    setAppState(AppState.FORM);
    setResult(null);
    setError(null);
  };

  if (appState === AppState.LOGIN) return <LoginScreen onLogin={handleLogin} error={error} />;

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={resetApp}>
            <Car className="w-6 h-6" />
            <h1 className="text-lg font-black tracking-tighter">AvalIA AI</h1>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-[10px] font-black border border-blue-100">
                <MapPin className="w-3 h-3" /> {selectedUf}
              </div>
              <button onClick={() => authService.logout()} className="p-2 text-gray-400 hover:text-red-600"><LogOut className="w-5 h-5" /></button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8 relative">
        {appState === AppState.PRICING && <PricingModal onUpgrade={() => syncUserSession()} onClose={() => setAppState(AppState.FORM)} />}
        {appState === AppState.FORM && user && <VehicleForm onSubmit={handleFormSubmit} isLoading={false} defaultUf={selectedUf} />}
        {appState === AppState.LOADING && (
          <div className="flex flex-col items-center justify-center pt-20 space-y-4">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            <h3 className="text-lg font-black text-gray-600">INTELIGÊNCIA REGIONAL ATIVA...</h3>
          </div>
        )}
        {appState === AppState.RESULT && result && lastFormData && <AnalysisResult data={result} vehicleData={lastFormData} onReset={resetApp} />}
        {appState === AppState.ERROR && (
          <div className="p-6 text-center space-y-4">
            <h3 className="text-red-600 font-bold">Falha na Conexão</h3>
            <p className="text-sm text-gray-500">{error}</p>
            <button onClick={resetApp} className="w-full bg-slate-900 text-white py-3 rounded-xl">Tentar Novamente</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
