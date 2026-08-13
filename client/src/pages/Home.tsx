import { useLocation } from "wouter";
import { useEffect, useState, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun, BookOpen, MessageSquare, CheckCircle, ArrowRight, Send, Loader2, Compass } from "lucide-react";
import { trpc } from "@/lib/trpc";
import chaptersData from "@/data/chapters_full.json";

const SUGGESTIONS = [
  "Что такое Job Story?",
  "Как создать нейроперсону?",
  "Чем JTBD лучше персон?",
  "Что такое Context Canvas?",
  "Как считать Opportunity Score?",
  "С чего начать исследование?",
];

export default function Home() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [hasStarted, setHasStarted] = useState(false);

  // Chat state
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = trpc.ai.chat.useMutation();
  const chapterCount = chaptersData.filter((chapter) => !chapter.title.includes("ЧАСТЬ")).length;
  const partCount = chaptersData.filter((chapter) => chapter.title.includes("ЧАСТЬ")).length;

  useEffect(() => {
    const saved = localStorage.getItem("jtbd-last-chapter");
    setHasStarted(!!saved);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg = text.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);
    try {
      const res = await chatMutation.mutateAsync({
        messages: [{ role: "user" as const, content: userMsg }],
      });
      const rawContent = res?.content;
      const reply = typeof rawContent === "string" ? rawContent : "Не удалось получить ответ.";
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Произошла ошибка. Попробуйте ещё раз." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── Header ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-md"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <span className="text-sm font-semibold tracking-wide text-muted-foreground">
          Synthetic <span className="text-foreground font-bold">JTBD</span>
        </span>
        <nav className="flex items-center gap-1">
          <button
            onClick={() => navigate("/chat")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            AI-чат
          </button>
          <button
            onClick={() => navigate("/trainer")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Тренажёр
          </button>
          <button
            onClick={() => navigate("/research")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          >
            <Compass className="w-3.5 h-3.5" />
            Исследование
          </button>
          <button
            onClick={() => navigate("/book")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Книга
          </button>
          <button
            onClick={toggleTheme}
            className="ml-1 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          >
            {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-16">
        {/* Radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, var(--glass-strong) 0%, transparent 60%)",
          }}
        />

        {/* Top label */}
        <div className="mb-8">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">
            Методология
          </span>
        </div>

        {/* Main headline */}
        <h1
          className="text-center font-black text-foreground leading-none tracking-tight mb-4"
          style={{
            fontSize: "clamp(3.5rem, 14vw, 9rem)",
            letterSpacing: "-0.035em",
            lineHeight: 0.92,
          }}
        >
          Synthetic
          <br />
          JTBD
        </h1>

        {/* Subheadline */}
        <p
          className="text-center font-semibold text-muted-foreground mb-10 max-w-sm"
          style={{ fontSize: "clamp(1rem, 2.5vw, 1.25rem)", letterSpacing: "-0.01em" }}
        >
          Понимайте пользователей через действия, а не слова
        </p>

        {/* ── Inline AI Chat ── */}
        <div className="w-full max-w-lg flex flex-col gap-3">
          {/* Message bubbles */}
          {messages.length > 0 && (
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto px-1">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-foreground text-background font-medium rounded-br-sm"
                        : "glass-card text-foreground rounded-bl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="glass-card px-4 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Думаю...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Suggestion bubbles — show only when no messages yet */}
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium glass-card text-muted-foreground hover:text-foreground hover:bg-accent transition-all active:scale-[0.97]"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input row */}
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-2xl glass-card"
            style={{ border: "1px solid var(--glass-border)" }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Спросите что-нибудь о Synthetic JTBD..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="p-1.5 rounded-xl bg-foreground text-background disabled:opacity-30 hover:opacity-80 transition-all active:scale-95 flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Book link below chat */}
          <button
            onClick={() => navigate("/book")}
            className="self-center flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {hasStarted ? "Продолжить чтение книги" : `Читать книгу — ${chapterCount} главы · ${partCount} частей`}
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </section>

      {/* ── Features strip ── */}
      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              icon: <BookOpen className="w-5 h-5" />,
              title: "Полная книга",
              desc: `${chapterCount} главы о методологии Synthetic JTBD`,
              action: () => navigate("/book"),
            },
            {
              icon: <MessageSquare className="w-5 h-5" />,
              title: "AI-чат",
              desc: "Задавайте вопросы по книге",
              action: () => navigate("/chat"),
            },
            {
              icon: <CheckCircle className="w-5 h-5" />,
              title: "Тренажёр",
              desc: "Проверяйте свои артефакты JTBD",
              action: () => navigate("/trainer"),
            },
            {
              icon: <Compass className="w-5 h-5" />,
              title: "Research Navigator",
              desc: "Соберите исследование от решения до валидации",
              action: () => navigate("/research"),
            },
          ].map((item) => (
            <button
              key={item.title}
              onClick={item.action}
              className="group text-left p-5 rounded-2xl glass-card hover:bg-accent/50 transition-all active:scale-[0.98]"
            >
              <div className="text-muted-foreground mb-3 group-hover:text-foreground transition-colors">
                {item.icon}
              </div>
              <p className="font-bold text-foreground text-sm mb-1">{item.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 pb-8 text-center">
        <p className="text-xs text-muted-foreground opacity-50">
          Synthetic JTBD · Дмитрий Михайлов
        </p>
      </footer>
    </div>
  );
}
