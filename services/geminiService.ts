
import { GoogleGenAI, Type } from "@google/genai";
import { VehicleFormData, AnalysisResponse, ToolType } from "../types";

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

    const scriptMatch = text.match(/\[\[SEÇÃO 2\]\]([\s\S]*?)\[\[SEÇÃO 3\]\]/);
    if (scriptMatch) {
      result.salesScripts = scriptMatch[1].trim()
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 5)
        .map(s => s.replace(/^[-*•"']\s*/, '').replace(/["']$/, ''));
    }

    const pillMatch = text.match(/\[\[SEÇÃO 3\]\]([\s\S]*?)\[\[SEÇÃO 4\]\]/);
    if (pillMatch) result.knowledgePill = pillMatch[1].trim();

    const jsonMatch = text.match(/\[\[SEÇÃO 4\]\]([\s\S]*)/);
    if (jsonMatch) {
      let jsonText = jsonMatch[1].trim().replace(/```json/g, '').replace(/```/g, '');
      const start = jsonText.indexOf('{');
      const end = jsonText.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
         try {
            result.crmData = JSON.parse(jsonText.substring(start, end + 1));
         } catch (e) { console.error("JSON parse error", e); }
      }
    }
  } catch (error) { console.error("Error parsing response:", error); }
  return result;
};

export const analyzeVehicle = async (data: VehicleFormData): Promise<AnalysisResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const transactionContext = data.transactionType === 'compra' ? 'COMPRA' : 'VENDA';
  
  const prompt = `
    PESQUISA REGIONAL OBRIGATÓRIA: Estado de ${data.uf} (Brasil).
    Analise o veículo para **${transactionContext}** considerando o mercado local de **${data.uf}**:
    - Modelo: ${data.brandModel} | Ano: ${data.year} | KM: ${data.mileage}
    - Diferenciais: ${data.transmission}, ${data.fuel}, ${data.color}, ${data.isArmored ? 'Blindado' : 'Sem Blindagem'}.
    - Preço Base: R$ ${data.price.toLocaleString('pt-BR')}

    USE GOOGLE SEARCH para: Tabela FIPE atual e anúncios reais em ${data.uf}.
  `;

  const systemInstruction = `
    Você é o 'AvalIA AI Automóveis', consultor premium.
    [[SEÇÃO 1]] Análise de Mercado Regional em ${data.uf}.
    [[SEÇÃO 2]] Scripts de Negociação para o contexto de ${data.uf}.
    [[SEÇÃO 3]] Pílula de Conhecimento técnico.
    [[SEÇÃO 4]] JSON Data (resumo_veiculo, faixa_preco_sugerida, nivel_dificuldade_venda, tags_sugeridas).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }],
        temperature: 0.7, 
      },
    });

    const candidate = response.candidates?.[0];
    const groundingUrls = candidate?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({ title: chunk.web?.title || "Fonte", uri: chunk.web?.uri }))
      .filter((item: any) => item.uri);

    return { ...parseResponse(response.text || ""), groundingUrls };
  } catch (error) { throw error; }
};

export const generateToolContent = async (type: ToolType, data: VehicleFormData): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const configs: Record<string, string> = {
    ads: "Crie 3 versões de anúncios (Formal, Entusiasta, Urgente) para este carro. Use emojis e tags de busca.",
    future: "Projete a desvalorização deste modelo para 6, 12 e 24 meses em porcentagem e valor real.",
    negotiation: "Liste 5 objeções comuns de compradores para este modelo e como contornar cada uma com argumentos técnicos.",
  };

  const prompt = `Carro: ${data.brandModel} ${data.year}, ${data.mileage}km, UF: ${data.uf}. Preço: R$${data.price}. ${configs[type as string]}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { systemInstruction: "Responda em Markdown claro e estruturado." }
    });
    return response.text || "Erro ao gerar conteúdo.";
  } catch (e) { return "Falha na comunicação com a IA."; }
};
