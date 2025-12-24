
import React, { useState, useEffect } from 'react';
import { historyService } from '../services/historyService';
import { User, AnalysisResponse, VehicleFormData } from '../types';
import { 
  Car, History, ChevronRight, TrendingUp, 
  Loader2, Zap, Sparkles, Camera, ArrowUpRight, Plus, LogOut, MapPin
} from 'lucide-react';

interface UserDashboardProps {
  user: User;
  onSelectConsultation: (analysis: AnalysisResponse, vehicle: VehicleFormData) => void;
  onNewEvaluation: () => void;
  onStartHealthCheck: () => void;
  onLogout: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ 
  user, onSelectConsultation, onNewEvaluation, onStartHealthCheck, onLogout 
}) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const h = await historyService.getHistory(user.id);
      setHistory(h);
      setLoading(false);
    };
    loadData();
  }, [user.id]);

  const totalEquity = history.reduce((acc, item) => {
    const priceStr = item.crmData.faixa_preco_sugerida.match(/\d+/g)?.join('') || "0";
    return acc + (parseInt(priceStr) / 100 || 0); 
  }, 0);

  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-fade-in pb-24">
      {/* Header Patrimônio */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/20 blur-[80px] rounded-full"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Garagem Virtual</p>
            <button onClick={onLogout} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
              <LogOut className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <h2 className="text-4xl font-black tracking-tighter mb-6 italic">
            R$ {totalEquity > 0 ? totalEquity.toLocaleString('pt-BR', { minimumFractionDigits: 0 }) : '---'}
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
             <button onClick={onNewEvaluation} className="bg-blue-600 hover:bg-blue-700 p-3 rounded-2xl flex flex-col items-center gap-1 transition-all shadow-lg active:scale-95">
                <Plus className="w-5 h-5 text-white" />
                <span className="text-[9px] font-black uppercase">Avaliar Carro</span>
             </button>
             <button onClick={onStartHealthCheck} className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-2xl flex flex-col items-center gap-1 transition-all active:scale-95">
                <Camera className="w-5 h-5 text-blue-400" />
                <span className="text-[9px] font-black uppercase">Health Scan IA</span>
             </button>
          </div>
        </div>
      </div>

      {/* Feed de Inteligência */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
          <Sparkles className="w-4 h-4 text-blue-500" /> Insight do Mercado
        </h3>
        
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-3xl flex items-start gap-4">
          <div className="bg-blue-600 p-2 rounded-xl text-white">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Dica Regional</p>
            <p className="text-xs text-slate-700 font-bold leading-tight">
              A demanda por seminovos em {localStorage.getItem('avalia_uf') || 'SP'} está em alta. Veículos brancos e pratas vendem 12% mais rápido.
            </p>
          </div>
        </div>
      </div>

      {/* Meus Carros */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Meus Carros</h3>
          <History className="w-4 h-4 text-slate-300" />
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600" /></div>
        ) : history.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-100 rounded-3xl p-10 text-center opacity-50">
             <Car className="w-10 h-10 mx-auto mb-2 text-slate-200" />
             <p className="text-xs font-bold uppercase text-slate-400 tracking-tighter">Sua garagem está vazia</p>
          </div>
        ) : (
          history.map((item, idx) => (
            <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm group hover:border-blue-200 transition-all cursor-pointer" onClick={() => onSelectConsultation(item, item.vehicleData)}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Car className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-black text-slate-900 uppercase tracking-tighter text-sm">{item.vehicleData.brandModel}</h4>
                    {item.crmData.tendencia_mercado === 'alta' && (
                       <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-black text-slate-900">{item.crmData.faixa_preco_sugerida}</span>
                    <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase">
                      <MapPin className="w-2 h-2" /> {item.vehicleData.city || item.vehicleData.uf}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-blue-500 transition-colors" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dica PRO */}
      <div className="bg-slate-900 p-6 rounded-[2rem] flex items-center gap-4 text-white">
        <Zap className="w-8 h-8 text-yellow-400 fill-current" />
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">AvalIA PRO</p>
          <p className="text-xs font-medium leading-tight text-slate-300">Gere Dossiês em PDF com dados específicos de {localStorage.getItem('avalia_uf') || 'sua região'}.</p>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
