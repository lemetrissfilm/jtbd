import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";

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
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content },
      ]);
    },
    onError: (error) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Ошибка: ${error.message}. Попробуйте ещё раз.`,
        },
      ]);
    },
  });

  const handleSendMessage = (content: string) => {
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content },
    ];
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
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/book")}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              К книге
            </Button>
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold">AI-ассистент по книге</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/trainer")}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <BookOpen className="w-4 h-4" />
              Тренажёр
            </Button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 flex flex-col gap-4">
        <div className="text-sm text-muted-foreground">
          Задавайте вопросы по методологии Synthetic JTBD. AI знает всё содержание книги и может объяснить любую концепцию.
        </div>

        <AIChatBox
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={chatMutation.isPending}
          placeholder="Спросите что-нибудь о методологии JTBD..."
          height="calc(100vh - 200px)"
          emptyStateMessage="Задайте вопрос по книге Synthetic JTBD"
          suggestedPrompts={SUGGESTED_PROMPTS}
        />
      </main>
    </div>
  );
}
