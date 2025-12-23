
import { supabase } from "./supabaseClient";
import { VehicleFormData, AnalysisResponse, PriceAlert } from "../types";

export const historyService = {
  saveConsultation: async (userId: string, vehicle: VehicleFormData, analysis: AnalysisResponse) => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('consultations')
      .insert({
        user_id: userId,
        vehicle_data: vehicle,
        analysis_data: analysis,
        brand_model: vehicle.brandModel,
        uf: vehicle.uf
      })
      .select()
      .single();
    
    if (error) console.error("Erro ao salvar histórico:", error);
    return data;
  },

  getHistory: async (userId: string) => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return data.map((item: any) => ({
      ...item.analysis_data,
      id: item.id,
      vehicleData: item.vehicle_data,
      createdAt: item.created_at
    }));
  },

  createAlert: async (userId: string, brandModel: string, uf: string, price: number) => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('price_alerts')
      .insert({
        user_id: userId,
        brand_model: brandModel,
        uf: uf,
        initial_price: price,
        active: true
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  getAlerts: async (userId: string): Promise<PriceAlert[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('user_id', userId);
    
    if (error) return [];
    return data.map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      brandModel: d.brand_model,
      uf: d.uf,
      initialPrice: d.initial_price,
      active: d.active,
      createdAt: d.created_at
    }));
  }
};
