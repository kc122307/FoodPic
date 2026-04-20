import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, Scale, Ruler, Calendar, User, Activity, Target } from "lucide-react";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const Onboarding = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [weight, setWeight] = useState<string>(profile?.weight?.toString() || "");
  const [height, setHeight] = useState<string>(profile?.height?.toString() || "");
  const [age, setAge] = useState<string>(profile?.age?.toString() || "");
  const [gender, setGender] = useState<string>(profile?.gender || "male");
  const [activity, setActivity] = useState<"low" | "medium" | "high">(profile?.activity || "medium");
  const [goal, setGoal] = useState<"lose" | "gain" | "maintain">(profile?.goal || "maintain");
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Pre-fill when profile loads after initial render
  useEffect(() => {
    if (profile && !initialized) {
      if (profile.weight) setWeight(profile.weight.toString());
      if (profile.height) setHeight(profile.height.toString());
      if (profile.age) setAge(profile.age.toString());
      if (profile.gender) setGender(profile.gender);
      if (profile.activity) setActivity(profile.activity);
      if (profile.goal) setGoal(profile.goal);
      setInitialized(true);
    }
  }, [profile, initialized]);

  const calculateBMR = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);

    if (isNaN(w) || isNaN(h) || isNaN(a)) return 2000;

    // Mifflin-St Jeor Equation
    let bmr = 10 * w + 6.25 * h - 5 * a;
    bmr = gender === "male" ? bmr + 5 : bmr - 161;

    // Activity multiplier
    const activityMultiplier = {
      low: 1.2,
      medium: 1.55,
      high: 1.75,
    };

    let dailyCalories = bmr * activityMultiplier[activity];

    // Goal adjustment
    if (goal === "lose") dailyCalories -= 500;
    if (goal === "gain") dailyCalories += 500;

    return Math.round(dailyCalories);
  };

  const handleComplete = async () => {
    if (!user) return;

    setIsLoading(true);
    const dailyCalories = calculateBMR();

    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          weight: parseFloat(weight) || null,
          height: parseFloat(height) || null,
          age: parseInt(age) || null,
          gender,
          activity,
          goal,
          daily_calorie_goal: dailyCalories,
          onboarding_completed: true,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success(`Your daily calorie goal is ${dailyCalories} calories!`);
      navigate("/");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return weight.trim() !== "";
      case 2: return height.trim() !== "";
      case 3: return age.trim() !== "";
      case 4: return gender !== "";
      case 5: return activity !== null;
      case 6: return goal !== null;
      default: return false;
    }
  };

  const renderStep = () => {
    const variants = {
      enter: { x: 100, opacity: 0 },
      center: { x: 0, opacity: 1 },
      exit: { x: -100, opacity: 0 },
    };

    switch (step) {
      case 1:
        return (
          <motion.div key="step1" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-6">
            <div className="flex items-center justify-center w-20 h-20 mx-auto bg-emerald-100 rounded-full">
              <Scale className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-center">What's your weight?</h2>
            <p className="text-center text-gray-500">This helps us calculate your daily calorie needs</p>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="70"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="text-center text-2xl h-14"
              />
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div key="step2" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-6">
            <div className="flex items-center justify-center w-20 h-20 mx-auto bg-blue-100 rounded-full">
              <Ruler className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-center">What's your height?</h2>
            <p className="text-center text-gray-500">Height affects your metabolic rate</p>
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                placeholder="170"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="text-center text-2xl h-14"
              />
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div key="step3" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-6">
            <div className="flex items-center justify-center w-20 h-20 mx-auto bg-purple-100 rounded-full">
              <Calendar className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-center">How old are you?</h2>
            <p className="text-center text-gray-500">Age is a factor in metabolism</p>
            <div className="space-y-2">
              <Label htmlFor="age">Age (years)</Label>
              <Input
                id="age"
                type="number"
                placeholder="25"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="text-center text-2xl h-14"
              />
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div key="step4" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-6">
            <div className="flex items-center justify-center w-20 h-20 mx-auto bg-pink-100 rounded-full">
              <User className="w-10 h-10 text-pink-600" />
            </div>
            <h2 className="text-2xl font-bold text-center">What's your gender?</h2>
            <p className="text-center text-gray-500">This affects your calorie calculations</p>
            <RadioGroup value={gender} onValueChange={setGender} className="grid grid-cols-2 gap-4">
              <div>
                <RadioGroupItem value="male" id="male" className="peer sr-only" />
                <Label
                  htmlFor="male"
                  className="flex flex-col items-center justify-center p-6 border-2 rounded-xl cursor-pointer peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-emerald-50 hover:bg-gray-50"
                >
                  <span className="text-3xl mb-2">👨</span>
                  <span className="font-semibold">Male</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="female" id="female" className="peer sr-only" />
                <Label
                  htmlFor="female"
                  className="flex flex-col items-center justify-center p-6 border-2 rounded-xl cursor-pointer peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-emerald-50 hover:bg-gray-50"
                >
                  <span className="text-3xl mb-2">👩</span>
                  <span className="font-semibold">Female</span>
                </Label>
              </div>
            </RadioGroup>
          </motion.div>
        );

      case 5:
        return (
          <motion.div key="step5" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-6">
            <div className="flex items-center justify-center w-20 h-20 mx-auto bg-orange-100 rounded-full">
              <Activity className="w-10 h-10 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-center">Activity Level</h2>
            <p className="text-center text-gray-500">How active are you on a daily basis?</p>
            <RadioGroup value={activity} onValueChange={(v) => setActivity(v as "low" | "medium" | "high")} className="space-y-3">
              {[
                { value: "low", label: "Low", desc: "Little or no exercise", emoji: "🧘" },
                { value: "medium", label: "Medium", desc: "Exercise 3-5 days/week", emoji: "🚶" },
                { value: "high", label: "High", desc: "Heavy exercise daily", emoji: "🏃" },
              ].map((option) => (
                <div key={option.value}>
                  <RadioGroupItem value={option.value} id={option.value} className="peer sr-only" />
                  <Label
                    htmlFor={option.value}
                    className="flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-emerald-50 hover:bg-gray-50"
                  >
                    <span className="text-3xl">{option.emoji}</span>
                    <div>
                      <p className="font-semibold">{option.label}</p>
                      <p className="text-sm text-gray-500">{option.desc}</p>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </motion.div>
        );

      case 6:
        return (
          <motion.div key="step6" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-6">
            <div className="flex items-center justify-center w-20 h-20 mx-auto bg-teal-100 rounded-full">
              <Target className="w-10 h-10 text-teal-600" />
            </div>
            <h2 className="text-2xl font-bold text-center">What's your goal?</h2>
            <p className="text-center text-gray-500">We'll adjust your calories accordingly</p>
            <RadioGroup value={goal} onValueChange={(v) => setGoal(v as "lose" | "gain" | "maintain")} className="space-y-3">
              {[
                { value: "lose", label: "Lose Weight", desc: "-500 calories/day", emoji: "📉" },
                { value: "maintain", label: "Maintain Weight", desc: "Keep current weight", emoji: "⚖️" },
                { value: "gain", label: "Gain Weight", desc: "+500 calories/day", emoji: "📈" },
              ].map((option) => (
                <div key={option.value}>
                  <RadioGroupItem value={option.value} id={option.value} className="peer sr-only" />
                  <Label
                    htmlFor={option.value}
                    className="flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-emerald-50 hover:bg-gray-50"
                  >
                    <span className="text-3xl">{option.emoji}</span>
                    <div>
                      <p className="font-semibold">{option.label}</p>
                      <p className="text-sm text-gray-500">{option.desc}</p>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div
                key={s}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  s <= step ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {s}
              </div>
            ))}
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
              initial={{ width: 0 }}
              animate={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>

          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep((s) => (s - 1) as Step)}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            
            {step < 6 ? (
              <Button
                onClick={() => setStep((s) => (s + 1) as Step)}
                disabled={!canProceed()}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!canProceed() || isLoading}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  <>
                    Complete Setup
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
