# Self-Hosted AI Agent Starter

A small Next.js app with a tool-calling agent loop. It runs on a local model through [Ollama](https://ollama.com) by default, so no API key is needed and nothing leaves your machine. To use a hosted model instead, bring your own key for any OpenAI-compatible API by changing three environment variables.


https://github.com/user-attachments/assets/6c79ea50-1acf-4a97-87dc-df626502cc2d



## Why this exists

- **Local first.** Run the agent on your own hardware with Ollama.
- **Bring your own key.** Switch to any OpenAI-compatible API with no code changes.
- **Easy to read.** The core is four small files, so you can see exactly how an agent loop works and change it.

## Quickstart

1. Install Ollama and pull a model that supports tools: `ollama pull llama3.1`
2. `npm install`
3. `cp .env.example .env.local`
4. `npm run dev` and open http://localhost:3000

Try: "What is 18% of 2,450, and what time is it?" You will see the agent call tools and then answer.

## Use your own API key

Edit `.env.local` and set `LLM_BASE_URL`, `LLM_MODEL` and `LLM_API_KEY`. Examples are in `.env.example`.

## How it works

- `lib/agent.ts`: the loop. Ask the model, run the tools it requests, feed the results back, stop at an answer or `AGENT_MAX_STEPS`.
- `lib/tools.ts`: the tools (`get_time`, `calculator`, `fetch_url`). Add a tool by adding one object to the array.
- `lib/llm.ts`: one client for Ollama and bring-your-own-key.
- `app/api/chat/route.ts`: the API route. It accepts only user and assistant text from the browser.

## Lite and Pro

| | Lite (this repo, free, MIT) | Pro (in development) |
|---|---|---|
| Agent loop with tools | Yes | Yes |
| Ollama and bring-your-own-key | Yes | Yes |
| Minimal chat UI | Yes | Yes |
| Streaming, persistent memory, Docker setup | No | Planned |
| Approval step for risky tools, login, rate limiting | No | Planned |

Pro link - https://majiwave3.gumroad.com/l/ycoiah

## Before you put it on the internet

This starter has no login and no rate limiting. The `fetch_url` tool blocks common private addresses but is a basic guard, not a full security layer. Add authentication and limits before exposing it publicly.

## License

MIT. See `LICENSE`.
