"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Role = "user" | "assistant" | "system";
type ChatMessage = { role: Role; content: string; tool_call_id?: string };
type ToolCall = { id: string; function: { name: string; arguments: string } };
type PuterResponse = { message?: { content?: string; tool_calls?: ToolCall[] }; content?: string };

declare global {
  interface Window {
    puter?: {
      ai: {
        chat: (messages: ChatMessage[], options?: Record<string, unknown>) => Promise<PuterResponse>;
      };
    };
  }
}

const MODEL = "gpt-5.6-luna";
const MAX_REPAIR_ROUNDS = 3;

const systemPrompt = `
You are Boss, a hands-on software agent. The user should only need to describe the goal.
You can plan, create code, test it, inspect failures, repair it, and verify the result yourself.

IMPORTANT WORKFLOW:
- Do not ask the user to press Run or open a sandbox.
- When a coding task needs verification, call run_sandbox yourself.
- Generate a complete self-contained HTML document for browser UI experiments.
- After run_sandbox returns an error, repair the HTML and call run_sandbox again.
- You may retry up to 3 verification rounds.
- Only claim something is verified when the sandbox result says ok=true.
- Keep the final answer concise and tell the user what was actually verified.

The internal sandbox is hidden from the user. It executes the generated HTML in an isolated iframe without SharedArrayBuffer.
`;

const sandboxTool = {
  type: "function",
  function: {
    name: "run_sandbox",
    description: "Run the current HTML in Boss's hidden internal browser sandbox. Use this to verify generated UI/code. Never ask the user to run it.",
    parameters: {
      type: "object",
      properties: {
        html: { type: "string", description: "A complete self-contained HTML document to execute." },
        purpose: { type: "string", description: "Short description of what is being verified." }
      },
      required: ["html", "purpose"],
      additionalProperties: false
    }
  }
};

function extractText(response: PuterResponse) {
  return response.message?.content ?? response.content ?? "";
}

function runHiddenSandbox(html: string): Promise<{ ok: boolean; errors: string[]; logs: string[] }> {
  return new Promise((resolve) => {
    const id = `boss-sandbox-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px;top:-9999px;border:0;";
    iframe.srcdoc = html;
    document.body.appendChild(iframe);

    const errors: string[] = [];
    const logs: string[] = [];
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onMessage);
      iframe.remove();
      resolve({ ok: errors.length === 0, errors, logs });
    };

    const timer = window.setTimeout(finish, 5000);

    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.__bossSandbox !== id) return;
      if (data.type === "error") errors.push(String(data.message || "Unknown runtime error"));
      if (data.type === "log") logs.push(String(data.message || ""));
      if (data.type === "ready") {
        window.clearTimeout(timer);
        window.setTimeout(finish, 500);
      }
    };

    window.addEventListener("message", onMessage);

    const instrument = `
      <script>
        (() => {
          const ID = ${JSON.stringify(id)};
          const send = (type, message) => parent.postMessage({__bossSandbox: ID, type, message}, "*");
          const oldError = console.error;
          console.error = (...args) => { send("error", args.map(String).join(" ")); oldError(...args); };
          window.addEventListener("error", (e) => send("error", e.message || "Script error"));
          window.addEventListener("unhandledrejection", (e) => send("error", String(e.reason || "Unhandled rejection")));
          send("ready", "sandbox-ready");
        })();
      </script>`;
    const injected = html.includes("</head>") ? html.replace("</head>", instrument + "</head>") : instrument + html;
    iframe.srcdoc = injected;
  });
}

async function askBoss(messages: ChatMessage[], onStatus: (s: string) => void) {
  if (!window.puter?.ai?.chat) throw new Error("Puter AI is not ready. Please wait a moment and try again.");

  const working = [...messages];
  for (let round = 0; round <= MAX_REPAIR_ROUNDS; round++) {
    onStatus(round === 0 ? "Boss กำลังวางแผน..." : `Boss กำลังแก้รอบที่ ${round}/${MAX_REPAIR_ROUNDS}...`);

    const response = await window.puter.ai.chat(working, {
      model: MODEL,
      normalize: true,
      temperature: 0.2,
      tools: [sandboxTool],
    });

    const toolCalls = response.message?.tool_calls ?? [];
    if (!toolCalls.length) return extractText(response);

    const assistantMessage = response.message ?? { content: "" };
    working.push({ role: "assistant", content: JSON.stringify(assistantMessage), ...(assistantMessage.tool_calls ? { tool_calls: assistantMessage.tool_calls } : {}) } as ChatMessage & { tool_calls?: ToolCall[] });

    for (const call of toolCalls) {
      if (call.function.name !== "run_sandbox") continue;
      const args = JSON.parse(call.function.arguments) as { html: string; purpose: string };
      onStatus(`Boss กำลังตรวจงานเอง: ${args.purpose}`);
      const result = await runHiddenSandbox(args.html);

      const report = JSON.stringify({
        ok: result.ok,
        errors: result.errors,
        logs: result.logs,
        instruction: result.ok
          ? "Verification passed. Continue to final response and state that the result was verified."
          : "Verification failed. Repair the HTML and call run_sandbox again."
      });

      working.push({ role: "tool", tool_call_id: call.id, content: report } as ChatMessage);
    }
  }

  return "Boss ตรวจและแก้ไขครบจำนวนรอบที่กำหนดแล้ว แต่ยังยืนยันผลสำเร็จไม่ได้";
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("พร้อมทำงาน");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, status]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;

    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setStatus("Boss รับงานแล้ว");

    try {
      const answer = await askBoss(
        [{ role: "system", content: systemPrompt }, ...next],
        setStatus
      );
      setMessages((current) => [...current, { role: "assistant", content: answer }]);
      setStatus("เสร็จแล้ว");
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: "assistant", content: `เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : String(error)}` }
      ]);
      setStatus("ต้องตรวจสอบการเชื่อมต่อ");
    } finally {
      setBusy(false);
    }
  }, [busy, input, messages]);

  return (
    <main className="boss-shell">
      <header className="boss-header">
        <div>
          <div className="brand">BossnuGrokXAI</div>
          <div className="subtitle">Chat-first Agent · Sandbox ทำงานเบื้องหลัง</div>
        </div>
        <div className={`status ${busy ? "working" : "idle"}`}>
          <span className="dot" />
          {status}
        </div>
      </header>

      <section className="chat">
        {messages.length === 0 ? (
          <div className="empty">
            <div className="orb">B</div>
            <h1>บอกเป้าหมายให้ Boss</h1>
            <p>Boss จะวางแผน ลงมือทดสอบ แก้ Error และตรวจผลให้เอง</p>
            <div className="chips">
              <button onClick={() => setInput("สร้างหน้าเว็บแชทเต็มจอให้ผม")}>สร้างหน้าเว็บ</button>
              <button onClick={() => setInput("ตรวจโค้ดนี้และแก้ Error ให้เอง")}>ตรวจและแก้โค้ด</button>
              <button onClick={() => setInput("สร้าง UI แล้วทดสอบให้ผ่านก่อนส่งผล")}>สร้าง + Verify</button>
            </div>
          </div>
        ) : (
          <div className="messages">
            {messages.map((message, index) => (
              <article key={index} className={`message ${message.role}`}>
                <div className="avatar">{message.role === "user" ? "คุณ" : "B"}</div>
                <div className="bubble">{message.content}</div>
              </article>
            ))}
            {busy && <div className="working-line"><span /> Boss กำลังทำงานเอง...</div>}
            <div ref={endRef} />
          </div>
        )}
      </section>

      <form className="composer" onSubmit={(e) => { e.preventDefault(); void send(); }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="บอก Boss ว่าต้องการให้ทำอะไร..."
          disabled={busy}
          rows={1}
        />
        <button className="send" type="submit" disabled={busy || !input.trim()}>
          {busy ? "กำลังทำ" : "ส่ง"}
        </button>
      </form>

      <div className="privacy">Sandbox ภายในถูกซ่อนจากผู้ใช้ · ไม่มีปุ่ม Run · Boss เป็นคนเรียก Tool เอง</div>
    </main>
  );
}
