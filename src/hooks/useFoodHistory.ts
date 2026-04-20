import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FoodHistoryItem {
  id: string;
  user_id: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  portion_size: string | null;
  image: string | null;
  detected_at: string;
  // For backwards compatibility with existing code
  name?: string;
  timestamp?: string;
  uploadedImage?: string;
  tags?: string[];
}

export const useFoodHistory = () => {
  const [history, setHistory] = useState<FoodHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchHistory = async () => {
    if (!user) {
      setHistory([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("food_history")
        .select("*")
        .eq("user_id", user.id)
        .order("detected_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Transform to match existing component expectations
      const transformedData = (data || []).map((item) => ({
        ...item,
        name: item.food_name,
        timestamp: item.detected_at,
        uploadedImage: item.image,
        tags: [],
      }));

      setHistory(transformedData);
    } catch (error) {
      console.error("Error fetching food history:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveToHistory = async (foodItem: {
    name: string;
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    portionSize?: string;
    uploadedImage?: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("food_history")
        .insert({
          user_id: user.id,
          food_name: foodItem.name,
          calories: foodItem.calories || 0,
          protein: foodItem.protein || 0,
          carbs: foodItem.carbs || 0,
          fat: foodItem.fat || 0,
          fiber: foodItem.fiber || 0,
          portion_size: foodItem.portionSize || null,
          image: foodItem.uploadedImage || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh history
      await fetchHistory();
      return data;
    } catch (error) {
      console.error("Error saving to history:", error);
      return null;
    }
  };

  const removeFromHistory = async (itemId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("food_history")
        .delete()
        .eq("id", itemId)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchHistory();
    } catch (error) {
      console.error("Error removing from history:", error);
    }
  };

  const clearHistory = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("food_history")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setHistory([]);
    } catch (error) {
      console.error("Error clearing history:", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  return {
    history,
    loading,
    saveToHistory,
    removeFromHistory,
    clearHistory,
    refreshHistory: fetchHistory,
  };
};
