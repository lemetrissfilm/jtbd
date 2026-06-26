import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, CheckCircle, MessageSquare, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

type EvalMessage = {
  role: "user" | "assistant";
  content: string;
};

const ARTIFACT_TYPES = [
  { value: "job_story", label: "Job Story" },
  { value: "jtbd_statement", label: "JTBD Statement" },
  { value: "synthetic_persona", label: "Синтетический персонаж" },
  { value: "interview_guide", label: "Гайд для интервью" },
  { value: "job_map", label: "Job Map" },
  { value: "opportunity_score", label: "Opportunity Score" },
  { value: "other", label: "Другое" },
];

const ARTIFACT_EXAMPLES: Record<string, string> = {
  job_story: `Когда я [ситуация], я хочу [мотивация], чтобы [ожидаемый результат].

Пример:
Когда я начинаю новый продуктовый проект, я хочу быстро понять реальные потребности пользователей, чтобы не тратить ресурсы на ненужные функции.`,
  jtbd_statement: `[Тип пользователя] нанимает [продукт/решение] для [работы], когда [контекст/триггер].

Пример:
Продакт-менеджер нанимает JTBD-интервью для понимания мотивации пользователей, когда команда расходится во мнениях о приоритетах разработки.`,
  synthetic_persona: `Имя: Алексей, 34 года, Senior PM в финтех-стартапе

Поведенческие данные:
- Использует Figma и Notion ежедневно
- Читает 3-5 статей о продукте в неделю
- Участвует в 2-3 исследованиях в квартал

Jobs to Be Done:
- Functional: Получить данные для обоснования решений перед стейкхолдерами
- Emotional: Чувствовать уверенность в правильности продуктовых решений
- Social: Выглядеть компетентным экспертом в команде`,
  interview_guide: `Тема: JTBD-интервью для понимания работы "планирование UX-исследования"

1. Расскажите о последнем разе, когда вы планировали UX-исследование
2. Что послужило триггером для начала исследования?
3. Какие альтернативы вы рассматривали?
4. Что было самым сложным в процессе?
5. Как вы поняли, что исследование прошло успешно?`,
  job_map: `Работа: Провести UX-исследование

1. Определить → Сформулировать исследовательский вопрос
2. Подготовить → Выбрать метод, создать гайд, найти участников
3. Провести → Записать интервью, наблюдать за поведением
4. Анализировать → Кодировать данные, находить паттерны
5. Синтезировать → Создать инсайты, Job Stories
6. Применить → Передать команде, приоритизировать`,
  opportunity_score: `Работа: Получить обратную связь от пользователей быстро

Важность (1-10): 9 — критично для принятия решений
Удовлетворённость (1-10): 4 — текущие методы медленные и дорогие
Opportunity Score: 9 + (9-4) = 14 → Высокий приоритет`,
  other: `Вставьте ваш артефакт здесь...`,
};

export default function TrainerPage() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [artifact, setArtifact] = useState("");
  const [selectedType, setSelectedType] = useState("job_story");
  const [evalMessages, setEvalMessages] = useState<EvalMessage[]>([]);
  const [followUpInput, setFollowUpInput] = useState("");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const evaluateMutation = trpc.ai.evaluate.useMutation({
    onSuccess: (data) => {
      const content = typeof data.content === "string" ? data.content : "Оценка получена.";
      const userMsg = evalMessages.length === 0
        ? `Проверь этот артефакт (тип: ${ARTIFACT_TYPES.find(t => t.value === selectedType)?.label}):\n\n${artifact}`
        : followUpInput;

      setEvalMessages((prev) => [
        ...prev,
        { role: "user", content: userMsg },
        { role: "assistant", content },
      ]);
      setFollowUpInput("");
    },
    onError: (error) => {
      setEvalMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Ошибка: ${error.message}` },
      ]);
    },
  });

  const handleEvaluate = () => {
    if (!artifact.trim()) return;
    const userMsg = `Проверь этот артефакт (тип: ${ARTIFACT_TYPES.find(t => t.value === selectedType)?.label}):\n\n${artifact}`;
    evaluateMutation.mutate({
      artifact,
      artifactType: selectedType,
      messages: [{ role: "user", content: userMsg }],
    });
  };

  const handleFollowUp = () => {
    if (!followUpInput.trim() || evalMessages.length === 0) return;
    const allMessages: EvalMessage[] = [
      ...evalMessages,
      { role: "user", content: followUpInput },
    ];
    evaluateMutation.mutate({
      artifact,
      artifactType: selectedType,
      messages: allMessages,
    });
  };

  const handleReset = () => {
    setEvalMessages([]);
    setFollowUpInput("");
  };

  const loadExample = () => {
    setArtifact(ARTIFACT_EXAMPLES[selectedType] || "");
  };

  const selectedTypeLabel = ARTIFACT_TYPES.find(t => t.value === selectedType)?.label || "Job Story";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
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
                <CheckCircle className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold">Тренажёр JTBD</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/chat")}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <MessageSquare className="w-4 h-4" />
              AI-чат
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
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Left: Artifact input */}
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Ваш артефакт</h2>
              <p className="text-sm text-muted-foreground">
                Напишите или вставьте артефакт JTBD — AI проверит его по критериям методологии
              </p>
            </div>

            {/* Artifact type selector */}
            <div className="relative">
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                Тип артефакта
              </label>
              <button
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-background hover:bg-secondary/50 transition-colors text-sm"
              >
                <span>{selectedTypeLabel}</span>
                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showTypeDropdown && "rotate-180")} />
              </button>
              {showTypeDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-border bg-card shadow-lg z-10">
                  {ARTIFACT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => {
                        setSelectedType(type.value);
                        setShowTypeDropdown(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 transition-colors first:rounded-t-lg last:rounded-b-lg",
                        selectedType === type.value && "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Artifact textarea */}
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">
                  Текст артефакта
                </label>
                <button
                  onClick={loadExample}
                  className="text-xs text-primary hover:underline"
                >
                  Загрузить пример
                </button>
              </div>
              <Textarea
                value={artifact}
                onChange={(e) => setArtifact(e.target.value)}
                placeholder={`Напишите ${selectedTypeLabel} для проверки...`}
                className="flex-1 min-h-[300px] resize-none font-mono text-sm leading-relaxed"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleEvaluate}
                disabled={!artifact.trim() || evaluateMutation.isPending}
                className="flex-1 gap-2"
              >
                {evaluateMutation.isPending ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    Проверяю...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Проверить артефакт
                  </>
                )}
              </Button>
              {evalMessages.length > 0 && (
                <Button variant="outline" onClick={handleReset} size="sm">
                  Сбросить
                </Button>
              )}
            </div>
          </div>

          {/* Right: Feedback panel */}
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Обратная связь AI</h2>
              <p className="text-sm text-muted-foreground">
                AI проверит артефакт по критериям методологии и даст рекомендации
              </p>
            </div>

            <div className="flex-1 rounded-lg border border-border bg-card overflow-hidden flex flex-col" style={{ minHeight: "400px" }}>
              {evalMessages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center text-muted-foreground">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-primary/50" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Готов к проверке</p>
                    <p className="text-sm">
                      Напишите артефакт слева и нажмите «Проверить» — AI оценит его по критериям Synthetic JTBD
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full max-w-xs text-xs">
                    {["Соответствие формату", "Глубина инсайтов", "Actionability", "Точность формулировок"].map((c) => (
                      <div key={c} className="px-3 py-2 rounded-lg bg-secondary/50 border border-border">
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col flex-1 overflow-hidden">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {evalMessages.map((msg, i) => (
                        <div key={i} className={cn(
                          "rounded-lg p-4",
                          msg.role === "user"
                            ? "bg-secondary/30 border border-border"
                            : "bg-primary/5 border border-primary/20"
                        )}>
                          <div className="flex items-center gap-2 mb-2">
                            {msg.role === "user" ? (
                              <>
                                <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
                                  <span className="text-xs font-bold">В</span>
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">Ваш артефакт</span>
                              </>
                            ) : (
                              <>
                                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                                  <Sparkles className="w-3 h-3 text-primary" />
                                </div>
                                <span className="text-xs font-medium text-primary">AI-ментор</span>
                              </>
                            )}
                          </div>
                          {msg.role === "assistant" ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                              <Streamdown>{msg.content}</Streamdown>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap font-mono text-muted-foreground line-clamp-3">
                              {msg.content}
                            </p>
                          )}
                        </div>
                      ))}
                      {evaluateMutation.isPending && (
                        <div className="rounded-lg p-4 bg-primary/5 border border-primary/20">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                              <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                            </div>
                            <span className="text-xs font-medium text-primary">AI-ментор анализирует...</span>
                          </div>
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <div
                                key={i}
                                className="w-2 h-2 rounded-full bg-primary/40 animate-bounce"
                                style={{ animationDelay: `${i * 150}ms` }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Follow-up input */}
                  {evalMessages.length > 0 && !evaluateMutation.isPending && (
                    <div className="border-t border-border p-3 flex gap-2">
                      <Textarea
                        value={followUpInput}
                        onChange={(e) => setFollowUpInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleFollowUp();
                          }
                        }}
                        placeholder="Уточните или задайте вопрос по оценке..."
                        className="flex-1 min-h-[60px] max-h-[120px] resize-none text-sm"
                        rows={2}
                      />
                      <Button
                        onClick={handleFollowUp}
                        disabled={!followUpInput.trim()}
                        size="sm"
                        className="self-end"
                      >
                        Отправить
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
