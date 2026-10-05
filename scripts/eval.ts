import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { CHAT_RULES, loadRuleSheet } from "@/server/rule-sheet";
import { modelName, splitHabit } from "@/server/split-habit";
import { type ChatTurn, MODEL_IDS, type ModelId, type SplitResult } from "@/shared/tiny-habit";

// npm run eval
// Sends every case in tests/cases.md to every model, with the current rules,
// and writes a side-by-side report to tests/results/.
// Runs on your Mac: needs Ollama running (for Gemma) and the key in .env.local (for Claude).

const CASES_FILE = path.join(process.cwd(), "tests", "cases.md");
const RESULTS_DIR = path.join(process.cwd(), "tests", "results");

type TestCase = { title: string; expect: string; messages: string[] };
type Step = { message: string; answer: string; seconds: number };

async function main() {
  const cases = parseCases(await readFile(CASES_FILE, "utf8"));
  const rules = await loadRuleSheet(CHAT_RULES);
  console.log(`Rules ${rules.version} · ${cases.length} cases · ${MODEL_IDS.join(" + ")}\n`);

  const runs = {} as Record<ModelId, Step[][]>;
  for (const model of MODEL_IDS) {
    runs[model] = [];
    for (const testCase of cases) {
      const steps = await runCase(model, testCase, rules.text);
      runs[model].push(steps);
      const seconds = steps.reduce((sum, s) => sum + s.seconds, 0);
      const failed = steps.some((s) => s.answer.startsWith("ERROR"));
      console.log(`${failed ? "✗" : "✓"} ${model.padEnd(6)} ${testCase.title} (${seconds.toFixed(1)} s)`);
    }
  }

  await mkdir(RESULTS_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 16).replace(":", "-");
  const file = path.join(RESULTS_DIR, `${stamp}_${rules.version}.md`);
  await writeFile(file, report(cases, runs, rules.version));
  console.log(`\nReport: ${path.relative(process.cwd(), file)}`);
}

// One conversation: each scripted message, then the model's answer, in turn.
async function runCase(model: ModelId, testCase: TestCase, rules: string): Promise<Step[]> {
  const turns: ChatTurn[] = [];
  const steps: Step[] = [];
  for (const message of testCase.messages) {
    turns.push({ role: "user", text: message });
    const start = performance.now();
    try {
      const result = await splitHabit(model, turns, rules);
      turns.push({ role: "assistant", result });
      steps.push({ message, answer: formatResult(result), seconds: (performance.now() - start) / 1000 });
    } catch (error) {
      // A broken answer is a finding, not a reason to stop the whole run:
      // record it and end this conversation (the next message would make no sense).
      steps.push({ message, answer: `ERROR: ${(error as Error).message}`, seconds: (performance.now() - start) / 1000 });
      break;
    }
  }
  return steps;
}

// ---- tests/cases.md → TestCase[] ----

function parseCases(markdown: string): TestCase[] {
  const cases: TestCase[] = [];
  for (const line of markdown.split("\n")) {
    if (line.startsWith("## ")) {
      cases.push({ title: line.slice(3).trim(), expect: "", messages: [] });
    } else if (cases.length > 0 && line.startsWith("Expect:")) {
      cases[cases.length - 1].expect = line.slice(7).trim();
    } else if (cases.length > 0 && line.startsWith("- ")) {
      cases[cases.length - 1].messages.push(line.slice(2).trim());
    }
  }
  const empty = cases.find((c) => c.messages.length === 0);
  if (empty) throw new Error(`Case "${empty.title}" has no "- " messages`);
  if (cases.length === 0) throw new Error(`No cases found in ${CASES_FILE}`);
  return cases;
}

// ---- report ----

function formatResult(result: SplitResult): string {
  if (!("tinyHabits" in result)) {
    return `**${result.move}**: ${result.message}`;
  }
  const habits = result.tinyHabits.map((h) => `${h.anchor}, ${h.behavior}.<br>_why: ${h.why}_`).join("<br><br>");
  const note = result.note === "" ? "" : `<br><br>note: ${result.note}`;
  return `**${result.move}**:<br>${habits}${note}`;
}

function report(cases: TestCase[], runs: Record<ModelId, Step[][]>, rulesVersion: string): string {
  const header = `| Person | ${MODEL_IDS.map(modelName).join(" | ")} |\n|---|${MODEL_IDS.map(() => "---").join("|")}|`;
  const sections = cases.map((testCase, i) => {
    const rows = testCase.messages.map((message, turn) => {
      const cells = MODEL_IDS.map((model) => {
        const step = runs[model][i][turn];
        return step ? `${step.answer}<br><sub>${step.seconds.toFixed(1)} s</sub>` : "–";
      });
      return `| ${cell(message)} | ${cells.map(cell).join(" | ")} |`;
    });
    return `## ${testCase.title}\n\nExpect: ${testCase.expect}\n\n${header}\n${rows.join("\n")}\n`;
  });
  const date = new Date().toLocaleString("de-CH");
  return `# Eval · rules ${rulesVersion} · ${date}\n\nRules snapshot: data/rules/${rulesVersion}.md\n\n${sections.join("\n")}`;
}

// Table cells can't contain raw "|" or line breaks.
function cell(text: string): string {
  return text.replaceAll("|", "\\|").replaceAll("\n", "<br>");
}

main();
