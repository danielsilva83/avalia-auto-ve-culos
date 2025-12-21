
import React, { useState, useEffect } from 'react';
import { VehicleFormData } from '../types';
import { 
  Car, Calendar, Gauge, Fuel, DollarSign, 
  Settings2, Tag, ShieldCheck, CheckCircle2,
  Disc, Sun, Radio, Armchair, MapPin
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
    onSubmit(formData);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
      <div className="bg-slate-900 p-6 text-white">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Car className="w-6 h-6" />
          Nova Avaliação
        </h2>
        <p className="text-slate-300 text-sm mt-1">Personalizada para o estado de {formData.uf}.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        
        {/* Transaction Type Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setTransactionType('venda')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-md transition-all ${
              formData.transactionType === 'venda' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Tag className="w-4 h-4" /> Vender
          </button>
          <button
            type="button"
            onClick={() => setTransactionType('compra')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-md transition-all ${
              formData.transactionType === 'compra' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <DollarSign className="w-4 h-4" /> Comprar
          </button>
        </div>

        {/* Modelo e UF */}
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Modelo do Veículo</label>
            <div className="relative">
              <input
                type="text"
                name="brandModel"
                placeholder="Ex: Honda Civic EXL"
                required
                value={formData.brandModel}
                onChange={handleChange}
                className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <Car className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
            <select
              name="uf"
              value={formData.uf}
              onChange={handleChange}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold"
            >
              {BRAZIL_STATES.map(s => <option key={s.uf} value={s.uf}>{s.uf}</option>)}
            </select>
          </div>
        </div>

        {/* Grid Ano e KM */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
            <div className="relative">
              <input
                type="number"
                name="year"
                required
                min="1950"
                max={new Date().getFullYear() + 1}
                value={formData.year}
                onChange={handleChange}
                className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">KM Atual</label>
            <div className="relative">
              <input
                type="number"
                name="mileage"
                required
                step="1000"
                
                value={formData.mileage}
                onChange={handleChange}
                className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <Gauge className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Grid Transmissão e Combustível */}
        <div className="grid grid-cols-2 gap-4">
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Câmbio</label>
            <div className="relative">
              <select
                name="transmission"
                value={formData.transmission}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
              >
                <option>Automático</option>
                <option>Manual</option>
                <option>CVT</option>
                <option>Automatizado</option>
              </select>
              <div className="absolute right-3 top-3 pointer-events-none text-gray-400">
                <Settings2 className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Combustível</label>
            <div className="relative">
              <select
                name="fuel"
                value={formData.fuel}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
              >
                <option>Flex</option>
                <option>Gasolina</option>
                <option>Diesel</option>
                <option>Híbrido</option>
                <option>Elétrico</option>
              </select>
              <div className="absolute right-3 top-3 pointer-events-none">
                <Fuel className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Estado e Cor */}
        <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conservação</label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option>Excelente</option>
                <option>Bom</option>
                <option>Regular</option>
                <option>Ruim</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
              <input
                type="text"
                name="color"
                placeholder="Ex: Prata"
                required
                value={formData.color}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
        </div>

        {/* Preço */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preço {formData.transactionType === 'venda' ? 'Desejado' : 'Ofertado'} (R$)
          </label>
          <div className="relative">
            <input
              type="number"
              name="price"
              required
              min="0"
              placeholder="1.000,00"
              step="1000"
              value={formData.price || ''}
              onChange={handleChange}
              className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-gray-800"
            />
            <DollarSign className="absolute left-3 top-3 w-5 h-5 text-green-600" />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full mt-2 py-4 rounded-lg font-bold text-white shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
            isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-900'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analisando...
            </span>
          ) : (
            'Avaliar Agora'
          )}
        </button>
      </form>
    </div>
  );
};

export default VehicleForm;
