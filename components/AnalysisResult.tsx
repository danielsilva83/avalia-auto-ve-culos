
import React, { useState } from 'react';
import { AnalysisResponse, VehicleFormData, ToolType } from '../types';
import { 
  Share2, ArrowLeft, ExternalLink, LayoutGrid, FileText, 
  Megaphone, TrendingDown, ShieldAlert, Calculator, X, 
  ChevronRight, Printer, CheckCircle2, DollarSign, Target,
  Zap, Copy, Check, Settings2, Car, ShieldCheck, AlertTriangle,
  Lightbulb, MessageSquare, Tag, Send
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
    const text = `*AvalIA AI - Inteligência Automotiva (${vehicleData.uf})*\n\n` +
      `🚗 *Veículo:* ${vehicleData.brandModel} ${vehicleData.year}\n` +
      `💰 *Sugestão de Preço:* ${data.crmData.faixa_preco_sugerida}\n` +
      `📉 *Liquidez:* ${data.crmData.nivel_dificuldade_venda}\n\n` +
      `_Gerado por: avaliaaiautomoveis.com_`;
    return encodeURIComponent(text);
  };

  const shareDossierWhatsApp = () => {
    const text = `*📄 DOSSIÊ DE VENDA CERTIFICADO - AvalIA AI*\n\n` +
      `🚗 *VEÍCULO:* ${vehicleData.brandModel.toUpperCase()}\n` +
      `📅 *ANO:* ${vehicleData.year}\n` +
      `📍 *REGIÃO:* ${vehicleData.uf}\n\n` +
      `${toolContent.replace(/[#*]/g, '')}\n\n` +
      `_Relatório gerado via avaliaaiautomoveis.com_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const ToolOverlay = () => {
    if (!activeTool) return null;
    const titles: Record<string, string> = {
      dossier: 'Dossiê de Venda Profissional',
      ads: 'Gerador de Anúncios Turbo',
      future: 'Visão de Futuro (6-24m)',
      negotiation: 'Cards de Negociação',
      profit: 'Cálculadora de ROI Automotivo'
    };

    return (
      <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-fade-in print:relative print:block print:bg-white">
        <header className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10 print:hidden">
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

        <div className="flex-1 overflow-y-auto p-6 pb-32 print:p-0 print:overflow-visible print:block">
          {isToolLoading ? (
             <div className="flex flex-col items-center justify-center h-64 space-y-4 print:hidden">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Gerando Inteligência...</p>
             </div>
          ) : (
            <div className="animate-fade-in-up print:animate-none print:block">
              {activeTool === 'profit' ? (
                <RoiCalculator baseSalePrice={vehicleData.price} brandModel={vehicleData.brandModel} />
              ) : (
                <div id="printable-dossier" className={`prose prose-slate max-w-none ${activeTool === 'dossier' ? 'bg-slate-900 text-white p-8 rounded-3xl shadow-2xl border-4 border-slate-800 print:bg-white print:text-black print:p-0 print:border-none print:shadow-none print:block' : 'bg-gray-50 p-6 rounded-2xl border border-slate-100'}`}>
                  {activeTool === 'dossier' && (
                    <div className="mb-8 text-center border-b border-white/10 pb-8 print:border-slate-200 print:mb-6 print:pb-6 print:block">
                       <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl print:hidden">
                          <Car className="w-10 h-10 text-white" />
                       </div>
                       <h1 className="text-3xl font-black uppercase text-white m-0 tracking-tighter italic print:text-black print:text-2xl">Laudo de Avaliação</h1>
                       <p className="text-blue-400 font-mono text-[10px] m-0 mt-2 uppercase tracking-widest print:text-slate-500">Certificado Regional AvalIA AI - {vehicleData.uf}</p>
                       <div className="mt-6 grid grid-cols-2 gap-2 text-[10px] font-bold print:mt-4">
                          <div className="bg-white/5 p-2 rounded uppercase border border-white/5 print:border-slate-200 print:bg-slate-50 print:text-black">{vehicleData.brandModel}</div>
                          <div className="bg-white/5 p-2 rounded uppercase border border-white/5 print:border-slate-200 print:bg-slate-50 print:text-black">Ano {vehicleData.year}</div>
                       </div>
                    </div>
                  )}
                  <div className={`whitespace-pre-wrap text-sm leading-relaxed ${activeTool === 'dossier' ? 'text-slate-300 print:text-black print:text-sm' : 'text-slate-700'}`}>
                    {toolContent}
                  </div>
                  {activeTool === 'dossier' && (
                    <div className="mt-12 pt-8 border-t border-white/10 flex flex-col gap-4 print:mt-8 print:pt-4 print:border-slate-100">
                      <div className="print:hidden flex flex-col gap-4">
                        <button 
                          onClick={shareDossierWhatsApp} 
                          className="w-full py-4 bg-green-600 text-white font-black rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 transition-colors shadow-lg"
                        >
                           <Send className="w-5 h-5" /> COMPARTILHAR NO WHATSAPP
                        </button>
                        <button 
                          onClick={() => window.print()} 
                          className="w-full py-4 bg-white/10 text-white font-black rounded-xl flex items-center justify-center gap-2 hover:bg-white/20 transition-colors border border-white/10"
                        >
                           <Printer className="w-5 h-5" /> SALVAR COMO PDF
                        </button>
                      </div>
                      <p className="text-center text-[9px] text-slate-500 uppercase font-black print:text-left print:text-[8px] print:mt-4">Este documento é um relatório informativo baseado em inteligência artificial regional e não substitui vistoria cautelar física ou perícia técnica presencial.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page { margin: 1.5cm; }
            body { background: white !important; color: black !important; }
            nav, header, footer, .print\\:hidden { display: none !important; }
            #printable-dossier { 
              visibility: visible !important; 
              display: block !important;
              position: relative !important;
              width: 100% !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              color: black !important;
            }
            #printable-dossier * { 
              visibility: visible !important; 
              color: black !important;
              background: transparent !important;
              overflow: visible !important;
            }
            /* Esconde tudo exceto o dossiê */
            body > *:not(.fixed) { display: none !important; }
            .fixed:has(#printable-dossier) { 
              position: relative !important; 
              display: block !important; 
              background: white !important;
              z-index: auto !important;
            }
          }
        `}} />
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

      {/* Cards de Preço e Liquidez */}
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

      {/* Análise Principal */}
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

      {/* Tags de CRM */}
      {data.crmData.tags_sugeridas && data.crmData.tags_sugeridas.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {data.crmData.tags_sugeridas.map((tag, i) => (
            <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 uppercase tracking-tight">
              <Tag className="w-3 h-3 text-slate-400" /> {tag}
            </span>
          ))}
        </div>
      )}

      {/* Scripts de Negociação */}
      {data.salesScripts && data.salesScripts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="bg-blue-50 px-6 py-4 flex items-center gap-2 border-b border-blue-100">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <h3 className="font-black text-blue-900 uppercase text-[10px] tracking-widest">Argumentos de Venda</h3>
          </div>
          <div className="p-4 space-y-3">
            {data.salesScripts.map((script, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 italic flex gap-3">
                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                "{script}"
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pílula de Conhecimento */}
      {data.knowledgePill && (
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-6 flex gap-4">
          <div className="bg-amber-100 p-3 rounded-xl h-fit">
            <Lightbulb className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h4 className="font-black text-amber-900 uppercase text-[10px] tracking-widest mb-1">Você Sabia?</h4>
            <p className="text-xs text-amber-800 leading-relaxed">{data.knowledgePill}</p>
          </div>
        </div>
      )}

      {/* SLOT DE AFILIADOS */}
      <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-6 border border-slate-200 shadow-sm animate-fade-in-up">
        <div className="flex items-start gap-4 mb-4">
          <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200">
            <ShieldCheck className="w-6 h-6 text-slate-900" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Check de Segurança Obrigatório</h4>
            <p className="text-xs text-slate-500">Evite prejuízos com carros de leilão, sinistro ou bloqueio judicial.</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>3 em cada 10 veículos possuem histórico de leilão.</span>
          </div>
          
          <a 
            href={AFFILIATE_LINK} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 uppercase text-xs"
          >
            Consultar Histórico Completo <ExternalLink className="w-4 h-4" />
          </a>
          <p className="text-[9px] text-center text-slate-400 uppercase font-medium">Relatório completo via Olho no Carro®</p>
        </div>
      </div>

      {/* Menu de Ferramentas PRO */}
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

      {/* Floating Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-100 z-50 print:hidden">
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
