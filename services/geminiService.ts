
import { GoogleGenAI } from "@google/genai";
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
  
  const amenities = [
    data.transmission, data.fuel,
    data.isArmored ? 'Blindado' : null,
    data.hasSunroof ? 'Teto Solar' : null,
    data.hasLeather ? 'Couro' : null,
    data.hasMultimedia ? 'Multimídia' : null,
    data.hasServiceHistory ? 'Revisões em dia' : null,
    data.singleOwner ? 'Único Dono' : null
  ].filter(Boolean).join(', ');

  const prompt = `
    Analise o veículo para **${transactionContext}** no estado de **${data.uf}**:
    - Modelo: ${data.brandModel} | Ano: ${data.year} | KM: ${data.mileage}
    - Diferenciais: ${amenities}
    - Preço Base: R$ ${data.price.toLocaleString('pt-BR')}

    USE GOOGLE SEARCH para encontrar a Tabela FIPE e anúncios reais em ${data.uf}.
    FOCO REGIONAL: Justifique o preço baseado na demanda específica de ${data.uf}.
  `;

  const systemInstruction = `
    Você é o 'AvalIA AI Automóveis'.
    [[SEÇÃO 1]] Análise de Preço Regional em ${data.uf}.
    [[SEÇÃO 2]] Scripts de Negociação curtos.
    [[SEÇÃO 3]] 1 Curiosidade técnica.
    [[SEÇÃO 4]] JSON (resumo_veiculo, faixa_preco_sugerida, nivel_dificuldade_venda, tags_sugeridas).
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

    const groundingUrls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({ title: chunk.web?.title || "Fonte", uri: chunk.web?.uri }))
      .filter((item: any) => item.uri);

    return { ...parseResponse(response.text || ""), groundingUrls };
  } catch (error) { throw error; }
};

export const generateToolContent = async (type: ToolType, data: VehicleFormData): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const toolPrompts: Record<string, string> = {
    ads: "Gere 3 anúncios de alta conversão (Formal, Emocional e Urgente) para este carro. Use emojis e foque no público de " + data.uf,
    future: "Projete a desvalorização deste veículo para 6, 12 e 24 meses em " + data.uf + ". Apresente em uma lista com valores e motivos.",
    negotiation: "Liste 5 'Battle Cards': uma objeção comum do comprador de " + data.brandModel + " e a melhor resposta técnica para manter o preço.",
    dossier: "Crie um resumo executivo premium para este veículo, destacando por que ele é uma excelente oportunidade em " + data.uf + " comparado à média nacional."
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: toolPrompts[type as string],
      config: { systemInstruction: "Responda em Markdown estruturado para visualização mobile." }
    });
    return response.text || "Erro ao gerar inteligência.";
  } catch (e) { return "Falha na comunicação com a IA."; }
};
