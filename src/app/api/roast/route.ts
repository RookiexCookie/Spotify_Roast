import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const names = body.names || [];

    const playlistText = Array.isArray(names)
      ? names.join("\n")
      : String(names);

    /*
    ============================================
    STAGE 1 — PSYCHOLOGICAL PROFILE EXTRACTION
    ============================================
    */

    const profilePrompt = `
You analyze people through their playlists.

Your job is NOT to roast yet.

Your job is to infer:
- fake personality they want to project
- biggest insecurity
- romantic delusion
- social media behavior
- friend group role
- fake aura
- what makes them predictable
- what cinematic fantasy they imagine themselves in

PLAYLIST:
${playlistText}

RULES:
- Be sharp.
- Be observant.
- Be specific.
- No generic insults.
- No random abuse.
- No meme spam.
- Infer believable behavior.

OUTPUT JSON ONLY:

{
  "persona": "",
  "main_delusion": "",
  "insecurities": [],
  "social_behavior": "",
  "romantic_pattern": "",
  "imagined_aesthetic": "",
  "friend_group_role": "",
  "most_predictable_trait": "",
  "summary": ""
}
`;

    const profileModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
        topP: 0.9,
      },
    });

    const profileResult = await profileModel.generateContent(profilePrompt);

    const profileText = profileResult.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let profile;

    try {
      profile = JSON.parse(profileText);
    } catch {
      profile = {
        persona: "attention-seeking sadboy",
        main_delusion: "thinks emotional damage equals personality",
        insecurities: ["forgettable"],
        social_behavior: "posts cryptic stories after minor inconveniences",
        romantic_pattern: "falls in love with attention not people",
        imagined_aesthetic: "main character in night-drive edits",
        friend_group_role: "tries too hard to seem deep",
        most_predictable_trait: "confuses music taste with personality",
        summary: "emotionally performative but painfully predictable",
      };
    }

    /*
    ============================================
    STAGE 2 — ROAST GENERATION
    ============================================
    */

    const roastPrompt = `
You privately judge people through their playlists.

You sound like:
- someone exposing a friend in Discord VC
- socially observant
- casually brutal
- weirdly accurate
- funny because it feels TRUE

IMPORTANT:
You are roasting THE LISTENER.
NOT the artist.
NOT the song.

The humor comes from:
- recognition
- specificity
- exposing fake self-image
- fantasy vs reality

NEVER:
- spam memes
- use random insults
- say "bro you're dumb"
- explain jokes
- sound like Twitter replies
- repeat the same structure

FOCUS ON:
- fake confidence
- texting habits
- romantic delusions
- social media behavior
- trying too hard to seem deep/cool
- imagined cinematic moments
- emotional performance
- attention-seeking behavior

THE PLAYLIST:
${playlistText}

PSYCHOLOGICAL PROFILE:
${JSON.stringify(profile, null, 2)}

EXAMPLES OF GOOD STYLE:

Input: The Weeknd - Starboy
Roast:
"You listen to this while fixing your hair in dark reflection shots like some emotionally unavailable villain. Bhai tu Swiggy OTP bolte waqt bhi awkward ho jata hai."

Input: Prateek Kuhad - cold/mess
Roast:
"You want people to think you're emotionally complicated. Reality me tu bas dry texter hai jisko khud nahi pata kya feel ho raha hai."

Input: Taylor Swift
Roast:
"You learned female heartbreak lore just so girls think you're emotionally mature. Tera entire personality depends on getting reactions in Instagram notes."

RULE:
Every roast must expose:
- the fantasy
VS
- the actual reality

STRICT OUTPUT JSON ONLY:

{
  "score": number,
  "playlist_roast": "1-2 sentence overall roast",
  "roasts": [
    {
      "name": "exact song/artist",
      "roast": "specific observational roast"
    }
  ]
}
`;

    const roastModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",

      generationConfig: {
        responseMimeType: "application/json",

        /*
        SWEET SPOT:
        Creative but coherent
        */
        temperature: 1.12,
        topP: 0.95,
      },

      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,

          threshold: HarmBlockThreshold.BLOCK_NONE,
        },

        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,

          threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        },
      ],
    });

    const roastResult = await roastModel.generateContent(roastPrompt);

    const roastText = roastResult.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(roastText);
    } catch (err) {
      console.error("Parse Error:", roastText);

      return NextResponse.json({
        score: 73,
        playlist_roast:
          "Your playlist confused even the AI. That's honestly impressive in the worst possible way.",
        roasts: [
          {
            name: "Parsing Error",
            roast:
              "Even the model got distracted trying to understand your fake aura.",
          },
        ],
      });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to generate roast. The AI judged the playlist and left.",
      },
      { status: 500 },
    );
  }
}
