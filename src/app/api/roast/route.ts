import { NextResponse } from "next/server";

const DEFAULT_BASE_URL =
  process.env.OPENAI_BASE_URL ||
  process.env.AI_BASE_URL ||
  "https://daysi-figgier-nonpleadingly.ngrok-free.dev/v1";
const MODEL_NAME =
  process.env.AI_MODEL || "Llama-3.2-3B-Instruct-abliterated";
const API_KEY = process.env.OPENAI_API_KEY || "not-needed";

const SYSTEM_PROMPT = `You are NOT a neutral narrator.
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

ABSOLUTE NON-NEGOTIABLE RULE:
If the roast does not make the listener feel personally exposed, it has FAILED.

---

VOICE & ENERGY (LOCK THIS IN):
- Hinglish-heavy, Indian internet tone
- Chaotic
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
always attack them openly with clever humor
Then compress it into **1–2 sentences**.

---

ROAST CONSTRUCTION RULES (CRITICAL):

For EACH item:
- you may Pick ONE fantasy the listener believes (hero arc, sad protagonist, gym beast, night rider, misunderstood genius, etc.)
- you must Expose the gap between fantasy and reality and the user delusion

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
openly offend but do it with clever humor
Begin.`;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Prepare Spotify JSON stats payload for the user message
    const userMessageContent =
      typeof body === "string" ? body : JSON.stringify(body, null, 2);

    const baseUrl = DEFAULT_BASE_URL.replace(/\/+$/, "");
    const endpoint = `${baseUrl}/chat/completions`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: userMessageContent,
          },
        ],
        temperature: 0.85,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI Provider error (${response.status}):`, errorText);
      throw new Error(
        `AI Provider returned status ${response.status}: ${errorText}`
      );
    }

    const data = await response.json();
    const generatedContent = data?.choices?.[0]?.message?.content?.trim() || "";

    if (!generatedContent) {
      throw new Error("No content generated from AI provider.");
    }

    // Default values
    let score = 75;
    let playlistRoast = "";
    let roasts: { name: string; roast: string }[] = [];

    // Calculate a dynamic basicness score if popularity data was provided in payload
    if (body?.top_artists && Array.isArray(body.top_artists)) {
      const popularities = body.top_artists
        .map((a: any) =>
          typeof a.popularity === "number" ? a.popularity : null
        )
        .filter((p: any) => p !== null);
      if (popularities.length > 0) {
        score = Math.round(
          popularities.reduce((a: number, b: number) => a + b, 0) /
            popularities.length
        );
      }
    }

    // Clean markdown code fence if present
    const cleanedText = generatedContent
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    try {
      const parsed = JSON.parse(cleanedText);
      if (parsed && typeof parsed === "object") {
        if (typeof parsed.score === "number") score = parsed.score;
        if (parsed.playlist_roast) playlistRoast = parsed.playlist_roast;
        if (Array.isArray(parsed.roasts)) roasts = parsed.roasts;
      }
    } catch {
      // If JSON was partially truncated or formatted differently, extract what we can
      const scoreMatch = cleanedText.match(/"score":\s*(\d+)/);
      if (scoreMatch) score = parseInt(scoreMatch[1], 10);

      const playlistRoastMatch = cleanedText.match(
        /"playlist_roast":\s*"([^"]+)"/
      );
      if (playlistRoastMatch) playlistRoast = playlistRoastMatch[1];

      // Extract any roasts objects in roasts array
      const roastRegex =
        /\{\s*"name":\s*"([^"]+)",\s*"roast":\s*"([^"]+)"\s*\}/g;
      let match;
      while ((match = roastRegex.exec(cleanedText)) !== null) {
        roasts.push({ name: match[1], roast: match[2] });
      }
    }

    return NextResponse.json({
      score,
      playlist_roast: playlistRoast,
      roasts,
      choices: data.choices,
    });
  } catch (error: any) {
    console.error("Critical Roast Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to generate roast.",
      },
      { status: 500 }
    );
  }
}
