export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type Msg = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
};

// One client for Ollama and bring-your-own-key: both speak the OpenAI chat format.
export async function chat(messages: Msg[], tools: unknown[]): Promise<Msg> {
  const base = process.env.LLM_BASE_URL ?? "http://localhost:11434/v1";
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LLM_API_KEY ?? "ollama"}`,
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL ?? "llama3.1",
      messages,
      tools,
    }),
  });
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new Error(
      `Model request failed (${res.status}). Check LLM_BASE_URL and LLM_MODEL in .env.local. ${body}`
    );
  }
  const data = await res.json();
  return data.choices[0].message as Msg;
}
