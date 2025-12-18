
import React, { useState } from 'react';
import { VehicleFormData } from '../types';
import { 
  Car, Calendar, Gauge, Fuel, DollarSign, 
  Settings2, Tag, ShieldCheck, CheckCircle2,
  Disc, Sun, Radio, Armchair
} from 'lucide-react';

interface VehicleFormProps {
  onSubmit: (data: VehicleFormData) => void;
  isLoading: boolean;
}

const VehicleForm: React.FC<VehicleFormProps> = ({ onSubmit, isLoading }) => {
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
    isArmored: false,
    hasLeather: false,
    hasSunroof: false,
    hasMultimedia: false,
    hasServiceHistory: false,
    singleOwner: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: (name === 'year' || name === 'mileage' || name === 'price')
          ? (value === '' ? 0 : Number(value)) 
          : value,
      }));
    }
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
        <p className="text-slate-300 text-sm mt-1">Consulte FIPE e mercado em tempo real.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setFormData(p => ({...p, transactionType: 'venda'}))}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-md transition-all ${
              formData.transactionType === 'venda' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            <Tag className="w-4 h-4" /> Vender
          </button>
          <button
            type="button"
            onClick={() => setFormData(p => ({...p, transactionType: 'compra'}))}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-md transition-all ${
              formData.transactionType === 'compra' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            <DollarSign className="w-4 h-4" /> Comprar
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Modelo do Veículo</label>
          <input
            type="text"
            name="brandModel"
            placeholder="Ex: Honda Civic EXL 2.0"
            required
            value={formData.brandModel}
            onChange={handleChange}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
            <input
              type="number"
              name="year"
              required
              min="1950"
              inputMode="numeric"
              value={formData.year || ''}
              onChange={handleChange}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">KM Atual</label>
            <input
              type="number"
              name="mileage"
              required
              min="0"
              step="1000"
              inputMode="numeric"
              value={formData.mileage || ''}
              onChange={handleChange}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Câmbio</label>
            <select name="transmission" value={formData.transmission} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none appearance-none">
              <option>Automático</option>
              <option>Manual</option>
              <option>CVT</option>
              <option>Automatizado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Combustível</label>
            <select name="fuel" value={formData.fuel} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none appearance-none">
              <option>Flex</option>
              <option>Gasolina</option>
              <option>Diesel</option>
              <option>Híbrido</option>
              <option>Elétrico</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Diferenciais</label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
              <input type="checkbox" name="hasServiceHistory" checked={formData.hasServiceHistory} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded" />
              <span className="text-xs text-gray-700">Revisado</span>
            </label>
            <label className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
              <input type="checkbox" name="singleOwner" checked={formData.singleOwner} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded" />
              <span className="text-xs text-gray-700">Único Dono</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preço {formData.transactionType === 'venda' ? 'Desejado' : 'Ofertado'} (R$)
          </label>
          <input
            type="number"
            name="price"
            min="0"
            inputMode="numeric"
            placeholder="Não informado"
            value={formData.price || ''}
            onChange={handleChange}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 rounded-lg font-bold text-white bg-slate-800 hover:bg-slate-900 transition-all active:scale-95 disabled:bg-gray-400"
        >
          {isLoading ? 'Analisando...' : 'Avaliar Agora'}
        </button>
      </form>
    </div>
  );
};

export default VehicleForm;
