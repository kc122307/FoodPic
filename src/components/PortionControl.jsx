import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Minus, Plus, Scale } from "lucide-react";

const PORTION_UNITS = [
  { value: "serving", label: "Serving", multiplier: 1 },
  { value: "g", label: "Grams (g)", multiplier: 0.01 },
  { value: "oz", label: "Ounces (oz)", multiplier: 0.283495 },
  { value: "cup", label: "Cup", multiplier: 2.4 },
  { value: "tbsp", label: "Tablespoon", multiplier: 0.15 },
];

const PortionControl = ({ food, onPortionChange }) => {
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("serving");

  const selectedUnit = PORTION_UNITS.find(u => u.value === unit);
  const multiplier = quantity * (selectedUnit?.multiplier || 1);

  const adjustedFood = {
    ...food,
    calories: Math.round((food.originalCalories || food.calories) * multiplier),
    protein: Math.round(((food.originalProtein || food.protein) * multiplier) * 10) / 10,
    carbs: Math.round(((food.originalCarbs || food.carbs) * multiplier) * 10) / 10,
    fat: Math.round(((food.originalFat || food.fat) * multiplier) * 10) / 10,
    fiber: Math.round(((food.originalFiber || food.fiber || 0) * multiplier) * 10) / 10,
    sugar: Math.round(((food.originalSugar || food.sugar || 0) * multiplier) * 10) / 10,
    portionSize: `${quantity} ${selectedUnit?.label || 'serving'}`,
    portionMultiplier: multiplier,
  };

  const handleQuantityChange = (delta) => {
    const newQty = Math.max(0.25, Math.min(10, quantity + delta));
    setQuantity(newQty);
    onPortionChange?.({ ...adjustedFood, quantity: newQty, unit });
  };

  const handleUnitChange = (newUnit) => {
    setUnit(newUnit);
    const newSelectedUnit = PORTION_UNITS.find(u => u.value === newUnit);
    const newMultiplier = quantity * (newSelectedUnit?.multiplier || 1);
    onPortionChange?.({
      ...food,
      calories: Math.round((food.originalCalories || food.calories) * newMultiplier),
      protein: Math.round(((food.originalProtein || food.protein) * newMultiplier) * 10) / 10,
      carbs: Math.round(((food.originalCarbs || food.carbs) * newMultiplier) * 10) / 10,
      fat: Math.round(((food.originalFat || food.fat) * newMultiplier) * 10) / 10,
      portionSize: `${quantity} ${newSelectedUnit?.label || 'serving'}`,
      portionMultiplier: newMultiplier,
      quantity,
      unit: newUnit,
    });
  };

  return (
    <motion.div
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Scale className="w-4 h-4 text-emerald-600" />
        <span className="text-sm font-medium text-gray-700">Adjust Portion Size</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleQuantityChange(-0.25)}
            disabled={quantity <= 0.25}
            className="h-8 w-8 p-0"
          >
            <Minus className="w-4 h-4" />
          </Button>
          
          <Input
            type="number"
            value={quantity}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0.25;
              setQuantity(Math.max(0.25, Math.min(10, val)));
              onPortionChange?.({ ...adjustedFood, quantity: val, unit });
            }}
            className="w-16 h-8 text-center text-sm"
            step={0.25}
            min={0.25}
            max={10}
          />
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleQuantityChange(0.25)}
            disabled={quantity >= 10}
            className="h-8 w-8 p-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <Select value={unit} onValueChange={handleUnitChange}>
          <SelectTrigger className="w-32 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PORTION_UNITS.map((u) => (
              <SelectItem key={u.value} value={u.value}>
                {u.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-3 p-2 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Adjusted calories:</span>
          <span className="font-bold text-emerald-700">{adjustedFood.calories} cal</span>
        </div>
        <div className="flex gap-4 mt-1 text-xs text-gray-800">
          <span>C: {adjustedFood.carbs}g</span>
          <span>P: {adjustedFood.protein}g</span>
          <span>F: {adjustedFood.fat}g</span>
        </div>
      </div>
    </motion.div>
  );
};

export default PortionControl;
