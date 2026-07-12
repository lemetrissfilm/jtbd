import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun, BookOpen, MessageSquare, CheckCircle, ArrowRight } from "lucide-react";

export default function Home() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("jtbd-last-chapter");
    setHasStarted(!!saved);
  }, []);

  const handleStart = () => {
    navigate("/book");
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
        <span className="text-sm font-semibold tracking-wide text-white/60">
          Synthetic <span className="text-white font-bold">JTBD</span>
        </span>
        <nav className="flex items-center gap-1">
          <button
            onClick={() => navigate("/chat")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            AI-чат
          </button>
          <button
            onClick={() => navigate("/trainer")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Тренажёр
          </button>
          <button
            onClick={() => navigate("/book")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Книга
          </button>
          <button
            onClick={toggleTheme}
            className="ml-1 p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-16">
        {/* Subtle radial glow from top */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,255,255,0.07) 0%, transparent 60%)",
          }}
        />

        {/* Top label */}
        <div className="mb-8 flex items-center gap-2">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-white/40">
            Методология
          </span>
        </div>

        {/* Main headline — Revolut-style massive type */}
        <h1
          className="text-center font-black leading-none tracking-tight mb-4"
          style={{
            fontSize: "clamp(3.5rem, 14vw, 9rem)",
            letterSpacing: "-0.035em",
            lineHeight: 0.92,
          }}
        >
          Synthetic
          <br />
          <span className="text-white/90">JTBD</span>
        </h1>

        {/* Subheadline */}
        <p
          className="text-center font-semibold text-white/50 mb-12 max-w-sm"
          style={{ fontSize: "clamp(1rem, 2.5vw, 1.25rem)", letterSpacing: "-0.01em" }}
        >
          Понимайте пользователей через действия, а не слова
        </p>

        {/* Glass notification card — Revolut signature element */}
        <div
          className="mb-12 flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            maxWidth: "340px",
            width: "100%",
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-tight">
              {hasStarted ? "Продолжить чтение" : "62 главы · 12 частей"}
            </p>
            <p className="text-xs text-white/50 mt-0.5">
              {hasStarted ? "Вы уже начали — продолжайте" : "Полное руководство по методологии"}
            </p>
          </div>
          <span className="text-xs text-white/40 flex-shrink-0">→</span>
        </div>

        {/* CTA button */}
        <button
          onClick={handleStart}
          className="group flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-black text-base transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: "#ffffff", letterSpacing: "-0.01em" }}
        >
          {hasStarted ? "Продолжить чтение" : "Начать чтение"}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>

        {/* Secondary links */}
        <div className="mt-6 flex items-center gap-6">
          <button
            onClick={() => navigate("/chat")}
            className="text-sm text-white/40 hover:text-white/70 transition-colors font-medium"
          >
            AI-чат по книге
          </button>
          <span className="text-white/20">·</span>
          <button
            onClick={() => navigate("/trainer")}
            className="text-sm text-white/40 hover:text-white/70 transition-colors font-medium"
          >
            Тренажёр артефактов
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
              className="group text-left p-5 rounded-2xl transition-all duration-200 hover:bg-white/[0.07] active:scale-[0.98]"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="text-white/50 mb-3 group-hover:text-white/80 transition-colors">
                {item.icon}
              </div>
              <p className="font-bold text-white text-sm mb-1">{item.title}</p>
              <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 pb-8 text-center">
        <p className="text-xs text-white/20">
          Synthetic JTBD · Дмитрий Михайлов
        </p>
      </footer>
    </div>
  );
}
