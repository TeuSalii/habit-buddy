import { type ModelClient, OUTPUT_SCHEMA } from "./model";

// Gemma 4 12B, running on this Mac through Ollama. Nothing leaves the machine.
// Needs the Ollama app running and `ollama pull gemma4:12b` done once.
const OLLAMA_URL = "http://localhost:11434/api/chat";

type OllamaResponse = {
  message: { content: string };
  done_reason: string;
};

export const gemma: ModelClient = {
  name: "gemma4:12b",

  async generate(rules, messages) {
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.name,
        stream: false,
        // No hidden reasoning before the answer. Measured: thinking cost ~515
        // tokens (~31 s at 16.5 tokens/s) for a five-word reply, which ran past
        // the 30 s idle timeout of Expo's dev-server fetch.
        think: false,
        // Ollama forces the reply into this JSON shape...
        format: OUTPUT_SCHEMA,
        messages: [
          // ...and its docs recommend also showing the schema in the prompt:
          // small models follow a shape better when they can read it.
          { role: "system", content: `${rules}\n\n# Reply format\nReply with JSON only, matching this schema:\n${JSON.stringify(OUTPUT_SCHEMA)}` },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama failed (${response.status}): ${await response.text()}`);
    }
    const data = (await response.json()) as OllamaResponse;
    if (data.done_reason !== "stop") {
      throw new Error(`Gemma stopped early: ${data.done_reason}`);
    }
    return data.message.content;
  },
};
