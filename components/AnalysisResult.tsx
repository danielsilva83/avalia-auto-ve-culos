
import React, { useState } from 'react';
import { AnalysisResponse, VehicleFormData, ToolType } from '../types';
import { 
  Share2, Copy, BrainCircuit, ArrowLeft, MessageSquareQuote, 
  ExternalLink, LayoutGrid, FileText, Megaphone, TrendingDown, 
  ShieldAlert, Calculator, X, ChevronRight, Check, Printer,
  CheckCircle2
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
    
    if (type === 'profit') return; // Calculadora é local

    setIsToolLoading(true);
    try {
      const content = await generateToolContent(type, vehicleData);
      setToolContent(content);
    } catch (e) {
      setToolContent("Erro ao carregar ferramenta.");
    } finally {
      setIsToolLoading(false);
    }
  };

  const generateWhatsAppText = () => {
    const text = `*AvalIA AI - Avaliação Regional (${vehicleData.uf})* 🚗\n\n` +
      `*Veículo:* ${vehicleData.brandModel} ${vehicleData.year}\n` +
      `*Sugestão:* ${data.crmData.faixa_preco_sugerida}\n\n` +
      `_Acesse: avaliaaiautomoveis.com_`;
    return encodeURIComponent(text);
  };

  // --- SUB-COMPONENTES DE FERRAMENTAS ---

  const ProfitCalculator = () => {
    const [purchase, setPurchase] = useState(vehicleData.price * 0.85);
    const [maint, setMaint] = useState(1500);
    const expectedSale = vehicleData.price;
    const profit = expectedSale - purchase - maint;
    const margin = (profit / purchase) * 100;

    return (
      <div className="space-y-6">
        <div className="bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-200">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Valor de Compra (R$)</label>
            <input type="number" value={purchase} onChange={e => setPurchase(Number(e.target.value))} className="w-full p-2 rounded border" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Recondicionamento/Estética (R$)</label>
            <input type="number" value={maint} onChange={e => setMaint(Number(e.target.value))} className="w-full p-2 rounded border" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 p-4 rounded-xl border border-green-100">
            <p className="text-xs text-green-600 font-bold uppercase">Lucro Estimado</p>
            <p className="text-xl font-black text-green-700">R$ {profit.toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-600 font-bold uppercase">Margem ROI</p>
            <p className="text-xl font-black text-blue-700">{margin.toFixed(1)}%</p>
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
      future: 'Projeção de Desvalorização',
      negotiation: 'Guia de Objeções (Battle Cards)',
      profit: 'Calculadora de Margem (Revenda)'
    };

    return (
      <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-fade-in">
        <header className="px-6 py-4 border-b flex items-center justify-between bg-white sticky top-0">
          <button onClick={() => setActiveTool(null)} className="p-2 -ml-2 text-slate-400 hover:text-slate-900">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h3 className="font-bold text-slate-900">{titles[activeTool as string]}</h3>
          <div className="w-10"></div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 pb-24">
          {isToolLoading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
              <p className="text-slate-400 text-sm">IA gerando inteligência...</p>
            </div>
          ) : (
            <div className="animate-fade-in-up">
              {activeTool === 'profit' ? (
                <ProfitCalculator />
              ) : activeTool === 'dossier' ? (
                <div className="border-4 border-slate-900 p-8 rounded-3xl space-y-8 bg-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 bg-slate-900 text-white rounded-bl-2xl">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <h1 className="text-3xl font-black uppercase italic tracking-tighter">Laudo de Avaliação</h1>
                    <p className="text-slate-400 font-mono text-xs">CERTIFICADO POR AVALIA AI - {vehicleData.uf}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl">
                    <div><span className="text-slate-400">Modelo:</span><br/><b>{vehicleData.brandModel}</b></div>
                    <div><span className="text-slate-400">Ano:</span><br/><b>{vehicleData.year}</b></div>
                    <div><span className="text-slate-400">KM:</span><br/><b>{vehicleData.mileage.toLocaleString()}</b></div>
                    <div><span className="text-slate-400">Estado:</span><br/><b>{vehicleData.uf}</b></div>
                  </div>
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap text-slate-700">
                    {data.priceAnalysis}
                  </div>
                  <button onClick={() => window.print()} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                    <Printer className="w-5 h-5" /> Imprimir / Salvar PDF
                  </button>
                </div>
              ) : (
                <div className="prose prose-slate max-w-none whitespace-pre-wrap bg-slate-50 p-6 rounded-2xl border border-slate-100 text-slate-800 text-sm leading-relaxed">
                  {toolContent}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 pb-24">
      <ToolOverlay />

      {/* Header com Botão Voltar */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onReset} className="p-2 hover:bg-gray-200 rounded-full text-gray-600"><ArrowLeft className="w-6 h-6" /></button>
        <h2 className="text-xl font-bold text-gray-800">Resultado em {vehicleData.uf}</h2>
      </div>

      {/* Dashboard Resumo */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
           <p className="text-[10px] font-bold text-slate-400 uppercase">Sugestão Real</p>
           <p className="text-lg font-black text-slate-900">{data.crmData.faixa_preco_sugerida}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
           <p className="text-[10px] font-bold text-slate-400 uppercase">Dificuldade</p>
           <p className="text-lg font-black text-slate-900">{data.crmData.nivel_dificuldade_venda}</p>
        </div>
      </div>

      {/* Análise de Preço Principal */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-slate-900 px-6 py-4"><h3 className="text-white font-bold flex items-center gap-2">📊 Análise de Mercado</h3></div>
        <div className="p-6 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
          {data.priceAnalysis}
          {data.groundingUrls && data.groundingUrls.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Fontes Ativas ({vehicleData.uf}):</p>
              <div className="space-y-2">
                {data.groundingUrls.map((link, idx) => (
                  <a key={idx} href={link.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 group transition-all">
                    <ExternalLink className="w-3 h-3 text-blue-500" /><span className="text-[11px] text-gray-600 truncate">{link.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Menu flutuante de Ferramentas PRO */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex items-end p-4 animate-fade-in">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowMenu(false)}></div>
           <div className="relative w-full max-w-md mx-auto bg-white rounded-3xl overflow-hidden animate-fade-in-up">
              <div className="p-6 border-b flex items-center justify-between">
                <h3 className="font-black text-slate-900 uppercase tracking-tighter text-xl">Ferramentas Estratégicas</h3>
                <button onClick={() => setShowMenu(false)} className="p-2 bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4 grid gap-3">
                <button onClick={() => openTool('dossier')} className="w-full p-4 flex items-center gap-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all group">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-xl group-hover:scale-110 transition-transform"><FileText className="w-6 h-6" /></div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900">Dossiê Profissional</p>
                    <p className="text-xs text-slate-400">Laudo visual para enviar ao cliente/comprador.</p>
                  </div>
                  <ChevronRight className="ml-auto text-slate-300" />
                </button>
                <button onClick={() => openTool('ads')} className="w-full p-4 flex items-center gap-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all group">
                  <div className="p-3 bg-orange-100 text-orange-600 rounded-xl group-hover:scale-110 transition-transform"><Megaphone className="w-6 h-6" /></div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900">Gerador de Anúncios</p>
                    <p className="text-xs text-slate-400">Copywriting otimizada para OLX e Webmotors.</p>
                  </div>
                  <ChevronRight className="ml-auto text-slate-300" />
                </button>
                <button onClick={() => openTool('future')} className="w-full p-4 flex items-center gap-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all group">
                  <div className="p-3 bg-purple-100 text-purple-600 rounded-xl group-hover:scale-110 transition-transform"><TrendingDown className="w-6 h-6" /></div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900">Projeção Futura</p>
                    <p className="text-xs text-slate-400">Quanto este carro valerá em 6, 12 e 24 meses.</p>
                  </div>
                  <ChevronRight className="ml-auto text-slate-300" />
                </button>
                <button onClick={() => openTool('negotiation')} className="w-full p-4 flex items-center gap-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all group">
                  <div className="p-3 bg-red-100 text-red-600 rounded-xl group-hover:scale-110 transition-transform"><ShieldAlert className="w-6 h-6" /></div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900">Battle Cards de Negociação</p>
                    <p className="text-xs text-slate-400">Respostas para as 5 maiores objeções.</p>
                  </div>
                  <ChevronRight className="ml-auto text-slate-300" />
                </button>
                <button onClick={() => openTool('profit')} className="w-full p-4 flex items-center gap-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all group">
                  <div className="p-3 bg-green-100 text-green-600 rounded-xl group-hover:scale-110 transition-transform"><Calculator className="w-6 h-6" /></div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900">Calculadora de Margem</p>
                    <p className="text-xs text-slate-400">Ferramenta essencial para revendedores.</p>
                  </div>
                  <ChevronRight className="ml-auto text-slate-300" />
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-200 z-50 flex justify-center gap-3">
        <div className="w-full max-w-md flex gap-3">
          <a href={`https://wa.me/?text=${generateWhatsAppText()}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
            <Share2 className="w-5 h-5" /> WhatsApp
          </a>
          <button onClick={() => setShowMenu(true)} className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
            <LayoutGrid className="w-5 h-5" /> Ferramentas PRO
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResult;
