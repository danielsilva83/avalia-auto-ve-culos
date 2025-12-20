
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
      result.priceAnalysis = sections[1].trim();
    }

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

  const transactionContext = data.transactionType === 'compra' ? 'COMPRA (Quanto pagar)' : 'VENDA (Quanto pedir)';
  
  const amenities = [
    data.transmission === 'Automático' ? 'Câmbio Automático' : 'Câmbio Manual',
    data.fuel ? `Combustível: ${data.fuel}` : null,
    data.isArmored ? 'Blindado' : null,
    data.hasSunroof ? 'Teto Solar' : null,
    data.hasLeather ? 'Bancos de Couro' : null,
    data.hasMultimedia ? 'Multimídia' : null,
    data.hasServiceHistory ? 'Histórico de Revisão' : null,
    data.singleOwner ? 'Único Dono' : null
  ].filter(Boolean).join(', ');

  const prompt = `
    PESQUISA REGIONAL OBRIGATÓRIA: Estado de ${data.uf} (Brasil).
    
    Analise o veículo para **${transactionContext}** considerando o mercado local de **${data.uf}**:
    - Modelo: ${data.brandModel}
    - Ano/Modelo: ${data.year}
    - KM: ${data.mileage}
    - Diferenciais: ${amenities}
    - Preço Base Informado: R$ ${data.price.toLocaleString('pt-BR')}

    TAREFAS DE PESQUISA (Use Google Search):
    1. Busque o valor da Tabela FIPE para este modelo.
    2. Procure por anúncios similares ATIVOS em portais como Webmotors, OLX ou iCarros NO ESTADO DE ${data.uf}.
    3. Identifique se existe variação de IPVA ou taxas regionais em ${data.uf} que impactam o valor.
    4. Avalie a liquidez: este carro vende rápido em ${data.uf}?
  `;

  const systemInstruction = `
    Você é o 'AvalIA AI Automóveis', especialista em precificação regional brasileira.
    
    REGRA DE OURO: Você deve diferenciar o preço de mercado nacional da média praticada no estado de ${data.uf}.
    
    FORMATO DE RESPOSTA (Markdown):
    [[SEÇÃO 1]]
    ### Análise de Mercado Regional (${data.uf})
    - Valor FIPE vs. Valor Real Praticado em ${data.uf}.
    - Por que o preço varia nesta região (Destaque IPVA, Demanda Local ou Logística).
    - Sugestão de Preço (Mínimo, Ideal e Teto).

    [[SEÇÃO 2]]
    Scripts de Negociação adaptados para ${data.uf}.

    [[SEÇÃO 3]]
    Pílula de Conhecimento técnico sobre o modelo.

    [[SEÇÃO 4]]
    JSON Data para CRM.
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
    const groundingUrls = candidate.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        title: chunk.web?.title || chunk.web?.uri || "Fonte",
        uri: chunk.web?.uri
      }))
      .filter((item: any) => item.uri);

    const parsed = parseResponse(response.text || "");
    return { ...parsed, groundingUrls };
  } catch (error) {
    console.error("Error calling Gemini:", error);
    throw error;
  }
};
