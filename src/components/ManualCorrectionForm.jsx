
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { findBestFoodMatch } from "@/services/tensorflowService";
import { getNutritionByFoodName } from "@/services/usdaService";

const ManualCorrectionForm = ({ food, onFoodCorrected, onCancel }) => {
  const [foodName, setFoodName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!foodName.trim()) {
      toast.error("Please enter a food name");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First try to get nutrition data from USDA API
      const usdaNutrition = await getNutritionByFoodName(foodName);
      
      let result;
      
      if (usdaNutrition) {
        // Use USDA data if available
        result = {
          ...food,
          id: Date.now(),
          name: usdaNutrition.description || foodName,
          confidence: 100, // User correction has 100% confidence
          calories: Math.round(usdaNutrition.calories) || 0,
          carbs: Math.round(usdaNutrition.carbs * 10) / 10 || 0,
          protein: Math.round(usdaNutrition.protein * 10) / 10 || 0,
          fat: Math.round(usdaNutrition.fat * 10) / 10 || 0,
          sugar: Math.round(usdaNutrition.sugar * 10) / 10 || 0,
          fiber: Math.round(usdaNutrition.fiber * 10) / 10 || 0,
          vitamins: {
            vitaminA: usdaNutrition.vitaminA || 0,
            vitaminC: usdaNutrition.vitaminC || 0,
            calcium: usdaNutrition.calcium || 0,
            iron: usdaNutrition.iron || 0
          },
          tags: ["usda-verified", "user-corrected"],
          timestamp: new Date().toISOString(),
          originalName: food.name,
          userCorrected: true,
          usdaVerified: true
        };
        
        toast.success(`Updated to ${result.name} with USDA nutrition data`);
      } else {
        // Fallback to local food database
        const correctedFood = findBestFoodMatch([{ 
          className: foodName,
          probability: 1.0
        }]);
        
        // If no match found, display error
        if (!correctedFood || !correctedFood.name) {
          toast.error("Sorry, we couldn't find nutrition data for this food");
          setIsSubmitting(false);
          return;
        }
        
        // Create the corrected food object with local data
        result = {
          ...food,
          id: Date.now(),
          name: correctedFood.name,
          confidence: 100, // User correction has 100% confidence
          calories: correctedFood.calories || 0,
          carbs: correctedFood.carbs || 0,
          protein: correctedFood.protein || 0,
          fat: correctedFood.fat || 0,
          sugar: correctedFood.sugar || 0,
          fiber: correctedFood.fiber || 0,
          tags: [correctedFood.category || "unknown", "user-corrected"],
          timestamp: new Date().toISOString(),
          originalName: food.name,
          userCorrected: true
        };
        
        toast.success(`Updated to ${result.name}`);
      }
      
      // Pass the corrected food back to parent
      onFoodCorrected(result);
      
    } catch (error) {
      console.error("Error correcting food:", error);
      toast.error("Failed to update food information");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-4 bg-white rounded-lg shadow-md border border-gray-200"
    >
      <h3 className="text-lg font-semibold mb-3">Correct Food Identification</h3>
      <p className="text-sm text-gray-600 mb-4">
        If "{food.name}" is incorrect, please enter the correct food name below.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="food-name">Food Name</Label>
          <Input
            id="food-name"
            placeholder="e.g. Pizza, Salad, Pasta"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        
        <div className="flex gap-2 justify-end">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting || !foodName.trim()}
          >
            {isSubmitting ? 'Updating...' : 'Update Food'}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default ManualCorrectionForm;
