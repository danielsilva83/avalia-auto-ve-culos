
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
    
    if (sections.length > 1) {
      result.priceAnalysis = sections[ sections.length > 5 ? 1 : 1 ].trim();
    }

    // Simplificando o parse para garantir que pegamos os scripts
    const scriptMatch = text.match(/\[\[SEÇÃO 2\]\]([\s\S]*?)\[\[SEÇÃO 3\]\]/);
    if (scriptMatch) {
      result.salesScripts = scriptMatch[1].trim()
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 5)
        .map(s => s.replace(/^[-*•"']\s*/, '').replace(/["']$/, ''));
    }

    const pillMatch = text.match(/\[\[SEÇÃO 3\]\]([\s\S]*?)\[\[SEÇÃO 4\]\]/);
    if (pillMatch) {
      result.knowledgePill = pillMatch[1].trim();
    }

    const jsonMatch = text.match(/\[\[SEÇÃO 4\]\]([\s\S]*)/);
    if (jsonMatch) {
      let jsonText = jsonMatch[1].trim().replace(/```json/g, '').replace(/```/g, '');
      const start = jsonText.indexOf('{');
      const end = jsonText.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
         try {
            result.crmData = JSON.parse(jsonText.substring(start, end + 1));
         } catch (e) {
            console.error("JSON parse error", e);
         }
      }
    }
  } catch (error) {
    console.error("Error parsing response:", error);
  }

  return result;
};

export const analyzeVehicle = async (data: VehicleFormData): Promise<AnalysisResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const transactionContext = data.transactionType === 'compra' ? 'COMPRA (Avaliação para pagar)' : 'VENDA (Preço para anunciar)';
  
  const amenities = [
    data.transmission === 'Automático' ? 'Câmbio Automático' : 'Câmbio Manual',
    data.fuel ? `Combustível: ${data.fuel}` : null,
    data.isArmored ? 'Blindado' : null,
    data.hasSunroof ? 'Teto Solar' : null,
    data.hasLeather ? 'Bancos de Couro' : null,
    data.hasMultimedia ? 'Multimídia' : null,
    data.hasServiceHistory ? 'Todas as Revisões em Dia' : 'Sem histórico de revisão informado',
    data.singleOwner ? 'Único Dono' : null
  ].filter(Boolean).join(', ');

  const prompt = `
    Analise o seguinte veículo para fins de **${transactionContext}** no estado de **${data.uf}**:
    
    DETALHES DO VEÍCULO:
    - UF da Pesquisa: ${data.uf}
    - Modelo: ${data.brandModel}
    - Ano/Modelo: ${data.year}
    - Quilometragem: ${data.mileage} km
    - Cor: ${data.color}
    - Conservação: ${data.condition}
    - Diferenciais: ${amenities}
    - Preço Base: R$ ${data.price.toLocaleString('pt-BR')}

    Utilize o Google Search para encontrar:
    1. O valor na Tabela FIPE atual para este modelo em ${data.uf}.
    2. Ofertas reais de mercado em portais (Webmotors, OLX) especificamente no estado de ${data.uf}.
    3. Verifique se há impostos (IPVA) ou taxas regionais em ${data.uf} que afetem o valor.
    
    Considere que o mercado em ${data.uf} pode ter variações de preço comparado à média nacional.
  `;

  const systemInstruction = `
    Você é o "AvalIA AI Automóveis", um Consultor Especialista em Mercado Automotivo Regional.

    OBJETIVO:
    Analisar o veículo focando na região informada (UF). O preço em SP é diferente do preço no RS ou NE.

    IMPORTANTE:
    Você DEVE usar a ferramenta 'googleSearch' para buscar preços reais de anúncios NO ESTADO INFORMADO (${data.uf}).

    ESTRUTURA DE SAÍDA:
    [[SEÇÃO 1]]
    Análise de Mercado em ${data.uf}. 
    - Compare explicitamente com a FIPE Regional.
    - Estime faixa de preço (Mínimo - Ideal - Teto) para ${data.uf}.
    - Destaque fatores regionais.

    [[SEÇÃO 2]]
    Script de Negociação.
    - 2 frases para o contexto local.

    [[SEÇÃO 3]]
    Pílula de Conhecimento.
    - 1 detalhe técnico/mercado sobre o modelo.

    [[SEÇÃO 4]]
    JSON Data.
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

    if (!response || !response.candidates || response.candidates.length === 0) {
      throw new Error("A IA não conseguiu processar sua solicitação.");
    }

    const candidate = response.candidates[0];
    const text = response.text;
    
    const groundingUrls = candidate.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        title: chunk.web?.title || chunk.web?.uri || "Fonte",
        uri: chunk.web?.uri
      }))
      .filter((item: any) => item.uri);

    const parsed = parseResponse(text || "");
    return { ...parsed, groundingUrls };
  } catch (error) {
    console.error("Error calling Gemini:", error);
    throw error;
  }
};
