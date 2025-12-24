
import React, { useState, useEffect } from 'react';
import { VehicleFormData } from '../types';
import { 
  Car, Calendar, Gauge, Fuel, DollarSign, 
  Settings2, Tag, ShieldCheck, MapPin, ArrowRight
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
    city: '', // Novo campo
    uf: defaultUf || 'SP',
    isArmored: false,
    hasLeather: false,
    hasSunroof: false,
    hasMultimedia: false,
    hasServiceHistory: false,
    singleOwner: false
  });

  useEffect(() => {
    if (defaultUf) {
      setFormData(prev => ({ ...prev, uf: defaultUf }));
    }
  }, [defaultUf]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'year' || name === 'mileage' || name === 'price' 
          ? Number(value) 
          : value,
      }));
    }
  };

  const setTransactionType = (type: 'venda' | 'compra') => {
    setFormData(prev => ({ ...prev, transactionType: type }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    onSubmit(formData);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 animate-fade-in-up">
      <div className="bg-slate-900 p-8 text-white">
        <h2 className="text-2xl font-black flex items-center gap-3 tracking-tighter">
          <Car className="w-7 h-7 text-blue-400" />
          NOVA AVALIAÇÃO
        </h2>
        <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">Busca Regionalizada em Tempo Real</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        
        {/* Transaction Type Toggle */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setTransactionType('venda')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
              formData.transactionType === 'venda' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Tag className="w-4 h-4" /> Vender
          </button>
          <button
            type="button"
            onClick={() => setTransactionType('compra')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
              formData.transactionType === 'compra' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <DollarSign className="w-4 h-4" /> Comprar
          </button>
        </div>

        {/* Modelo */}
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Marca e Modelo</label>
            <div className="relative">
              <input
                type="text"
                name="brandModel"
                placeholder="Ex: Honda Civic EXL"
                required
                value={formData.brandModel}
                onChange={handleChange}
                className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none font-bold text-slate-800 placeholder:text-slate-300 transition-all"
              />
              <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
          </div>

          {/* Cidade e UF Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Município</label>
              <div className="relative">
                <input
                  type="text"
                  name="city"
                  placeholder="Sua Cidade"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full p-4 pl-10 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none font-bold text-slate-800 text-sm"
                />
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">UF</label>
              <select
                name="uf"
                value={formData.uf}
                onChange={handleChange}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none font-black text-slate-800 appearance-none text-center text-sm"
              >
                {BRAZIL_STATES.map(s => <option key={s.uf} value={s.uf}>{s.uf}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Grid Ano e KM */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ano Modelo</label>
            <div className="relative">
              <input
                type="number"
                name="year"
                required
                min="1950"
                max={new Date().getFullYear() + 1}
                value={formData.year}
                onChange={handleChange}
                className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none font-bold"
              />
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Quilometragem</label>
            <div className="relative">
              <input
                type="number"
                name="mileage"
                required
                step="1000"
                min="0"
                value={formData.mileage}
                onChange={handleChange}
                className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none font-bold"
              />
              <Gauge className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Grid Transmissão e Combustível */}
        <div className="grid grid-cols-2 gap-4">
           <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Câmbio</label>
            <div className="relative">
              <select
                name="transmission"
                value={formData.transmission}
                onChange={handleChange}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none appearance-none font-bold text-sm"
              >
                <option>Automático</option>
                <option>Manual</option>
                <option>CVT</option>
                <option>Automatizado</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <Settings2 className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Combustível</label>
            <div className="relative">
              <select
                name="fuel"
                value={formData.fuel}
                onChange={handleChange}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none appearance-none font-bold text-sm"
              >
                <option>Flex</option>
                <option>Gasolina</option>
                <option>Diesel</option>
                <option>Híbrido</option>
                <option>Elétrico</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Fuel className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Preço */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            Preço {formData.transactionType === 'venda' ? 'Desejado' : 'Ofertado'} (R$)
          </label>
          <div className="relative">
            <input
              type="number"
              name="price"
              required
              min="1"
              placeholder="Ex: 55000"
              value={formData.price || ''}
              onChange={handleChange}
              className="w-full p-5 pl-14 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none font-black text-lg text-slate-900 placeholder:text-slate-300"
            />
            <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-600" />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-5 rounded-2xl font-black text-white shadow-xl transition-all transform active:scale-[0.98] uppercase tracking-widest text-xs flex items-center justify-center gap-3 ${
            isLoading 
              ? 'bg-slate-400 cursor-not-allowed' 
              : 'bg-slate-900 hover:bg-black hover:shadow-slate-200'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>AVALIANDO...</span>
            </div>
          ) : (
            <>AVALIAR EM {formData.city || formData.uf} <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </form>
    </div>
  );
};

export default VehicleForm;
