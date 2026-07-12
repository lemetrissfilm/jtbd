import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, CheckCircle, Sparkles, Sun, Moon } from "lucide-react";
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
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/book")}
            className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            К книге
          </button>
          <span className="text-white/15">|</span>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">AI-ассистент</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate("/trainer")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-white/40 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Тренажёр
          </button>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-full text-white/30 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 flex flex-col gap-3">
        <p className="text-xs text-white/30">
          AI знает всё содержание книги и может объяснить любую концепцию Synthetic JTBD
        </p>
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
