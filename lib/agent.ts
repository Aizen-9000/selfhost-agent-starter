import { chat, Msg } from "./llm";
import { toolSpecs, runTool } from "./tools";

export type Step = { tool: string; args: string; result: string };

const SYSTEM =
  "You are a helpful assistant. Use the provided tools when they help, then answer clearly and briefly.";

// The agent loop: ask the model, run any tools it requests, feed results back, repeat.
export async function runAgent(history: Msg[]): Promise<{ answer: string; steps: Step[] }> {
  const maxSteps = Number(process.env.AGENT_MAX_STEPS ?? 6);
  const messages: Msg[] = [{ role: "system", content: SYSTEM }, ...history];
  const steps: Step[] = [];

  for (let i = 0; i < maxSteps; i++) {
    const reply = await chat(messages, toolSpecs);
    messages.push(reply);
    if (!reply.tool_calls?.length) return { answer: reply.content ?? "", steps };

    for (const call of reply.tool_calls) {
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
