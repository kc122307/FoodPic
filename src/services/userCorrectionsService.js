
// Storage key for user corrections
const CORRECTIONS_STORAGE_KEY = 'food-recognizer-corrections';

// Get stored corrections
export const getUserCorrections = () => {
  try {
    const correctionsData = localStorage.getItem(CORRECTIONS_STORAGE_KEY);
    return correctionsData ? JSON.parse(correctionsData) : [];
  } catch (error) {
    console.error('Error retrieving user corrections:', error);
    return [];
  }
};

// Save a new correction
export const saveUserCorrection = (originalName, correctedName) => {
  try {
    const corrections = getUserCorrections();
    
    // Check if this correction already exists
    const existingIndex = corrections.findIndex(
      correction => correction.originalName.toLowerCase() === originalName.toLowerCase()
    );
    
    if (existingIndex >= 0) {
      // Update existing correction
      corrections[existingIndex] = {
        originalName,
        correctedName,
        timestamp: new Date().toISOString(),
        count: (corrections[existingIndex].count || 1) + 1
      };
    } else {
      // Add new correction
      corrections.push({
        originalName,
        correctedName,
        timestamp: new Date().toISOString(),
        count: 1
      });
    }
    
    // Save to localStorage
    localStorage.setItem(CORRECTIONS_STORAGE_KEY, JSON.stringify(corrections));
    return corrections;
  } catch (error) {
    console.error('Error saving user correction:', error);
    return null;
  }
};

// Get suggested correction for a food name
export const getSuggestedCorrection = (foodName) => {
  try {
    const corrections = getUserCorrections();
    const suggestion = corrections.find(
      correction => correction.originalName.toLowerCase() === foodName.toLowerCase()
    );
    
    return suggestion ? suggestion.correctedName : null;
  } catch (error) {
    console.error('Error getting suggestion:', error);
    return null;
  }
};
