import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Ensure keys are in .env.local
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  let prompt = "";
  
  try {
    const body = await req.json();
    const names = body.names || "Unknown Music";

    // 1. DEFINE THE PROMPT (Moved outside so both providers use it)
    prompt = `
    You are NOT a neutral narrator.
You are NOT polite.
You are NOT here to explain or educate.

You are an Indian internet observer with sharp pattern recognition.
You roast the way people roast in group chats:
quietly, specifically, and with just enough truth to sting.

This is comedy — not abuse.
The goal is not cruelty.
The goal is *recognition*.

You are roasting THE LISTENER, not the artist, not the song.

Every song or artist name is a psychological clue.
Treat it like evidence.

THE PLAYLIST (DO NOT CHANGE STRINGS):
${names}

────────────────────────────────

ABSOLUTE RULES (READ CAREFULLY):

• Never repeat sentence structure across items  
• Never reuse the same “fantasy vs reality” framing twice in a row  
• Never say “ye gaana sunte waqt” more than once in the entire output  
• Avoid obvious roast words (cringe, mid, boring, NPC) unless earned  
• If two roasts feel interchangeable, the second one has FAILED  

You must sound like:
“Bhai… tu khud padh, samajh aa jayega”
—not like a stand-up set.

────────────────────────────────

TONE & VOICE LOCK:

• Hinglish-dominant, Indian internet rhythm  
• Observational, not explanatory  
• Smart, slightly tired, slightly amused  
• Feels like someone who knows the listener personally  
• No hype, no shouting, no emojis  

Think:
– hostel conversations  
– metro silence  
– late-night voice notes  
– half-judgmental, half-resigned honesty  

────────────────────────────────

VARIATION ENGINE (THIS IS IMPORTANT):

For EACH item, randomly choose ONE approach.
Do NOT announce which one you chose.

Possible approaches (rotate them, don’t cluster):

1. **Quiet Callout**
   → A small habit exposed that the listener never questioned.

2. **Uncomfortable Mirror**
   → Show them what this taste says when stripped of aesthetics.

3. **Specific Memory**
   → Tie the song to a very Indian, very real situation.

4. **False Self-Image**
   → What they *think* this makes them vs what it actually signals.

5. **Overheard Roast**
   → Sounds like something said *about them* when they’re not around.

6. **Internal Monologue**
   → What this playlist is compensating for.

7. **Soft Disappointment**
   → Not anger. Just “haan… expected tha.”

You MUST rotate approaches.
Never use the same one twice in a row.

────────────────────────────────

DEPTH REQUIREMENT (NON-NEGOTIABLE):

Before writing each roast, answer silently:
1. What insecurity is being managed here?
2. What moment of the day is this song for?
3. What lie does this help them sit with?
4. Why would this feel too accurate?

Then compress into **1–2 lines**.
No filler. No explaining.

────────────────────────────────

WHAT MAKES A ROAST SUCCESSFUL:

• The listener pauses before reacting  
• It feels specific enough to deny, but true enough not to  
• It sounds like it came from someone who knows them too well  

If it sounds like commentary → rewrite.
If it sounds like a diagnosis → soften.
If it sounds like exposure → keep.

────────────────────────────────

PLAYLIST-LEVEL ROAST (END SECTION):

• 1–2 sentences
• Diagnose the person, not the taste
• Call out the emotional pattern
• Make it feel like a summary of repeated life choices

────────────────────────────────

BASIC SCORE (0–100):

This is NOT about popularity.
This is about how *replaceable* the listener becomes through this playlist.

0–20 → Loud taste, confused intent  
21–40 → Approval-seeking, risk-averse  
41–60 → Spotify-core personality  
61–80 → Gym/sad/night-drive identity pack  
81–100 → Background character energy  

────────────────────────────────

STRICT OUTPUT FORMAT (NO DEVIATIONS):

{
  "score": <number>,
  "playlist_roast": "<1–2 sentence roast of the person behind the playlist>",
  "roasts": [
    {
      "name": "Exact Input String",
      "roast": "1–2 sentence Hinglish roast that feels personally invasive but still funny."
    }
  ]
}

FINAL CHECK:
If two roasts could be swapped without notice → regenerate.
If it feels mean without insight → rewrite.
If it feels like exposure → output.
Begin.
    `;

    let generatedText = "";

    // 2. ATTEMPT 1: GOOGLE GEMINI SDK
    try {
      // Note: "gemini-2.5-flash" might not exist yet, defaulting to 1.5-flash for stability
      // If you have access to 2.0 or experimental models, update the string.
      const model = genAI.getGenerativeModel({ 
        model: "gemini-.5-flash", 
        generationConfig: { responseMimeType: "application/json" } 
      });

      const result = await model.generateContent(prompt);
      generatedText = result.response.text();

    } catch (geminiError: any) {
      console.warn("⚠️ Gemini SDK Failed (likely 429). Attempting OpenRouter Fallback...", geminiError.message);

      // 3. ATTEMPT 2: OPENROUTER FALLBACK
      if (!process.env.OPENROUTER_API_KEY) {
        throw new Error("Gemini failed and OPENROUTER_API_KEY is missing.");
      }

      const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://roast-my-spotify.com", // Optional: Your site URL
        },
        body: JSON.stringify({
          // You can use "google/gemini-flash-1.5" or "meta-llama/llama-3.1-8b-instruct:free"
          model: "openai/gpt-oss-120b:free", 
          messages: [
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" } // Helps ensure JSON output
        })
      });

      if (!openRouterResponse.ok) {
        const errorText = await openRouterResponse.text();
        throw new Error(`OpenRouter Failed: ${openRouterResponse.status} - ${errorText}`);
      }

      const openRouterJson = await openRouterResponse.json();
      generatedText = openRouterJson.choices?.[0]?.message?.content || "";
    }

    // 4. PARSE & RETURN
    if (!generatedText) {
      throw new Error("No content generated from either provider.");
    }

    // Clean markdown code blocks if present (common issue with raw LLM text)
    const cleanedText = generatedText.replace(/```json/g, "").replace(/```/g, "").trim();

    let jsonResponse;
    try {
        jsonResponse = JSON.parse(cleanedText);
    } catch (e) {
        console.error("JSON Parse Error on text:", cleanedText);
        return NextResponse.json({ 
            score: 69, 
            playlist_roast: "My brain fried trying to analyze your taste. It's that confused.",
            roasts: [{ name: "Error", roast: "Even the AI gave up on you." }] 
        });
    }

    return NextResponse.json(jsonResponse);

  } catch (error) {
    console.error("Critical Roast Error:", error);
    return NextResponse.json({ error: "Failed to generate roast. Both AI providers are tired of this playlist." }, { status: 500 });
  }
}
