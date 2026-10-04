import { chat, Msg, ToolCall } from "./llm";
import { toolSpecs, runTool, tools } from "./tools";

export type Step = { tool: string; args: string; result: string };

const SYSTEM =
  "You are a helpful assistant. Use the provided tools when they help, then answer clearly and briefly.";

// Some local models (for example qwen2.5-coder) write tool calls as JSON text
// instead of structured tool_calls. This picks those calls out of the text.
function parseInlineCalls(text: string | null): ToolCall[] {
  if (!text) return [];
  const calls: ToolCall[] = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] !== "{") {
      i++;
      continue;
    }
    // find the matching closing brace, skipping braces inside strings
    let depth = 0, inStr = false, esc = false, end = -1;
    for (let j = i; j < text.length; j++) {
      const ch = text[j];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === "\\") esc = true;
        else if (ch === '"') inStr = false;
        continue;
      }
      if (ch === '"') inStr = true;
      else if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          end = j;
          break;
        }
      }
    }
    if (end === -1) break;
    try {
      const c = JSON.parse(text.slice(i, end + 1));
      if (c && typeof c.name === "string" && tools.some((t) => t.name === c.name)) {
        calls.push({
          id: `inline_${Date.now()}_${calls.length}`,
          type: "function",
          function: { name: c.name, arguments: JSON.stringify(c.arguments ?? c.parameters ?? {}) },
        });
      }
    } catch {}
    i = end + 1;
  }
  return calls;
}

// The agent loop: ask the model, run any tools it requests, feed results back, repeat.
export async function runAgent(history: Msg[]): Promise<{ answer: string; steps: Step[] }> {
  const maxSteps = Number(process.env.AGENT_MAX_STEPS ?? 6);
  const messages: Msg[] = [{ role: "system", content: SYSTEM }, ...history];
  const steps: Step[] = [];

  for (let i = 0; i < maxSteps; i++) {
    const reply = await chat(messages, toolSpecs);
    let calls = reply.tool_calls ?? [];
    const inline = calls.length === 0;
    if (inline) calls = parseInlineCalls(reply.content);

    if (calls.length === 0) {
      messages.push(reply);
      return { answer: reply.content ?? "", steps };
    }

    messages.push({ role: "assistant", content: inline ? null : reply.content, tool_calls: calls });
    for (const call of calls) {
      const result = await runTool(call.function.name, call.function.arguments);
      steps.push({ tool: call.function.name, args: call.function.arguments, result: result.slice(0, 500) });
      messages.push({ role: "tool", tool_call_id: call.id, name: call.function.name, content: result });
    }
  }
  return {
    answer: "Stopped after the maximum number of steps. Raise AGENT_MAX_STEPS or simplify the request.",
    steps,
  };
}