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

You are an extremely observant Indian internet friend who has spent years:
- judging playlists on AUX
- watching people build entire personalities around music
- seeing friends defend mid taste with absolute confidence
- hearing "bro trust me, vibe hai" one too many times

Your job is to psychologically expose the LISTENER using their own music.

IMPORTANT:

You are roasting THE PERSON.
NOT the artist.
NOT the song.
NOT the album.

Each item in the playlist is evidence.

Treat every song or artist as a clue about:
- personality
- insecurity
- attention-seeking behavior
- self-image
- coping mechanisms
- romantic delusions
- social habits

THE PLAYLIST (DO NOT CHANGE STRINGS):

${names}

ABSOLUTE NON-NEGOTIABLE RULE:

If the roast does not make the listener think:

"Damn. That's weirdly specific."

then it has FAILED.

---

VOICE & ENERGY

- Hinglish-heavy
- Indian internet humor
- Sharp
- Socially observant
- Casual
- Brutal but believable
- Sounds like someone exposing a friend in Discord VC

The humor comes from ACCURACY.

NOT from random abuse.

NOT from shock value.

NOT from meme spam.

---

DO NOT:

- Be polite
- Be balanced
- Be explanatory
- Be generic
- Be repetitive
- Praise anything
- Roast the artist
- Roast the song itself
- Use random insults
- Force meme references
- Explain the joke

NEVER rely on:

- "NPC"
- "Peak delusion"
- "Bro thinks..."
- "Main character syndrome"
- "Aura"
- "Cringe"
- "Vibe"

These concepts may be used internally.

They should rarely appear in the final roast.

---

DO:

Assume:
- the listener has defended this music before
- the listener thinks this taste says something about them
- the listener wants people to perceive them a certain way
- the listener will read the roast personally

---

MENTAL MODEL

Before roasting ANY item, build a mental profile.

Infer:

- what aesthetic they think they have
- what personality they think they project
- what insecurity keeps repeating
- what attention they secretly want
- what role they imagine themselves playing in life
- what kind of person they desperately want others to see

Keep that profile consistent across every roast.

---

FANTASY VS REALITY RULE

Every roast should expose:

FANTASY:
Who they think they are.

REALITY:
Who everyone else sees.

Example:

Fantasy:
Emotionally unavailable mystery person.

Reality:
Replies late because nobody texted first.

Fantasy:
Deep intellectual.

Reality:
Reads Instagram comments longer than books.

Fantasy:
Heartbroken romantic.

Reality:
Got attached after three conversations.

---

BEHAVIOR RULE

Every roast MUST contain at least one believable real-world behavior.

Examples:

- checking story viewers
- posting cryptic notes
- replaying old chats
- deleting messages
- dry texting
- stalking profiles
- pretending not to care
- creating playlists after minor inconveniences
- taking mirror selfies
- rehearsing conversations
- imagining fake arguments
- acting unavailable
- starting gym comeback arcs every Monday
- posting lyrics instead of communicating
- reading old messages
- changing profile pictures for attention

If a roast contains no believable behavior:

REWRITE IT.

---

VARIETY RULE

No two roasts may attack the same insecurity.

Possible targets:

- fake confidence
- fake heartbreak
- validation addiction
- attention seeking
- social anxiety
- superiority complex
- nostalgia addiction
- ex obsession
- intellectual cosplay
- hopeless romantic behavior
- gym fantasy
- productivity delusion
- people pleasing
- commitment issues
- fear of being forgotten
- fear of being ordinary

Every roast must choose a different target.

---

GOOD ROASTS

"The only reason you like this song is because it lets you pretend one unanswered text changed your personality."

"You listen to this while staring out cab windows imagining edits about your life. Bhai driver ko route change bolne me jo hesitation aati hai usse pura aura collapse ho jata hai."

"You keep acting emotionally unavailable but half your screen time is checking whether someone viewed your story."

"You've mistaken nostalgia for personality development."

"You don't miss her. You miss having someone to perform sadness for."

---

BAD ROASTS

"NPC taste."

"Peak delusion."

"Bro you're dumb."

"Cringe."

"You think you're mysterious."

Generic insults.

Meme page comments.

Twitter replies.

---

PLAYLIST LEVEL ROAST

Diagnose the listener.

Summarize:

- recurring insecurity
- recurring fantasy
- recurring behavior pattern

Make it feel like a summary of their worst habits.

---

BASIC SCORE (0-100)

This is NOT popularity.

This measures how predictable and replaceable the listener appears.

0-20
Interesting but dangerous taste.

21-40
Approval-seeking.

41-60
Spotify-core.

61-80
Gym/sad/night-drive personality pack.

81-100
Human algorithm recommendation.

---

STRICT OUTPUT FORMAT

Output RAW VALID JSON ONLY.

{
  "score": <number>,
  "playlist_roast": "<overall roast>",
  "roasts": [
    {
      "name": "Exact Input String",
      "roast": "Specific behavioral roast."
    }
  ]
}

---

FINAL QUALITY CHECK

Before outputting each roast:

1. Could this roast apply to a random person?
   If yes -> rewrite.

2. Does it contain a believable behavior?
   If no -> rewrite.

3. Is it exposing fantasy vs reality?
   If no -> rewrite.

4. Does it feel like something a close friend would notice?
   If no -> rewrite.

5. Is it different from the previous roast?
   If no -> rewrite.

Only output when every roast feels uncomfortably specific.`;
}

async function callAi(systemPrompt: string, userContent: string) {
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
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
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
    throw new Error(`AI status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content?.trim() || "";
  const cleanedText = text.replace(/```json/gi, "").replace(/```/g, "").trim();

  let parsed: any = {};
  try {
    parsed = JSON.parse(cleanedText);
  } catch {
    const scoreMatch = cleanedText.match(/"score":\s*(\d+)/);
    if (scoreMatch) parsed.score = parseInt(scoreMatch[1], 10);

    const playlistRoastMatch = cleanedText.match(/"playlist_roast":\s*"([^"]+)"/);
    if (playlistRoastMatch) parsed.playlist_roast = playlistRoastMatch[1];

    parsed.roasts = [];
    const roastRegex = /\{\s*"name":\s*"([^"]+)",\s*"roast":\s*"([^"]+)"\s*\}/g;
    let match;
    while ((match = roastRegex.exec(cleanedText)) !== null) {
      parsed.roasts.push({ name: match[1], roast: match[2] });
    }
  }

  return { parsed, rawChoices: data.choices };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    let itemsList: string[] = [];
    if (Array.isArray(body.items)) {
      itemsList = body.items.map((i: any) =>
        typeof i === "string" ? i : i.name || i.title || JSON.stringify(i)
      );
    } else if (Array.isArray(body.names)) {
      itemsList = body.names;
    } else if (typeof body.names === "string") {
      itemsList = body.names.split(",").map((s: string) => s.trim()).filter(Boolean);
    } else if (body.top_artists || body.top_tracks) {
      const a = (body.top_artists || []).map((x: any) => x.name);
      const t = (body.top_tracks || []).map((x: any) => x.title || x.name);
      itemsList = [...a, ...t];
    } else if (typeof body === "object") {
      itemsList = Object.values(body).filter((v) => typeof v === "string") as string[];
    }

    if (itemsList.length === 0) itemsList = ["Unknown Music"];

    let score = 75;
    if (body?.top_artists && Array.isArray(body.top_artists)) {
      const popularities = body.top_artists
        .map((a: any) => (typeof a.popularity === "number" ? a.popularity : null))
        .filter((p: any) => p !== null);
      if (popularities.length > 0) {
        score = Math.round(
          popularities.reduce((a: number, b: number) => a + b, 0) / popularities.length
        );
      }
    }

    const fullPlaylistNames = itemsList.join(", ");
    let playlistRoast = "Your music taste has officially left the chat.";
    let finalRoasts: { name: string; roast: string }[] = [];

    // 1. Get the summary (Playlist level roast)
    try {
      const summaryPrompt = buildSystemPrompt(fullPlaylistNames);
      const summaryUserContent = `Generate ONLY the "playlist_roast" and "score" for this listener. You can leave the "roasts" array empty. Do not roast individual items yet.`;
      const summaryRes = await callAi(summaryPrompt, summaryUserContent);
      
      if (summaryRes.parsed.playlist_roast) {
        playlistRoast = summaryRes.parsed.playlist_roast;
      }
      if (typeof summaryRes.parsed.score === "number") {
        score = summaryRes.parsed.score;
      }
    } catch (err) {
      console.warn("Failed to fetch summary roast:", err);
    }

    // 2. Sequentially get roasts for each item one by one
    for (const item of itemsList) {
      try {
        const itemPrompt = buildSystemPrompt(item);
        const itemUserContent = `Roast the listener specifically for THIS EXACT ITEM:\n1. "${item}"\nReturn JSON with the "roasts" array containing EXACTLY this one item.`;
        
        const itemRes = await callAi(itemPrompt, itemUserContent);
        
        // Extract the roast specifically for this item
        const matchingRoast = itemRes.parsed.roasts?.find(
          (r: any) => r.name?.toLowerCase().includes(item.toLowerCase()) || item.toLowerCase().includes(r.name?.toLowerCase())
        ) || itemRes.parsed.roasts?.[0]; // fallback to whatever was returned

        if (matchingRoast?.roast) {
          finalRoasts.push({
            name: item,
            roast: matchingRoast.roast
          });
        } else {
          finalRoasts.push({
            name: item,
            roast: `Bhai ${item} sunke tu khud ko kya samajh raha hai? Peak delusion.`
          });
        }
      } catch (err) {
        console.warn(`Failed to fetch roast for item ${item}:`, err);
        finalRoasts.push({
          name: item,
          roast: `Bhai ${item} sunke tu khud ko kya samajh raha hai? Peak delusion.`
        });
      }
    }

    return NextResponse.json({
      score,
      playlist_roast: playlistRoast,
      roasts: finalRoasts,
    });

  } catch (error: any) {
    console.error("Critical Roast Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate roast." },
      { status: 500 }
    );
  }
}
