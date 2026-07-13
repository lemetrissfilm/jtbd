import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun, BookOpen, MessageSquare, CheckCircle, ArrowRight } from "lucide-react";

export default function Home() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme, switchable } = useTheme();
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("jtbd-last-chapter");
    setHasStarted(!!saved);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-md"
        style={{ borderBottom: "1px solid var(--border)" }}>
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
        {/* Subtle radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% -10%, var(--glass-strong) 0%, transparent 60%)",
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
          className="text-center font-semibold text-muted-foreground mb-12 max-w-sm"
          style={{ fontSize: "clamp(1rem, 2.5vw, 1.25rem)", letterSpacing: "-0.01em" }}
        >
          Понимайте пользователей через действия, а не слова
        </p>

        {/* Glass notification card */}
        <button
          onClick={() => navigate("/book")}
          className="mb-12 flex items-center gap-3 px-4 py-3 rounded-2xl glass-card group transition-all duration-200 active:scale-[0.98]"
          style={{
            maxWidth: "340px",
            width: "100%",
            boxShadow: "none",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 1px var(--glass-border), 0 0 24px 4px rgba(255,255,255,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-accent"
            style={{ background: "var(--glass-strong)" }}
          >
            <BookOpen className="w-5 h-5 text-foreground" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-foreground leading-tight">
              {hasStarted ? "Продолжить чтение" : "62 главы · 12 частей"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hasStarted ? "Вы уже начали — продолжайте" : "Полное руководство по методологии"}
            </p>
          </div>
        </button>

        {/* CTA button */}
        <button
          onClick={() => navigate("/book")}
          className="group btn-primary flex items-center gap-3 px-8 py-4 text-base"
        >
          {hasStarted ? "Продолжить чтение" : "Начать чтение"}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>

      </section>

      {/* ── Features strip ── */}
      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              icon: <BookOpen className="w-5 h-5" />,
              title: "Полная книга",
              desc: "62 главы о методологии Synthetic JTBD",
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
