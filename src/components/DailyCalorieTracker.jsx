import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Target, Flame, Edit2, Check, Zap } from "lucide-react";
import MathChallengeDialog from "./MathChallengeDialog";

const DailyCalorieTracker = ({ history, onGoalChange, dailyGoal: propDailyGoal }) => {
  const [dailyGoal, setDailyGoal] = useState(() => {
    const saved = localStorage.getItem("dailyCalorieGoal");
    return saved ? parseInt(saved) : 2000;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [tempGoal, setTempGoal] = useState(dailyGoal);
  const [showMathChallenge, setShowMathChallenge] = useState(false);
  
  useEffect(() => {
    if (propDailyGoal) {
      setDailyGoal(propDailyGoal);
      setTempGoal(propDailyGoal);
    }
  }, [propDailyGoal]);

  const today = new Date().toDateString();
  
  const todayCalories = history
    .filter(item => new Date(item.timestamp).toDateString() === today)
    .reduce((sum, item) => sum + (item.calories || 0), 0);

  const percentage = Math.min((todayCalories / dailyGoal) * 100, 100);
  const remaining = Math.max(dailyGoal - todayCalories, 0);
  const isOverGoal = todayCalories > dailyGoal;

  useEffect(() => {
    localStorage.setItem("dailyCalorieGoal", dailyGoal.toString());
  }, [dailyGoal]);

  const handleEditClick = () => {
    setTempGoal(dailyGoal);
    setShowMathChallenge(true);
  };

  const handleMathChallengeSuccess = () => {
    setIsEditing(true);
  };

  const handleSaveGoal = () => {
    const newGoal = Math.max(100, Math.min(10000, tempGoal));
    setDailyGoal(newGoal);
    setIsEditing(false);
    onGoalChange?.(newGoal);
  };

  return (
    <div className="relative bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-6 mb-6 shadow-lg overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Today's Calories</h3>
            <p className="text-xs text-gray-700">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          </div>
        </div>
        
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={tempGoal}
              onChange={(e) => setTempGoal(parseInt(e.target.value) || 0)}
              className="w-24 h-9 text-sm"
              min={500}
              max={10000}
            />
            <Button size="sm" variant="ghost" onClick={handleSaveGoal} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
              <Check className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleEditClick}
            className="text-gray-700 hover:text-gray-600"
          >
            <Target className="w-4 h-4 mr-1" />
            Goal: {dailyGoal}
            <Edit2 className="w-3 h-3 ml-1" />
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative mb-5">
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
          <motion.div
            className={`h-full rounded-full ${
              isOverGoal 
                ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                : 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-600 drop-shadow-sm">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-2xl font-bold text-emerald-600">{todayCalories}</p>
          <p className="text-xs text-gray-700">consumed</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
          <p className={`text-2xl font-bold ${isOverGoal ? 'text-red-500' : 'text-cyan-600'}`}>
            {isOverGoal ? `+${todayCalories - dailyGoal}` : remaining}
          </p>
          <p className="text-xs text-gray-700">{isOverGoal ? 'over goal' : 'remaining'}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-2xl font-bold text-teal-600">{dailyGoal}</p>
          <p className="text-xs text-gray-700">daily goal</p>
        </div>
      </div>

      {isOverGoal && (
        <motion.div 
          className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Zap className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-red-700 font-medium">
                You've exceeded your daily goal by {todayCalories - dailyGoal} calories.
              </p>
              <p className="text-xs text-red-400 mt-1">
                Consider pausing food intake or adjust your goal above.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <MathChallengeDialog
        open={showMathChallenge}
        onOpenChange={setShowMathChallenge}
        onSuccess={handleMathChallengeSuccess}
      />
    </div>
  );
};

export default DailyCalorieTracker;
