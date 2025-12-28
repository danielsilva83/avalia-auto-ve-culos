
import React, { useState } from 'react';
import { Car, TrendingUp, ShieldCheck, AlertCircle, MapPin } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (uf: string) => Promise<void>;
  error?: string | null;
}

const BRAZIL_STATES = [
  { uf: 'AC', name: 'Acre' }, { uf: 'AL', name: 'Alagoas' }, { uf: 'AP', name: 'Amapá' },
  { uf: 'AM', name: 'Amazonas' }, { uf: 'BA', name: 'Bahia' }, { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' }, { uf: 'ES', name: 'Espírito Santo' }, { uf: 'GO', name: 'Goiás' },
  { uf: 'MA', name: 'Maranhão' }, { uf: 'MT', name: 'Mato Grosso' }, { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'MG', name: 'Minas Gerais' }, { uf: 'PA', name: 'Pará' }, { uf: 'PB', name: 'Paraíba' },
  { uf: 'PR', name: 'Paraná' }, { uf: 'PE', name: 'Pernambuco' }, { uf: 'PI', name: 'Piauí' },
  { uf: 'RJ', name: 'Rio de Janeiro' }, { uf: 'RN', name: 'Rio Grande do Norte' }, { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'RO', name: 'Rondônia' }, { uf: 'RR', name: 'Roraima' }, { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'SP', name: 'São Paulo' }, { uf: 'SE', name: 'Sergipe' }, { uf: 'TO', name: 'Tocantins' }
];

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, error }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUf, setSelectedUf] = useState(localStorage.getItem('avalia_uf') || 'SP');

  const handleLoginClick = async () => {
    setIsLoading(true);
    try {
      await onLogin(selectedUf);
    } catch (e) {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-20%] w-[80%] h-[40%] bg-slate-100 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

      <div className="px-6 pt-12 pb-6 z-10">
        <div className="flex justify-center mb-6">
          <div className="bg-slate-900 p-4 rounded-2xl shadow-xl shadow-slate-200">
            <Car className="w-10 h-10 text-white" />
          </div>
        </div>

        <h1 className="text-4xl text-center text-gray-900 mb-2 tracking-tight font-['Playfair_Display'] font-bold">
          AvalIA AI <span className="text-slate-700">Automóveis</span>
        </h1>
        <p className="text-center text-gray-500 text-sm leading-relaxed px-4">
          Inteligência Artificial que entende que o valor do carro muda em cada estado e município do Brasil.
        </p>
      </div>

      <div className="px-6 space-y-6 z-10 flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* UF Selector */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
            <MapPin className="w-3 h-3 text-slate-500" /> LOCALIZAÇÃO PARA PESQUISA
          </label>
          <div className="relative">
            <select
              value={selectedUf}
              onChange={(e) => setSelectedUf(e.target.value)}
              className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-slate-900 transition-all appearance-none cursor-pointer pr-10"
            >
              {BRAZIL_STATES.map(s => (
                <option key={s.uf} value={s.uf}>{s.name} ({s.uf})</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 italic text-center">
            *A IA filtrará anúncios e impostos de {BRAZIL_STATES.find(s => s.uf === selectedUf)?.name}.
          </p>
        </div>

        <div className="space-y-4 px-2">
          <div className="flex items-start gap-3">
            <div className="bg-green-100 p-1.5 rounded-lg mt-0.5">
              <TrendingUp className="w-4 h-4 text-green-700" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900">Precisão Regional</h3>
              <p className="text-xs text-gray-500">Dados baseados no mercado real da sua UF.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-1.5 rounded-lg mt-0.5">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900">Scripts Personalizados</h3>
              <p className="text-xs text-gray-500">Argumentos que funcionam no seu estado.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white border-t border-gray-100 z-20 pb-10">
        <button
          onClick={handleLoginClick}
          disabled={isLoading}
          className="w-full max-w-md mx-auto bg-slate-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-800 active:bg-slate-950 transition-all shadow-lg group disabled:opacity-80"
        >
          {isLoading ? (
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Entrar e Avaliar em {selectedUf}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
