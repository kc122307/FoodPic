import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing food detection request...");

    // Use Gemini Pro for better accuracy with complex images
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert food nutritionist and recognition AI. Your job is to accurately identify ALL food items in an image and provide precise nutritional estimates.

CRITICAL INSTRUCTIONS:
1. Identify EVERY SINGLE food item visible in the image - DO NOT MISS ANYTHING
2. Include ALL accompaniments: side dishes, garnishes, dips, sauces, onion slices, lemon wedges, chutneys, raita, pickles, etc.
3. For Indian meals: Always check for raita (yogurt dip), pickles, onion rings/slices, papad, salad, dal
4. For combo meals/plates with multiple items, list EACH item separately (e.g., biryani, raita, onion separately)
5. Be SPECIFIC about the food type (e.g., "Chicken Dum Biryani" not just "Biryani")
6. Estimate portion sizes based on visual cues
7. Provide accurate calorie and macro estimates based on typical serving sizes
8. Count quantities correctly (e.g., 3 onion rings = quantity: 3)

NUTRITIONAL ACCURACY GUIDELINES (per typical serving):
- Chicken Biryani (1 plate): 500-700 cal
- Veg Biryani (1 plate): 400-550 cal
- Raita (1 small bowl): 80-150 cal
- Raw Onion slices (1 slice): 4-6 cal
- Papad (1 piece): 30-50 cal
- Dal (1 bowl): 150-200 cal
- Naan (1 piece): 260-300 cal
- Roti (1 piece): 70-100 cal
- Beef Burger (with bun, no cheese): 250-350 cal
- Cheeseburger: 300-400 cal
- Chicken Burger: 350-450 cal
- Large Fries: 400-500 cal
- Medium Fries: 300-380 cal
- Small Fries: 200-250 cal
- Soda (medium): 150-200 cal
- Apple: 80-100 cal
- Banana: 100-120 cal
- Rice (1 cup cooked): 200-240 cal
- Pizza slice: 250-350 cal
- Salad (no dressing): 50-100 cal
- Grilled Chicken Breast: 165-200 cal
- Pasta (1 cup): 200-250 cal

Return your response as a JSON object with this EXACT structure:
{
  "foods": [
    {
      "name": "Specific Food Name",
      "quantity": 1,
      "servingSize": "1 medium burger (150g)",
      "confidence": 0.95,
      "category": "fast food/fruit/vegetable/meat/dairy/grain/beverage/dessert/etc",
      "calories": number,
      "protein": number in grams,
      "carbs": number in grams,
      "fat": number in grams,
      "fiber": number in grams,
      "sugar": number in grams
    }
  ],
  "totalCalories": total of all items,
  "totalProtein": total protein in grams,
  "totalCarbs": total carbs in grams,
  "totalFat": total fat in grams,
  "description": "Description of the meal/plate including all identified items",
  "mealType": "breakfast/lunch/dinner/snack/beverage"
}

If no food is detected, return:
{
  "foods": [],
  "totalCalories": 0,
  "totalProtein": 0,
  "totalCarbs": 0,
  "totalFat": 0,
  "description": "No food detected in the image",
  "mealType": "unknown"
}

RESPOND WITH VALID JSON ONLY. No markdown, no code blocks, no additional text.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this food image. Identify ALL food items visible and provide detailed nutritional information for each. If there are multiple items (like a combo meal), list each separately and calculate totals."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.2 // Lower temperature for more consistent/accurate results
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("Raw AI response:", content);
    
    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response
    let result;
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      result = JSON.parse(cleanContent.trim());
      
      // Validate and ensure totals are calculated
      if (result.foods && result.foods.length > 0) {
        // Recalculate totals to ensure accuracy
        result.totalCalories = result.foods.reduce(
          (sum: number, f: any) => sum + (f.calories || 0) * (f.quantity || 1),
          0
        );
        result.totalProtein = result.foods.reduce(
          (sum: number, f: any) => sum + (f.protein || 0) * (f.quantity || 1),
          0
        );
        result.totalCarbs = result.foods.reduce(
          (sum: number, f: any) => sum + (f.carbs || 0) * (f.quantity || 1),
          0
        );
        result.totalFat = result.foods.reduce(
          (sum: number, f: any) => sum + (f.fat || 0) * (f.quantity || 1),
          0
        );
        result.totalFiber = result.foods.reduce(
          (sum: number, f: any) => sum + (f.fiber || 0) * (f.quantity || 1),
          0
        );
        result.totalSugar = result.foods.reduce(
          (sum: number, f: any) => sum + (f.sugar || 0) * (f.quantity || 1),
          0
        );
      }

      // If the model returns ONLY a garnish (common failure), run a stricter 2nd pass.
      const firstName = (result.foods?.[0]?.name || "").toLowerCase();
      const looksLikeGarnishOnly =
        (result.foods?.length === 1) &&
        (firstName.includes("mint") ||
          firstName.includes("garnish") ||
          firstName.includes("coriander") ||
          firstName.includes("cilantro") ||
          firstName.includes("parsley"));

      if (looksLikeGarnishOnly) {
        console.log("Garnish-only detection detected; running second-pass reanalysis...", result.foods?.[0]);

        const secondPass = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-pro",
            messages: [
              {
                role: "system",
                content: `You are an expert food recognition AI.

CRITICAL: Never return ONLY a garnish/herb if any main dish is visible. If mint/onion is present, it must be listed ALONGSIDE the main dish (e.g., biryani, curry, rice, etc).

Identify ALL food items visible, including accompaniments (onion slices, raita, chutney, lemon, salad). Be specific about Indian meals.

Return VALID JSON ONLY with this EXACT structure:
{
  "foods": [{"name": string, "quantity": number, "servingSize": string, "confidence": number, "category": string, "calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number, "sugar": number}],
  "totalCalories": number,
  "totalProtein": number,
  "totalCarbs": number,
  "totalFat": number,
  "description": string,
  "mealType": string
}`,
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Re-analyze this image. Your previous answer returned only a garnish. Identify the MAIN DISH and ALL sides (e.g., chicken biryani + onion + mint).",
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: imageBase64.startsWith("data:")
                        ? imageBase64
                        : `data:image/jpeg;base64,${imageBase64}`,
                    },
                  },
                ],
              },
            ],
            max_tokens: 1500,
            temperature: 0.2,
          }),
        });

        if (secondPass.ok) {
          const secondData = await secondPass.json();
          const secondContent = secondData.choices?.[0]?.message?.content;
          if (secondContent) {
            let cleanSecond = secondContent.trim();
            if (cleanSecond.startsWith("```json")) cleanSecond = cleanSecond.slice(7);
            if (cleanSecond.startsWith("```")) cleanSecond = cleanSecond.slice(3);
            if (cleanSecond.endsWith("```")) cleanSecond = cleanSecond.slice(0, -3);

            try {
               const secondResult = JSON.parse(cleanSecond.trim());
               if (secondResult?.foods?.length) {
                 secondResult.totalCalories = secondResult.foods.reduce(
                   (sum: number, f: any) => sum + (f.calories || 0) * (f.quantity || 1),
                   0
                 );
                 secondResult.totalProtein = secondResult.foods.reduce(
                   (sum: number, f: any) => sum + (f.protein || 0) * (f.quantity || 1),
                   0
                 );
                 secondResult.totalCarbs = secondResult.foods.reduce(
                   (sum: number, f: any) => sum + (f.carbs || 0) * (f.quantity || 1),
                   0
                 );
                 secondResult.totalFat = secondResult.foods.reduce(
                   (sum: number, f: any) => sum + (f.fat || 0) * (f.quantity || 1),
                   0
                 );
                 secondResult.totalFiber = secondResult.foods.reduce(
                   (sum: number, f: any) => sum + (f.fiber || 0) * (f.quantity || 1),
                   0
                 );
                 secondResult.totalSugar = secondResult.foods.reduce(
                   (sum: number, f: any) => sum + (f.sugar || 0) * (f.quantity || 1),
                   0
                 );
                 console.log("Second-pass result accepted:", secondResult.foods.map((f: any) => f.name));
                 result = secondResult;
               }
            } catch (e) {
              console.warn("Second-pass JSON parse failed; keeping first result.");
            }
          }
        } else {
          const err = await secondPass.text();
          console.warn("Second-pass request failed:", secondPass.status, err);
        }
      }

      console.log("Parsed result with totals:", result);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content, parseError);
      result = {
        foods: [{
          name: "Food Item",
          quantity: 1,
          confidence: 0.7,
          category: "unknown",
          calories: 200,
          protein: 10,
          carbs: 25,
          fat: 8,
          fiber: 2,
          sugar: 5
        }],
        totalCalories: 200,
        totalProtein: 10,
        totalCarbs: 25,
        totalFat: 8,
        description: "Could not parse detailed response"
      };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in detect-food function:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: message || "Failed to detect food" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
