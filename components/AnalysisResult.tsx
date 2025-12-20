
import React, { useState } from 'react';
import { AnalysisResponse, VehicleFormData, ToolType } from '../types';
import { 
  Share2, ArrowLeft, ExternalLink, LayoutGrid, FileText, 
  Megaphone, TrendingDown, ShieldAlert, Calculator, X, 
  ChevronRight, Printer, CheckCircle2, DollarSign, Target
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

  const openTool = async (type: ToolType) => {
    setActiveTool(type);
    setShowMenu(false);
    if (type === 'profit') return;

    setIsToolLoading(true);
    try {
      const content = await generateToolContent(type, vehicleData);
      setToolContent(content);
    } catch (e) {
      setToolContent("Erro ao carregar inteligência.");
    } finally {
      setIsToolLoading(false);
    }
  };

  const generateWhatsAppText = () => {
    const text = `*AvalIA AI - Análise Regional (${vehicleData.uf})*\n` +
      `🚗 ${vehicleData.brandModel} ${vehicleData.year}\n` +
      `💰 Sugestão: ${data.crmData.faixa_preco_sugerida}\n` +
      `avaliaaiautomoveis.com`;
    return encodeURIComponent(text);
  };

  // --- FERRAMENTA: CALCULADORA DE LUCRO ---
  const ProfitCalculator = () => {
    const [buy, setBuy] = useState(vehicleData.price * 0.85);
    const [prep, setPrep] = useState(1200);
    const profit = vehicleData.price - buy - prep;
    const roi = (profit / buy) * 100;

    return (
      <div className="space-y-6">
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Custo de Aquisição (R$)</label>
            <input type="number" value={buy} onChange={e => setBuy(Number(e.target.value))} className="w-full p-3 rounded-xl border font-bold" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Gasto com Estética/Mecânica (R$)</label>
            <input type="number" value={prep} onChange={e => setPrep(Number(e.target.value))} className="w-full p-3 rounded-xl border font-bold" />
          </div>
          <div className="pt-2 border-t">
            <p className="text-[10px] font-black text-slate-400 uppercase block mb-1">Preço Estimado de Venda (IA)</p>
            <p className="text-xl font-black text-slate-900">R$ {vehicleData.price.toLocaleString('pt-BR')}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-600 p-4 rounded-2xl text-white">
            <p className="text-[10px] font-bold opacity-80 uppercase">LUCRO LÍQUIDO</p>
            <p className="text-xl font-black">R$ {profit.toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-blue-600 p-4 rounded-2xl text-white">
            <p className="text-[10px] font-bold opacity-80 uppercase">MARGEM ROI</p>
            <p className="text-xl font-black">{roi.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    );
  };

  // --- OVERLAY DAS FERRAMENTAS ---
  const ToolOverlay = () => {
    if (!activeTool) return null;
    const titles: Record<string, string> = {
      dossier: 'Dossiê Profissional', ads: 'Anúncios Turbo',
      future: 'Visão de Futuro', negotiation: 'Cards de Negociação', profit: 'Lucro na Veia'
    };

    return (
      <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-fade-in">
        <header className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
          <button onClick={() => setActiveTool(null)} className="p-2 -ml-2"><ArrowLeft className="w-6 h-6" /></button>
          <h3 className="font-black text-slate-900 uppercase tracking-tighter">{titles[activeTool]}</h3>
          <div className="w-10"></div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 pb-24">
          {isToolLoading ? (
             <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Processando Inteligência...</p>
             </div>
          ) : (
            <div className="animate-fade-in-up">
              {activeTool === 'profit' ? <ProfitCalculator /> : (
                <div className={`prose prose-slate max-w-none ${activeTool === 'dossier' ? 'bg-slate-900 text-white p-8 rounded-3xl shadow-2xl' : 'bg-gray-50 p-6 rounded-2xl'}`}>
                  {activeTool === 'dossier' && (
                    <div className="mb-8 text-center border-b border-white/20 pb-6">
                       <CheckCircle2 className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                       <h1 className="text-2xl font-black uppercase text-white m-0 tracking-tighter">Laudo de Mercado</h1>
                       <p className="text-blue-300 font-mono text-[10px] m-0">AVALIAÇÃO REGIONAL CERTIFICADA - {vehicleData.uf}</p>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {toolContent}
                  </div>
                  {activeTool === 'dossier' && (
                    <button onClick={() => window.print()} className="w-full mt-10 py-4 bg-white text-slate-900 font-black rounded-xl flex items-center justify-center gap-2">
                       <Printer className="w-5 h-5" /> SALVAR / IMPRIMIR LAUDO
                    </button>
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
        <button onClick={onReset} className="p-2 hover:bg-gray-200 rounded-full"><ArrowLeft className="w-6 h-6" /></button>
        <h2 className="text-xl font-bold">Resultados para {vehicleData.brandModel}</h2>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 p-5 rounded-2xl text-white">
           <p className="text-[10px] font-black opacity-50 uppercase tracking-widest">Preço Sugerido</p>
           <p className="text-xl font-black tracking-tighter">{data.crmData.faixa_preco_sugerida}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Liquidez em {vehicleData.uf}</p>
           <p className="text-xl font-black text-slate-900 tracking-tighter">{data.crmData.nivel_dificuldade_venda}</p>
        </div>
      </div>

      {/* Análise Principal */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-100 px-6 py-4 flex items-center gap-2">
           <Target className="w-5 h-5 text-slate-600" />
           <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Inteligência de Mercado</h3>
        </div>
        <div className="p-6 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
          {data.priceAnalysis}
          {data.groundingUrls && data.groundingUrls.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Fontes Verificadas ({vehicleData.uf}):</p>
              {data.groundingUrls.map((link, i) => (
                <a key={i} href={link.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-[11px] text-slate-500 font-bold hover:bg-slate-100 truncate">
                  <ExternalLink className="w-3 h-3 text-blue-500 shrink-0" /> {link.title}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Menu flutuante de Ferramentas */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex items-end p-4 animate-fade-in">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowMenu(false)}></div>
           <div className="relative w-full bg-white rounded-3xl overflow-hidden animate-fade-in-up">
              <div className="p-6 border-b flex justify-between items-center">
                <h4 className="font-black text-slate-900 uppercase tracking-tighter">Estratégias PRO</h4>
                <button onClick={() => setShowMenu(false)} className="p-2 bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-3 grid gap-2">
                <button onClick={() => openTool('dossier')} className="w-full p-4 flex items-center gap-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all text-left group">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-xl group-hover:scale-110 transition-transform"><FileText className="w-6 h-6" /></div>
                  <div><p className="font-bold text-slate-900">Dossiê de Venda</p><p className="text-[10px] text-slate-400 uppercase font-black">Laudo Visual</p></div>
                  <ChevronRight className="ml-auto text-slate-300" />
                </button>
                <button onClick={() => openTool('ads')} className="w-full p-4 flex items-center gap-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all text-left group">
                  <div className="p-3 bg-orange-100 text-orange-600 rounded-xl group-hover:scale-110 transition-transform"><Megaphone className="w-6 h-6" /></div>
                  <div><p className="font-bold text-slate-900">Anúncio Turbo</p><p className="text-[10px] text-slate-400 uppercase font-black">Copy de Venda</p></div>
                  <ChevronRight className="ml-auto text-slate-300" />
                </button>
                <button onClick={() => openTool('future')} className="w-full p-4 flex items-center gap-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all text-left group">
                  <div className="p-3 bg-purple-100 text-purple-600 rounded-xl group-hover:scale-110 transition-transform"><TrendingDown className="w-6 h-6" /></div>
                  <div><p className="font-bold text-slate-900">Visão de Futuro</p><p className="text-[10px] text-slate-400 uppercase font-black">Previsão 24 Meses</p></div>
                  <ChevronRight className="ml-auto text-slate-300" />
                </button>
                <button onClick={() => openTool('negotiation')} className="w-full p-4 flex items-center gap-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all text-left group">
                  <div className="p-3 bg-red-100 text-red-600 rounded-xl group-hover:scale-110 transition-transform"><ShieldAlert className="w-6 h-6" /></div>
                  <div><p className="font-bold text-slate-900">Cards de Objeção</p><p className="text-[10px] text-slate-400 uppercase font-black">Scripts de Guerra</p></div>
                  <ChevronRight className="ml-auto text-slate-300" />
                </button>
                <button onClick={() => openTool('profit')} className="w-full p-4 flex items-center gap-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all text-left group">
                  <div className="p-3 bg-green-100 text-green-600 rounded-xl group-hover:scale-110 transition-transform"><Calculator className="w-6 h-6" /></div>
                  <div><p className="font-bold text-slate-900">Calculadora de Lucro</p><p className="text-[10px] text-slate-400 uppercase font-black">Margem de Revenda</p></div>
                  <ChevronRight className="ml-auto text-slate-300" />
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Floating Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 z-50">
        <div className="max-w-md mx-auto flex gap-3">
          <a href={`https://wa.me/?text=${generateWhatsAppText()}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-green-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 active:scale-95 transition-transform">
            <Share2 className="w-5 h-5" /> COMPARTILHAR
          </a>
          <button onClick={() => setShowMenu(true)} className="flex-1 bg-slate-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 active:scale-95 transition-transform">
            <LayoutGrid className="w-5 h-5" /> FERRAMENTAS PRO
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResult;
