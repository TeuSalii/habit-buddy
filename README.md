# Happy Habits Buddy

A phone app that helps a person build small, more sustainable food habits.

It is not a chatbot. The person puts the food moments of their day on a map (breakfast, shopping, cooking and so on), and the AI companion **Buddy** offers one tiny habit for one of those moments.

This is a research prototype. It runs on a developer's computer and a test phone, not in an app store.

## Purpose

Most intentions fail for two reasons: they are too big, and they have no place in the day. Buddy works on both.

- **Tiny:** one small action that costs nothing and needs nothing new.
- **Anchored:** the action belongs to a moment that already happens, for example "after dinner at home".
- **The person's own choice:** they pick the area they want to work on and can answer in their own words. Buddy never suggests a food the person does not eat.
- **Money and waste first:** the app leads with throwing less food away and saving money. Sustainability is the effect, not the sales pitch.

Buddy is not a diet app, a therapist or a doctor. It never talks about eating less, calories or weight.

The project has a second purpose: comparing two AI models on the same task. Claude (in the cloud) and Gemma (on the developer's own computer) get the same rules and must answer in the same format.

## What you need

| What | Why | Needed for |
| --- | --- | --- |
| [Node.js](https://nodejs.org) with npm | Runs the development server on your computer | Everything |
| [Expo Go](https://expo.dev/go) on an Android phone | Shows the app on the phone, without building or installing it | Using the app |
| Phone and computer on the same Wi-Fi | The phone loads the app from your computer | Using the app |
| An Anthropic API key | Buddy's offers in the app are written by Claude | Using the app |
| [Ollama](https://ollama.com) with the model `gemma4:12b` | Runs Gemma on your computer, so nothing leaves the machine | Only the developer lab with Gemma, and `npm run eval` |

The app itself works without Ollama and Gemma. They are needed only when you compare the models.

## Run it

1. Install the packages:

   ```bash
   npm install
   ```

2. Create a file named `.env.local` in the project folder with your key. Git ignores this file, so the key stays on your computer.

   ```
   ANTHROPIC_API_KEY=your-key
   ```

3. Start the development server:

   ```bash
   npx expo start
   ```

4. Open Expo Go on the phone and scan the QR code from the terminal.

For Gemma, install Ollama, download the model once and keep the Ollama app running:

```bash
ollama pull gemma4:12b
```

## How it works

### For the person

1. **Introduction.** A short statement about habits, one quiz question with the answer shown as bars, the choice of an area (for example "Throwing less away" or "How I shop"), and one question about the person.
2. **Day map.** The person adds a food moment by answering up to four questions, one at a time: what, when, where, and on which days.
3. **Buddy's offer.** Right after a moment is added, Buddy offers one tiny habit for it. The person can accept it, ask for another idea, or decline.
4. **Check-offs.** An accepted habit becomes a plan with one box per day.
5. **"You are here" card.** The person can take another quiz at any time, and see, correct or delete what Buddy knows about them.

Buddy offers by itself only while fewer than two changes are open. Starting many habits at once is how none of them sticks.

### Under the hood

```
Phone (Expo Go)  →  API routes on your computer  →  rule sheet + model  →  offer  →  phone
```

- **The app and its server are one project.** The screens run on the phone. The files in `src/app/api/` run on your computer, inside the Expo development server. The API key never reaches the phone.
- **The rule sheet decides how Buddy answers.** It is plain Markdown in `rules/`: behavior science, voice, guardrails and the rules for food offers. The files are read on every request, so an edit takes effect without a restart.
- **Two models, one contract.** Claude and Gemma receive the same rules and must reply in the same JSON shape. The app uses Claude. The developer lab can switch between them.
- **The data stays on the phone.** Moments, answers and check-offs are stored on the device. There is no account. Several test persons can share one phone, and switching between them never deletes anything.
- **A log on your computer.** Every offer and check-off is written to `data/log.jsonl` with a random ID instead of a name. Git ignores the `data/` folder.
- **Developer lab.** A screen for the team, not for users. You describe a situation, the model makes three suggestions, and you approve the right one. Approved offers are saved in `rules/approved-offers.jsonl` and shown to the models as examples with every later request. The models do not learn by themselves.

## Project layout

| Folder | Content |
| --- | --- |
| `rules/` | The rule sheet (design material) |
| `src/app/` | Screens, and the API routes in `src/app/api/` |
| `src/components/` | The parts the screens are built from |
| `src/content/` | Quiz questions and the questions about the person |
| `src/server/` | Code that runs only on the computer: models, rule sheet, log |
| `src/shared/` | The contract between the app and the server |
| `src/storage/` | What the app saves on the phone |
| `tests/` | Test cases and reports of the model comparison |

## Commands

| Command | What it does |
| --- | --- |
| `npx expo start` | Starts the development server |
| `npx tsc --noEmit` | Checks the TypeScript types |
| `npm run eval` | Sends every case in `tests/cases.md` to both models and writes a side-by-side report to `tests/results/` |

## Built with

Expo, React Native and TypeScript.
