import OpenAI from "openai";
import { BEFF_JEZOS_SYSTEM_PROMPT } from "@/lib/beff-prompt";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { message, history = [] } = await request.json();

    if (!message) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    // Build conversation history for context
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: BEFF_JEZOS_SYSTEM_PROMPT },
      ...history.map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      messages,
      model: "gpt-4.1",
      temperature: 0.8,
      max_tokens: 300,
    });

    const response = completion.choices[0]?.message?.content || "";

    return Response.json({ response });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return Response.json(
      { error: "Failed to get response from the oracle" },
      { status: 500 }
    );
  }
}
