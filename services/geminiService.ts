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

    if (sections.length > 2) {
      const scriptsText = sections[2].trim();
      result.salesScripts = scriptsText
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => s.replace(/^[-*•"']\s*/, '').replace(/["']$/, ''));
    }

    if (sections.length > 3) {
      result.knowledgePill = sections[3].trim();
    }

    if (sections.length > 4) {
      let jsonText = sections[4].trim();
      jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '');
      
      const start = jsonText.indexOf('{');
      const end = jsonText.lastIndexOf('}');
      
      if (start !== -1 && end !== -1) {
         const cleanJson = jsonText.substring(start, end + 1);
         try {
            result.crmData = JSON.parse(cleanJson);
         } catch (jsonError) {
            console.warn("JSON parsing failed. Attempting cleanup...", jsonError);
            try {
              const fixedJson = cleanJson.replace(/'/g, '"');
              result.crmData = JSON.parse(fixedJson);
            } catch (e) {
               console.error("Failed to recover JSON:", cleanJson);
            }
         }
      }
    }
  } catch (error) {
    console.error("Error parsing response:", error);
  }

  return result;
};

export const analyzeVehicle = async (data: VehicleFormData): Promise<AnalysisResponse> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const transactionContext = data.transactionType === 'compra' ? 'COMPRA (Avaliação para pagar)' : 'VENDA (Preço para anunciar)';
  
  // Format amenities list
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
    Analise o seguinte veículo para fins de **${transactionContext}**:
    
    DETALHES DO VEÍCULO:
    - Tipo: ${data.type}
    - Modelo: ${data.brandModel}
    - Ano/Modelo: ${data.year}
    - Quilometragem: ${data.mileage} km
    - Cor: ${data.color}
    - Estado de Conservação: ${data.condition}
    - Diferenciais/Opcionais: ${amenities}
    - Preço ${data.transactionType === 'venda' ? 'Desejado pelo Dono' : 'Oferecido'}: R$ ${data.price.toLocaleString('pt-BR')}

    Utilize o Google Search para encontrar:
    1. O valor atualizado na Tabela FIPE para este modelo e ano.
    2. Ofertas reais de mercado (Webmotors, OLX, iCarros) para veículos similares (mesmo ano/km).
    
    Considere fortemente o impacto da quilometragem (se está alta ou baixa para o ano) e o histórico de revisões na liquidez e valor final.
  `;

  const systemInstruction = `
    Você é o "AvalIA Auto", um Consultor Sênior de Mercado Automotivo e Mentor para revendedores de carros.

    OBJETIVO:
    Analisar dados de um veículo, estimar a precificação comparando FIPE x Mercado Real e fornecer argumentos irrefutáveis.

    CONTEXTO:
    Se for VENDA: Foque em como justificar o preço (ou abaixá-lo se estiver fora da realidade) usando KM, estado dos pneus e opcionais valorizados.
    Se for COMPRA: Foque em identificar riscos (desvalorização alta, "micar" no estoque) e margem de negociação.

    PERFIL DE RESPOSTA (Mobile-First):
    1. Seja direto e visual (use bullet points e emojis).
    2. Compare sempre com a FIPE (ex: "Está 10% abaixo da FIPE").
    3. Tom de voz: Especialista, seguro e focado em lucro/liquidez.

    IMPORTANTE:
    Você DEVE usar a ferramenta 'googleSearch' para buscar a Tabela FIPE atual e anúncios concorrentes.

    ESTRUTURA DE SAÍDA OBRIGATÓRIA:
    Use EXATAMENTE os delimitadores abaixo.

    [[SEÇÃO 1]]
    Análise de Mercado e Preço.
    - Mostre a FIPE Estimada.
    - Estime uma faixa de preço real de venda (Mínimo - Ideal - Teto).
    - Destaque 3 pontos fortes (ex: Baixa KM, Único dono) e 2 pontos de atenção (ex: Cor prata, blindagem vencida).
    - Use Markdown.

    [[SEÇÃO 2]]
    Script de Negociação.
    - Forneça 2 frases "matadoras" para usar na negociação (seja para comprar barato ou vender bem).

    [[SEÇÃO 3]]
    Pílula Mecânica/Mercado.
    - Explique brevemente (max 2 frases) um detalhe técnico ou de mercado sobre esse modelo específico. Ex: "Esse motor THP requer atenção na corrente de comando", ou "Honda Fit tem liquidez D+0".

    [[SEÇÃO 4]]
    CRM Data (JSON).
    - Gere um objeto JSON válido.
    - Exemplo:
    {
      "resumo_veiculo": "Honda Civic 2020 EXL, 40k km...",
      "faixa_preco_sugerida": "R$ X - R$ Y",
      "nivel_dificuldade_venda": "Alto/Médio/Baixo",
      "tags_sugeridas": ["Giro Rápido", "Revisado", "Baixa KM"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }],
        temperature: 0.7, 
      },
    });

    // Verificação Robusta de Resposta
    if (!response || !response.candidates || response.candidates.length === 0) {
      console.error("Gemini retornou resposta vazia (sem candidates).", response);
      throw new Error("A IA não conseguiu processar sua solicitação. Tente novamente.");
    }

    const candidate = response.candidates[0];

    // Verifica bloqueios de segurança
    if (candidate.finishReason !== "STOP" && !response.text) {
      console.error("Gemini bloqueado ou erro.", {
         finishReason: candidate.finishReason,
         safetyRatings: candidate.safetyRatings
      });
      throw new Error(`A análise foi interrompida pela IA. Motivo: ${candidate.finishReason}`);
    }

    const text = response.text;
    if (!text) {
      console.error("Texto da resposta indefinido.", JSON.stringify(response, null, 2));
      throw new Error("A IA retornou dados incompletos. Por favor, tente novamente.");
    }

    return parseResponse(text);
  } catch (error) {
    console.error("Error calling Gemini:", error);
    throw error;
  }
};