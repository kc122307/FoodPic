import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Save, Scale, Ruler, Calendar, User, Activity, Target } from "lucide-react";

const ProfileEdit = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [activity, setActivity] = useState<"low" | "medium" | "high">("medium");
  const [goal, setGoal] = useState<"lose" | "gain" | "maintain">("maintain");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName((profile as any).display_name || "");
      if (profile.weight) setWeight(profile.weight.toString());
      if (profile.height) setHeight(profile.height.toString());
      if (profile.age) setAge(profile.age.toString());
      if (profile.gender) setGender(profile.gender);
      if (profile.activity) setActivity(profile.activity);
      if (profile.goal) setGoal(profile.goal);
    }
  }, [profile]);

  const calculateBMI = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (isNaN(w) || isNaN(h) || h === 0) return null;
    return (w / ((h / 100) ** 2)).toFixed(1);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: "Underweight", color: "text-blue-500" };
    if (bmi < 25) return { label: "Normal", color: "text-emerald-500" };
    if (bmi < 30) return { label: "Overweight", color: "text-yellow-500" };
    return { label: "Obese", color: "text-red-500" };
  };

  const calculateBMR = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);
    if (isNaN(w) || isNaN(h) || isNaN(a)) return 2000;

    let bmr = 10 * w + 6.25 * h - 5 * a;
    bmr = gender === "male" ? bmr + 5 : bmr - 161;

    const multiplier = { low: 1.2, medium: 1.55, high: 1.75 };
    let dailyCalories = bmr * multiplier[activity];

    if (goal === "lose") dailyCalories -= 500;
    if (goal === "gain") dailyCalories += 500;

    return Math.round(dailyCalories);
  };

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    const dailyCalories = calculateBMR();

    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          display_name: displayName || null,
          weight: parseFloat(weight) || null,
          height: parseFloat(height) || null,
          age: parseInt(age) || null,
          gender,
          activity,
          goal,
          daily_calorie_goal: dailyCalories,
        } as any)
        .eq("user_id", user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success(`Profile updated! Daily goal: ${dailyCalories} cal`);
      navigate("/");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const bmi = calculateBMI();
  const bmiNum = bmi ? parseFloat(bmi) : null;
  const bmiCategory = bmiNum ? getBMICategory(bmiNum) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
        </div>

        {/* BMI Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-6 mb-6"
        >
          <p className="text-sm text-gray-500 mb-1">Your BMI</p>
          {bmiNum ? (
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-gray-900">{bmi}</span>
              <span className={`text-lg font-semibold ${bmiCategory?.color}`}>{bmiCategory?.label}</span>
            </div>
          ) : (
            <p className="text-gray-400">Enter weight & height to see BMI</p>
          )}
          <p className="text-xs text-gray-400 mt-2">Daily calorie goal: {calculateBMR()} cal</p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-5"
        >
          {/* Display Name */}
          <div className="rounded-xl bg-white border border-gray-200 p-4 space-y-2 shadow-sm">
            <Label className="text-gray-600 flex items-center gap-2">
              <User className="w-4 h-4" /> Display Name
            </Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
            <p className="text-xs text-gray-400">Email: {user?.email}</p>
          </div>

          {/* Weight & Height */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-white border border-gray-200 p-4 space-y-2 shadow-sm">
              <Label className="text-gray-600 flex items-center gap-2">
                <Scale className="w-4 h-4" /> Weight (kg)
              </Label>
              <Input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="70"
                className="text-center text-lg"
              />
            </div>
            <div className="rounded-xl bg-white border border-gray-200 p-4 space-y-2 shadow-sm">
              <Label className="text-gray-600 flex items-center gap-2">
                <Ruler className="w-4 h-4" /> Height (cm)
              </Label>
              <Input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="170"
                className="text-center text-lg"
              />
            </div>
          </div>

          {/* Age */}
          <div className="rounded-xl bg-white border border-gray-200 p-4 space-y-2 shadow-sm">
            <Label className="text-gray-600 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Age
            </Label>
            <Input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="25"
              className="text-center text-lg"
            />
          </div>

          {/* Gender */}
          <div className="rounded-xl bg-white border border-gray-200 p-4 space-y-3 shadow-sm">
            <Label className="text-gray-600">Gender</Label>
            <RadioGroup value={gender} onValueChange={setGender} className="grid grid-cols-2 gap-3">
              {[
                { value: "male", label: "Male", emoji: "👨" },
                { value: "female", label: "Female", emoji: "👩" },
              ].map((opt) => (
                <div key={opt.value}>
                  <RadioGroupItem value={opt.value} id={`gender-${opt.value}`} className="peer sr-only" />
                  <Label
                    htmlFor={`gender-${opt.value}`}
                    className="flex items-center justify-center gap-2 p-3 rounded-lg border border-gray-200 cursor-pointer peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-emerald-50 hover:bg-gray-50 text-gray-700"
                  >
                    <span>{opt.emoji}</span> {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Activity Level */}
          <div className="rounded-xl bg-white border border-gray-200 p-4 space-y-3 shadow-sm">
            <Label className="text-gray-600 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Activity Level
            </Label>
            <RadioGroup value={activity} onValueChange={(v) => setActivity(v as any)} className="space-y-2">
              {[
                { value: "low", label: "Low", desc: "Little or no exercise", emoji: "🧘" },
                { value: "medium", label: "Medium", desc: "Exercise 3-5 days/week", emoji: "🚶" },
                { value: "high", label: "High", desc: "Heavy exercise daily", emoji: "🏃" },
              ].map((opt) => (
                <div key={opt.value}>
                  <RadioGroupItem value={opt.value} id={`act-${opt.value}`} className="peer sr-only" />
                  <Label
                    htmlFor={`act-${opt.value}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-emerald-50 hover:bg-gray-50 text-gray-700"
                  >
                    <span className="text-xl">{opt.emoji}</span>
                    <div>
                      <p className="font-medium">{opt.label}</p>
                      <p className="text-xs text-gray-400">{opt.desc}</p>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Goal */}
          <div className="rounded-xl bg-white border border-gray-200 p-4 space-y-3 shadow-sm">
            <Label className="text-gray-600 flex items-center gap-2">
              <Target className="w-4 h-4" /> Goal
            </Label>
            <RadioGroup value={goal} onValueChange={(v) => setGoal(v as any)} className="space-y-2">
              {[
                { value: "lose", label: "Lose Weight", desc: "-500 cal/day", emoji: "📉" },
                { value: "maintain", label: "Maintain", desc: "Keep current weight", emoji: "⚖️" },
                { value: "gain", label: "Gain Weight", desc: "+500 cal/day", emoji: "📈" },
              ].map((opt) => (
                <div key={opt.value}>
                  <RadioGroupItem value={opt.value} id={`goal-${opt.value}`} className="peer sr-only" />
                  <Label
                    htmlFor={`goal-${opt.value}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-emerald-50 hover:bg-gray-50 text-gray-700"
                  >
                    <span className="text-xl">{opt.emoji}</span>
                    <div>
                      <p className="font-medium">{opt.label}</p>
                      <p className="text-xs text-gray-400">{opt.desc}</p>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-md"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </div>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </>
            )}
          </Button>

          <div className="h-8" />
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileEdit;
