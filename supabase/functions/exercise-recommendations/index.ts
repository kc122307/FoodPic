import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile, dailyGoal, todayCalories } = await req.json();

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const goalText = profile?.goal === "lose" ? "weight loss" : profile?.goal === "gain" ? "muscle gain" : "weight maintenance";
    const remaining = Math.max(0, (dailyGoal || 2000) - (todayCalories || 0));

    const systemPrompt = `You are a fitness expert. Return EXACTLY a JSON array of 4 exercise recommendations. No markdown, no explanation, just the JSON array.

Each object must have these fields:
- "name": string (exercise name)
- "duration": string (e.g. "20 min")
- "calories": number (estimated calories burned)
- "intensity": string (one of: "low", "medium", "high")
- "description": string (one short sentence why this exercise is good for the user)

Base recommendations on:
- User goal: ${goalText}
- Daily calorie goal: ${dailyGoal || 2000} cal
- Calories consumed today: ${todayCalories || 0} cal
- Remaining calories: ${remaining} cal
- Weight: ${profile?.weight || "unknown"} kg
- Height: ${profile?.height || "unknown"} cm
- Age: ${profile?.age || "unknown"}
- Activity level: ${profile?.activity || "medium"}

For weight loss: recommend high calorie-burning cardio and HIIT.
For muscle gain: recommend strength training and compound movements.
For maintenance: recommend balanced mix of cardio and strength.
Adjust intensity based on activity level. Make recommendations diverse.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Give me my personalized exercise recommendations as a JSON array." },
        ],
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway Error:", response.status, errorText);
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    // Extract JSON array from response (handle markdown code blocks)
    let exercises;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      exercises = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      console.error("Failed to parse exercises:", content);
      exercises = [];
    }

    return new Response(
      JSON.stringify({ exercises }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in exercise-recommendations:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
