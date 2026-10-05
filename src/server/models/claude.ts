import Anthropic from "@anthropic-ai/sdk";

import { type ModelClient, OUTPUT_SCHEMA } from "./model";

// Claude via Anthropic's API. Reads ANTHROPIC_API_KEY and throws if it's missing.
const client = new Anthropic();

export const claude: ModelClient = {
  // Sonnet: fast enough that a person waiting on the screen doesn't give up.
  name: "claude-sonnet-5",

  async generate(rules, messages) {
    const response = await client.messages.create({
      model: this.name,
      max_tokens: 1024,
      system: rules,
      messages,
      output_config: { format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
    });

    if (response.stop_reason !== "end_turn") {
      throw new Error(`Claude stopped early: ${response.stop_reason}`);
    }
    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      throw new Error("Claude returned no text block");
    }
    return block.text;
  },
};
