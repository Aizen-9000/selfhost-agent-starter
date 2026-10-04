"use client";
import { useState } from "react";

type Step = { tool: string; args: string; result: string };
type Item = { role: "user" | "assistant"; content: string; steps?: Step[] };

export default function Page() {
  const [items, setItems] = useState<Item[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const next: Item[] = [...items, { role: "user", content: text }];
    setItems(next);
    setInput("");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed.");
      setItems([...next, { role: "assistant", content: data.answer, steps: data.steps }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <h1>Self-hosted AI agent</h1>
      {items.length === 0 && (
        <p className="empty">Ask something that needs a tool, like “What is 18% of 2,450, and what time is it?”</p>
      )}
      {items.map((m, i) => (
        <div key={i} className={`msg ${m.role}`}>
          {m.steps?.map((s, j) => (
            <details key={j}>
              <summary>Used {s.tool}</summary>
              <pre>{s.args}{"\n"}{s.result}</pre>
            </details>
          ))}
          <p>{m.content}</p>
        </div>
      ))}
      {busy && <p className="status">Thinking…</p>}
      {error && <p className="error">{error}</p>}
      <form onSubmit={send}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Message the agent" aria-label="Message" />
        <button disabled={busy}>Send</button>
      </form>
    </main>
  );
}
