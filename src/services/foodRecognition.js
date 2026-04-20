
// This is a simulation service since we don't have a real API connected yet
// In a real app, you would replace this with an actual API call

// Sample database of food items with nutrition data
const foodDatabase = [
  {
    id: 1,
    name: "Apple",
    calories: 95,
    carbs: 25,
    protein: 0.5,
    fat: 0.3,
    sugar: 19,
    fiber: 4,
    tags: ["fruit", "healthy", "snack"],
    image: "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?q=80&w=200&auto=format",
    colorProfile: [255, 0, 0] // Red dominant color for apple
  },
  {
    id: 2,
    name: "Banana",
    calories: 105,
    carbs: 27,
    protein: 1.3,
    fat: 0.4,
    sugar: 14,
    fiber: 3.1,
    tags: ["fruit", "energy", "potassium"],
    image: "https://images.unsplash.com/photo-1528825871115-3581a5387919?q=80&w=200&auto=format",
    colorProfile: [255, 255, 0] // Yellow dominant color for banana
  },
  {
    id: 3,
    name: "Chicken Salad",
    calories: 310,
    carbs: 10,
    protein: 38,
    fat: 14,
    sugar: 2,
    fiber: 3,
    tags: ["protein", "lunch", "healthy"],
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=200&auto=format",
    colorProfile: [50, 200, 50] // Green dominant color for salad
  },
  {
    id: 4,
    name: "Pizza Slice",
    calories: 285,
    carbs: 36,
    protein: 12,
    fat: 10,
    sugar: 3.8,
    fiber: 2.5,
    tags: ["fast food", "carbs", "indulgence"],
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=200&auto=format",
    colorProfile: [200, 150, 100] // Brownish dominant color for pizza
  },
  {
    id: 5,
    name: "Salmon Fillet",
    calories: 412,
    carbs: 0,
    protein: 40,
    fat: 27,
    sugar: 0,
    fiber: 0,
    tags: ["protein", "omega-3", "dinner"],
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=200&auto=format",
    colorProfile: [255, 150, 150] // Pinkish dominant color for salmon
  },
  {
    id: 6,
    name: "Avocado Toast",
    calories: 260,
    carbs: 20,
    protein: 5,
    fat: 18,
    sugar: 1.5,
    fiber: 7,
    tags: ["breakfast", "healthy fats", "trendy"],
    image: "https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?q=80&w=200&auto=format",
    colorProfile: [100, 150, 50] // Greenish dominant color for avocado toast
  },
  {
    id: 7,
    name: "Burger",
    calories: 550,
    carbs: 40,
    protein: 25,
    fat: 30,
    sugar: 5,
    fiber: 2,
    tags: ["fast food", "beef", "sandwich"],
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=200&auto=format",
    colorProfile: [180, 120, 80] // Brownish dominant color for burger
  },
  {
    id: 8,
    name: "Chicken Burger",
    calories: 470,
    carbs: 38,
    protein: 28,
    fat: 22,
    sugar: 4,
    fiber: 2,
    tags: ["fast food", "chicken", "sandwich"],
    image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?q=80&w=200&auto=format",
    colorProfile: [200, 170, 110] // Tan dominant color for chicken burger
  },
  {
    id: 9,
    name: "French Fries",
    calories: 365,
    carbs: 48,
    protein: 4,
    fat: 17,
    sugar: 0.5,
    fiber: 4,
    tags: ["fast food", "side dish", "potato"],
    image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?q=80&w=200&auto=format",
    colorProfile: [230, 180, 50] // Golden dominant color for fries
  },
  {
    id: 10,
    name: "Spaghetti",
    calories: 420,
    carbs: 75,
    protein: 15,
    fat: 8,
    sugar: 3,
    fiber: 4,
    tags: ["pasta", "dinner", "italian"],
    image: "https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?q=80&w=200&auto=format",
    colorProfile: [190, 80, 60] // Reddish dominant color for tomato sauce
  },
  {
    id: 11,
    name: "Ice Cream",
    calories: 330,
    carbs: 35,
    protein: 5,
    fat: 18,
    sugar: 28,
    fiber: 0,
    tags: ["dessert", "sweet", "dairy"],
    image: "https://images.unsplash.com/photo-1629385701021-fcd568a743e5?q=80&w=200&auto=format",
    colorProfile: [240, 240, 220] // Creamy white dominant color
  },
  {
    id: 12,
    name: "Chocolate Cake",
    calories: 480,
    carbs: 62,
    protein: 5,
    fat: 24,
    sugar: 42,
    fiber: 2,
    tags: ["dessert", "sweet", "chocolate"],
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=200&auto=format",
    colorProfile: [100, 50, 30] // Brown dominant color for chocolate
  }
];

// Enhanced recognition system with improved pattern matching
const analyzeImageContent = (fileName, imageFile) => {
  console.log(`Analyzing input: filename=${fileName}, imageFile=${!!imageFile}`);
  
  // If no file provided at all, return unknown food
  if (!fileName && !imageFile) {
    console.log('No input provided, returning Unknown Food');
    return null;
  }
  
  // Check if it's likely a black image from camera in low light
  if (imageFile && isLikelyBlackImage(imageFile)) {
    console.log('Detected likely black or very dark image, returning Unknown Food');
    return null;
  }
  
  // If we have a filename, analyze it
  if (fileName) {
    // Convert filename to lowercase and remove extensions
    const cleanFileName = fileName.toLowerCase().replace(/\.(jpg|jpeg|png|gif|webp)$/, '');
    console.log(`Analyzing filename: ${cleanFileName}`);
    
    // Try to find a direct match in the food database
    for (let i = 0; i < foodDatabase.length; i++) {
      const food = foodDatabase[i];
      const foodNameLower = food.name.toLowerCase();
      
      // Check for exact match
      if (cleanFileName === foodNameLower || 
          cleanFileName.includes(foodNameLower) || 
          foodNameLower.includes(cleanFileName)) {
        console.log(`Found direct match for "${cleanFileName}" - Returning ${food.name}`);
        return i;
      }
      
      // Check for tags
      for (const tag of food.tags) {
        if (cleanFileName.includes(tag)) {
          console.log(`Found tag match "${tag}" for "${cleanFileName}" - Returning ${food.name}`);
          return i;
        }
      }
    }
    
    // BROADER PATTERN MATCHING - Improved food detection
    
    // Check for burger/hamburger related terms
    if (cleanFileName.includes('burger') || 
        cleanFileName.includes('hamburger') || 
        cleanFileName.includes('beef') && (cleanFileName.includes('bun') || cleanFileName.includes('bread'))) {
      
      // Check for chicken burger specifically
      if (cleanFileName.includes('chicken')) {
        console.log(`Found "chicken burger" in filename - Returning CHICKEN BURGER`);
        return 8; // Chicken burger index
      }
      
      console.log(`Found burger-related terms in filename - Returning BURGER`);
      return 7; // Burger index
    }
    
    // Check for apple related terms
    if (cleanFileName.includes('apple')) {
      console.log(`Found "apple" in filename - Returning APPLE`);
      return 0; // Apple index
    }
    
    // Check for banana related terms
    if (cleanFileName.includes('banana')) {
      console.log(`Found "banana" in filename - Returning BANANA`);
      return 1; // Banana index
    }
    
    // Check for chicken salad related terms
    if ((cleanFileName.includes('chicken') && cleanFileName.includes('salad')) || 
        (cleanFileName.includes('salad') && !cleanFileName.includes('fruit'))) {
      console.log(`Found salad terms in filename - Returning CHICKEN SALAD`);
      return 2; // Chicken salad index
    }
    
    // Check for pizza related terms
    if (cleanFileName.includes('pizza')) {
      console.log(`Found "pizza" in filename - Returning PIZZA`);
      return 3; // Pizza index
    }
    
    // Check for salmon related terms
    if (cleanFileName.includes('salmon') || cleanFileName.includes('fish')) {
      console.log(`Found fish terms in filename - Returning SALMON`);
      return 4; // Salmon index
    }
    
    // Check for avocado toast related terms
    if (cleanFileName.includes('avocado') && cleanFileName.includes('toast')) {
      console.log(`Found "avocado toast" in filename - Returning AVOCADO TOAST`);
      return 5; // Avocado toast index
    }
    
    // Check for french fries related terms
    if ((cleanFileName.includes('french') && cleanFileName.includes('fries')) ||
        cleanFileName.includes('fries') || 
        cleanFileName.includes('chips')) {
      console.log(`Found fries terms in filename - Returning FRENCH FRIES`);
      return 9; // French fries index
    }
    
    // Check for pasta related terms
    if (cleanFileName.includes('pasta') || 
        cleanFileName.includes('spaghetti') || 
        cleanFileName.includes('noodle')) {
      console.log(`Found pasta terms in filename - Returning SPAGHETTI`);
      return 10; // Spaghetti index
    }
    
    // Check for ice cream related terms
    if ((cleanFileName.includes('ice') && cleanFileName.includes('cream')) ||
        cleanFileName.includes('icecream')) {
      console.log(`Found ice cream terms in filename - Returning ICE CREAM`);
      return 11; // Ice cream index
    }
    
    // Check for chocolate cake related terms
    if ((cleanFileName.includes('chocolate') && cleanFileName.includes('cake')) ||
        cleanFileName.includes('chocolate') || 
        cleanFileName.includes('cake')) {
      console.log(`Found cake terms in filename - Returning CHOCOLATE CAKE`);
      return 12; // Chocolate cake index
    }
    
    // GENERIC FOOD DETECTION - For less specific filenames
    
    // Check for common food terms
    if (cleanFileName.includes('food') || 
        cleanFileName.includes('meal') || 
        cleanFileName.includes('dish') || 
        cleanFileName.includes('lunch') ||
        cleanFileName.includes('dinner') ||
        cleanFileName.includes('breakfast')) {
      // Default to most likely common food (pizza in this case)
      console.log(`Found generic food terms - Returning PIZZA as default`);
      return 3; // Pizza as a default for generic food terms
    }
  }
  
  // Default behavior - try to make an intelligent guess based on filename patterns
  if (fileName) {
    // Simple fallback: check for number patterns in the filename that might indicate a food
    const match = fileName.match(/\d+/);
    if (match) {
      const num = parseInt(match[0]) % foodDatabase.length;
      console.log(`Using number pattern in filename to guess food: ${foodDatabase[num].name}`);
      return num;
    }
    
    // Final fallback - return a random food item instead of null
    const randomIndex = Math.floor(Math.random() * foodDatabase.length);
    console.log(`No clear matches found - Returning random food: ${foodDatabase[randomIndex].name}`);
    return randomIndex;
  }
  
  // If we couldn't determine the food type, return random food item
  const randomIndex = Math.floor(Math.random() * foodDatabase.length);
  console.log(`No clear pattern matching - Returning random food: ${foodDatabase[randomIndex].name}`);
  return randomIndex;
};

// Helper function to detect if an image is likely black or very dark
// This is a simplified implementation - in a real app, you would analyze the image data
const isLikelyBlackImage = (imageFile) => {
  // In a real implementation, we would analyze the pixel data
  // For this simulation, we'll return false to allow the filename analysis to proceed
  return false;
};

// Simulate analyzing a food image
export const analyzeImage = (imageFile) => {
  return new Promise((resolve) => {
    // Simulate API delay
    setTimeout(() => {
      // Get food index using our improved recognition system
      const fileIndex = analyzeImageContent(imageFile?.name, imageFile);
      
      // Handle case where no food was recognized
      if (fileIndex === null) {
        resolve({
          id: 0,
          name: "Unknown Food",
          calories: 0,
          carbs: 0,
          protein: 0, 
          fat: 0,
          sugar: 0,
          fiber: 0,
          tags: ["unknown"],
          uploadedImage: imageFile ? URL.createObjectURL(imageFile) : null,
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      const recognizedFood = foodDatabase[fileIndex];
      
      console.log(`Recognized food: ${recognizedFood.name} (index ${fileIndex})`);
      
      // Create an object URL for the uploaded image
      const imageUrl = imageFile ? URL.createObjectURL(imageFile) : recognizedFood.image;
      
      resolve({
        ...recognizedFood,
        uploadedImage: imageUrl,
        timestamp: new Date().toISOString()
      });
    }, 1500); // 1.5 seconds delay to simulate API call
  });
};

// Get history from local storage
export const getHistory = () => {
  const history = localStorage.getItem('foodHistory');
  return history ? JSON.parse(history) : [];
};

// Save an item to history (with duplicate detection)
export const saveToHistory = (foodItem) => {
  const history = getHistory();
  const now = Date.now();
  
  const normalizeName = (name) => String(name || "").trim().toLowerCase();

  // Check for duplicate: same (normalized) name saved within last 30 seconds
  const targetName = normalizeName(foodItem?.name);
  const isDuplicate = history.some((item) => {
    const itemTime = new Date(item.timestamp).getTime();
    const timeDiff = now - itemTime;
    return normalizeName(item?.name) === targetName && timeDiff < 30000;
  });
  
  if (isDuplicate) {
    console.log(`Skipping duplicate save for ${foodItem.name} (already saved recently)`);
    return history; // Return existing history without adding duplicate
  }
  
  // Ensure timestamp is set
  const itemToSave = {
    ...foodItem,
    timestamp: foodItem.timestamp || new Date().toISOString()
  };
  
  const updatedHistory = [itemToSave, ...history.slice(0, 19)]; // Keep only the 20 most recent items
  localStorage.setItem('foodHistory', JSON.stringify(updatedHistory));
  console.log(`Saved ${itemToSave.name} to history`);
  return updatedHistory;
};

// Remove a specific item from history
export const removeFromHistory = (itemToRemove) => {
  const history = getHistory();
  const updatedHistory = history.filter(item => 
    !(item.id === itemToRemove.id && item.timestamp === itemToRemove.timestamp)
  );
  localStorage.setItem('foodHistory', JSON.stringify(updatedHistory));
  return updatedHistory;
};

// Clear history
export const clearHistory = () => {
  localStorage.removeItem('foodHistory');
  return [];
};
