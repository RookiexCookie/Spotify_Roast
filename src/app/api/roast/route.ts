import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // The user's Spotify listening data is provided as a JSON payload in the request body.
    // We will pass this JSON stats payload inside the user message content.
    const userMessageContent = `
Here is the user's Spotify listening data in JSON format:
${JSON.stringify(body, null, 2)}

You MUST respond with a JSON object in this exact format (do not include any additional commentary outside the JSON):
{
  "score": <number between 0 and 100 representing how basic/replaceable their taste is>,
  "playlist_roast": "A 1-2 sentence overall savage, sarcastic roast of the user's entire music taste",
  "roasts": [
    {
      "name": "Exact artist or track name from the input list",
      "roast": "A 1-2 sentence savage, specific roast of this specific item"
    }
  ]
}
`;

    let generatedText = "";

    try {
      const apiResponse = await fetch("https://daysi-figgier-nonpleadingly.ngrok-free.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer not-needed",
        },
        body: JSON.stringify({
          model: "Llama-3.2-3B-Instruct-abliterated",
          messages: [
            {
              role: "system",
              content: "You are a ruthless, elitist, and unfiltered music critic. Analyze the user's Spotify listening data provided in JSON format. Deliver a savage, sarcastic, and highly specific roast targeting their top artists, tracks, and genre habits. Do not hold back, do not apologize, and do not provide generic compliments."
            },
            {
              role: "user",
              content: userMessageContent
            }
          ],
          temperature: 0.85,
          max_tokens: 450,
          response_format: { type: "json_object" }
        })
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error("OpenAI-compatible API error:", apiResponse.status, errorText);
        throw new Error(`API responded with status ${apiResponse.status}`);
      }

      const responseData = await apiResponse.json();
      generatedText = responseData.choices?.[0]?.message?.content || "";
    } catch (apiError: any) {
      console.error(
        "Critical: Self-hosted OpenAI-compatible provider failed.",
        apiError.message,
      );
      throw new Error("AI provider failed to generate content.");
    }

    if (!generatedText) {
      throw new Error("No content generated from the AI provider.");
    }

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
          "Failed to generate roast. The AI is tired of this playlist.",
      },
      { status: 500 },
    );
  }
}
