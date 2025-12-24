
import React, { useState } from 'react';
import { AnalysisResponse, VehicleFormData, ToolType } from '../types';
import { 
  Share2, ArrowLeft, ExternalLink, LayoutGrid, FileText, 
  Megaphone, TrendingUp, TrendingDown, ShieldAlert, Calculator, X, 
  ChevronRight, Printer, CheckCircle2, DollarSign, Target,
  Zap, Copy, Check, Car, ShieldCheck, AlertTriangle,
  Lightbulb, MessageSquare, Tag, Bell, BellRing, Loader2, MapPin
} from 'lucide-react';
import { generateToolContent } from '../services/geminiService';
import RoiCalculator from './RoiCalculator';

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

  const AFFILIATE_LINK = "https://anycar.com.br/?ind=lwiVZxBshn"; 

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
    const text = `*AvalIA AI - Inteligência Automotiva*\n\n` +
      `🚗 *Veículo:* ${vehicleData.brandModel} ${vehicleData.year}\n` +
      `📍 *Local:* ${vehicleData.city}/${vehicleData.uf}\n` +
      `💰 *Sugestão de Preço:* ${data.crmData.faixa_preco_sugerida}\n` +
      `📈 *Tendência:* ${data.crmData.tendencia_mercado === 'alta' ? 'Alta' : 'Estável'}\n\n` +
      `_avaliaaiautomoveis.com_`;
    return encodeURIComponent(text);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 pb-32 animate-fade-in">
      
      {/* Tool Overlay */}
      {activeTool && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-fade-in">
          <header className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
            <button onClick={() => setActiveTool(null)} className="p-2 -ml-2 text-slate-400 hover:text-slate-900"><ArrowLeft className="w-6 h-6" /></button>
            <h3 className="font-black text-slate-900 uppercase tracking-tighter text-sm italic">{activeTool}</h3>
            <div className="w-6"></div>
          </header>
          <div className="flex-1 overflow-y-auto p-6">
            {isToolLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-blue-600 mb-2" />
                <p className="text-[10px] font-black text-slate-400 uppercase">Processando...</p>
              </div>
            ) : activeTool === 'profit' ? (
              <RoiCalculator baseSalePrice={vehicleData.price} brandModel={vehicleData.brandModel} />
            ) : (
              <div className={`p-8 rounded-3xl ${activeTool === 'dossier' ? 'bg-slate-900 text-white shadow-2xl' : 'bg-slate-50 border'}`}>
                 <div className="whitespace-pre-wrap text-sm leading-relaxed">{toolContent}</div>
                 <div className="mt-8 flex gap-2">
                   <button onClick={() => copyToClipboard(toolContent)} className="flex-1 py-3 bg-white text-slate-900 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} COPIAR
                   </button>
                   {activeTool === 'dossier' && (
                     <button onClick={() => window.print()} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2">
                       <Printer className="w-4 h-4" /> IMPRIMIR
                     </button>
                   )}
                 </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onReset} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft className="w-6 h-6 text-slate-600" /></button>
          <h2 className="text-xl font-bold text-slate-800 truncate max-w-[200px]">{vehicleData.brandModel}</h2>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black border border-blue-100">
           <MapPin className="w-3 h-3" /> {vehicleData.city}/{vehicleData.uf}
        </div>
      </div>

      {/* Cards de Preço e Liquidez */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 p-5 rounded-2xl text-white shadow-xl">
           <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-1">Preço Sugerido</p>
           <p className="text-xl font-black tracking-tighter">{data.crmData.faixa_preco_sugerida}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tendência em {vehicleData.city}</p>
           <div className="flex items-center gap-1">
             {data.crmData.tendencia_mercado === 'alta' ? <TrendingUp className="text-emerald-500 w-5 h-5" /> : <TrendingDown className="text-red-500 w-5 h-5" />}
             <span className="text-sm font-black uppercase tracking-tighter">{data.crmData.tendencia_mercado || 'Estável'}</span>
           </div>
        </div>
      </div>

      {/* Análise Principal */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 flex items-center gap-2 border-b border-slate-100">
           <Target className="w-4 h-4 text-blue-600" />
           <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Análise do Mercado Local</h3>
        </div>
        <div className="p-6 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
          {data.priceAnalysis}
          {data.groundingUrls && (
            <div className="mt-6 pt-4 border-t border-slate-50 flex flex-wrap gap-2">
              {data.groundingUrls.map((link, i) => (
                <a key={i} href={link.uri} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border rounded-lg text-[10px] font-bold text-slate-500">
                  <ExternalLink className="w-3 h-3 text-blue-500" /> {link.title}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Slot de Segurança */}
      <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex items-start gap-4">
        <ShieldCheck className="w-10 h-10 text-amber-600 shrink-0" />
        <div className="space-y-2">
          <h4 className="font-black text-sm text-amber-900 uppercase">Check de Segurança</h4>
          <p className="text-xs text-amber-700 leading-tight">Evite prejuízos em {vehicleData.city}. Verifique histórico de leilão e multas antes de fechar.</p>
          <a href={AFFILIATE_LINK} target="_blank" className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase">Consultar Histórico</a>
        </div>
      </div>

      {/* Floating Menu */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-100 z-50">
        <div className="max-w-md mx-auto flex gap-3">
          <a href={`https://wa.me/?text=${generateWhatsAppText()}`} target="_blank" className="flex-1 bg-green-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest shadow-lg">
            <Share2 className="w-5 h-5" /> COMPARTILHAR
          </a>
          <button onClick={() => setShowMenu(true)} className="flex-1 bg-slate-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest shadow-lg">
            <LayoutGrid className="w-5 h-5" /> FERRAMENTAS PRO
          </button>
        </div>
      </div>

      {/* Menu Overlay */}
      {showMenu && (
        <div className="fixed inset-0 z-[70] flex items-end p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowMenu(false)}></div>
           <div className="relative w-full bg-white rounded-3xl overflow-hidden animate-fade-in-up">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                <h4 className="font-black text-slate-900 uppercase text-xs">Ações Estratégicas</h4>
                <button onClick={() => setShowMenu(false)} className="p-2 border rounded-full"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-4 grid gap-3">
                 <button onClick={() => openTool('dossier')} className="w-full p-4 bg-blue-50 rounded-2xl flex items-center gap-4 text-left border border-blue-100">
                    <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600"><FileText /></div>
                    <div><p className="font-black text-sm">Dossiê de Venda</p><p className="text-[10px] text-blue-600 font-bold uppercase">PDF Certificado para {vehicleData.city}</p></div>
                 </button>
                 <button onClick={() => openTool('profit')} className="w-full p-4 bg-emerald-50 rounded-2xl flex items-center gap-4 text-left border border-emerald-100">
                    <div className="p-3 bg-white rounded-xl shadow-sm text-emerald-600"><Calculator /></div>
                    <div><p className="font-black text-sm">Calculadora ROI</p><p className="text-[10px] text-emerald-600 font-bold uppercase">Projeção de Lucro Líquido</p></div>
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisResult;
