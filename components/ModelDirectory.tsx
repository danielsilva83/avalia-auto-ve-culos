
import React from 'react';
import { Car, ChevronRight, Search } from 'lucide-react';

interface ModelDirectoryProps {
  onSelect: (brand: string, model: string) => void;
}

const POPULAR_MODELS = [
  { brand: 'volkswagen', model: 'gol', name: 'Gol' },
  { brand: 'honda', model: 'civic', name: 'Civic' },
  { brand: 'toyota', model: 'corolla', name: 'Corolla' },
  { brand: 'chevrolet', model: 'onix', name: 'Onix' },
  { brand: 'fiat', model: 'uno', name: 'Uno' },
  { brand: 'jeep', model: 'compass', name: 'Compass' },
  { brand: 'hyundai', model: 'hb20', name: 'HB20' },
  { brand: 'ford', model: 'ka', name: 'Ka' },
];

const ModelDirectory: React.FC<ModelDirectoryProps> = ({ onSelect }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Diretório de Modelos</h1>
        <p className="text-slate-500 text-sm">Selecione um veículo para ver as tendências de mercado.</p>
      </div>

      <div className="relative mb-8">
        <input 
          type="text" 
          placeholder="Buscar modelo específico..." 
          className="w-full p-4 pl-12 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-slate-900 outline-none font-bold"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
      </div>

      <div className="grid gap-3">
        {POPULAR_MODELS.map((item) => (
          <button
            key={`${item.brand}-${item.model}`}
            onClick={() => onSelect(item.brand, item.model)}
            className="w-full p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:bg-blue-50 hover:border-blue-200 transition-all group shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Car className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.brand}</p>
                <p className="text-lg font-black text-slate-900 leading-none">{item.name}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>

      <div className="mt-12 p-8 bg-blue-600 rounded-3xl text-white text-center shadow-xl shadow-blue-900/10">
         <h3 className="font-black text-xl mb-2">Não achou seu modelo?</h3>
         <p className="text-blue-100 text-sm mb-6">Nossa IA consegue avaliar qualquer veículo fabricado no Brasil em segundos.</p>
         <button 
           onClick={() => window.location.href = '/'}
           className="px-8 py-4 bg-white text-blue-600 font-black rounded-xl uppercase tracking-widest text-xs active:scale-95 transition-transform"
         >
           Fazer Avaliação Manual
         </button>
      </div>
    </div>
  );
};

export default ModelDirectory;
