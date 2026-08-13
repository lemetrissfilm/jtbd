import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, CheckCircle, Sparkles, Sun, Moon, Compass, ShieldAlert } from "lucide-react";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";

const SUGGESTED_PROMPTS = [
  "Что такое Job Story и чем он отличается от User Story?",
  "Как создать синтетического пользователя?",
  "Как провести JTBD-интервью с AI?",
  "Объясни разницу между functional и emotional jobs",
  "Как избежать типичных ошибок в JTBD-исследовании?",
  "Что такое Job Map и как его строить?",
];

export default function ChatPage() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      const content = typeof data.content === "string" ? data.content : "Получен ответ.";
      setMessages((prev) => [...prev, { role: "assistant", content }]);
    },
    onError: (error) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Ошибка: ${error.message}. Попробуйте ещё раз.` },
      ]);
    },
  });

  const handleSendMessage = (content: string) => {
    const newMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    chatMutation.mutate({
      messages: newMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-3 bg-background"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/book")}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            К книге
          </button>
          <span className="text-border opacity-60">|</span>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background: "var(--glass-surface)", border: "1px solid var(--glass-border)" }}
            >
              <Sparkles className="w-3.5 h-3.5 text-foreground" />
            </div>
            <span className="font-bold text-sm tracking-tight text-foreground">AI-ассистент</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate("/trainer")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Тренажёр
          </button>
          <button
            onClick={() => navigate("/research")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          >
            <Compass className="w-3.5 h-3.5" />
            Исследование
          </button>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          >
            {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            AI знает содержание книги и помогает формулировать гипотезы, вопросы и артефакты.
          </p>
          <button onClick={() => navigate("/research")} className="flex items-center gap-1.5 text-xs font-semibold text-foreground transition-colors hover:text-muted-foreground">
            <ShieldAlert className="w-3.5 h-3.5" />
            Гипотеза ≠ факт
          </button>
        </div>
        <AIChatBox
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={chatMutation.isPending}
          placeholder="Спросите что-нибудь о методологии JTBD..."
          height="calc(100vh - 160px)"
          emptyStateMessage="Задайте вопрос по книге Synthetic JTBD"
          suggestedPrompts={SUGGESTED_PROMPTS}
        />
      </main>
    </div>
  );
}
