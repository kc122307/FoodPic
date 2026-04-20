import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Scale } from "lucide-react";

const BMIDisplay = () => {
  const { profile } = useAuth();

  if (!profile?.weight || !profile?.height) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Scale className="w-4 h-4 text-white" />
          </div>
          <span className="text-gray-800 text-sm font-medium">BMI</span>
        </div>
        <p className="text-gray-700 text-xs">Update profile to see BMI</p>
      </div>
    );
  }

  const heightInMeters = profile.height / 100;
  const bmi = profile.weight / (heightInMeters * heightInMeters);
  const roundedBmi = Math.round(bmi * 10) / 10;

  let category = "";
  let categoryColor = "";
  
  if (bmi < 18.5) {
    category = "Underweight";
    categoryColor = "text-blue-500";
  } else if (bmi < 25) {
    category = "Normal";
    categoryColor = "text-emerald-500";
  } else if (bmi < 30) {
    category = "Overweight";
    categoryColor = "text-amber-500";
  } else {
    category = "Obese";
    categoryColor = "text-red-500";
  }

  const position = Math.min(Math.max((bmi - 15) / 25 * 100, 0), 100);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
          <Scale className="w-4 h-4 text-white" />
        </div>
        <span className="text-gray-800 text-sm font-medium">BMI</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{roundedBmi}</p>
      <p className={`text-xs ${categoryColor} mb-3`}>{category}</p>
      
      <div className="relative h-2 rounded-full overflow-hidden bg-gradient-to-r from-blue-400 via-emerald-400 via-50% via-orange-400 to-red-400">
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-gray-700"
          initial={{ left: "0%" }}
          animate={{ left: `${position}%` }}
          transition={{ type: "spring", stiffness: 100 }}
          style={{ marginLeft: "-6px" }}
        />
      </div>
    </div>
  );
};

export default BMIDisplay;
