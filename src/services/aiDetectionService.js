import { supabase } from "@/integrations/supabase/client";

/**
 * Detect food in an image using AI vision
 * @param {File|string} imageInput - File object or base64 string
 * @returns {Promise<Object>} Detection result with foods array and totals
 */
export const detectFoodWithAI = async (imageInput) => {
  try {
    let imageBase64;
    
    if (typeof imageInput === 'string') {
      // Already base64
      imageBase64 = imageInput;
    } else if (imageInput instanceof File) {
      // Convert File to base64
      imageBase64 = await fileToBase64(imageInput);
    } else {
      throw new Error("Invalid image input");
    }
    
    console.log("Sending image to AI for detection...");
    
    const { data, error } = await supabase.functions.invoke("detect-food", {
      body: { imageBase64 }
    });

    if (error) {
      // Normalize errors so the UI never crashes on non-Error objects
      const msg =
        (typeof error?.message === "string" && error.message) ||
        (typeof error === "string" ? error : JSON.stringify(error));

      if (msg.includes("429") || msg.toLowerCase().includes("rate limit")) {
        throw new Error("Rate limit exceeded. Please wait a few seconds and try again.");
      }

      throw new Error(msg || "Food detection failed. Please try again.");
    }

    console.log("AI detection result:", data);
    return data;

  } catch (error) {
    console.error("Error in AI food detection:", error);
    // Re-throw as a real Error instance
    if (error instanceof Error) throw error;
    throw new Error(typeof error === "string" ? error : "Food detection failed. Please try again.");
  }
};

/**
 * Convert File to base64 string
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Process AI detection result into app format
 * Handles multiple foods and calculates totals
 */
export const processAIDetectionResult = (aiResult, imageUrl) => {
  if (!aiResult?.foods || aiResult.foods.length === 0) {
    return {
      id: 0,
      name: "Unknown Food",
      calories: 0,
      carbs: 0,
      protein: 0,
      fat: 0,
      sugar: 0,
      fiber: 0,
      tags: ["unknown"],
      uploadedImage: imageUrl,
      timestamp: new Date().toISOString(),
      confidence: 0,
      isMultipleItems: false,
      foods: []
    };
  }
  
  const foods = aiResult.foods;
  const isMultipleItems = foods.length > 1;
  
  console.log("Processing AI result - foods count:", foods.length, "isMultipleItems:", isMultipleItems);
  console.log("All detected foods:", foods.map(f => f.name));
  
  // Calculate totals
  const totalCalories = aiResult.totalCalories || foods.reduce((sum, f) => sum + (f.calories || 0) * (f.quantity || 1), 0);
  const totalProtein = aiResult.totalProtein || foods.reduce((sum, f) => sum + (f.protein || 0) * (f.quantity || 1), 0);
  const totalCarbs = aiResult.totalCarbs || foods.reduce((sum, f) => sum + (f.carbs || 0) * (f.quantity || 1), 0);
  const totalFat = aiResult.totalFat || foods.reduce((sum, f) => sum + (f.fat || 0) * (f.quantity || 1), 0);
  const totalFiber = aiResult.totalFiber || foods.reduce((sum, f) => sum + (f.fiber || 0) * (f.quantity || 1), 0);
  const totalSugar = aiResult.totalSugar || foods.reduce((sum, f) => sum + (f.sugar || 0) * (f.quantity || 1), 0);
  
  // Create display name - ALWAYS show ALL items when multiple foods detected
  let displayName;
  if (isMultipleItems) {
    // Show all food names joined with +
    displayName = foods.map(f => f.name).join(" + ");
    console.log("Multiple items display name:", displayName);
  } else {
    displayName = foods[0]?.name || "Unknown Food";
    console.log("Single item display name:", displayName);
  }
  
  // Calculate average confidence
  const avgConfidence = foods.reduce((sum, f) => sum + (f.confidence || 0.8), 0) / foods.length;
  
  // Create items array for display (with individual details)
  const items = foods.map(f => ({
    name: f.name,
    quantity: f.quantity || 1,
    servingSize: f.servingSize,
    calories: Math.round((f.calories || 0) * (f.quantity || 1)),
    protein: Math.round((f.protein || 0) * (f.quantity || 1) * 10) / 10,
    carbs: Math.round((f.carbs || 0) * (f.quantity || 1) * 10) / 10,
    fat: Math.round((f.fat || 0) * (f.quantity || 1) * 10) / 10,
    fiber: Math.round((f.fiber || 0) * (f.quantity || 1) * 10) / 10,
    sugar: Math.round((f.sugar || 0) * (f.quantity || 1) * 10) / 10,
    category: f.category,
    confidence: f.confidence || 0.8
  }));
  
  return {
    id: Date.now(),
    name: displayName,
    calories: Math.round(totalCalories),
    carbs: Math.round(totalCarbs * 10) / 10,
    protein: Math.round(totalProtein * 10) / 10,
    fat: Math.round(totalFat * 10) / 10,
    sugar: Math.round(totalSugar * 10) / 10,
    fiber: Math.round(totalFiber * 10) / 10,
    tags: isMultipleItems 
      ? ["combo", aiResult.mealType || "meal"] 
      : [foods[0]?.category || "food"],
    uploadedImage: imageUrl,
    timestamp: new Date().toISOString(),
    confidence: avgConfidence,
    isMultipleItems,
    items, // Individual food items for display
    foods: items, // Keep for backwards compatibility
    description: aiResult.description,
    mealType: aiResult.mealType
  };
};
