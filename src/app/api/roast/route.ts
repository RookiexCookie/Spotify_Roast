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
Each item may be a song name or an artist name. Treat both as a MIRROR into the listener’s behavior.

ABSOLUTE NON-NEGOTIABLE RULES:
1. Every item MUST have a completely UNIQUE, different roast targeting that specific item. NEVER repeat the same roast, jokes, or sentence patterns across items.
2. Limit each item's roast to 1–2 punchy Hinglish/English sentences (under 30 words each).
3. If the roast does not make the listener feel personally exposed, it has FAILED.

---

VOICE & ENERGY (LOCK THIS IN):
- Hinglish-heavy, Indian internet tone
- Chaotic, observational, specific
- Sounds like someone roasting quietly in a group chat: "Bhai tu khud sun, samajh aa jayega" energy

DO NOT:
- Be polite, balanced, explanatory, or generic
- Praise anything or give the same roast twice

---

STRICT OUTPUT FORMAT (NO EXCEPTIONS):
Output ONLY valid raw JSON matching this schema:
{
  "score": <integer from 0 to 100 representing basicness>,
  "playlist_roast": "<1–2 sentence overall summary roast of the listener>",
  "roasts": [
    {
      "name": "<exact item name from the user list>",
      "roast": "<1–2 sentence unique, specific savage roast targeting the user for listening to this exact item>"
    }
  ]
}

Ensure the "roasts" array contains an entry for EVERY item in the user input. Output strictly JSON.`;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Extract flat list of item names from any payload format
    let itemsList: string[] = [];
    if (Array.isArray(body.items)) {
      itemsList = body.items.map((i: any) =>
        typeof i === "string" ? i : i.name || i.title || JSON.stringify(i)
      );
    } else if (Array.isArray(body.names)) {
      itemsList = body.names;
    } else if (typeof body.names === "string") {
      itemsList = body.names
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
    } else if (body.top_artists || body.top_tracks) {
      const a = (body.top_artists || []).map((x: any) => x.name);
      const t = (body.top_tracks || []).map((x: any) => x.title || x.name);
      itemsList = [...a, ...t];
    } else if (typeof body === "object") {
      itemsList = Object.values(body).filter(
        (v) => typeof v === "string"
      ) as string[];
    }

    if (itemsList.length === 0) {
      itemsList = ["Unknown Music"];
    }

    // Format numbered user items
    const userMessageContent =
      `Here are the ${itemsList.length} items from the user's Spotify playlist/history.\n` +
      `Generate a distinct, unique savage roast for each one of them:\n` +
      itemsList.map((item, idx) => `${idx + 1}. "${item}"`).join("\n");

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
        presence_penalty: 0.6,
        frequency_penalty: 0.6,
        max_tokens: 1000,
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
