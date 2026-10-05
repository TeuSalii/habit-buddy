import type { ModelId } from "@/shared/tiny-habit";
import { claude } from "./claude";
import { gemma } from "./gemma";
import type { ModelClient } from "./model";

// The one place that knows which models exist. Everything that talks to a
// model (the lab's conversation, Buddy's offers) picks it from here by id.
export const MODELS: Record<ModelId, ModelClient> = { claude, gemma };
