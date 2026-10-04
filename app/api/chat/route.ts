import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agent";
import type { Msg } from "@/lib/llm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!Array.isArray(body.messages)) {
      return NextResponse.json({ error: "messages must be an array." }, { status: 400 });
    }
    // Accept only user/assistant text from the browser, so clients cannot inject system or tool messages.
    const history = (body.messages as Msg[])
      .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content }));
    return NextResponse.json(await runAgent(history));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error." }, { status: 500 });
  }
}
