
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import NutritionFacts from "./NutritionFacts";
import { ChevronDown, ChevronUp } from "lucide-react";

const FoodCard = ({ food }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showItemBreakdown, setShowItemBreakdown] = useState(false);
  
  if (!food) return null;
  
  // Debug output to check the food object being passed
  console.log("FoodCard received food:", food);
  
  const hasMultipleItems = food.isMultipleItems && food.foods && food.foods.length > 1;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="overflow-hidden shadow-lg border-t border-l border-r border-gray-200">
        <CardContent className="p-0">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight mb-1">{food.name}</h2>
                <div className="flex flex-wrap gap-2 mb-2">
                  {food.tags && food.tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-800">
                      {tag}
                    </span>
                  ))}
                </div>
                {food.description && (
                  <p className="text-sm text-muted-foreground mt-1">{food.description}</p>
                )}
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center text-2xl font-bold">
                  <span className="text-sm font-normal text-muted-foreground mr-1">cal</span>
                  {food.calories || 0}
                </div>
                {hasMultipleItems && (
                  <span className="text-xs text-emerald-600 font-medium">Total</span>
                )}
              </div>
            </div>
            
            {/* Multiple items breakdown */}
            {hasMultipleItems && (
              <div className="mt-4">
                <button
                  onClick={() => setShowItemBreakdown(!showItemBreakdown)}
                  className="flex items-center justify-between w-full p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg hover:from-emerald-100 hover:to-teal-100 transition-colors"
                >
                  <span className="text-sm font-medium text-emerald-700">
                    {food.foods.length} items detected
                  </span>
                  {showItemBreakdown ? (
                    <ChevronUp className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-emerald-600" />
                  )}
                </button>
                
                <AnimatePresence>
                  {showItemBreakdown && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 space-y-2">
                        {food.foods.map((item, index) => (
                          <div 
                            key={index}
                            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.name}</p>
                              {item.servingSize && (
                                <p className="text-xs text-muted-foreground">{item.servingSize}</p>
                              )}
                              <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                                <span>C: {item.carbs}g</span>
                                <span>P: {item.protein}g</span>
                                <span>F: {item.fat}g</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-sm">{item.calories} cal</p>
                              {item.quantity > 1 && (
                                <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            
            {/* Show confidence level if available */}
            {food.confidence && (
              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-muted-foreground">Confidence</span>
                  <span className="text-sm font-medium">{Math.round(food.confidence * 100)}%</span>
                </div>
                <Progress value={food.confidence * 100} className="h-2" />
              </div>
            )}
            
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs text-muted-foreground mb-1">Carbs</p>
                <p className="font-semibold">{food.carbs || 0}g</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs text-muted-foreground mb-1">Protein</p>
                <p className="font-semibold">{food.protein || 0}g</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs text-muted-foreground mb-1">Fat</p>
                <p className="font-semibold">{food.fat || 0}g</p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-center">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full rounded-full"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? "Hide Details" : "View Nutrition Facts"}
              </Button>
            </div>
          </div>
          
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <NutritionFacts food={food} />
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FoodCard;
