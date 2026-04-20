
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

// Cache model to avoid reloading
let modelCache = null;

// Load the MobileNet model
export const loadModel = async () => {
  if (modelCache) {
    return modelCache;
  }
  
  try {
    console.log('Loading MobileNet model...');
    // Load model with alpha 1.0 for better accuracy (ResNet50-like performance)
    modelCache = await mobilenet.load({ version: 2, alpha: 1.0 });
    console.log('MobileNet model loaded successfully');
    return modelCache;
  } catch (error) {
    console.error('Error loading MobileNet model:', error);
    throw new Error('Failed to load image recognition model');
  }
};

// Preprocess image for classification - apply data augmentation techniques
export const preprocessImage = async (imageElement) => {
  return new Promise((resolve, reject) => {
    try {
      if (imageElement.complete && imageElement.naturalHeight !== 0) {
        // Create canvas for potential image preprocessing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions to match image
        canvas.width = imageElement.naturalWidth;
        canvas.height = imageElement.naturalHeight;
        
        // Draw image to canvas with brightness adjustment
        ctx.filter = 'brightness(1.05) contrast(1.05)';
        ctx.drawImage(imageElement, 0, 0);
        
        // Create a new image from the canvas
        const processedImg = new Image();
        processedImg.onload = () => resolve(processedImg);
        processedImg.onerror = (e) => reject(e);
        processedImg.src = canvas.toDataURL('image/jpeg', 0.95);
      } else {
        imageElement.onload = () => resolve(imageElement);
        imageElement.onerror = (e) => reject(e);
      }
    } catch (error) {
      console.error('Error in image preprocessing:', error);
      // If preprocessing fails, use the original image
      resolve(imageElement);
    }
  });
};

// Classify an image using the loaded model
export const classifyImage = async (imageElement) => {
  try {
    const model = await loadModel();
    
    // Ensure image is loaded and preprocessed
    const processedImage = await preprocessImage(imageElement);
    
    // Classify the image with top 10 results for better matching
    console.log('Classifying image...');
    const predictions = await model.classify(processedImage, 10);
    console.log('Classification results:', predictions);
    
    return predictions;
  } catch (error) {
    console.error('Error classifying image:', error);
    throw new Error('Failed to recognize food in image');
  }
};

// Map common MobileNet classifications to food categories
// Enhanced to cover Food-101 dataset categories
const foodMappings = {
  // Food-101 Categories - Main dishes
  'pizza': { name: 'Pizza', category: 'main dish', calories: 285, carbs: 36, protein: 12, fat: 10, sugar: 3.8, fiber: 2.5 },
  'spaghetti bolognese': { name: 'Spaghetti Bolognese', category: 'main dish', calories: 340, carbs: 45, protein: 20, fat: 9, sugar: 6, fiber: 4 },
  'lasagna': { name: 'Lasagna', category: 'main dish', calories: 284, carbs: 23, protein: 16, fat: 14, sugar: 4, fiber: 2 },
  'fish and chips': { name: 'Fish and Chips', category: 'main dish', calories: 585, carbs: 58, protein: 28, fat: 28, sugar: 1, fiber: 3 },
  'steak': { name: 'Steak', category: 'main dish', calories: 271, carbs: 0, protein: 26, fat: 19, sugar: 0, fiber: 0 },
  'hamburger': { name: 'Hamburger', category: 'fast food', calories: 295, carbs: 29, protein: 17, fat: 14, sugar: 6, fiber: 1.1 },
  'cheeseburger': { name: 'Cheeseburger', category: 'fast food', calories: 350, carbs: 30, protein: 20, fat: 17, sugar: 7, fiber: 1 },
  'club sandwich': { name: 'Club Sandwich', category: 'sandwich', calories: 480, carbs: 45, protein: 28, fat: 22, sugar: 5, fiber: 3 },
  'grilled salmon': { name: 'Grilled Salmon', category: 'main dish', calories: 208, carbs: 0, protein: 22, fat: 13, sugar: 0, fiber: 0 },
  'roast chicken': { name: 'Roast Chicken', category: 'main dish', calories: 239, carbs: 0, protein: 27, fat: 14, sugar: 0, fiber: 0 },
  
  // Food-101 Categories - Fast Food
  'french fries': { name: 'French Fries', category: 'fast food', calories: 365, carbs: 48, protein: 4, fat: 17, sugar: 0.5, fiber: 4 },
  'onion rings': { name: 'Onion Rings', category: 'fast food', calories: 480, carbs: 61, protein: 7, fat: 23, sugar: 11, fiber: 3 },
  'fried chicken': { name: 'Fried Chicken', category: 'fast food', calories: 320, carbs: 11, protein: 30, fat: 19, sugar: 0, fiber: 0.5 },
  'hot dog': { name: 'Hot Dog', category: 'fast food', calories: 290, carbs: 18, protein: 10, fat: 18, sugar: 4, fiber: 0 },
  'burrito': { name: 'Burrito', category: 'fast food', calories: 450, carbs: 60, protein: 18, fat: 16, sugar: 3, fiber: 8 },
  'taco': { name: 'Taco', category: 'fast food', calories: 210, carbs: 21, protein: 9, fat: 10, sugar: 2, fiber: 3 },
  'nachos': { name: 'Nachos', category: 'fast food', calories: 600, carbs: 73, protein: 15, fat: 33, sugar: 3, fiber: 9 },
  
  // Food-101 Categories - Asian Cuisine
  'sushi': { name: 'Sushi', category: 'japanese', calories: 280, carbs: 38, protein: 9, fat: 9, sugar: 4, fiber: 1 },
  'spring roll': { name: 'Spring Roll', category: 'asian', calories: 180, carbs: 24, protein: 4, fat: 8, sugar: 2, fiber: 1 },
  'ramen': { name: 'Ramen', category: 'japanese', calories: 380, carbs: 56, protein: 14, fat: 12, sugar: 4, fiber: 2 },
  'fried rice': { name: 'Fried Rice', category: 'chinese', calories: 333, carbs: 45, protein: 12, fat: 12, sugar: 3, fiber: 2 },
  'pad thai': { name: 'Pad Thai', category: 'thai', calories: 390, carbs: 56, protein: 16, fat: 12, sugar: 14, fiber: 3 },
  'bibimbap': { name: 'Bibimbap', category: 'korean', calories: 560, carbs: 77, protein: 25, fat: 18, sugar: 3, fiber: 7 },
  'donburi': { name: 'Donburi', category: 'japanese', calories: 450, carbs: 65, protein: 18, fat: 14, sugar: 5, fiber: 3 },
  'gyoza': { name: 'Gyoza', category: 'japanese', calories: 260, carbs: 28, protein: 12, fat: 11, sugar: 1, fiber: 2 },
  'curry rice': { name: 'Curry Rice', category: 'asian', calories: 430, carbs: 73, protein: 10, fat: 13, sugar: 6, fiber: 5 },
  'pho': { name: 'Pho', category: 'vietnamese', calories: 215, carbs: 27, protein: 15, fat: 5, sugar: 0, fiber: 1 },
  
  // Food-101 Categories - Italian Cuisine
  'risotto': { name: 'Risotto', category: 'italian', calories: 352, carbs: 45, protein: 8, fat: 16, sugar: 1, fiber: 2 },
  'ravioli': { name: 'Ravioli', category: 'italian', calories: 320, carbs: 42, protein: 14, fat: 12, sugar: 3, fiber: 3 },
  'gnocchi': { name: 'Gnocchi', category: 'italian', calories: 210, carbs: 38, protein: 4, fat: 5, sugar: 1, fiber: 2 },
  'tiramisu': { name: 'Tiramisu', category: 'dessert', calories: 330, carbs: 30, protein: 5, fat: 22, sugar: 24, fiber: 0 },
  'caprese salad': { name: 'Caprese Salad', category: 'salad', calories: 260, carbs: 9, protein: 10, fat: 20, sugar: 6, fiber: 2 },
  'bruschetta': { name: 'Bruschetta', category: 'appetizer', calories: 170, carbs: 19, protein: 5, fat: 9, sugar: 2, fiber: 1 },
  
  // Food-101 Categories - Desserts
  'cheesecake': { name: 'Cheesecake', category: 'dessert', calories: 321, carbs: 26, protein: 6, fat: 23, sugar: 21, fiber: 0 },
  'chocolate cake': { name: 'Chocolate Cake', category: 'dessert', calories: 371, carbs: 50, protein: 5, fat: 18, sugar: 36, fiber: 2 },
  'apple pie': { name: 'Apple Pie', category: 'dessert', calories: 296, carbs: 43, protein: 3, fat: 13, sugar: 25, fiber: 2 },
  'ice cream': { name: 'Ice Cream', category: 'dessert', calories: 207, carbs: 24, protein: 3.5, fat: 11, sugar: 21, fiber: 0.5 },
  'donut': { name: 'Donut', category: 'dessert', calories: 253, carbs: 30, protein: 4, fat: 14, sugar: 10, fiber: 1 },
  'cupcake': { name: 'Cupcake', category: 'dessert', calories: 292, carbs: 41, protein: 3, fat: 14, sugar: 28, fiber: 0.5 },
  'creme brulee': { name: 'Crème Brûlée', category: 'dessert', calories: 300, carbs: 27, protein: 4, fat: 20, sugar: 24, fiber: 0 },
  'panna cotta': { name: 'Panna Cotta', category: 'dessert', calories: 210, carbs: 25, protein: 3, fat: 11, sugar: 22, fiber: 0 },
  'macarons': { name: 'Macarons', category: 'dessert', calories: 95, carbs: 12, protein: 1, fat: 5, sugar: 10, fiber: 0 },
  'waffles': { name: 'Waffles', category: 'breakfast', calories: 218, carbs: 25, protein: 6, fat: 11, sugar: 6, fiber: 1 },
  'pancakes': { name: 'Pancakes', category: 'breakfast', calories: 175, carbs: 28, protein: 4, fat: 5, sugar: 9, fiber: 0.5 },
  'chocolate mousse': { name: 'Chocolate Mousse', category: 'dessert', calories: 225, carbs: 21, protein: 3, fat: 14, sugar: 19, fiber: 1 },
  
  // Food-101 Categories - Breakfast
  'eggs benedict': { name: 'Eggs Benedict', category: 'breakfast', calories: 650, carbs: 24, protein: 25, fat: 50, sugar: 2, fiber: 1 },
  'omelette': { name: 'Omelette', category: 'breakfast', calories: 210, carbs: 2, protein: 15, fat: 16, sugar: 1, fiber: 0 },
  'french toast': { name: 'French Toast', category: 'breakfast', calories: 280, carbs: 30, protein: 9, fat: 14, sugar: 11, fiber: 2 },
  'breakfast burrito': { name: 'Breakfast Burrito', category: 'breakfast', calories: 420, carbs: 45, protein: 20, fat: 16, sugar: 4, fiber: 6 },
  
  // Food-101 Categories - Salads and Healthy Options
  'caesar salad': { name: 'Caesar Salad', category: 'salad', calories: 250, carbs: 10, protein: 8, fat: 20, sugar: 2, fiber: 3 },
  'greek salad': { name: 'Greek Salad', category: 'salad', calories: 180, carbs: 10, protein: 5, fat: 14, sugar: 4, fiber: 3 },
  'cobb salad': { name: 'Cobb Salad', category: 'salad', calories: 420, carbs: 9, protein: 30, fat: 30, sugar: 3, fiber: 4 },
  'avocado toast': { name: 'Avocado Toast', category: 'breakfast', calories: 190, carbs: 20, protein: 4, fat: 10, sugar: 2, fiber: 5 },
  'quinoa bowl': { name: 'Quinoa Bowl', category: 'healthy', calories: 340, carbs: 52, protein: 12, fat: 10, sugar: 3, fiber: 8 },
  'acai bowl': { name: 'Acai Bowl', category: 'breakfast', calories: 420, carbs: 75, protein: 8, fat: 12, sugar: 40, fiber: 12 },
  
  // Food-101 Categories - European Specialties
  'paella': { name: 'Paella', category: 'spanish', calories: 367, carbs: 43, protein: 22, fat: 12, sugar: 2, fiber: 4 },
  'escargot': { name: 'Escargot', category: 'french', calories: 400, carbs: 2, protein: 16, fat: 37, sugar: 0, fiber: 0 },
  'croissant': { name: 'Croissant', category: 'bakery', calories: 272, carbs: 31, protein: 5, fat: 14, sugar: 11, fiber: 2 },
  'foie gras': { name: 'Foie Gras', category: 'french', calories: 462, carbs: 4, protein: 11, fat: 44, sugar: 0, fiber: 0 },
  'soufflé': { name: 'Soufflé', category: 'french', calories: 220, carbs: 10, protein: 12, fat: 15, sugar: 5, fiber: 0 },
  
  // More Food-101 Categories - International Dishes
  'falafel': { name: 'Falafel', category: 'middle eastern', calories: 333, carbs: 32, protein: 13, fat: 18, sugar: 0, fiber: 5 },
  'hummus': { name: 'Hummus', category: 'middle eastern', calories: 166, carbs: 14, protein: 8, fat: 10, sugar: 0, fiber: 4 },
  'kebab': { name: 'Kebab', category: 'middle eastern', calories: 380, carbs: 30, protein: 30, fat: 15, sugar: 5, fiber: 3 },
  'tacos': { name: 'Tacos', category: 'mexican', calories: 210, carbs: 21, protein: 9, fat: 10, sugar: 2, fiber: 3 },
  'guacamole': { name: 'Guacamole', category: 'mexican', calories: 150, carbs: 8, protein: 2, fat: 13, sugar: 1, fiber: 6 },
  'churros': { name: 'Churros', category: 'dessert', calories: 280, carbs: 38, protein: 4, fat: 13, sugar: 15, fiber: 1 },
  'empanadas': { name: 'Empanadas', category: 'latin american', calories: 265, carbs: 25, protein: 8, fat: 15, sugar: 2, fiber: 1 },
  
  // Fruits
  'banana': { name: 'Banana', category: 'fruit', calories: 105, carbs: 27, protein: 1.3, fat: 0.4, sugar: 14, fiber: 3.1 },
  'fig': { name: 'Fig', category: 'fruit', calories: 74, carbs: 19, protein: 0.8, fat: 0.3, sugar: 16, fiber: 3 },
  'pomegranate': { name: 'Pomegranate', category: 'fruit', calories: 83, carbs: 19, protein: 1.7, fat: 1.2, sugar: 14, fiber: 4 },
  'orange': { name: 'Orange', category: 'fruit', calories: 62, carbs: 15, protein: 1.2, fat: 0.2, sugar: 12, fiber: 3.1 },
  'lemon': { name: 'Lemon', category: 'fruit', calories: 29, carbs: 9, protein: 1.1, fat: 0.3, sugar: 2.5, fiber: 2.8 },
  'strawberry': { name: 'Strawberry', category: 'fruit', calories: 32, carbs: 7.7, protein: 0.7, fat: 0.3, sugar: 4.9, fiber: 2 },
  'pineapple': { name: 'Pineapple', category: 'fruit', calories: 50, carbs: 13, protein: 0.5, fat: 0.1, sugar: 10, fiber: 1.4 },
  'apple': { name: 'Apple', category: 'fruit', calories: 95, carbs: 25, protein: 0.5, fat: 0.3, sugar: 19, fiber: 4 },
  'grapes': { name: 'Grapes', category: 'fruit', calories: 69, carbs: 18, protein: 0.6, fat: 0.2, sugar: 15, fiber: 0.9 },
  'kiwi': { name: 'Kiwi', category: 'fruit', calories: 61, carbs: 15, protein: 1.1, fat: 0.5, sugar: 9, fiber: 3 },
  'mango': { name: 'Mango', category: 'fruit', calories: 60, carbs: 15, protein: 0.8, fat: 0.4, sugar: 14, fiber: 1.6 },
  
  // Drinks
  'coffee': { name: 'Coffee', category: 'drink', calories: 2, carbs: 0, protein: 0.3, fat: 0, sugar: 0, fiber: 0 },
  'cappuccino': { name: 'Cappuccino', category: 'drink', calories: 80, carbs: 8, protein: 5, fat: 4, sugar: 7, fiber: 0 },
  'latte': { name: 'Latte', category: 'drink', calories: 120, carbs: 10, protein: 7, fat: 6, sugar: 9, fiber: 0 },
  'espresso': { name: 'Espresso', category: 'drink', calories: 2, carbs: 0.5, protein: 0.2, fat: 0, sugar: 0, fiber: 0 },
  'tea': { name: 'Tea', category: 'drink', calories: 2, carbs: 0.5, protein: 0, fat: 0, sugar: 0, fiber: 0 },
  'juice': { name: 'Fruit Juice', category: 'drink', calories: 110, carbs: 27, protein: 0.5, fat: 0.2, sugar: 22, fiber: 0.5 },
  'smoothie': { name: 'Smoothie', category: 'drink', calories: 190, carbs: 44, protein: 2.5, fat: 1, sugar: 36, fiber: 3 },
  'soda': { name: 'Soda', category: 'drink', calories: 150, carbs: 39, protein: 0, fat: 0, sugar: 39, fiber: 0 },
  
  // Baked Goods
  'bagel': { name: 'Bagel', category: 'bakery', calories: 245, carbs: 48, protein: 10, fat: 1.5, sugar: 6, fiber: 2 },
  'bread': { name: 'Bread', category: 'bakery', calories: 79, carbs: 15, protein: 3, fat: 1, sugar: 1.5, fiber: 1.5 },
  'muffin': { name: 'Muffin', category: 'bakery', calories: 340, carbs: 55, protein: 5, fat: 12, sugar: 32, fiber: 2 },
  'pretzel': { name: 'Pretzel', category: 'bakery', calories: 115, carbs: 23, protein: 3, fat: 1, sugar: 0.5, fiber: 1 },
  'baguette': { name: 'Baguette', category: 'bakery', calories: 130, carbs: 26, protein: 4, fat: 0.5, sugar: 1, fiber: 1 },
  'garlic bread': { name: 'Garlic Bread', category: 'side', calories: 350, carbs: 45, protein: 8, fat: 15, sugar: 3, fiber: 2 },
  'beignets': { name: 'Beignets', category: 'dessert', calories: 327, carbs: 51, protein: 6, fat: 11, sugar: 26, fiber: 2 },
};

// Generic food category detection
const genericFoodCategories = {
  'fruit': { defaultCals: 80, carbs: 20, protein: 1, fat: 0.5, sugar: 15, fiber: 3 },
  'vegetable': { defaultCals: 50, carbs: 10, protein: 2, fat: 0.3, sugar: 4, fiber: 4 },
  'meat': { defaultCals: 250, carbs: 0, protein: 25, fat: 17, sugar: 0, fiber: 0 },
  'dessert': { defaultCals: 300, carbs: 40, protein: 4, fat: 15, sugar: 30, fiber: 1 },
  'bread': { defaultCals: 250, carbs: 47, protein: 8, fat: 3, sugar: 5, fiber: 2 },
  'dairy': { defaultCals: 200, carbs: 5, protein: 10, fat: 15, sugar: 5, fiber: 0 },
  'fast food': { defaultCals: 350, carbs: 35, protein: 15, fat: 18, sugar: 8, fiber: 2 },
  'salad': { defaultCals: 120, carbs: 10, protein: 5, fat: 8, sugar: 3, fiber: 3 },
  'soup': { defaultCals: 120, carbs: 15, protein: 5, fat: 4, sugar: 2, fiber: 2 },
  'breakfast': { defaultCals: 300, carbs: 35, protein: 12, fat: 15, sugar: 10, fiber: 2 },
  'seafood': { defaultCals: 180, carbs: 5, protein: 20, fat: 10, sugar: 0, fiber: 0 },
  'pasta': { defaultCals: 320, carbs: 60, protein: 12, fat: 5, sugar: 2, fiber: 2 },
  'rice': { defaultCals: 200, carbs: 44, protein: 4, fat: 0.5, sugar: 0, fiber: 0.5 },
  'asian': { defaultCals: 400, carbs: 60, protein: 15, fat: 12, sugar: 5, fiber: 3 },
  'mexican': { defaultCals: 420, carbs: 55, protein: 16, fat: 18, sugar: 3, fiber: 7 }
};

// Find the best matching food from our database based on MobileNet classification
const findMatchingFood = (className) => {
  // Convert to lowercase for case-insensitive matching
  const lowerClassName = className.toLowerCase();
  
  // Check direct matches first
  for (const [key, food] of Object.entries(foodMappings)) {
    if (lowerClassName.includes(key)) {
      return { ...food, matchedTerm: key };
    }
  }
  
  // Check for generic food categories if no direct match
  for (const [category, values] of Object.entries(genericFoodCategories)) {
    if (lowerClassName.includes(category)) {
      return {
        name: className,
        category,
        calories: values.defaultCals,
        carbs: values.carbs,
        protein: values.protein,
        fat: values.fat,
        sugar: values.sugar,
        fiber: values.fiber,
        isGeneric: true
      };
    }
  }
  
  // If no match found, return null
  return null;
};

// Use ensemble method with top predictions for more accurate classification
export const findBestFoodMatch = (predictions) => {
  // Try direct match with top prediction first
  const topMatch = findMatchingFood(predictions[0].className);
  if (topMatch && !topMatch.isGeneric) {
    return topMatch;
  }
  
  // If no good match with top prediction, try the next few
  for (let i = 1; i < Math.min(predictions.length, 3); i++) {
    const nextMatch = findMatchingFood(predictions[i].className);
    if (nextMatch && !nextMatch.isGeneric) {
      return nextMatch;
    }
  }
  
  // If still no good matches, return the top generic match or the first match
  return topMatch || findMatchingFood(predictions[0].className) || {
    name: predictions[0].className,
    category: 'unknown',
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
    sugar: 0,
    fiber: 0
  };
};

// Convert TensorFlow predictions to our app's food format
export const convertPredictionToFood = (prediction) => {
  // Extract food name and confidence from prediction
  const { className, probability } = prediction;
  
  // Format the confidence as a percentage
  const confidencePercentage = Math.round(probability * 100);
  
  // Try to find a matching food in our database
  const matchedFood = findMatchingFood(className);
  
  if (matchedFood) {
    return {
      id: Date.now(), // Generate a unique ID
      name: matchedFood.name,
      confidence: confidencePercentage,
      calories: matchedFood.calories,
      carbs: matchedFood.carbs,
      protein: matchedFood.protein,
      fat: matchedFood.fat,
      sugar: matchedFood.sugar,
      fiber: matchedFood.fiber,
      tags: [matchedFood.category, "ai-detected"],
      timestamp: new Date().toISOString()
    };
  }
  
  // If no match found, return the raw classification
  return {
    id: Date.now(), // Generate a unique ID
    name: className,
    confidence: confidencePercentage,
    calories: 0, // Default values since we don't have nutrition data
    carbs: 0,
    protein: 0,
    fat: 0,
    sugar: 0,
    fiber: 0,
    tags: ["ai-detected", "unknown"],
    timestamp: new Date().toISOString()
  };
};
