

export interface VehicleImage {
  data: string; // base64
  mimeType: string;
  label: string;
}

export interface VehicleHealthStatus {
  item: string;
  status: 'bom' | 'alerta' | 'critico';
  obs: string;
}

export interface VehicleFormData {
  id?: string;
  transactionType: 'venda' | 'compra' | 'monitoramento';
  type: string;
  brandModel: string;
  year: number;
  mileage: number;
  transmission: string;
  condition: string;
  price: number;
  city: string; // Nova propriedade
  uf: string;
  fuel: string;
  color: string;
  isArmored: boolean;
  hasLeather: boolean;
  hasSunroof: boolean;
  hasMultimedia: boolean;
  hasServiceHistory: boolean;
  singleOwner: boolean;
  images?: VehicleImage[];
  healthData?: VehicleHealthStatus[];
}

export interface CrmData {
  resumo_veiculo: string;
  faixa_preco_sugerida: string;
  nivel_dificuldade_venda: string;
  tags_sugeridas: string[];
  visao_ia_diagnostico?: string;
  tendencia_mercado?: 'alta' | 'estavel' | 'queda';
  valor_estimado_proximo_mes?: string;
}

export interface AnalysisResponse {
  id?: string;
  priceAnalysis: string;
  salesScripts: string[];
  knowledgePill: string;
  crmData: CrmData;
  groundingUrls?: { title: string; uri: string }[];
  createdAt?: string;
}

// Fixed: Added missing SEO states used in App.tsx
export enum AppState {
  LOGIN = 'LOGIN',
  FORM = 'FORM',
  LOADING = 'LOADING',
  RESULT = 'RESULT',
  ERROR = 'ERROR',
  PRICING = 'PRICING',
  DASHBOARD = 'DASHBOARD',
  HEALTH_CHECK = 'HEALTH_CHECK',
  SEO_MODEL_PAGE = 'SEO_MODEL_PAGE',
  SEO_DIRECTORY = 'SEO_DIRECTORY'
}

export interface User {
  id: string;
  name: string;
  email: string;
  isPro: boolean;
  credits: number;
}

export type ToolType = 'dossier' | 'ads' | 'future' | 'negotiation' | 'profit' | null;

export interface PixPaymentResponse {
  paymentId: string;
  qrCodeBase64: string;
  copyPasteCode: string;
  status: string;
  ticketUrl?: string;
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