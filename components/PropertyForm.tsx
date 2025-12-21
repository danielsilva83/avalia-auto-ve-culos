
import React, { useState, useEffect } from 'react';
import { VehicleFormData } from '../types';
import { 
  Car, Calendar, Gauge, Fuel, DollarSign, 
  Settings2, Tag, ShieldCheck, CheckCircle2,
  MapPin, Check, ChevronDown, Zap
} from 'lucide-react';

interface VehicleFormProps {
  onSubmit: (data: VehicleFormData) => void;
  isLoading: boolean;
  defaultUf?: string;
}

const BRAZIL_STATES = [
  { uf: 'AC', name: 'Acre' }, { uf: 'AL', name: 'Alagoas' }, { uf: 'AP', name: 'Amapá' },
  { uf: 'AM', name: 'Amazonas' }, { uf: 'BA', name: 'Bahia' }, { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' }, { uf: 'ES', name: 'Espírito Santo' }, { uf: 'GO', name: 'Goiás' },
  { uf: 'MA', name: 'Maranhão' }, { uf: 'MT', name: 'Mato Grosso' }, { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'MG', name: 'Minas Gerais' }, { uf: 'PA', name: 'Pará' }, { uf: 'PB', name: 'Paraíba' },
  { uf: 'PR', name: 'Paraná' }, { uf: 'PE', name: 'Pernambuco' }, { uf: 'PI', name: 'Piauí' },
  { uf: 'RJ', name: 'Rio de Janeiro' }, { uf: 'RN', name: 'Rio Grande do Norte' }, { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'RO', name: 'Rondônia' }, { uf: 'RR', name: 'Roraima' }, { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'SP', name: 'São Paulo' }, { uf: 'SE', name: 'Sergipe' }, { uf: 'TO', name: 'Tocantins' }
];

const VehicleForm: React.FC<VehicleFormProps> = ({ onSubmit, isLoading, defaultUf }) => {
  const [formData, setFormData] = useState<VehicleFormData>({
    transactionType: 'venda',
    type: 'Carro',
    brandModel: '',
    year: new Date().getFullYear(),
    mileage: 0,
    transmission: 'Automático',
    fuel: 'Flex',
    color: '',
    condition: 'Bom',
    price: 0,
    uf: defaultUf || 'SP',
    isArmored: false,
    hasLeather: false,
    hasSunroof: false,
    hasMultimedia: false,
    hasServiceHistory: false,
    singleOwner: false
  });

  useEffect(() => {
    if (defaultUf) setFormData(prev => ({ ...prev, uf: defaultUf }));
  }, [defaultUf]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'year' || name === 'mileage' || name === 'price') && type !== 'checkbox'
        ? Number(value) 
        : val,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in-up">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        
        {/* Toggle Tipo de Transação */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl relative">
          <button 
            type="button" 
            onClick={() => setFormData(p => ({...p, transactionType: 'venda'}))} 
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all z-10 ${formData.transactionType === 'venda' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
          >
            QUERO VENDER
          </button>
          <button 
            type="button" 
            onClick={() => setFormData(p => ({...p, transactionType: 'compra'}))} 
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all z-10 ${formData.transactionType === 'compra' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
          >
            QUERO COMPRAR
          </button>
        </div>

        {/* Informações Básicas Grid */}
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Marca / Modelo</label>
              <div className="relative">
                <input type="text" name="brandModel" required value={formData.brandModel} onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none text-sm font-bold" placeholder="Ex: Honda Civic G10" />
                <Car className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">UF</label>
              <div className="relative">
                <select name="uf" value={formData.uf} onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm appearance-none outline-none focus:ring-2 focus:ring-slate-900">
                  {BRAZIL_STATES.map(s => <option key={s.uf} value={s.uf}>{s.uf}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Ano do Modelo</label>
              <div className="relative">
                <input type="number" name="year" value={formData.year} onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Km Atual</label>
              <div className="relative">
                <input type="number" name="mileage" value={formData.mileage} onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                <Gauge className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Opcionais e Diferenciais - Grid de Checkboxes */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Settings2 className="w-3 h-3 text-blue-600" />
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diferenciais do Veículo</label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'isArmored', label: 'Blindado', icon: ShieldCheck },
              { id: 'hasSunroof', label: 'Teto Solar', icon: Check },
              { id: 'hasLeather', label: 'Bancos Couro', icon: Check },
              { id: 'hasMultimedia', label: 'Multimídia', icon: Check },
              { id: 'hasServiceHistory', label: 'Revisões em dia', icon: CheckCircle2 },
              { id: 'singleOwner', label: 'Único Dono', icon: Check }
            ].map(opt => (
              <label key={opt.id} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer group ${formData[opt.id as keyof VehicleFormData] ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                <input type="checkbox" name={opt.id} checked={!!formData[opt.id as keyof VehicleFormData]} onChange={handleChange} className="hidden" />
                <div className={`p-1.5 rounded-lg ${formData[opt.id as keyof VehicleFormData] ? 'bg-white/10' : 'bg-slate-200/50 text-slate-400'}`}>
                  <opt.icon className="w-3.5 h-3.5" />
                </div>
                <span className={`text-[11px] font-bold ${formData[opt.id as keyof VehicleFormData] ? 'text-white' : 'text-slate-500'}`}>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Preço de Referência */}
        <div className="pt-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Preço Sugerido / Desejado (R$)</label>
          <div className="relative">
            <input type="number" name="price" required value={formData.price || ''} onChange={handleChange} className="w-full p-5 pl-12 bg-blue-50/30 border border-blue-100 rounded-2xl font-black text-xl text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10" placeholder="0,00" />
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-green-600" />
          </div>
          <p className="mt-2 text-[9px] text-slate-400 text-center uppercase font-black">Compare com a Tabela FIPE no próximo passo.</p>
        </div>

        <button type="submit" disabled={isLoading} className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-900/20 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              PROCESSANDO MERCADO...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-yellow-400 fill-current" />
              AVALIAR AGORA
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default VehicleForm;
