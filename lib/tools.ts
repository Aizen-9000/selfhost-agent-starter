type Tool = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  run: (args: any) => Promise<string> | string;
};

// To add a tool: push another object into this array. The agent picks it up automatically.
export const tools: Tool[] = [
  {
    name: "get_time",
    description: "Get the current date and time in ISO format.",
    parameters: { type: "object", properties: {} },
    run: () => new Date().toISOString(),
  },
  {
    name: "calculator",
    description: "Evaluate an arithmetic expression such as (18/100)*2450.",
    parameters: {
      type: "object",
      properties: { expression: { type: "string" } },
      required: ["expression"],
    },
    run: ({ expression }) => {
      const expr = String(expression ?? "").slice(0, 100);
      if (!/^[0-9+\-*/().%\s^]+$/.test(expr)) return "Error: only numbers and + - * / ( ) % ^ are allowed.";
      try {
        return String(Function(`"use strict"; return (${expr.replace(/\^/g, "**")})`)());
      } catch {
        return "Error: could not evaluate that expression.";
      }
    },
  },
  {
    name: "fetch_url",
    description: "Download a public web page and return its text (first 4000 characters).",
    parameters: {
      type: "object",
      properties: { url: { type: "string" } },
      required: ["url"],
    },
    run: async ({ url }) => {
      let u: URL;
      try {
        u = new URL(String(url));
      } catch {
        return "Error: invalid URL.";
      }
      const host = u.hostname;
      const blocked = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1)/;
      if (!["http:", "https:"].includes(u.protocol) || blocked.test(host)) {
        return "Error: only public http(s) addresses are allowed.";
      }
      const res = await fetch(u, { signal: AbortSignal.timeout(8000) });
      const html = await res.text();
      return html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 4000);
    },
  },
];

export const toolSpecs = tools.map((t) => ({
  type: "function",
  function: { name: t.name, description: t.description, parameters: t.parameters },
}));

export async function runTool(name: string, argsJson: string): Promise<string> {
  const tool = tools.find((t) => t.name === name);
  if (!tool) return `Error: unknown tool "${name}".`;
  try {
    return await tool.run(argsJson ? JSON.parse(argsJson) : {});
  } catch (e) {
    return `Error: ${e instanceof Error ? e.message : "tool failed"}`;
  }
}
