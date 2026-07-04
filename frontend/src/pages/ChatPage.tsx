import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, MessageSquare } from "lucide-react";
import { sendChat } from "../services/chat";
import type { ChatMessage } from "../types";

const FAQ_BUTTONS = [
  "Resume el estado del negocio",
  "¿Cuántos clientes tienen riesgo alto?",
  "Compara los segmentos de clientes",
  "¿Qué variables influyen más en el churn?",
  "¿Qué ocurriría si reducimos el MTTR?",
  "¿Qué recomendaciones estratégicas hay?",
  "Analiza el cliente CLI-0002",
  "¿Qué tendencias observas?",
];

const WELCOME: ChatMessage = {
  id:        "0",
  role:      "assistant",
  content:   "Hola 👋 Soy el Asistente BI+AI de Integratel Perú.\n\nPuedo analizar clientes, interpretar KPIs, ejecutar predicciones con el modelo XGBoost y generar recomendaciones estratégicas basadas en datos reales del sistema.\n\nPrueba preguntarme: 'Resume el estado del negocio' o 'Analiza el cliente CLI-0042'.",
  timestamp: new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
};

function Bubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isUser ? "bg-primary-600" : "bg-gray-200"}`}>
        {isUser
          ? <User className="w-3.5 h-3.5 text-white" />
          : <Bot  className="w-3.5 h-3.5 text-gray-600" />}
      </div>
      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? "bg-primary-600 text-white rounded-br-none"
          : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
      }`}>
        {msg.content}
        <p className={`text-[10px] mt-1 ${isUser ? "text-primary-200 text-right" : "text-gray-400"}`}>
          {msg.timestamp}
        </p>
      </div>
    </div>
  );
}

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const now = new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });

    const userMsg: ChatMessage = {
      id: Date.now().toString(), role: "user", content: text, timestamp: now,
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res  = await sendChat(text);
      const reply = res.data.data.reply;
      setMessages((m) => [...m, {
        id:        Date.now().toString() + "r",
        role:      "assistant",
        content:   reply,
        timestamp: new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
      }]);
    } catch {
      setMessages((m) => [...m, {
        id:        Date.now().toString() + "e",
        role:      "assistant",
        content:   "⚠️ No pude conectarme al servidor. Verifica que el backend esté activo.",
        timestamp: now,
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.14)-theme(spacing.12))]">
      {/* Header */}
      <div className="card p-4 flex items-center gap-3 mb-4 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-gray-800">Asistente BI+AI</p>
          <p className="text-xs text-green-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            En línea
          </p>
        </div>
      </div>

      {/* FAQ quick buttons */}
      <div className="flex flex-wrap gap-2 mb-4 shrink-0">
        {FAQ_BUTTONS.map((q) => (
          <button
            key={q}
            id={`faq-${q.slice(0, 20).replace(/\s/g, "-")}`}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 transition-colors"
            onClick={() => send(q)}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
        {messages.map((m) => <Bubble key={m.id} msg={m} />)}
        {loading && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-gray-600" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-3 shrink-0">
        <input
          id="chat-input"
          className="input flex-1"
          placeholder="Escribe tu pregunta…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
          disabled={loading}
        />
        <button
          id="chat-send"
          className="btn-primary px-4"
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
