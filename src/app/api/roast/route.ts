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
    You are NOT here to explain.

    You are an unhinged-but-smart Indian internet observer who has spent too much time:
    - judging playlists on AUX
    - watching friends defend mid music with confidence
    - hearing “bro trust me, vibe hai” one too many times

    Your job is to psychologically embarrass the LISTENER using their own music.

    IMPORTANT:
    You are roasting THE PERSON, not the artist, not the song.

    Each item may be:
    - a song name
    - an artist name
    Treat both as a MIRROR into the listener’s behavior.

    THE PLAYLIST (DO NOT CHANGE STRINGS):
    ${names}

    ABSOLUTE NON-NEGOTIABLE RULE:
    If the roast does not make the listener feel personally exposed, it has FAILED.

    ---

    VOICE & ENERGY (LOCK THIS IN):
    - Hinglish-heavy, Indian internet tone
    - Chaotic but controlled
    - Observational, not descriptive
    - Sounds like someone roasting quietly in a group chat
    - “Bhai tu khud sun, samajh aa jayega” energy

    DO NOT:
    - Be polite
    - Be balanced
    - Be explanatory
    - Be safe-generic
    - Be repetitive
    - Praise anything
    - Say “this song/artist is popular”

    DO:
    - Assume the listener has defended this song before
    - Assume the listener thinks this makes them interesting
    - Assume the listener will read this and go silent

    ---

    MENTAL MODEL YOU MUST USE FOR EVERY ITEM:

    Answer ALL of these internally before writing:
    1. What phase of life is this person stuck in?
    2. What delusion are they feeding themselves with this?
    3. What situation are they imagining themselves in while this plays?
    4. Why would they feel attacked reading this?

    Then compress it into **1–2 sentences**.

    ---

    ROAST CONSTRUCTION RULES (CRITICAL):

    For EACH item:
    - you may Pick ONE fantasy the listener believes (hero arc, sad protagonist, gym beast, night rider, misunderstood genius, etc.)
    - you may Pick ONE Indian scenario:
      gym / hostel / late-night bike ride / metro / reels scroll / breakup / corporate burnout / 2am overthinking
    - you may Expose the gap between fantasy and reality

    Examples of the REQUIRED ENERGY (DO NOT COPY):

    - “Isko sunte waqt tum khudko hero samajhne lagte ho, jabki reality mein bas headphones lagake responsibilities avoid ho rahi hoti hain.”
    - “Ye gaana music kam, tumhare ‘main different hoon bro’ delusion ka background score zyada lagta hai.”
    - “Tum isko sunte nahi ho, tum apni personality ko temporarily borrow karte ho.”

    ---

    PLAYLIST-LEVEL ROAST:
    - Diagnose the person in 1–2 sentences
    - Call out their overall pattern
    - Make it feel like a summary of their bad decisions

    ---

    BASIC SCORE (0–100):
    This is NOT about popularity.
    This is about how replaceable this playlist makes the listener.

    - 0–20 → Annoying but dangerous taste
    - 21–40 → Safe, scared, approval-seeking
    - 41–60 → Spotify-core, zero risk
    - 61–80 → Gym/sad/night-drive personality pack
    - 81–100 → NPC with headphones

    ---

    STRICT OUTPUT FORMAT (NO EXCEPTIONS):

    {
      "score": <number>,
      "playlist_roast": "<1–2 sentence roast of the person behind the playlist>",
      "roasts": [
        {
          "name": "Exact Input String",
          "roast": "1–2 sentence Hinglish roast that feels uncomfortably accurate."
        }
      ]
    }

    FINAL CHECK:
    If the roast feels like commentary → rewrite.
    If it feels like exposure → output.

    Do not soften.
    Do not apologize.
    Begin.
    `;

    let generatedText = "";

    // 2. ATTEMPT 1: GOOGLE GEMINI SDK
    try {
      // Note: "gemini-2.5-flash" might not exist yet, defaulting to 1.5-flash for stability
      // If you have access to 2.0 or experimental models, update the string.
      const model = genAI.getGenerativeModel({
        model: "gemini-.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });

      const result = await model.generateContent(prompt);
      generatedText = result.response.text();
    } catch (geminiError: any) {
      console.warn(
        "⚠️ Gemini SDK Failed (likely 429). Attempting OpenRouter Fallback...",
        geminiError.message,
      );

      // 3. ATTEMPT 2: OPENROUTER FALLBACK
      if (!process.env.OPENROUTER_API_KEY) {
        throw new Error("Gemini failed and OPENROUTER_API_KEY is missing.");
      }

      const openRouterResponse = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://roast-my-spotify.com", // Optional: Your site URL
          },
          body: JSON.stringify({
            // You can use "google/gemini-flash-1.5" or "meta-llama/llama-3.1-8b-instruct:free"
            model: "nex-agi/deepseek-v3.1-nex-n1:free",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }, // Helps ensure JSON output
          }),
        },
      );

      if (!openRouterResponse.ok) {
        const errorText = await openRouterResponse.text();
        throw new Error(
          `OpenRouter Failed: ${openRouterResponse.status} - ${errorText}`,
        );
      }

      const openRouterJson = await openRouterResponse.json();
      generatedText = openRouterJson.choices?.[0]?.message?.content || "";
    }

    // 4. PARSE & RETURN
    if (!generatedText) {
      throw new Error("No content generated from either provider.");
    }

    // Clean markdown code blocks if present (common issue with raw LLM text)
    const cleanedText = generatedText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(cleanedText);
    } catch (e) {
      console.error("JSON Parse Error on text:", cleanedText);
      return NextResponse.json({
        score: 69,
        playlist_roast:
          "My brain fried trying to analyze your taste. It's that confused.",
        roasts: [{ name: "Error", roast: "Even the AI gave up on you." }],
      });
    }

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Critical Roast Error:", error);
    return NextResponse.json(
      {
        error:
          "Failed to generate roast. Both AI providers are tired of this playlist.",
      },
      { status: 500 },
    );
  }
}
