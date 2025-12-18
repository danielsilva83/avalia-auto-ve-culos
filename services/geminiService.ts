
import { GoogleGenAI } from "@google/genai";
import { VehicleFormData, AnalysisResponse } from "../types";

const parseResponse = (text: string): AnalysisResponse => {
  const result: AnalysisResponse = {
    priceAnalysis: "",
    salesScripts: [],
    knowledgePill: "",
    crmData: {
      resumo_veiculo: "Erro na análise",
      faixa_preco_sugerida: "N/A",
      nivel_dificuldade_venda: "N/A",
      tags_sugeridas: []
    }
  };

  try {
    const sections = text.split(/\[\[SEÇÃO \d\]\]/);
    if (sections.length > 1) result.priceAnalysis = sections[1].trim();
    if (sections.length > 2) {
      result.salesScripts = sections[2].trim().split('\n').map(s => s.trim().replace(/^[-*•"']\s*/, '').replace(/["']$/, '')).filter(s => s.length > 0);
    }
    if (sections.length > 3) result.knowledgePill = sections[3].trim();
    if (sections.length > 4) {
      const jsonText = sections[4].trim().replace(/```json/g, '').replace(/```/g, '');
      const start = jsonText.indexOf('{');
      const end = jsonText.lastIndexOf('}');
      if (start !== -1 && end !== -1) result.crmData = JSON.parse(jsonText.substring(start, end + 1));
    }
  } catch (error) { console.error("Error parsing response:", error); }
  return result;
};

export const analyzeVehicle = async (data: VehicleFormData): Promise<AnalysisResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const transactionContext = data.transactionType === 'compra' ? 'COMPRA' : 'VENDA';
  
  // Format price info: if 0, treat as not informed
  const priceInfo = data.price > 0 
    ? `R$ ${data.price.toLocaleString('pt-BR')}` 
    : 'NÃO INFORMADO (Sugira o valor ideal baseado inteiramente no mercado atual)';

  const prompt = `
    Analise para ${transactionContext}:
    - Modelo: ${data.brandModel}
    - Ano: ${data.year}
    - KM: ${data.mileage}
    - Conservação: ${data.condition}
    - Combustível: ${data.fuel}
    - Cor: ${data.color}
    - Diferenciais: ${data.singleOwner ? 'Único Dono, ' : ''}${data.hasServiceHistory ? 'Revisado, ' : ''}${data.hasLeather ? 'Couro, ' : ''}${data.hasSunroof ? 'Teto Solar' : ''}
    - Preço Base: ${priceInfo}
    Use googleSearch para FIPE e Mercado Real atual.
  `;

  const systemInstruction = `
    Você é o AvalIA AI Automóveis. Forneça análise FIPE x Mercado Real em 4 seções:
    [[SEÇÃO 1]] Análise Markdown direta com emojis. Inclua a Tabela FIPE estimada e preços de anúncios reais encontrados.
    [[SEÇÃO 2]] Scripts de negociação curtos e persuasivos.
    [[SEÇÃO 3]] Pílula técnica curta sobre o modelo (liquidez ou problemas crônicos).
    [[SEÇÃO 4]] JSON: { "resumo_veiculo": "", "faixa_preco_sugerida": "", "nivel_dificuldade_venda": "", "tags_sugeridas": [] }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview", 
    contents: prompt,
    config: { systemInstruction, tools: [{ googleSearch: {} }] },
  });

  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error("Nenhum resultado retornado pela IA.");
  }

  const candidate = candidates[0];
  const groundingUrls = candidate.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
    title: chunk.web?.title || "Fonte", uri: chunk.web?.uri
  })).filter((item: any) => item.uri);

  return { ...parseResponse(response.text || ""), groundingUrls };
};