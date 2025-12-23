
import React from 'react';
import { Car, Search, TrendingUp, ShieldCheck, ArrowRight, MapPin, Star } from 'lucide-react';

interface SeoModelPageProps {
  brand: string;
  model: string;
  onStart: () => void;
}

const SeoModelPage: React.FC<SeoModelPageProps> = ({ brand, model, onStart }) => {
  const brandName = brand.charAt(0).toUpperCase() + brand.slice(1);
  const modelName = model.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero SEO */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
           <MapPin className="w-3 h-3" /> Guia de Preços Regional
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-tight">
          Quanto vale um <span className="text-blue-600">{brandName} {modelName}</span> hoje?
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          Não se baseie apenas na Tabela FIPE. O valor do {modelName} varia drasticamente por estado e estado de conservação.
        </p>
      </div>

      {/* Card de Chamada */}
      <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[60px] rounded-full"></div>
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Inteligência em Tempo Real</p>
              <h3 className="font-bold">Avaliação Gratuita por IA</h3>
            </div>
          </div>
          
          <div className="space-y-3">
             <div className="flex items-center gap-3 text-sm text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Cruzamento com anúncios ativos</span>
             </div>
             <div className="flex items-center gap-3 text-sm text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Análise de liquidez regional</span>
             </div>
          </div>

          <button 
            onClick={onStart}
            className="w-full bg-white text-slate-900 font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-50 transition-all active:scale-95 shadow-xl"
          >
            AVALIAR MEU CARRO AGORA <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conteúdo Informativo SEO */}
      <div className="space-y-6">
        <h2 className="text-xl font-black text-slate-800 tracking-tight">O que você precisa saber antes de vender seu {modelName}</h2>
        
        <div className="grid gap-4">
          <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
               <Star className="w-4 h-4 text-yellow-500" /> Histórico de Depreciação
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Modelos como o {brandName} {modelName} costumam ter uma curva de desvalorização específica. Fatores como a cor branca ou prata podem aumentar a liquidez em até 15%.
            </p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
               <Search className="w-4 h-4 text-blue-500" /> Demanda por Região
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Atualmente, SUVs e Sedans dessa categoria possuem maior giro em estados do Sudeste. Nossa IA identifica o "Hotspot" de venda para o seu modelo.
            </p>
          </div>
        </div>
      </div>

      <footer className="pt-10 pb-20 text-center border-t border-slate-100">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">AvalIA AI - O Guia Definitivo do {modelName}</p>
      </footer>
    </div>
  );
};

export default SeoModelPage;
