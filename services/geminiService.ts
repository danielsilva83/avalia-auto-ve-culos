
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
    Analise o veículo para **${transactionContext}** no estado de **${data.uf}** no município de **${data.municipio}**:
    - Modelo: ${data.brandModel} | Ano: ${data.year} | KM: ${data.mileage}
    - Diferenciais: ${amenities}
    - Preço Base Informado: R$ ${data.price.toLocaleString('pt-BR')}

    USE GOOGLE SEARCH para encontrar a Tabela FIPE atualizada e anúncios reais em ${data.uf} no município de ${data.municipio}.
    FOCO REGIONAL: Justifique o preço baseado na demanda e liquidez específica do estado de ${data.uf} no município de ${data.municipio}.
  `;

  const systemInstruction = `
    Você é o 'AvalIA AI Automóveis', o consultor mais preciso do Brasil.
    [[SEÇÃO 1]] Análise Detalhada de Preço e Mercado Regional em ${data.uf} - ${data.municipio}.
    [[SEÇÃO 2]] Scripts Rápidos de Negociação.
    [[SEÇÃO 3]] Uma pílula de conhecimento sobre este modelo específico.
    [[SEÇÃO 4]] JSON estritamente formatado: { "resumo_veiculo": "...", "faixa_preco_sugerida": "R$ X a R$ Y", "nivel_dificuldade_venda": "Fácil/Médio/Difícil", "tags_sugeridas": ["tag1", "tag2"] }
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

    const candidate = response?.candidates?.[0];
    const groundingUrls = candidate?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({ title: chunk.web?.title || "Fonte", uri: chunk.web?.uri }))
      .filter((item: any) => item.uri);

    return { ...parseResponse(response.text || ""), groundingUrls };
  } catch (error) { throw error; }
};

export const generateToolContent = async (type: ToolType, data: VehicleFormData): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const toolPrompts: Record<string, string> = {
    ads: `Gere 3 anúncios de alta conversão (um Formal, um Emocional e um Urgente) para o veículo ${data.brandModel} ${data.year} em ${data.uf} no município de ${data.municipio}. Destaque os opcionais informados e use emojis.`,
    future: `Com base no mercado automotivo de ${data.uf} no município de ${data.municipio}, projete a desvalorização do ${data.brandModel} ${data.year} para os próximos 6, 12 e 24 meses. Explique os motivos técnicos e de mercado.`,
    negotiation: `Crie 5 'Battle Cards' para quem está negociando um ${data.brandModel}. Para cada card, apresente uma objeção comum e a resposta técnica matadora para defender o preço.`,
    dossier: `Crie um Dossiê de Venda Executivo para o ${data.brandModel} ${data.year}. Destaque por que este veículo é uma oportunidade superior considerando seus diferenciais e o mercado local de ${data.uf} no município de ${data.municipio}.`
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: toolPrompts[type as string],
      config: { systemInstruction: "Responda em Markdown elegante e estruturado para leitura em dispositivos móveis." }
    });
    return response.text || "Erro ao gerar inteligência estratégica.";
  } catch (e) { return "Falha na comunicação com a inteligência artificial."; }
};
