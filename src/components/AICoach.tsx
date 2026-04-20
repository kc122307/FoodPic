import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Bot, Send, X, Sparkles, Dumbbell, Utensils, TrendingUp } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AICoachProps {
  todayCalories: number;
  dailyGoal: number;
  todayFoods: { name: string; calories: number }[];
}

const AICoach = ({ todayCalories, dailyGoal, todayFoods }: AICoachProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { profile } = useAuth();

  const quickPrompts = [
    { icon: <Utensils className="w-4 h-4" />, text: "What should I eat next?" },
    { icon: <Dumbbell className="w-4 h-4" />, text: "Suggest a workout" },
    { icon: <TrendingUp className="w-4 h-4" />, text: "Am I on track today?" },
  ];

  const buildContext = () => {
    const remaining = Math.max(0, dailyGoal - todayCalories);
    const percentUsed = dailyGoal > 0 ? Math.round((todayCalories / dailyGoal) * 100) : 0;
    const isOverGoal = todayCalories > dailyGoal;
    const goalText = profile?.goal === "lose" ? "weight loss" : profile?.goal === "gain" ? "weight gain" : "weight maintenance";
    
    return `You are a friendly fitness and nutrition coach. Be concise and encouraging. Always reference the user's ACTUAL calorie data when answering.

User Profile:
- Weight: ${profile?.weight || "unknown"} kg
- Height: ${profile?.height || "unknown"} cm
- Age: ${profile?.age || "unknown"}
- Activity Level: ${profile?.activity || "medium"}
- Goal: ${goalText}

TODAY'S CALORIE TRACKING (use these exact numbers when the user asks):
- Daily Calorie Goal: ${dailyGoal} calories
- Calories Consumed So Far: ${todayCalories} calories
- Calories Remaining: ${isOverGoal ? "0 (exceeded by " + (todayCalories - dailyGoal) + " calories)" : remaining + " calories"}
- Progress: ${percentUsed}% of daily goal used
- Status: ${isOverGoal ? "OVER GOAL" : percentUsed > 80 ? "Almost at goal" : percentUsed > 50 ? "On track" : "Plenty of room left"}
- Foods eaten today: ${todayFoods.length > 0 ? todayFoods.map(f => `${f.name} (${f.calories} cal)`).join(", ") : "Nothing yet"}
- Number of meals logged: ${todayFoods.length}

IMPORTANT: When the user asks about their calories, progress, or what they can still eat, always use the exact numbers above. Never make up or estimate calorie values.
FORMATTING RULES:
- Always respond in clear, numbered steps or bullet points
- Use bold (**text**) for key terms, food names, and numbers
- Never write long paragraphs — break everything into short, scannable points
- Use emojis sparingly for visual appeal (🔥, ✅, 💪, 🥗, ⚡)
- Keep each point to one line
- Keep responses short (3-5 bullet points max unless asked for details).`;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-coach", {
        body: {
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          context: buildContext(),
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response || "I'm sorry, I couldn't process that request.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI Coach error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg flex items-center justify-center text-white z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bot className="w-7 h-7" />
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">AI Coach</h3>
                  <p className="text-xs text-white/80">Your fitness assistant</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="w-12 h-12 text-emerald-200 mx-auto mb-4" />
                  <p className="text-gray-800 mb-4">
                    Hi! I'm your AI fitness coach. Ask me anything about nutrition or exercise!
                  </p>
                  <div className="space-y-2">
                    {quickPrompts.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(prompt.text)}
                        className="flex items-center gap-2 w-full p-3 text-left text-sm bg-gray-50 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                      >
                        {prompt.icon}
                        {prompt.text}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl ${
                          msg.role === "user"
                            ? "bg-emerald-500 text-white rounded-br-none"
                            : "bg-gray-100 text-gray-800 rounded-bl-none"
                        }`}
                      >
                        <div className={`text-sm prose prose-sm max-w-none ${msg.role === "user" ? "prose-invert" : ""} [&_ul]:space-y-1 [&_ol]:space-y-1 [&_li]:leading-relaxed [&_p]:my-1`}>
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-none">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(input);
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || !input.trim()}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AICoach;
