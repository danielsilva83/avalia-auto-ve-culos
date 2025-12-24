
import React, { useState, useEffect } from 'react';
import { historyService } from '../services/historyService';
import { User, AnalysisResponse, VehicleFormData, PriceAlert } from '../types';
import { 
  Car, Bell, History, ChevronRight, Calendar, MapPin, 
  TrendingUp, Trash2, Loader2, Inbox
} from 'lucide-react';

interface UserDashboardProps {
  user: User;
  onSelectConsultation: (analysis: AnalysisResponse, vehicle: VehicleFormData) => void;
  onBack: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, onSelectConsultation, onBack }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'history' | 'alerts'>('history');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [h, a] = await Promise.all([
        historyService.getHistory(user.id),
        historyService.getAlerts(user.id)
      ]);
      setHistory(h);
      setAlerts(a);
      setLoading(false);
    };
    loadData();
  }, [user.id]);

  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-fade-in pb-20">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Minha Garagem</h2>
        <button onClick={onBack} className="text-xs font-bold text-blue-600 uppercase">Voltar</button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl">
        <button 
          onClick={() => setTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${tab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
        >
          <History className="w-4 h-4" /> Meus Carros
        </button>
        <button 
          onClick={() => setTab('alerts')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${tab === 'alerts' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
        >
          <Bell className="w-4 h-4" /> Alertas
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-2" />
          <p className="text-xs font-bold uppercase tracking-widest">Carregando garagem...</p>
        </div>
      ) : tab === 'history' ? (
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <Car className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 text-xs font-bold uppercase">Nenhuma avaliação salva</p>
            </div>
          ) : (
            history.map((item, idx) => (
              <button 
                key={idx}
                onClick={() => onSelectConsultation(item, item.vehicleData)}
                className="w-full p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 hover:border-blue-200 transition-all text-left shadow-sm group"
              >
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Car className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{item.vehicleData.brandModel}</p>
                    <span className="text-[9px] text-slate-400 font-bold">{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase">{item.vehicleData.uf}</span>
                    <span className="text-[10px] font-bold text-slate-400">{item.crmData.faixa_preco_sugerida}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 text-xs font-bold uppercase">Nenhum alerta ativo</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-black text-slate-900 text-sm uppercase">{alert.brandModel}</h4>
                    <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> Monitorando em {alert.uf}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-[8px] font-black uppercase ${alert.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                    {alert.active ? 'Ativo' : 'Pausado'}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase">Preço Base</p>
                    <p className="text-sm font-black text-slate-900">R$ {alert.initialPrice.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-blue-600 uppercase">Status</p>
                    <p className="text-[10px] font-bold text-slate-600">Buscando flutuações...</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
