import { NextResponse } from "next/server";

const DEFAULT_BASE_URL =
  process.env.OPENAI_BASE_URL ||
  process.env.AI_BASE_URL ||
  "https://daysi-figgier-nonpleadingly.ngrok-free.dev/v1";
const MODEL_NAME =
  process.env.AI_MODEL || "Llama-3.2-3B-Instruct-abliterated";
const API_KEY = process.env.OPENAI_API_KEY || "not-needed";

const SYSTEM_PROMPT = `You are a ruthless, elitist, and unfiltered music critic. Analyze the user's Spotify listening data provided in JSON format. Deliver a savage, sarcastic, and highly specific roast targeting their top artists, tracks, and genre habits. Do not hold back, do not apologize, and do not provide generic compliments.

You MUST respond ONLY with a raw, valid JSON object in this exact schema:
{
  "score": <integer from 0 to 100>,
  "playlist_roast": "<1-2 sentence merciless overall roast of this user's taste>",
  "roasts": [
    {
      "name": "<exact artist or track name from input>",
      "roast": "<1-2 sentence sharp, savage roast specifically exposing why the user listens to this>"
    }
  ]
}

Ensure the "roasts" array contains an entry for every artist and track in the user's data. Output strictly JSON.`;

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
