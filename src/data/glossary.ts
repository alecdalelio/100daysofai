export type GlossaryEntry = {
  term: string;
  short: string;       // 1–2 sentence tooltip definition
  tags?: string[];     // e.g., "tool", "concept", "workflow"
  aka?: string[];      // synonyms or common variants
};

export const GLOSSARY: GlossaryEntry[] = [
  { term: "ChatGPT", short: "OpenAI's chat assistant used for writing, coding, and analysis.", tags: ["tool","assistant"], aka:["GPT"] },
  { term: "Claude", short: "Anthropic's chat assistant known for helpful, careful, long‑context reasoning.", tags:["tool","assistant"] },
  { term: "GitHub Copilot", short: "AI pair‑programmer inside your editor that suggests code as you type.", tags:["tool","code"], aka:["Copilot"] },
  { term: "Cursor", short: "An AI‑powered code editor that can read your repo and generate edits via agents.", tags:["tool","code"] },
  { term: "Perplexity", short: "AI search that answers with sources; great for research and quick overviews.", tags:["tool","search"] },
  { term: "Lovable", short: "A visual builder that ships full‑stack apps quickly with AI‑assisted edits.", tags:["tool","builder"] },
  { term: "Suno", short: "Text‑to‑music tool for songs, instrumentals, and vocals.", tags:["tool","media"] },
  { term: "Midjourney", short: "Text‑to‑image model for stylized, high‑quality images.", tags:["tool","media"] },
  { term: "Runway", short: "Video generation and editing with AI (text‑to‑video, effects, greenscreen).", tags:["tool","media"] },
  { term: "Pika", short: "AI video generation and editing focused on short, stylized clips.", tags:["tool","media"] },
  { term: "Leonardo AI", short: "Image generation with fine‑tuning options and asset workflows.", tags:["tool","media"] },
  { term: "Replit Ghostwriter", short: "AI coding assistant built into Replit's cloud IDE.", tags:["tool","code"], aka:["Ghostwriter"] },
  { term: "Notion AI", short: "AI features inside Notion for writing, summaries, and database help.", tags:["tool","productivity"] },

  { term: "Assistants API", short: "OpenAI API that manages tools, files, and threads to build multi‑step assistants.", tags:["api","openai"], aka:["OpenAI Assistants"] },
  { term: "Whisper", short: "OpenAI's speech‑to‑text model for accurate transcription.", tags:["api","speech"] },
  { term: "Text‑to‑Speech (TTS)", short: "Convert text into natural‑sounding audio using models or cloud APIs.", tags:["api","speech"], aka:["TTS"] },
  { term: "Vision models", short: "Models that can understand images (and sometimes video) plus text.", tags:["api","vision"], aka:["multimodal"] },

  { term: "Prompt", short: "The instructions or message you give an AI model.", tags:["concept"] },
  { term: "System Prompt", short: "Hidden instructions that set role, style, and guardrails for the model.", tags:["concept"], aka:["System Message"] },
  { term: "Few‑shot", short: "Providing a few examples in the prompt so the model learns the pattern.", tags:["concept"] },
  { term: "Tokens", short: "Units of text the model reads/writes (≈ words or word pieces). Affects cost/length.", tags:["concept"] },
  { term: "Temperature", short: "Controls randomness: higher = more creative; lower = more deterministic.", tags:["concept"] },
  { term: "Top‑p", short: "Another creativity control; limits choices to the top probability mass p.", tags:["concept"] },
  { term: "Function Calling / Tools", short: "Let the model call your functions/APIs to fetch data or take actions.", tags:["concept","dev"], aka:["Tool Use"] },
  { term: "Agents", short: "Systems that let models plan, call tools, and iterate toward a goal.", tags:["concept","dev"] },

  { term: "Embeddings", short: "Number vectors that represent meaning; used for search, clustering, and RAG.", tags:["concept","vector"] },
  { term: "Vector Database", short: "Stores embeddings to find semantically similar items fast.", tags:["concept","vector"], aka:["Vector DB"] },
  { term: "RAG", short: "Retrieval‑Augmented Generation: look up relevant info first, then generate an answer.", tags:["concept","pattern"] },
  { term: "MCP", short: "Model Context Protocol: a standard for exposing tools/data to AI apps.", tags:["concept","protocol"] },

  { term: "LangChain", short: "Python/JS framework for building LLM apps with prompts, tools, and memory.", tags:["framework"] },
  { term: "LlamaIndex", short: "Framework focused on data connectors, indexes, and retrieval (RAG).", tags:["framework"] },
  { term: "FastAPI", short: "Fast Python web framework—great for APIs powering AI apps.", tags:["framework","backend"] },
  { term: "n8n", short: "Open‑source automation tool to chain APIs and jobs without heavy code.", tags:["automation"] },
  { term: "Playwright", short: "Browser automation/testing library; often used for scraping and UI tasks.", tags:["automation","testing"] },
  { term: "Webhooks", short: "HTTP callbacks from one app to your endpoint to notify you of events.", tags:["infra"] }
];

export function getDefinition(term: string): GlossaryEntry | undefined {
  const t = term.trim().toLowerCase();
  return GLOSSARY.find(e =>
    e.term.toLowerCase() === t || (e.aka ?? []).some(a => a.toLowerCase() === t)
  );
}
