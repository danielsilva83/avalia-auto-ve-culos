
export interface User {
  id: string;
  name: string;
  email: string;
  isPro: boolean;
  credits: number;
}

export interface PixPaymentResponse {
  paymentId: string;
  qrCodeBase64: string;
  copyPasteCode: string;
  status: string;
  ticketUrl?: string;
}

export interface GroundingUrl {
  title: string;
  uri: string;
}

export interface VehicleFormData {
  transactionType: 'venda' | 'compra';
  type: string; // Carro, Moto, Caminhonete
  brandModel: string; // Marca e Modelo
  year: number;
  mileage: number; // KM
  transmission: string; // Automatico, Manual
  condition: string;
  price: number;
  // New attributes for cars
  fuel: string;
  color: string;
  isArmored: boolean; // Blindado
  hasLeather: boolean;
  hasSunroof: boolean;
  hasMultimedia: boolean;
  hasServiceHistory: boolean; // Todas as revisões
  singleOwner: boolean; // Único dono
}

export interface CrmData {
  resumo_veiculo: string;
  faixa_preco_sugerida: string;
  nivel_dificuldade_venda: string;
  tags_sugeridas: string[];
}

export interface AnalysisResponse {
  priceAnalysis: string; // Section 1: Markdown
  salesScripts: string[]; // Section 2: Array of strings
  knowledgePill: string; // Section 3: Concept
  crmData: CrmData; // Section 4: JSON Data
  groundingUrls?: GroundingUrl[]; // Section 5: Sources from Google Search
}

export enum AppState {
  LOGIN = 'LOGIN',
  FORM = 'FORM',
  LOADING = 'LOADING',
  RESULT = 'RESULT',
  ERROR = 'ERROR',
  PRICING = 'PRICING'
}
