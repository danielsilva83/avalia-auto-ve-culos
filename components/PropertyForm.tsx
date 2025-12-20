
import React, { useState, useEffect } from 'react';
import { VehicleFormData } from '../types';
import { 
  Car, Calendar, Gauge, Fuel, DollarSign, 
  Settings2, Tag, ShieldCheck, CheckCircle2,
  MapPin, Check
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
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        
        {/* Toggle Transação */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button type="button" onClick={() => setFormData(p => ({...p, transactionType: 'venda'}))} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.transactionType === 'venda' ? 'bg-white text-slate-900 shadow' : 'text-gray-500'}`}>VENDER</button>
          <button type="button" onClick={() => setFormData(p => ({...p, transactionType: 'compra'}))} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.transactionType === 'compra' ? 'bg-white text-slate-900 shadow' : 'text-gray-500'}`}>COMPRAR</button>
        </div>

        {/* Modelo e UF */}
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-3">
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Modelo</label>
            <input type="text" name="brandModel" required value={formData.brandModel} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-sm" placeholder="Ex: Corolla XEi" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">UF</label>
            <select name="uf" value={formData.uf} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm">
              {BRAZIL_STATES.map(s => <option key={s.uf} value={s.uf}>{s.uf}</option>)}
            </select>
          </div>
        </div>

        {/* Ano e KM */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Ano</label>
            <input type="number" name="year" value={formData.year} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Quilometragem</label>
            <input type="number" name="mileage" value={formData.mileage} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
          </div>
        </div>

        {/* Opcionais - Checkboxes */}
        <div className="space-y-3">
          <label className="block text-[10px] font-black text-gray-400 uppercase">Opcionais & Histórico</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'isArmored', label: 'Blindado', icon: ShieldCheck },
              { id: 'hasSunroof', label: 'Teto Solar', icon: Check },
              { id: 'hasLeather', label: 'Bancos Couro', icon: Check },
              { id: 'hasMultimedia', label: 'Multimídia', icon: Check },
              { id: 'hasServiceHistory', label: 'Revisões OK', icon: CheckCircle2 },
              { id: 'singleOwner', label: 'Único Dono', icon: Check }
            ].map(opt => (
              <label key={opt.id} className={`flex items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${formData[opt.id as keyof VehicleFormData] ? 'bg-slate-900 border-slate-900 text-white' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                <input type="checkbox" name={opt.id} checked={!!formData[opt.id as keyof VehicleFormData]} onChange={handleChange} className="hidden" />
                <opt.icon className="w-4 h-4" />
                <span className="text-[11px] font-bold">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Preço Base */}
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Preço Atual / Pretendido (R$)</label>
          <div className="relative">
            <input type="number" name="price" required value={formData.price || ''} onChange={handleChange} className="w-full p-4 pl-10 bg-slate-50 border border-slate-200 rounded-xl font-black text-lg outline-none" placeholder="0,00" />
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />
          </div>
        </div>

        <button type="submit" disabled={isLoading} className="w-full py-4 bg-slate-900 text-white font-black rounded-xl shadow-lg hover:shadow-slate-200 transition-all disabled:opacity-50">
          {isLoading ? 'ANALISANDO MERCADO...' : 'AVALIAR AGORA'}
        </button>
      </form>
    </div>
  );
};

export default VehicleForm;
