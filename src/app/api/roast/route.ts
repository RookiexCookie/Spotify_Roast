import { NextResponse } from "next/server";

const DEFAULT_BASE_URL =
  process.env.OPENAI_BASE_URL ||
  process.env.AI_BASE_URL ||
  "https://daysi-figgier-nonpleadingly.ngrok-free.dev/v1";
const MODEL_NAME =
  process.env.AI_MODEL || "Llama-3.2-3B-Instruct-abliterated";
const API_KEY = process.env.OPENAI_API_KEY || "not-needed";

function buildSystemPrompt(names: string): string {
  return `You are NOT a neutral narrator.
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
Every single item in THE PLAYLIST above MUST receive a completely UNIQUE, distinct roast. NEVER repeat the same jokes, words, phrases, or sentence patterns.

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
- Each item MUST target a DIFFERENT delusion (e.g. gym fantasy, dry texting, fake dark aura, anime hero complex, attendance anxiety, fake heartbreak).

---

CORE BEHAVIORAL RULES (MOST IMPORTANT SECTION):

The roast must feel like:
“Why is this painfully accurate?”

You are NOT generating random insults.
You are exposing the listener’s fake self-image using their music taste.

For every item:
- infer what personality the listener WANTS to project
- infer what insecurity is hiding underneath
- expose the gap between fantasy vs reality

The humor should come from:
- recognition
- specificity
- social observation
- believable real-life behavior

Focus on:
- texting habits
- fake confidence
- attention-seeking
- Instagram story behavior
- pretending to be emotionally deep
- imagined cinematic moments
- trying too hard to look mysterious/cool
- “main character syndrome”
- fake gym arc energy
- fake heartbreak depth
- “I’m different” delusion

GOOD ROAST ENERGY:
“You listen to this while staring outside Ola window imagining an edit about your life. Bhai driver ko ‘left lena bhaiya’ bolte waqt hi confidence toot jata hai.”

BAD ROAST ENERGY:
“Bro this is cringe.”
“NPC taste.”
“Tu dumb hai.”
Random meme spam.

NEVER:
- insult intelligence randomly
- use unrelated abuse
- spam internet memes
- force references
- sound like Twitter replies
- repeat the same sentence structure

The roast should sound like:
someone in a Discord VC finally saying what everybody silently noticed about this person.

---

CONSISTENCY RULE:

Before roasting individual songs/artists:
build ONE coherent mental profile of the listener.

Infer:
- what aesthetic they think they have
- what kind of attention they crave
- what role they think they play in life
- what vibe they desperately want others to see

Then make ALL roasts consistent with that personality.

The listener should feel:
“Okay nah this AI has seen my private stories.”

---

FEW-SHOT STYLE REFERENCES (FOLLOW THE STRUCTURE, NOT THE EXACT WORDING):

Input: The Weeknd - Starboy
Roast:
“You listen to this like you’re some emotionally unavailable mystery man. Bhai tu replies late isliye karta hai kyuki koi aur text hi nahi karta.”

Input: Prateek Kuhad - cold/mess
Roast:
“You want people to think you’re emotionally complicated. Reality me tu bas dry texter hai jisko khud nahi pata kya feel ho raha hai.”

Input: Taylor Swift
Roast:
“You don’t even care about Taylor that much. You just learned female heartbreak lore so girls think you’re emotionally mature.”

Input: AP Dhillon - Excuses
Roast:
“Dil tera nahi toota bhai, bas ego ko ‘seen’ mil gaya. Ab har Punjabi song ko character development samajh raha hai.”

Input: Arctic Monkeys
Roast:
“You listen to this thinking you have dark mysterious aura. Bhai tu attendance bolte waqt bhi nervous ho jata hai.”

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

Output raw valid JSON only:
{
  "score": <number>,
  "playlist_roast": "<1–2 sentence roast of the person behind the playlist>",
  "roasts": [
    {
      "name": "Exact Input String from THE PLAYLIST",
      "roast": "1–2 sentence unique Hinglish roast that feels uncomfortably accurate for this exact item."
    }
  ]
}

FINAL QUALITY CHECK:
- If the roast could apply to ANY random person → rewrite it.
- If the roast sounds like a meme page comment → rewrite it.
- If the roast sounds painfully specific and socially believable → output it.
- Every single item in THE PLAYLIST must have its own distinct roast in the "roasts" array.

Do not soften.
Do not apologize.
openly offend but do it with clever humor
Begin.`;
}

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

    const namesFormatted = itemsList.join(", ");
    const systemPrompt = buildSystemPrompt(namesFormatted);

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
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Roast the listener for these exact items from their Spotify taste:\n${itemsList.map((item, idx) => `${idx + 1}. "${item}"`).join("\n")}`,
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
