
import React, { useState } from 'react';
import { AnalysisResponse, VehicleFormData, ToolType } from '../types';
import { 
  Share2, ArrowLeft, ExternalLink, LayoutGrid, FileText, 
  Megaphone, TrendingDown, ShieldAlert, Calculator, X, 
  ChevronRight, Printer, CheckCircle2, DollarSign, Target,
  Zap, Copy, Check, Settings2, Car
} from 'lucide-react';
import { generateToolContent } from '../services/geminiService';

interface AnalysisResultProps {
  data: AnalysisResponse;
  vehicleData: VehicleFormData;
  onReset: () => void;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ data, vehicleData, onReset }) => {
  const [activeTool, setActiveTool] = useState<ToolType>(null);
  const [toolContent, setToolContent] = useState<string>('');
  const [isToolLoading, setIsToolLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const openTool = async (type: ToolType) => {
    setActiveTool(type);
    setShowMenu(false);
    if (type === 'profit') return;

    setIsToolLoading(true);
    try {
      const content = await generateToolContent(type, vehicleData);
      setToolContent(content);
    } catch (e) {
      setToolContent("Erro ao carregar inteligência estratégica.");
    } finally {
      setIsToolLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateWhatsAppText = () => {
    const text = `*AvalIA AI - Inteligência Automotiva (${vehicleData.uf})*\n\n` +
      `🚗 *Veículo:* ${vehicleData.brandModel} ${vehicleData.year}\n` +
      `💰 *Sugestão de Preço:* ${data.crmData.faixa_preco_sugerida}\n` +
      `📉 *Liquidez:* ${data.crmData.nivel_dificuldade_venda}\n\n` +
      `_Gerado por: avaliaaiautomoveis.com_`;
    return encodeURIComponent(text);
  };

  const ProfitCalculator = () => {
    const [buyPrice, setBuyPrice] = useState(vehicleData.price * 0.85);
    const [expenses, setExpenses] = useState(1500);
    const expectedSale = vehicleData.price;
    const profit = expectedSale - buyPrice - expenses;
    const margin = (profit / buyPrice) * 100;

    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Preço de Compra (R$)</label>
            <div className="relative">
              <input type="number" value={buyPrice} onChange={e => setBuyPrice(Number(e.target.value))} className="w-full p-3 pl-10 rounded-xl border font-bold outline-none focus:ring-2 focus:ring-slate-900" />
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Gastos Estimados (Estética/Mecânica)</label>
            <div className="relative">
              <input type="number" value={expenses} onChange={e => setExpenses(Number(e.target.value))} className="w-full p-3 pl-10 rounded-xl border font-bold outline-none focus:ring-2 focus:ring-slate-900" />
              <Settings2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div className="pt-2 border-t flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 uppercase">Venda Projetada (IA):</span>
            <span className="font-black text-slate-900">R$ {expectedSale.toLocaleString('pt-BR')}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-600 p-4 rounded-2xl text-white shadow-lg shadow-green-900/10">
            <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Lucro Estimado</p>
            <p className="text-xl font-black">R$ {profit.toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-900/10">
            <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Margem ROI</p>
            <p className="text-xl font-black">{margin.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    );
  };

  const ToolOverlay = () => {
    if (!activeTool) return null;
    const titles: Record<string, string> = {
      dossier: 'Dossiê de Venda Profissional',
      ads: 'Gerador de Anúncios Turbo',
      future: 'Visão de Futuro (6-24m)',
      negotiation: 'Cards de Negociação',
      profit: 'Calculadora de Lucro Líquido'
    };

    return (
      <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-fade-in">
        <header className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <button onClick={() => setActiveTool(null)} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h3 className="font-black text-slate-900 uppercase tracking-tighter text-sm">{titles[activeTool]}</h3>
          <div className="flex gap-2">
            {activeTool !== 'profit' && activeTool !== 'dossier' && (
              <button onClick={() => copyToClipboard(toolContent)} className="p-2 text-slate-400 hover:text-slate-900">
                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
              </button>
            )}
            <div className="w-4"></div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 pb-32">
          {isToolLoading ? (
             <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Gerando Inteligência...</p>
             </div>
          ) : (
            <div className="animate-fade-in-up">
              {activeTool === 'profit' ? <ProfitCalculator /> : (
                <div className={`prose prose-slate max-w-none ${activeTool === 'dossier' ? 'bg-slate-900 text-white p-8 rounded-3xl shadow-2xl border-4 border-slate-800' : 'bg-gray-50 p-6 rounded-2xl border border-slate-100'}`}>
                  {activeTool === 'dossier' && (
                    <div className="mb-8 text-center border-b border-white/10 pb-8">
                       <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                          <Car className="w-10 h-10 text-white" />
                       </div>
                       <h1 className="text-3xl font-black uppercase text-white m-0 tracking-tighter italic">Laudo de Avaliação</h1>
                       <p className="text-blue-400 font-mono text-[10px] m-0 mt-2 uppercase tracking-widest">Certificado Regional AvalIA AI - {vehicleData.uf}</p>
                       <div className="mt-6 grid grid-cols-2 gap-2 text-[10px] font-bold">
                          <div className="bg-white/5 p-2 rounded uppercase">{vehicleData.brandModel}</div>
                          <div className="bg-white/5 p-2 rounded uppercase">Ano {vehicleData.year}</div>
                       </div>
                    </div>
                  )}
                  <div className={`whitespace-pre-wrap text-sm leading-relaxed ${activeTool === 'dossier' ? 'text-slate-300' : 'text-slate-700'}`}>
                    {toolContent}
                  </div>
                  {activeTool === 'dossier' && (
                    <div className="mt-12 pt-8 border-t border-white/10 flex flex-col gap-4">
                      <button onClick={() => window.print()} className="w-full py-4 bg-white text-slate-900 font-black rounded-xl flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors shadow-lg">
                         <Printer className="w-5 h-5" /> IMPRIMIR / SALVAR PDF
                      </button>
                      <p className="text-center text-[9px] text-slate-500 uppercase font-black">Este documento não substitui vistoria cautelar física.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 pb-32">
      <ToolOverlay />

      <div className="flex items-center gap-2">
        <button onClick={onReset} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <h2 className="text-xl font-bold text-slate-800">Resultado: {vehicleData.brandModel}</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 p-5 rounded-2xl text-white shadow-xl shadow-slate-900/10">
           <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-1">Preço Sugerido</p>
           <p className="text-xl font-black tracking-tighter">{data.crmData.faixa_preco_sugerida}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Liquidez em {vehicleData.uf}</p>
           <p className="text-xl font-black text-slate-900 tracking-tighter">{data.crmData.nivel_dificuldade_venda}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
           <div className="flex items-center gap-2">
             <Target className="w-4 h-4 text-blue-600" />
             <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Análise de Mercado</h3>
           </div>
           <span className="text-[9px] font-black text-slate-400 bg-white px-2 py-1 rounded border uppercase">{vehicleData.uf}</span>
        </div>
        <div className="p-6 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
          {data.priceAnalysis}
          
          {data.groundingUrls && data.groundingUrls.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-50">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Fontes Verificadas (Tempo Real):</p>
              <div className="flex flex-wrap gap-2">
                {data.groundingUrls.map((link, i) => (
                  <a key={i} href={link.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-[11px] text-slate-600 font-bold hover:bg-slate-100 transition-all border border-slate-100 max-w-full">
                    <ExternalLink className="w-3 h-3 text-blue-500 shrink-0" /> <span className="truncate">{link.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showMenu && (
        <div className="fixed inset-0 z-50 flex items-end p-4 animate-fade-in">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowMenu(false)}></div>
           <div className="relative w-full bg-white rounded-3xl overflow-hidden animate-fade-in-up shadow-2xl">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500 fill-current" />
                  <h4 className="font-black text-slate-900 uppercase tracking-tighter">Hub Estratégico PRO</h4>
                </div>
                <button onClick={() => setShowMenu(false)} className="p-2 bg-white border border-slate-200 rounded-full shadow-sm">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="p-3 grid gap-2 max-h-[70vh] overflow-y-auto">
                <button onClick={() => openTool('dossier')} className="w-full p-4 flex items-center gap-4 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-all text-left group border border-transparent hover:border-blue-100">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-xl group-hover:scale-110 transition-transform"><FileText className="w-6 h-6" /></div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">Dossiê de Venda</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black">Laudo Visual Certificado</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </button>
                <button onClick={() => openTool('ads')} className="w-full p-4 flex items-center gap-4 bg-slate-50 rounded-2xl hover:bg-orange-50 transition-all text-left group border border-transparent hover:border-orange-100">
                  <div className="p-3 bg-orange-100 text-orange-600 rounded-xl group-hover:scale-110 transition-transform"><Megaphone className="w-6 h-6" /></div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">Anúncio Turbo</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black">Copy de Alta Conversão</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </button>
                <button onClick={() => openTool('future')} className="w-full p-4 flex items-center gap-4 bg-slate-50 rounded-2xl hover:bg-purple-50 transition-all text-left group border border-transparent hover:border-purple-100">
                  <div className="p-3 bg-purple-100 text-purple-600 rounded-xl group-hover:scale-110 transition-transform"><TrendingDown className="w-6 h-6" /></div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">Visão de Futuro</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black">Projeção 24 Meses</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </button>
                <button onClick={() => openTool('negotiation')} className="w-full p-4 flex items-center gap-4 bg-slate-50 rounded-2xl hover:bg-red-50 transition-all text-left group border border-transparent hover:border-red-100">
                  <div className="p-3 bg-red-100 text-red-600 rounded-xl group-hover:scale-110 transition-transform"><ShieldAlert className="w-6 h-6" /></div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">Battle Cards</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black">Scripts de Negociação</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </button>
                <button onClick={() => openTool('profit')} className="w-full p-4 flex items-center gap-4 bg-slate-50 rounded-2xl hover:bg-green-50 transition-all text-left group border border-transparent hover:border-green-100">
                  <div className="p-3 bg-green-100 text-green-600 rounded-xl group-hover:scale-110 transition-transform"><Calculator className="w-6 h-6" /></div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">Lucro na Veia</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black">Calculadora de ROI</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </button>
              </div>
           </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-100 z-50">
        <div className="max-w-md mx-auto flex gap-3">
          <a href={`https://wa.me/?text=${generateWhatsAppText()}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-green-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
            <Share2 className="w-5 h-5" /> COMPARTILHAR
          </a>
          <button onClick={() => setShowMenu(true)} className="flex-1 bg-slate-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
            <LayoutGrid className="w-5 h-5" /> FERRAMENTAS PRO
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResult;
