
// USDA FoodData Central API service
// Documentation: https://fdc.nal.usda.gov/api-guide.html

const USDA_API_KEY = 'DEMO_KEY'; // Replace with your actual API key for production
const USDA_API_URL = 'https://api.nal.usda.gov/fdc/v1';

/**
 * Search for foods in the USDA database
 * @param {string} query Food name to search for
 * @param {number} pageSize Number of results to return
 * @returns {Promise<Array>} Array of food items
 */
export const searchFoods = async (query, pageSize = 5) => {
  try {
    const response = await fetch(`${USDA_API_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=${pageSize}&dataType=Foundation,SR Legacy`);
    
    if (!response.ok) {
      throw new Error(`USDA API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.foods || [];
  } catch (error) {
    console.error('Error searching USDA foods:', error);
    return [];
  }
};

/**
 * Get detailed nutrition information for a specific food
 * @param {string} fdcId USDA FoodData Central ID
 * @returns {Promise<Object>} Detailed food data
 */
export const getFoodDetails = async (fdcId) => {
  try {
    const response = await fetch(`${USDA_API_URL}/food/${fdcId}?api_key=${USDA_API_KEY}`);
    
    if (!response.ok) {
      throw new Error(`USDA API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching food details:', error);
    return null;
  }
};

/**
 * Extract standardized nutrition data from USDA food item
 * @param {Object} usdaFood Food item from USDA API
 * @returns {Object} Standardized nutrition data
 */
export const extractNutritionData = (usdaFood) => {
  // Default values
  const nutritionData = {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    fiber: 0,
    sugar: 0,
    vitaminA: 0,
    vitaminC: 0,
    calcium: 0,
    iron: 0
  };
  
  if (!usdaFood || !usdaFood.foodNutrients) {
    return nutritionData;
  }
  
  // Nutrient ID mappings for common nutrients
  const nutrientMap = {
    calories: [1008, 208], // Energy (kcal)
    protein: [1003, 203], // Protein (g)
    fat: [1004, 204], // Total lipid (fat) (g)
    carbs: [1005, 205], // Carbohydrate, by difference (g)
    fiber: [1079, 291], // Fiber, total dietary (g)
    sugar: [2000, 269], // Sugars, total (g)
    vitaminA: [1106, 320], // Vitamin A, RAE (µg)
    vitaminC: [1162, 401], // Vitamin C (mg)
    calcium: [1087, 301], // Calcium (mg)
    iron: [1089, 303] // Iron (mg)
  };
  
  // Extract nutrient values
  for (const nutrient of usdaFood.foodNutrients) {
    // Look for nutrient by ID
    for (const [key, ids] of Object.entries(nutrientMap)) {
      if (ids.includes(nutrient.nutrientId) || (nutrient.nutrient && ids.includes(nutrient.nutrient.id))) {
        nutritionData[key] = nutrient.amount || nutrient.value || 0;
        break;
      }
    }
  }
  
  return nutritionData;
};

/**
 * Get nutrition data for a food by name
 * @param {string} foodName Food name to search for
 * @returns {Promise<Object>} Standardized nutrition data
 */
export const getNutritionByFoodName = async (foodName) => {
  try {
    // Search for foods matching the name
    const searchResults = await searchFoods(foodName);
    
    if (!searchResults || searchResults.length === 0) {
      console.log(`No USDA results found for ${foodName}`);
      return null;
    }
    
    // Use the first (best match) result
    const bestMatch = searchResults[0];
    console.log(`USDA best match for "${foodName}": ${bestMatch.description} (fdcId: ${bestMatch.fdcId})`);
    
    // Extract nutrition from search result (basic data)
    const basicNutrition = extractNutritionData(bestMatch);
    
    // If we have an fdcId, try to get more detailed nutrition data
    if (bestMatch.fdcId) {
      try {
        const detailedFood = await getFoodDetails(bestMatch.fdcId);
        if (detailedFood) {
          const detailedNutrition = extractNutritionData(detailedFood);
          console.log(`Got detailed nutrition for ${foodName}:`, detailedNutrition);
          return {
            ...detailedNutrition,
            description: detailedFood.description || bestMatch.description,
            brandName: detailedFood.brandName,
            ingredients: detailedFood.ingredients,
            servingSize: detailedFood.servingSize,
            servingSizeUnit: detailedFood.servingSizeUnit
          };
        }
      } catch (detailError) {
        console.error('Error getting detailed nutrition:', detailError);
      }
    }
    
    // Return basic nutrition data as fallback
    return {
      ...basicNutrition,
      description: bestMatch.description,
      brandName: bestMatch.brandName,
      ingredients: bestMatch.ingredients
    };
    
  } catch (error) {
    console.error('Error getting nutrition by food name:', error);
    return null;
  }
};
