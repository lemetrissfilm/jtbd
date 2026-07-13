import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, CheckCircle, MessageSquare, Sparkles } from "lucide-react";
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
  { value: "job_chain", label: "Job Chain" },
  { value: "jtbd_statement", label: "JTBD Statement" },
  { value: "synthetic_persona", label: "Синтетический персонаж" },
  { value: "interview_guide", label: "Гайд для интервью" },
  { value: "job_map", label: "Job Map" },
  { value: "opportunity_score", label: "Opportunity Score" },
  { value: "other", label: "Другое" },
];

const ARTIFACT_EXAMPLES: Record<string, string> = {
  job_chain: `Работа: Оплатить на кассе через банковское приложение

1. Разблокировать телефон [налоговый]
   Критерий: быстро, без пин-кода
2. Найти приложение [налоговый]
   Критерий: сразу на главном экране
3. Ввести пин-код [налоговый]
   Критерий: Face ID или Touch ID
4. Ожидать загрузку [налоговый]
   Критерий: < 1 секунды
5. Приложить телефон к терминалу [основной]
   Критерий: подтверждение сразу
6. Убедиться, что платёж прошёл [основной]
   Критерий: чёткое визуальное подтверждение
7. Извиниться перед очередью [лишний]
   Критерий: убрать полностью`,
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
  opportunity_score: `Контекст: Продукт — платформа для проведения UX-исследований
Персонаж: Алексей, Senior PM в финтех-стартапе
Job Chain: Спланировать и провести UX-исследование за 1 неделю

| # | Работа (Job)                          | Важность | Удовлетворённость | OS = I + max(I-S, 0) | Приоритет  |
|---|---------------------------------------|----------|-------------------|----------------------|------------|
| 1 | Найти подходящих респондентов         |    9     |         3         |    9 + (9-3) = 15    | 🔴 Критический |
| 2 | Составить скрипт интервью             |    8     |         5         |    8 + (8-5) = 11    | 🟠 Высокий |
| 3 | Договориться о времени встречи        |    7     |         4         |    7 + (7-4) = 10    | 🟠 Высокий |
| 4 | Провести интервью и записать          |    9     |         7         |    9 + (9-7) = 11    | 🟠 Высокий |
| 5 | Расшифровать запись                   |    6     |         2         |    6 + (6-2) = 10    | 🟠 Высокий |
| 6 | Синтезировать инсайты в Job Stories   |    8     |         3         |    8 + (8-3) = 13    | 🟠 Высокий |
| 7 | Презентовать результаты команде       |    5     |         7         |    5 + max(5-7,0) = 5| 🟢 Низкий  |

Вывод: Наибольшая возможность — «Найти подходящих респондентов» (OS=15).`,
  other: `Вставьте ваш артефакт здесь...`,
};

export default function TrainerPage() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [artifact, setArtifact] = useState("");
  const [selectedType, setSelectedType] = useState("job_story");
  const [evalMessages, setEvalMessages] = useState<EvalMessage[]>([]);
  const [followUpInput, setFollowUpInput] = useState("");
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
    const allMessages: EvalMessage[] = [...evalMessages, { role: "user", content: followUpInput }];
    evaluateMutation.mutate({ artifact, artifactType: selectedType, messages: allMessages });
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
          <span className="text-muted-foreground opacity-40">|</span>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background: "var(--glass-surface)", border: "1px solid var(--glass-border)" }}
            >
              <CheckCircle className="w-3.5 h-3.5 text-foreground" />
            </div>
            <span className="font-bold text-sm tracking-tight text-foreground">Тренажёр JTBD</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate("/chat")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            AI-чат
          </button>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          >
            {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">

          {/* Left: Artifact input */}
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-black tracking-tight text-foreground">Ваш артефакт</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Напишите или вставьте артефакт JTBD — AI проверит его по критериям методологии
              </p>
            </div>

            {/* Type selector — tiles */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">
                Тип артефакта
              </label>
              <div className="flex flex-wrap gap-2">
                {ARTIFACT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95",
                      selectedType === type.value
                        ? "bg-foreground text-background font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    style={{
                      background: selectedType === type.value ? "var(--foreground)" : "var(--glass-surface)",
                      border: selectedType === type.value ? "1px solid transparent" : "1px solid var(--glass-border)",
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Текст артефакта
                </label>
                <button
                  onClick={loadExample}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Загрузить пример →
                </button>
              </div>
              <textarea
                value={artifact}
                onChange={(e) => setArtifact(e.target.value)}
                placeholder={`Напишите ${selectedTypeLabel} для проверки...`}
                className="flex-1 min-h-[280px] resize-none font-mono text-sm leading-relaxed p-4 rounded-2xl outline-none text-foreground placeholder:text-muted-foreground bg-input"
                style={{ border: "1px solid var(--border)" }}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleEvaluate}
                disabled={!artifact.trim() || evaluateMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold btn-primary"
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
              </button>
              {evalMessages.length > 0 && (
                <button
                  onClick={handleReset}
                  className="px-4 py-3 rounded-2xl text-sm text-muted-foreground hover:text-foreground transition-colors"
                  style={{ border: "1px solid var(--border)" }}
                >
                  Сбросить
                </button>
              )}
            </div>
          </div>

          {/* Right: Feedback panel */}
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-black tracking-tight text-foreground">Обратная связь AI</h2>
              <p className="text-xs text-muted-foreground mt-1">
                AI проверит артефакт по критериям методологии и даст рекомендации
              </p>
            </div>

            <div
              className="flex-1 rounded-2xl overflow-hidden flex flex-col"
              style={{
                background: "var(--glass-surface)",
                border: "1px solid var(--glass-border)",
                minHeight: "400px",
              }}
            >
              {evalMessages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8 text-center">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: "var(--glass-strong)" }}
                  >
                    <CheckCircle className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground mb-1">Готов к проверке</p>
                    <p className="text-sm text-muted-foreground">
                      Напишите артефакт слева и нажмите «Проверить»
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
                    {["Соответствие формату", "Глубина инсайтов", "Actionability", "Точность формулировок"].map((c) => (
                      <div
                        key={c}
                        className="px-3 py-2 rounded-xl text-xs text-muted-foreground"
                        style={{ background: "var(--glass-surface)", border: "1px solid var(--glass-border)" }}
                      >
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col flex-1 overflow-hidden">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {evalMessages.map((msg, i) => (
                        <div
                          key={i}
                          className="rounded-2xl p-4"
                          style={{
                            background: msg.role === "user" ? "var(--glass-surface)" : "var(--glass-strong)",
                            border: "1px solid var(--glass-border)",
                          }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {msg.role === "user" ? (
                              <>
                                <div
                                  className="w-5 h-5 rounded-full flex items-center justify-center"
                                  style={{ background: "var(--glass-strong)" }}
                                >
                                  <span className="text-xs font-bold text-foreground">В</span>
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">Ваш артефакт</span>
                              </>
                            ) : (
                              <>
                                <div
                                  className="w-5 h-5 rounded-full flex items-center justify-center"
                                  style={{ background: "var(--primary)", opacity: 0.9 }}
                                >
                                  <Sparkles className="w-3 h-3 text-primary-foreground" />
                                </div>
                                <span className="text-xs font-bold text-foreground">AI-ментор</span>
                              </>
                            )}
                          </div>
                          {msg.role === "assistant" ? (
                            <div className="prose dark:prose-invert prose-sm max-w-none">
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
                        <div
                          className="rounded-2xl p-4"
                          style={{
                            background: "var(--glass-strong)",
                            border: "1px solid var(--glass-border)",
                          }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ background: "var(--primary)", opacity: 0.9 }}
                            >
                              <Sparkles className="w-3 h-3 text-primary-foreground animate-pulse" />
                            </div>
                            <span className="text-xs font-bold text-muted-foreground">AI-ментор анализирует...</span>
                          </div>
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce opacity-50"
                                style={{ animationDelay: `${i * 150}ms` }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {evalMessages.length > 0 && !evaluateMutation.isPending && (
                    <div
                      className="p-3 flex gap-2"
                      style={{ borderTop: "1px solid var(--border)" }}
                    >
                      <textarea
                        value={followUpInput}
                        onChange={(e) => setFollowUpInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleFollowUp();
                          }
                        }}
                        placeholder="Уточните или задайте вопрос по оценке..."
                        className="flex-1 min-h-[56px] max-h-[120px] resize-none text-sm p-3 rounded-xl outline-none text-foreground placeholder:text-muted-foreground bg-input"
                        style={{ border: "1px solid var(--border)" }}
                        rows={2}
                      />
                      <button
                        onClick={handleFollowUp}
                        disabled={!followUpInput.trim()}
                        className="self-end px-4 py-2 rounded-xl text-sm font-bold btn-primary"
                      >
                        →
                      </button>
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
