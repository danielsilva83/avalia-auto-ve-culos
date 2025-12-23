
import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Settings2, TrendingUp, AlertCircle, 
  Info, PieChart, Wallet, ArrowRight, Gauge
} from 'lucide-react';

interface RoiCalculatorProps {
  baseSalePrice: number;
  brandModel: string;
}

const RoiCalculator: React.FC<RoiCalculatorProps> = ({ baseSalePrice, brandModel }) => {
  const [purchasePrice, setPurchasePrice] = useState(baseSalePrice * 0.82);
  const [reforms, setReforms] = useState(1200);
  const [taxes, setTaxes] = useState(350);
  const [adsComission, setAdsComission] = useState(500);
  const [targetSale, setTargetSale] = useState(baseSalePrice);

  const totalInvestment = purchasePrice + reforms + taxes + adsComission;
  const netProfit = targetSale - totalInvestment;
  const roiPercentage = (netProfit / totalInvestment) * 100;
  const marginPercentage = (netProfit / targetSale) * 100;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <PieChart className="w-24 h-24" />
        </div>
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Resultado Projetado para</p>
          <h3 className="text-lg font-black tracking-tight mb-4 uppercase italic">{brandModel}</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase opacity-70">Lucro Líquido</p>
              <p className="text-2xl font-black">R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase opacity-70">Retorno (ROI)</p>
              <p className="text-2xl font-black">{roiPercentage.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="w-4 h-4 text-slate-400" />
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custos de Aquisição e Preparação</h4>
        </div>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Preço de Compra (R$)</label>
            <div className="relative">
              <input 
                type="number" 
                value={purchasePrice} 
                onChange={e => setPurchasePrice(Number(e.target.value))}
                className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
              />
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Reformas/Estética</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={reforms} 
                  onChange={e => setReforms(Number(e.target.value))}
                  className="w-full p-4 pl-10 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                />
                <Settings2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Taxas/Documentos</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={taxes} 
                  onChange={e => setTaxes(Number(e.target.value))}
                  className="w-full p-4 pl-10 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                />
                <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Marketing/Comissão de Venda</label>
            <div className="relative">
              <input 
                type="number" 
                value={adsComission} 
                onChange={e => setAdsComission(Number(e.target.value))}
                className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
              />
              <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase">Venda Alvo (Sugerida IA)</span>
            <span className="font-black text-slate-900">R$ {targetSale.toLocaleString('pt-BR')}</span>
          </div>
          <input 
            type="range" 
            min={baseSalePrice * 0.8} 
            max={baseSalePrice * 1.2} 
            step={500}
            value={targetSale}
            onChange={e => setTargetSale(Number(e.target.value))}
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0" />
        <p className="text-[10px] text-amber-800 leading-tight">
          <strong>Atenção:</strong> O ROI ideal para revenda rápida gira entre 8% e 15%. Se o seu ROI projetado estiver abaixo disso, reavalie o preço de compra ou reduza custos de preparação.
        </p>
      </div>
    </div>
  );
};

export default RoiCalculator;
