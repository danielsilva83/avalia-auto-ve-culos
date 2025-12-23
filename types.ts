
export interface VehicleFormData {
  transactionType: 'venda' | 'compra';
  type: string;
  brandModel: string;
  year: number;
  mileage: number;
  transmission: string;
  condition: string;
  price: number;
  uf: string;
  fuel: string;
  color: string;
  isArmored: boolean;
  hasLeather: boolean;
  hasSunroof: boolean;
  hasMultimedia: boolean;
  hasServiceHistory: boolean;
  singleOwner: boolean;
}

export interface CrmData {
  resumo_veiculo: string;
  faixa_preco_sugerida: string;
  nivel_dificuldade_venda: string;
  tags_sugeridas: string[];
}

export interface AnalysisResponse {
  id?: string; // ID vindo do banco para histórico
  priceAnalysis: string;
  salesScripts: string[];
  knowledgePill: string;
  crmData: CrmData;
  groundingUrls?: { title: string; uri: string }[];
  createdAt?: string;
}

export interface PriceAlert {
  id: string;
  userId: string;
  brandModel: string;
  uf: string;
  initialPrice: number;
  active: boolean;
  createdAt: string;
}

export type ToolType = 'dossier' | 'ads' | 'future' | 'negotiation' | 'profit' | null;

export interface User {
  id: string;
  name: string;
  email: string;
  isPro: boolean;
  credits: number;
}

export enum AppState {
  LOGIN = 'LOGIN',
  FORM = 'FORM',
  LOADING = 'LOADING',
  RESULT = 'RESULT',
  ERROR = 'ERROR',
  PRICING = 'PRICING',
  DASHBOARD = 'DASHBOARD', // Novo estado
  SEO_DIRECTORY = 'SEO_DIRECTORY',
  SEO_MODEL_PAGE = 'SEO_MODEL_PAGE'
}

export interface PixPaymentResponse {
  paymentId: string;
  qrCodeBase64: string;
  copyPasteCode: string;
  status: string;
  ticketUrl?: string;
}
