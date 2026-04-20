
import { motion } from "framer-motion";

const NutritionFacts = ({ food }) => {
  // Check if we have multiple food items
  const hasMultipleItems = food?.isMultipleItems && food?.foods && food?.foods.length > 1;
  
  // Ensure food object has all required properties with proper fallbacks
  const safeFood = {
    name: food?.name || "Unknown Food",
    calories: food?.calories || 0,
    fat: food?.fat || 0,
    carbs: food?.carbs || 0,
    fiber: food?.fiber || 0,
    sugar: food?.sugar || 0,
    protein: food?.protein || 0,
    vitamins: food?.vitamins || {
      vitaminA: 0,
      vitaminC: 0,
      calcium: 0,
      iron: 0
    }
  };

  // Calculate % daily values based on standard 2000 calorie diet
  const dailyValues = {
    fat: Math.round((safeFood.fat / 65) * 100),
    carbs: Math.round((safeFood.carbs / 300) * 100),
    fiber: Math.round((safeFood.fiber / 25) * 100),
    sugar: Math.round((safeFood.sugar / 50) * 100),
    protein: Math.round((safeFood.protein / 50) * 100),
    vitaminA: Math.round((safeFood.vitamins.vitaminA / 900) * 100),
    vitaminC: Math.round((safeFood.vitamins.vitaminC / 90) * 100),
    calcium: Math.round((safeFood.vitamins.calcium / 1300) * 100),
    iron: Math.round((safeFood.vitamins.iron / 18) * 100)
  };

  console.log("NutritionFacts received food:", food);

  const hasUsdaData = food?.usdaVerified || food?.tags?.includes("usda-verified");
  const hasVitaminData = safeFood.vitamins.vitaminA > 0 || safeFood.vitamins.vitaminC > 0 || 
                         safeFood.vitamins.calcium > 0 || safeFood.vitamins.iron > 0;

  return (
    <motion.div 
      className="px-6 pb-6 pt-2 border-t border-gray-200 mt-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.3 }}
    >
      <h3 className="font-bold text-lg mb-4">
        {hasMultipleItems ? "Combined Nutrition Facts" : `Nutrition Facts for ${safeFood.name}`}
      </h3>
      
      {/* Show individual items breakdown for multiple foods */}
      {hasMultipleItems && (
        <div className="mb-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg">
          <p className="text-sm font-medium text-emerald-700 mb-2">Items Breakdown:</p>
          <div className="space-y-2">
            {food.foods.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm bg-white/60 p-2 rounded">
                <span className="font-medium">{item.name}</span>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>{item.calories} cal</span>
                  <span>C: {item.carbs}g</span>
                  <span>P: {item.protein}g</span>
                  <span>F: {item.fat}g</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-emerald-200 flex justify-between items-center font-semibold text-emerald-800">
            <span>TOTAL</span>
            <div className="flex gap-3 text-sm">
              <span>{safeFood.calories} cal</span>
              <span>C: {safeFood.carbs}g</span>
              <span>P: {safeFood.protein}g</span>
              <span>F: {safeFood.fat}g</span>
            </div>
          </div>
        </div>
      )}
      
      {hasUsdaData && (
        <div className="mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            USDA Verified Data
          </span>
        </div>
      )}
      
      <div className="border-b border-gray-300 pb-2 mb-2">
        <div className="flex justify-between text-sm">
          <span className="font-semibold">Serving Size</span>
          <span>{hasMultipleItems ? "Combined Total" : "100g"}</span>
        </div>
      </div>
      
      <div className="border-b border-gray-300 pb-2 mb-2">
        <div className="flex justify-between items-end">
          <span className="font-bold text-xl">Calories</span>
          <span className="font-bold text-xl">{safeFood.calories}</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-semibold">Total Fat</span>
          <div className="text-right">
            <span>{safeFood.fat}g</span>
            <span className="text-xs text-gray-800 ml-1">{dailyValues.fat}%</span>
          </div>
        </div>
        
        <div className="flex justify-between text-sm pl-4">
          <span>Saturated Fat</span>
          <span>{(safeFood.fat * 0.3).toFixed(1)}g</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="font-semibold">Total Carbohydrates</span>
          <div className="text-right">
            <span>{safeFood.carbs}g</span>
            <span className="text-xs text-gray-800 ml-1">{dailyValues.carbs}%</span>
          </div>
        </div>
        
        <div className="flex justify-between text-sm pl-4">
          <span>Dietary Fiber</span>
          <div className="text-right">
            <span>{safeFood.fiber}g</span>
            <span className="text-xs text-gray-800 ml-1">{dailyValues.fiber}%</span>
          </div>
        </div>
        
        <div className="flex justify-between text-sm pl-4">
          <span>Sugars</span>
          <div className="text-right">
            <span>{safeFood.sugar}g</span>
            <span className="text-xs text-gray-800 ml-1">{dailyValues.sugar}%</span>
          </div>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="font-semibold">Protein</span>
          <div className="text-right">
            <span>{safeFood.protein}g</span>
            <span className="text-xs text-gray-800 ml-1">{dailyValues.protein}%</span>
          </div>
        </div>
        
        {hasVitaminData && (
          <>
            <div className="mt-3 pt-2 border-t border-gray-200">
              <span className="text-sm font-semibold">Vitamins & Minerals</span>
            </div>
            
            {safeFood.vitamins.vitaminA > 0 && (
              <div className="flex justify-between text-sm pl-4">
                <span>Vitamin A</span>
                <div className="text-right">
                  <span>{safeFood.vitamins.vitaminA}µg</span>
                  <span className="text-xs text-gray-800 ml-1">{dailyValues.vitaminA}%</span>
                </div>
              </div>
            )}
            
            {safeFood.vitamins.vitaminC > 0 && (
              <div className="flex justify-between text-sm pl-4">
                <span>Vitamin C</span>
                <div className="text-right">
                  <span>{safeFood.vitamins.vitaminC}mg</span>
                  <span className="text-xs text-gray-800 ml-1">{dailyValues.vitaminC}%</span>
                </div>
              </div>
            )}
            
            {safeFood.vitamins.calcium > 0 && (
              <div className="flex justify-between text-sm pl-4">
                <span>Calcium</span>
                <div className="text-right">
                  <span>{safeFood.vitamins.calcium}mg</span>
                  <span className="text-xs text-gray-800 ml-1">{dailyValues.calcium}%</span>
                </div>
              </div>
            )}
            
            {safeFood.vitamins.iron > 0 && (
              <div className="flex justify-between text-sm pl-4">
                <span>Iron</span>
                <div className="text-right">
                  <span>{safeFood.vitamins.iron}mg</span>
                  <span className="text-xs text-gray-800 ml-1">{dailyValues.iron}%</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="mt-4 pt-2 border-t border-gray-200">
        <p className="text-xs text-muted-foreground">
          * Percent Daily Values are based on a 2,000 calorie diet. Your daily
          values may be higher or lower depending on your calorie needs.
        </p>
      </div>
    </motion.div>
  );
};

export default NutritionFacts;
