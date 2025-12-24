
import { GoogleGenAI } from "@google/genai";
import { VehicleFormData, AnalysisResponse, ToolType, VehicleImage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeVehicle = async (data: VehicleFormData): Promise<AnalysisResponse> => {
  const transactionContext = data.transactionType === 'monitoramento' ? 'MONITORAMENTO DE PATRIMÔNIO' : data.transactionType.toUpperCase();
  
  const prompt = `
    Analise o mercado para: ${data.brandModel} ${data.year}, ${data.mileage}km em ${data.city}/${data.uf}.
    Tipo de transação: ${transactionContext}.
    Preço base informado: R$ ${data.price.toLocaleString('pt-BR')}

    USE GOOGLE SEARCH para encontrar anúncios reais hoje especificamente em ${data.city} e região metropolitana de ${data.uf}.
    FOCO LOCAL: Justifique se o preço em ${data.city} tende a ser maior ou menor que a média estadual.
    
    Forneça:
    [[SEÇÃO 1]] Análise detalhada comparando FIPE com preços reais de anúncios locais em ${data.city}.
    [[SEÇÃO 2]] 3 Scripts de venda/negociação curtos e persuasivos.
    [[SEÇÃO 3]] Uma pílula de conhecimento sobre a revenda deste modelo.
    [[SEÇÃO 4]] JSON estrito com dados de CRM e tendências.
  `;

  const systemInstruction = `
    Você é o 'AvalIA AI', o maior especialista em precificação automotiva regional do Brasil.
    Na [[SEÇÃO 4]], retorne SEMPRE este JSON:
    {
      "resumo_veiculo": "string",
      "faixa_preco_sugerida": "R$ X a R$ Y",
      "nivel_dificuldade_venda": "Fácil/Média/Alta",
      "tags_sugeridas": ["tag1", "tag2"],
      "tendencia_mercado": "alta" | "estavel" | "queda",
      "valor_estimado_proximo_mes": "R$ ..."
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction,
      tools: [{ googleSearch: {} }]
    }
  });

  return parseGeminiResponse(response);
};

export const analyzeVehicleHealth = async (images: VehicleImage[]): Promise<string> => {
  const prompt = "Analise estas fotos de um carro (podem ser pneus, painel, motor ou lataria). Identifique sinais de desgaste, luzes de advertência ou danos que precisem de atenção imediata ou que reduzam o valor de revenda. Seja técnico e objetivo.";
  
  const parts: any[] = [{ text: prompt }];
  images.forEach(img => parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } }));

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: { systemInstruction: "Você é um perito avaliador de vistoria cautelar." }
  });

  return response.text || "Não foi possível analisar as imagens.";
};

export const generateToolContent = async (type: ToolType, vehicle: VehicleFormData): Promise<string> => {
  if (!type || type === 'profit') return "";
  
  const prompts: Record<string, string> = {
    dossier: `Gere um Dossiê Profissional de Venda para o ${vehicle.brandModel} ${vehicle.year} em ${vehicle.city}/${vehicle.uf}. Liste diferenciais, ficha técnica resumida e por que este é um bom negócio para alguém da região.`,
    ads: `Crie 3 modelos de anúncios (Instagram, OLX e WhatsApp) persuasivos para o ${vehicle.brandModel} ${vehicle.year}. Cite que o veículo está em ${vehicle.city}.`,
    future: `Projete o valor deste ${vehicle.brandModel} nos próximos 12 e 24 meses baseado na economia atual de ${vehicle.city} e do estado ${vehicle.uf}.`,
    negotiation: `Crie um guia de negociação para o dono deste ${vehicle.brandModel}. Liste as 5 principais objeções de compradores locais e como respondê-las.`
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompts[type as string],
    config: { systemInstruction: "Você é um consultor de elite em vendas automotivas." }
  });

  return response.text || "";
};

function parseGeminiResponse(response: any): AnalysisResponse {
  const text = response.text || "";
  const sections = text.split(/\[\[SEÇÃO \d\]\]/);
  
  const result: AnalysisResponse = {
    priceAnalysis: sections[1]?.trim() || text,
    salesScripts: sections[2]?.trim().split('\n').filter((s: string | any[]) => s.length > 5).map((s: string) => s.replace(/^[-*•"']\s*/, '').replace(/["']$/, '')) || [],
    knowledgePill: sections[3]?.trim() || "",
    crmData: { resumo_veiculo: "", faixa_preco_sugerida: "", nivel_dificuldade_venda: "", tags_sugeridas: [] }
  };

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      result.crmData = JSON.parse(jsonMatch[0]);
    } catch (e) {}
  }

  if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
    result.groundingUrls = response.candidates[0].groundingMetadata.groundingChunks
      .filter((c: any) => c.web)
      .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));
  }

  return result;
}
