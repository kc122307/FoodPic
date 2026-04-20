import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dumbbell, Heart, Flame, Timer, ChevronRight, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AIExercise {
  name: string;
  duration: string;
  calories: number;
  intensity: "low" | "medium" | "high";
  description: string;
}

interface ExerciseRecommendationsProps {
  dailyGoal: number;
  todayCalories: number;
}

const iconMap: Record<string, JSX.Element> = {
  high: <Flame className="w-4 h-4" />,
  medium: <Dumbbell className="w-4 h-4" />,
  low: <Heart className="w-4 h-4" />,
};

const colorMap: Record<string, string> = {
  high: "from-orange-500 to-red-500",
  medium: "from-indigo-500 to-purple-500",
  low: "from-emerald-500 to-teal-500",
};

const ExerciseRecommendations = ({ dailyGoal, todayCalories }: ExerciseRecommendationsProps) => {
  const { profile } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [exercises, setExercises] = useState<AIExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const lastFetchKey = useRef("");

  const fetchExercises = useCallback(async () => {
    const fetchKey = `${dailyGoal}-${todayCalories}-${profile?.goal}-${profile?.activity}`;
    if (fetchKey === lastFetchKey.current && hasFetched) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("exercise-recommendations", {
        body: {
          profile: {
            weight: profile?.weight,
            height: profile?.height,
            age: profile?.age,
            activity: profile?.activity,
            goal: profile?.goal,
          },
          dailyGoal,
          todayCalories,
        },
      });

      if (error) throw error;

      if (data?.exercises?.length > 0) {
        setExercises(data.exercises);
        lastFetchKey.current = fetchKey;
        setHasFetched(true);
      }
    } catch (err) {
      console.error("Failed to fetch exercises:", err);
      if (!hasFetched) {
        setExercises([
          { name: "Brisk Walk", duration: "30 min", calories: 150, intensity: "low", description: "Great for general fitness." },
          { name: "HIIT Workout", duration: "20 min", calories: 250, intensity: "high", description: "Burns calories fast." },
          { name: "Yoga Flow", duration: "25 min", calories: 100, intensity: "low", description: "Improves flexibility." },
          { name: "Weight Training", duration: "35 min", calories: 200, intensity: "medium", description: "Builds strength." },
        ]);
        setHasFetched(true);
      }
    } finally {
      setLoading(false);
    }
  }, [dailyGoal, todayCalories, profile?.goal, profile?.activity, profile?.weight, profile?.height, profile?.age, hasFetched]);

  useEffect(() => {
    if (profile) {
      const timer = setTimeout(() => fetchExercises(), 500);
      return () => clearTimeout(timer);
    }
  }, [dailyGoal, profile?.goal, fetchExercises]);

  const handleRefresh = () => {
    lastFetchKey.current = "";
    fetchExercises();
    toast.success("Refreshing recommendations...");
  };

  const goalText = profile?.goal === "lose" ? "Weight Loss" : profile?.goal === "gain" ? "Muscle Gain" : "Maintenance";

  return (
    <div
      ref={containerRef}
      className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm overflow-hidden relative"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">AI Exercise Recommendations</h3>
            <p className="text-xs text-gray-700">Personalized for {goalText} • {dailyGoal} cal goal</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRefresh}
          disabled={loading}
          className="text-gray-700 hover:text-gray-600"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>

      {loading && exercises.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-sm text-gray-700">AI is crafting your workout plan...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exercises.map((exercise, index) => (
            <motion.div
              key={`${exercise.name}-${index}`}
              className="group flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 hover:border-gray-200 transition-all cursor-pointer"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-gradient-to-br ${colorMap[exercise.intensity] || colorMap.medium} rounded-lg text-white`}>
                  {iconMap[exercise.intensity] || iconMap.medium}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{exercise.name}</p>
                  <p className="text-xs text-gray-700 mt-0.5">{exercise.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-700 mt-1">
                    <Timer className="w-3 h-3" />
                    {exercise.duration}
                    <span className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-800 text-[10px] uppercase">
                      {exercise.intensity}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600">~{exercise.calories}</p>
                  <p className="text-xs text-gray-700">cal burn</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-800 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {loading && exercises.length > 0 && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-2xl flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-gray-800 animate-spin" />
        </div>
      )}
    </div>
  );
};

export default ExerciseRecommendations;
