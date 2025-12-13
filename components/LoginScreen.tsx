import React, { useState } from 'react';
import { Car, CheckCircle2, TrendingUp, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => Promise<void>;
  error?: string | null;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, error }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginClick = async () => {
    setIsLoading(true);
    try {
      await onLogin();
    } catch (e) {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-20%] w-[80%] h-[40%] bg-slate-100 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[30%] bg-slate-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

      {/* Header / Hero */}
      <div className="px-6 pt-16 pb-8 z-10">
        <div className="flex justify-center mb-6">
          <div className="bg-slate-900 p-4 rounded-2xl shadow-xl shadow-slate-200">
            <Car className="w-10 h-10 text-white" />
          </div>
        </div>
        
        <h1 className="text-4xl text-center text-gray-900 mb-3 tracking-tight font-['Playfair_Display'] font-bold">
          AvalIA <span className="text-slate-700">Auto</span>
        </h1>
        <p className="text-center text-gray-500 text-lg leading-relaxed">
          A Inteligência Artificial para comprar e vender carros no preço certo.
        </p>
      </div>

      {/* Value Proposition Cards */}
      <div className="px-6 space-y-6 z-10 flex-1 flex flex-col justify-center">
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-fade-in-up">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex items-start gap-4">
          <div className="bg-green-100 p-2 rounded-lg shrink-0 mt-1">
            <TrendingUp className="w-5 h-5 text-green-700" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Análise FIPE Real</h3>
            <p className="text-sm text-gray-500 leading-snug">
              Cruzamento de dados da Tabela FIPE com anúncios reais da web.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="bg-purple-100 p-2 rounded-lg shrink-0 mt-1">
            <ShieldCheck className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Segurança na Negociação</h3>
            <p className="text-sm text-gray-500 leading-snug">
              Scripts prontos para justificar o preço ou negociar descontos.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="bg-orange-100 p-2 rounded-lg shrink-0 mt-1">
            <CheckCircle2 className="w-5 h-5 text-orange-700" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Expertise Mecânica</h3>
            <p className="text-sm text-gray-500 leading-snug">
              Dicas sobre problemas crônicos e liquidez de cada modelo.
            </p>
          </div>
        </div>

      </div>

      {/* Footer / Action */}
      <div className="p-6 bg-white border-t border-gray-100 z-20 pb-10">
        <button
          onClick={handleLoginClick}
          disabled={isLoading}
          className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-800 active:bg-slate-950 transition-all shadow-lg group disabled:opacity-80"
        >
          {isLoading ? (
             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
          ) : (
            <>
              {/* Google Icon SVG */}
              <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continuar com Google</span>
            </>
          )}
        </button>
        
        <p className="text-center text-xs text-gray-400 mt-4">
          Ao continuar, você aceita nossos Termos e Política.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;