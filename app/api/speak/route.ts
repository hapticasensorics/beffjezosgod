import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return Response.json({ error: "Text is required" }, { status: 400 });
    }

    // Use OpenAI TTS with "onyx" voice for a deeper, more authoritative tone
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "onyx", // Deep, authoritative voice fitting for a "god"
      input: text,
      speed: 0.95, // Slightly slower for gravitas
    });

    // Convert to array buffer and return as audio
    const buffer = Buffer.from(await mp3.arrayBuffer());

    return new Response(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("OpenAI TTS error:", error);
    return Response.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}
