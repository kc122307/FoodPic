import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import bgBlobs from "@/assets/bg-blobs.png";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { detectFoodWithAI, processAIDetectionResult } from "@/services/aiDetectionService";
import { saveUserCorrection } from "@/services/userCorrectionsService";
import { toast } from "sonner";
import { Check, X, Video, Camera, History, Sparkles, Zap, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFoodHistory } from "@/hooks/useFoodHistory";
import { supabase } from "@/integrations/supabase/client";

import Header from "@/components/Header";
import ImageUpload from "@/components/ImageUpload";
import FoodCard from "@/components/FoodCard";
import HistoryItem from "@/components/HistoryItem";
import ManualCorrectionForm from "@/components/ManualCorrectionForm";
import LiveCameraDetection from "@/components/LiveCameraDetection";
import DailyCalorieTracker from "@/components/DailyCalorieTracker";
import PortionControl from "@/components/PortionControl";
import AICoach from "@/components/AICoach";
import ExerciseRecommendations from "@/components/ExerciseRecommendations";
import BMIDisplay from "@/components/BMIDisplay";

const Index = () => {
  const [activeTab, setActiveTab] = useState("analyze");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedFood, setAnalyzedFood] = useState(null);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [askForConfirmation, setAskForConfirmation] = useState(false);
  const [showLiveCamera, setShowLiveCamera] = useState(false);
  const [adjustedFood, setAdjustedFood] = useState(null);

  const { profile, refreshProfile } = useAuth();
  const { history, saveToHistory, removeFromHistory, clearHistory, loading: historyLoading } = useFoodHistory();

  const containerRef = useRef(null);
  const heroRef = useRef(null);

  const lastLiveSaveRef = useRef({ key: null, ts: 0 });

  const [dailyGoalState, setDailyGoalState] = useState(() => {
    const saved = localStorage.getItem("dailyCalorieGoal");
    return saved ? parseInt(saved) : (profile?.daily_calorie_goal || 2000);
  });

  useEffect(() => {
    if (profile?.daily_calorie_goal) {
      const saved = localStorage.getItem("dailyCalorieGoal");
      if (!saved) {
        setDailyGoalState(profile.daily_calorie_goal);
        localStorage.setItem("dailyCalorieGoal", profile.daily_calorie_goal.toString());
      }
    }
  }, [profile?.daily_calorie_goal]);

  const getDailyGoal = () => dailyGoalState;

  const getTodayCalories = (hist) => {
    const today = new Date().toDateString();
    return (hist || [])
      .filter((item) => new Date(item.timestamp || item.detected_at).toDateString() === today)
      .reduce((sum, item) => sum + (item.calories || 0), 0);
  };

  const getRemainingCalories = (hist) => {
    const dailyGoal = getDailyGoal();
    const todayCalories = getTodayCalories(hist || history);
    return Math.max(0, dailyGoal - todayCalories);
  };

  const checkCalorieWarning = (caloriesToAdd, hist) => {
    const remaining = getRemainingCalories(hist);
    if (caloriesToAdd > remaining) {
      return {
        exceeded: true,
        message: `⚠️ This meal contains ${caloriesToAdd} calories, which exceeds your remaining daily calories (${remaining}). Please stop eating or update today's calorie goal.`
      };
    }
    return { exceeded: false, message: null };
  };

  const handleImageCapture = async (file) => {
    if (!file) return;
    
    setIsAnalyzing(true);
    setAnalyzedFood(null);
    setShowCorrectionForm(false);
    setAskForConfirmation(false);
    
    try {
      const imageUrl = URL.createObjectURL(file);
      const aiResult = await detectFoodWithAI(file);
      
      if (!aiResult || !aiResult.foods || aiResult.foods.length === 0) {
        throw new Error("Could not recognize any food in the image");
      }
      
      const result = processAIDetectionResult(aiResult, imageUrl);
      setAnalyzedFood(result);
      setAskForConfirmation(true);
      
      toast.success(`Identified as ${result.name} (${Math.round(result.confidence * 100)}% confidence)`);
    } catch (error) {
      console.error("Error analyzing image:", error);
      toast.error(error.message || "Could not analyze the image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLiveFoodDetected = async (detectionData) => {
    const liveKey = (detectionData?.foods || [])
      .map((f) => String(f?.name || "").trim().toLowerCase())
      .filter(Boolean)
      .sort()
      .join("|");

    const now = Date.now();
    if (
      liveKey &&
      lastLiveSaveRef.current.key === liveKey &&
      now - lastLiveSaveRef.current.ts < 3000
    ) {
      return;
    }
    lastLiveSaveRef.current = { key: liveKey, ts: now };

    const result = processAIDetectionResult(
      { foods: detectionData.foods },
      detectionData.uploadedImage
    );

    const warning = checkCalorieWarning(result.calories, history);
    
    await saveToHistory({
      name: result.name,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
      fiber: result.fiber,
      portionSize: result.portionSize,
      uploadedImage: result.uploadedImage,
    });

    if (warning.exceeded) {
      toast.warning(warning.message, { duration: 5000 });
    } else {
      toast.success(
        `Saved: ${result.name} (${result.calories} cal) - ${getRemainingCalories(history)} cal remaining`
      );
    }

    setAnalyzedFood(result);
    setAdjustedFood(null);
    setAskForConfirmation(false);
    setShowCorrectionForm(false);
  };

  const handleHistoryClear = async () => {
    await clearHistory();
    toast.success("History cleared");
  };

  const handleHistoryItemClick = (item) => {
    setAnalyzedFood(item);
    setActiveTab("analyze");
    setShowCorrectionForm(false);
    setAskForConfirmation(false);
  };
  
  const handleHistoryItemDelete = async (item) => {
    await removeFromHistory(item.id);
    toast.success(`Removed ${item.name || item.food_name} from history`);
  };
  
  const handleConfirmCorrect = async () => {
    setAskForConfirmation(false);

    const foodToSave = adjustedFood || analyzedFood;
    const warning = checkCalorieWarning(foodToSave?.calories || 0, history);

    await saveToHistory({
      name: foodToSave.name,
      calories: foodToSave.calories,
      protein: foodToSave.protein,
      carbs: foodToSave.carbs,
      fat: foodToSave.fat,
      fiber: foodToSave.fiber,
      portionSize: foodToSave.portionSize,
      uploadedImage: foodToSave.uploadedImage,
    });

    setAdjustedFood(null);

    if (warning.exceeded) {
      toast.warning(warning.message, { duration: 5000 });
    } else {
      toast.success(`Saved: ${foodToSave.name} - ${getRemainingCalories(history)} cal remaining`);
    }
  };

  const handlePortionChange = (adjusted) => {
    setAdjustedFood(adjusted);
  };
  
  const handleConfirmIncorrect = () => {
    setAskForConfirmation(false);
    setShowCorrectionForm(true);
  };
  
  const handleCorrectClick = () => {
    setShowCorrectionForm(true);
  };
  
  const handleFoodCorrected = async (correctedFood) => {
    if (analyzedFood && correctedFood) {
      saveUserCorrection(analyzedFood.name, correctedFood.name);
    }

    setAnalyzedFood(correctedFood);
    const warning = checkCalorieWarning(correctedFood?.calories || 0, history);

    await saveToHistory({
      name: correctedFood.name,
      calories: correctedFood.calories,
      protein: correctedFood.protein,
      carbs: correctedFood.carbs,
      fat: correctedFood.fat,
      fiber: correctedFood.fiber,
      portionSize: correctedFood.portionSize,
      uploadedImage: correctedFood.uploadedImage,
    });

    setShowCorrectionForm(false);

    if (warning.exceeded) {
      toast.warning(warning.message, { duration: 5000 });
    } else {
      toast.success(`Saved: ${correctedFood.name} - ${getRemainingCalories(history)} cal remaining`);
    }
  };

  const todayCalories = getTodayCalories(history);
  const dailyGoal = getDailyGoal();
  const todayFoods = history
    .filter((item) => new Date(item.timestamp || item.detected_at).toDateString() === new Date().toDateString())
    .map((item) => ({ name: item.name || item.food_name, calories: item.calories }));

  return (
    <div 
      ref={containerRef}
      className="min-h-screen pb-24 relative"
    >
      {/* Background image for glassmorphism */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${bgBlobs})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <div className="fixed inset-0 z-0 bg-gray-900/30 backdrop-blur-sm" />
      <Header />
      
      <main className="container px-4 max-w-xl mx-auto relative z-10">
        <div ref={heroRef}>
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="mb-6"
          >
             <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-2.5 mb-6 shadow-sm overflow-visible">
              <TabsList className="grid h-auto w-full grid-cols-2 items-stretch bg-transparent gap-2">
                <TabsTrigger 
                  value="analyze"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-800 rounded-xl py-3.5 font-semibold transition-all duration-300 hover:bg-gray-100/60"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Analyze Food
                </TabsTrigger>
                <TabsTrigger 
                  value="history"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-800 rounded-xl py-3.5 font-semibold transition-all duration-300 hover:bg-gray-100/60"
                >
                  <History className="w-4 h-4 mr-2" />
                  History
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="analyze" className="pt-2">
              <DailyCalorieTracker history={history} onGoalChange={async (goal) => {
                setDailyGoalState(goal);
                localStorage.setItem("dailyCalorieGoal", goal.toString());
                
                if (profile?.user_id) {
                  try {
                    const { error } = await supabase
                      .from("user_profiles")
                      .update({ daily_calorie_goal: goal })
                      .eq("user_id", profile.user_id);
                    
                    if (error) throw error;
                    await refreshProfile();
                  } catch (err) {
                    console.error("Failed to sync calorie goal:", err);
                  }
                }
              }} />

              <div className="grid grid-cols-2 gap-4 mb-6">
                <BMIDisplay />
                
                <motion.div
                  className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-4 shadow-sm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-800 text-sm font-medium">Today</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{todayFoods.length}</p>
                  <p className="text-gray-700 text-xs">meals logged</p>
                </motion.div>
              </div>

              <ExerciseRecommendations dailyGoal={dailyGoalState} todayCalories={todayCalories} />
              
              <motion.div 
                className="mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  onClick={() => setShowLiveCamera(true)}
                  className="w-full py-7 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] group"
                  size="lg"
                >
                  <Video className="w-6 h-6 mr-3" />
                  <span className="relative z-10">Live Camera Detection</span>
                  <Sparkles className="w-5 h-5 ml-2 animate-pulse" />
                </Button>
                <p className="text-center text-sm text-gray-700 mt-3">
                  Point your camera at food for real-time AI detection
                </p>
              </motion.div>
              
              <div className="flex items-center gap-3 mt-8 mb-8">
                <div className="flex-1 border-t border-gray-300" />
                <span className="px-4 text-sm text-gray-700 bg-white/80 rounded-full py-1.5 whitespace-nowrap">or upload image</span>
                <div className="flex-1 border-t border-gray-300" />
              </div>
              
              <motion.div 
                className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-sm mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <ImageUpload 
                  onImageCaptured={handleImageCapture} 
                  isLoading={isAnalyzing} 
                />
              </motion.div>
              
              {analyzedFood && askForConfirmation && (
                <motion.div 
                  className="mt-6"
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                >
                  {!analyzedFood.isMultipleItems && (
                    <PortionControl 
                      food={{
                        ...analyzedFood,
                        originalCalories: analyzedFood.originalCalories || analyzedFood.calories,
                        originalProtein: analyzedFood.originalProtein || analyzedFood.protein,
                        originalCarbs: analyzedFood.originalCarbs || analyzedFood.carbs,
                        originalFat: analyzedFood.originalFat || analyzedFood.fat,
                      }}
                      onPortionChange={handlePortionChange}
                    />
                  )}
                  
                  <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-sm">
                    {analyzedFood.isMultipleItems && analyzedFood.items ? (
                      <>
                        <p className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
                          <Zap className="w-5 h-5 text-amber-500" />
                          Detected {analyzedFood.items.length} items:
                        </p>
                        <div className="space-y-2 mb-4">
                          {analyzedFood.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                              <span className="text-gray-600">{index + 1}. {item.name}</span>
                              <span className="font-medium text-emerald-600">{item.calories} cal</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200">
                          <span className="font-bold text-gray-900">Total</span>
                          <span className="font-bold text-emerald-600 text-xl">{adjustedFood?.calories || analyzedFood.calories} cal</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-4 text-center">Is this correct?</p>
                      </>
                    ) : (
                      <p className="text-lg font-semibold text-gray-900 text-center mb-4">
                        Is this <span className="text-emerald-600">{analyzedFood.name}</span>? 
                        <span className="text-gray-800 ml-2">({adjustedFood?.calories || analyzedFood.calories} cal)</span>
                      </p>
                    )}
                    <div className="flex justify-center gap-4 mt-4">
                      <Button 
                        onClick={handleConfirmCorrect}
                        className="rounded-xl flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-md px-6 py-5"
                      >
                        <Check size={18} />
                        Yes, correct
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleConfirmIncorrect}
                        className="rounded-xl flex items-center gap-2 px-6 py-5"
                      >
                        <X size={18} />
                        No, incorrect
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {analyzedFood && !askForConfirmation && !showCorrectionForm && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <FoodCard food={analyzedFood} />
                  <div className="mt-4 text-center">
                    <Button 
                      variant="outline" 
                      onClick={handleCorrectClick}
                      className="rounded-xl"
                    >
                      Not {analyzedFood.name}? Correct It
                    </Button>
                  </div>
                </motion.div>
              )}
              
              {showCorrectionForm && analyzedFood && (
                <ManualCorrectionForm 
                  food={analyzedFood}
                  onFoodCorrected={handleFoodCorrected}
                  onCancel={() => setShowCorrectionForm(false)}
                />
              )}
            </TabsContent>
            
            <TabsContent value="history" className="h-full pt-2">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                {historyLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : history.length > 0 ? (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-gray-900">Your Food History</h2>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleHistoryClear}
                        className="text-gray-700 hover:text-gray-600"
                      >
                        Clear All
                      </Button>
                    </div>
                    
                    <ScrollArea className="h-[70vh] pr-4">
                      <motion.div className="space-y-3">
                        {history.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl overflow-hidden shadow-sm">
                              <HistoryItem 
                                item={{
                                  ...item,
                                  name: item.name || item.food_name,
                                  timestamp: item.timestamp || item.detected_at,
                                  uploadedImage: item.uploadedImage || item.image,
                                }} 
                                onClick={handleHistoryItemClick}
                                onDelete={handleHistoryItemDelete}
                              />
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </ScrollArea>
                  </>
                ) : (
                  <motion.div 
                    className="flex flex-col items-center justify-center h-[60vh] text-center bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-8 shadow-sm"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                      <History className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No History Yet</h3>
                    <p className="text-gray-700 mb-6 max-w-xs">
                      Take photos of your food to keep track of your eating habits
                    </p>
                    <Button 
                      onClick={() => setActiveTab('analyze')}
                      className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-md"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Analyze Food
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <LiveCameraDetection
        isActive={showLiveCamera}
        onFoodDetected={handleLiveFoodDetected}
        onClose={() => setShowLiveCamera(false)}
      />

      <AICoach 
        todayCalories={todayCalories}
        dailyGoal={dailyGoal}
        todayFoods={todayFoods}
      />
    </div>
  );
};

export default Index;
