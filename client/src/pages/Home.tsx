import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  Compass,
  Loader2,
  MessageSquare,
  Moon,
  Send,
  Sparkles,
  Sun,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import chaptersData from "@/data/chapters_full.json";
import { getBookStats, getReadingCtaLabel } from "@/lib/homeExperience";
import { HOME_ARTIFACT_CASE, HOME_CONTEXT_CANVAS, HOME_JOB_CHAIN } from "@/data/homeArtifacts";

const SUGGESTIONS = [
  "С чего начать JTBD-исследование?",
  "Как отличить Job Story от User Story?",
  "Как проверить гипотезу с нейроперсоной?",
  "Что такое Context Canvas?",
];

const CTA_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground px-5 py-3.5 text-sm font-bold text-background transition-all hover:opacity-85 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function Home() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [hasStarted, setHasStarted] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<"canvas" | "chain">("canvas");
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = trpc.ai.chat.useMutation();
  const { chapters: chapterCount, parts: partCount } = getBookStats(chaptersData);
  const readingCtaLabel = getReadingCtaLabel(hasStarted);

  useEffect(() => {
    setHasStarted(Boolean(localStorage.getItem("jtbd-last-chapter")));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startReading = () => navigate("/book");

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage = text.trim();
    const nextMessages = [...messages, { role: "user" as const, text: userMessage }];
    setInput("");
    setMessages(nextMessages);
    setIsLoading(true);

    try {
      const response = await chatMutation.mutateAsync({
        messages: nextMessages.map((message) => ({
          role: message.role,
          content: message.text,
        })),
      });
      const reply = typeof response.content === "string" ? response.content : "Не удалось получить ответ.";
      setMessages((previous) => [...previous, { role: "assistant", text: reply }]);
    } catch {
      setMessages((previous) => [
        ...previous,
        { role: "assistant", text: "Не получилось ответить. Попробуйте задать вопрос ещё раз." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header
        className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md sm:px-6"
      >
        <button onClick={() => navigate("/")} className="text-sm font-semibold tracking-wide text-muted-foreground transition-colors hover:text-foreground">
          Synthetic <span className="font-black text-foreground">JTBD</span>
        </button>
        <nav className="flex items-center gap-1" aria-label="Главная навигация">
          <button onClick={() => navigate("/chat")} className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground sm:px-3">
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">AI-чат</span>
          </button>
          <button onClick={() => navigate("/trainer")} className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground sm:px-3">
            <CheckCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Тренажёр</span>
          </button>
          <button onClick={() => navigate("/research")} className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground md:flex">
            <Compass className="h-3.5 w-3.5" />
            Исследование
          </button>
          <button onClick={toggleTheme} aria-label="Переключить тему" className="ml-1 rounded-full p-1.5 text-muted-foreground transition-all hover:bg-accent hover:text-foreground">
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </nav>
      </header>

      <main>
        <section className="relative isolate px-4 pb-20 pt-32 sm:px-6 sm:pt-40">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem]" style={{ background: "radial-gradient(ellipse 60% 46% at 50% 0%, var(--glass-strong) 0%, transparent 72%)" }} />
          <div className="mx-auto grid max-w-6xl items-end gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                Методология · Beta 3
              </div>
              <h1 className="max-w-3xl text-balance text-5xl font-black leading-[0.91] tracking-[-0.055em] text-foreground sm:text-7xl lg:text-[5.6rem]">
                Перестаньте угадывать. Поймите, <span className="text-muted-foreground">зачем вас нанимают.</span>
              </h1>
              <p className="mt-7 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                <strong className="font-semibold text-foreground">Synthetic JTBD</strong> — это практическая книга и рабочая среда для тех, кто хочет превращать пользовательские сигналы в решения, а не в бесконечный список «нужных» фич.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button onClick={startReading} className={CTA_CLASS}>
                  <BookOpen className="h-4 w-4" />
                  {readingCtaLabel}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button onClick={() => navigate("/research")} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-3.5 text-sm font-semibold text-foreground transition-all hover:bg-accent active:scale-[0.98]">
                  Пройти контур исследования
                  <Compass className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">{chapterCount} глав · {partCount} частей · AI-чат и тренажёр артефактов</p>
            </div>

            <aside className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-2xl shadow-black/20 sm:p-7">
              <div className="absolute -right-10 -top-16 h-44 w-44 rounded-full bg-foreground/10 blur-3xl" />
              <div className="relative">
                <div className="mb-10 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background"><Sparkles className="h-4 w-4" /></div>
                  <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Не набор фич</span>
                </div>
                <p className="max-w-sm text-2xl font-black leading-tight tracking-[-0.035em] text-foreground sm:text-3xl">От слов «пользователь хочет» — к ситуации, в которой решение действительно нужно.</p>
                <div className="mt-8 grid gap-3 border-t border-border pt-5 text-sm">
                  {["Зафиксируете контекст и силы выбора", "Разложите путь на Job Chain", "Проверите гипотезы до того, как строить"].map((item, index) => (
                    <div key={item} className="flex items-center gap-3 text-muted-foreground"><span className="font-mono text-xs text-foreground">0{index + 1}</span>{item}</div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="border-y border-border bg-card/35 px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Знакомая картина?</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-foreground sm:text-4xl">В бэклоге много работы. Ясности — мало.</h2>
            </div>
            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {[
                { number: "01", title: "Фича есть — ценности нет", text: "Команда реализовала запрос, но пользователь всё равно выбирает привычный обходной путь." },
                { number: "02", title: "Интервью не дают решения", text: "Люди говорят о желаниях, а команда не видит ситуацию, триггер и цену ошибки." },
                { number: "03", title: "Приоритеты меняются каждую неделю", text: "RICE создаёт таблицу, но не отвечает: какую работу пользователя стоит улучшать первой." },
              ].map((item) => (
                <article key={item.number} className="rounded-3xl border border-border bg-background p-6">
                  <span className="font-mono text-xs text-muted-foreground">{item.number}</span>
                  <h3 className="mt-8 text-xl font-black tracking-[-0.025em] text-foreground">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Что внутри</p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-foreground sm:text-4xl">Не теория ради теории. Контур, который приводит к решению.</h2>
                <p className="mt-5 text-base leading-relaxed text-muted-foreground">Книга объясняет, как собрать доказательства, где AI ускоряет работу, а где нужна обязательная проверка с реальными людьми.</p>
                <button onClick={startReading} className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-foreground transition-colors hover:text-muted-foreground">
                  Открыть первую главу <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2">
                {[
                  { step: "01", title: "Сигналы вместо догадок", text: "Отделите наблюдения, цитаты и логи от интерпретаций команды." },
                  { step: "02", title: "Контекст до решения", text: "Соберите Context Canvas и поймите, что происходит вокруг человека в момент выбора." },
                  { step: "03", title: "Работа, а не интерфейс", text: "Сформулируйте Job Stories и Job Chain, не подменяя задачу готовой фичей." },
                  { step: "04", title: "Приоритет с доказательствами", text: "Проверьте гипотезы и только потом используйте Opportunity Score, Kano и RICE." },
                ].map((item) => (
                  <article key={item.step} className="bg-background p-6 sm:p-7">
                    <span className="font-mono text-xs text-muted-foreground">{item.step}</span>
                    <h3 className="mt-7 text-lg font-black tracking-[-0.025em] text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-card/35 px-4 py-20 sm:px-6">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                Видео-введение · 00:08
              </div>
              <h2 className="mt-4 max-w-xl text-3xl font-black tracking-[-0.04em] text-foreground sm:text-4xl">Смотрите, как один сигнал превращается в продуктовое решение.</h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">За восемь секунд — вся логика книги: разрозненные сигналы собираются в контекст, контекст становится цепочкой работ, а затем — основанием для решения.</p>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-foreground" />Сигналы</span>
                <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-foreground" />Context Canvas</span>
                <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-foreground" />Job Chain</span>
                <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-foreground" />Решение</span>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-background p-2 shadow-2xl shadow-black/20">
              <video controls playsInline preload="metadata" className="aspect-video w-full rounded-[1.55rem] bg-black object-cover" aria-label="Короткое видео-введение в методологию Synthetic JTBD">
                <source src="/manus-storage/synthetic-jtbd-intro_70dc7af9.mp4" type="video/mp4" />
                Ваш браузер не поддерживает воспроизведение видео.
              </video>
              <div className="pointer-events-none absolute left-5 top-5 rounded-full border border-white/15 bg-black/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur">Synthetic JTBD</div>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-[0.62fr_1.38fr] lg:gap-16">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Методология в действии</p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-foreground sm:text-4xl">Не абстрактная схема. Рабочие артефакты команды.</h2>
                <p className="mt-5 text-base leading-relaxed text-muted-foreground">Посмотрите, как один конкретный момент — оплата на кассе — превращается в два артефакта, с которыми можно идти к дизайну и валидации.</p>
                <button onClick={() => navigate("/book")} className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-foreground transition-colors hover:text-muted-foreground">
                  Найти шаблоны в книге <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-hidden rounded-[2rem] border border-border bg-card">
                <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{HOME_ARTIFACT_CASE.label}</p>
                    <h3 className="mt-1 text-lg font-black tracking-[-0.025em] text-foreground">{HOME_ARTIFACT_CASE.title}</h3>
                  </div>
                  <div className="flex w-fit rounded-xl border border-border bg-background p-1" role="tablist" aria-label="Пример артефакта">
                    <button onClick={() => setActiveArtifact("canvas")} aria-pressed={activeArtifact === "canvas"} className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${activeArtifact === "canvas" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>Canvas</button>
                    <button onClick={() => setActiveArtifact("chain")} aria-pressed={activeArtifact === "chain"} className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${activeArtifact === "chain" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>Job Chain</button>
                  </div>
                </div>

                {activeArtifact === "canvas" ? (
                  <div className="grid gap-px bg-border sm:grid-cols-2">
                    {HOME_CONTEXT_CANVAS.map((item, index) => (
                      <article key={item.label} className={`min-h-32 bg-background p-5 sm:p-6 ${index === HOME_CONTEXT_CANVAS.length - 1 ? "sm:col-span-2" : ""}`}>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
                        <p className="mt-4 max-w-md text-base font-bold leading-snug tracking-[-0.02em] text-foreground">{item.value}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-border bg-background">
                    {HOME_JOB_CHAIN.map((item) => (
                      <article key={item.step} className="grid gap-3 p-5 sm:grid-cols-[3.25rem_7.5rem_1fr] sm:items-center sm:gap-4 sm:p-6">
                        <span className="font-mono text-xs text-muted-foreground">{item.step}</span>
                        <span className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${item.type === "Основная" ? "border-foreground/30 text-foreground" : "border-border text-muted-foreground"}`}>{item.type}</span>
                        <div>
                          <p className="font-bold tracking-[-0.02em] text-foreground">{item.label}</p>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Критерий успеха: {item.outcome}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
                <div className="border-t border-border px-5 py-4 text-xs text-muted-foreground sm:px-6">Рабочий пример демонстрирует структуру артефакта; гипотезы из него нужно подтвердить реальными пользовательскими данными.</div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-6 rounded-[2rem] border border-border bg-card p-6 sm:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background"><MessageSquare className="h-4 w-4" /></div>
              <h2 className="mt-5 text-2xl font-black tracking-[-0.035em] text-foreground">Не знаете, с чего начать?</h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">Спросите AI-ассистента. Он поможет разобраться в концепции, но не подменит реальные данные гипотезой.</p>
              <button onClick={() => navigate("/chat")} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-foreground transition-colors hover:text-muted-foreground">
                Открыть полный чат <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="min-w-0">
              {messages.length === 0 ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button key={suggestion} onClick={() => sendMessage(suggestion)} className="rounded-full border border-border bg-background px-3 py-1.5 text-left text-xs font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground active:scale-[0.98]">{suggestion}</button>
                  ))}
                </div>
              ) : (
                <div className="mb-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                  {messages.map((message, index) => (
                    <div key={`${message.role}-${index}`} className={message.role === "user" ? "ml-auto max-w-[90%] rounded-2xl rounded-br-sm bg-foreground px-4 py-2.5 text-sm text-background" : "max-w-[90%] rounded-2xl rounded-bl-sm border border-border bg-background px-4 py-2.5 text-sm leading-relaxed text-foreground"}>{message.text}</div>
                  ))}
                  {isLoading && <div className="flex w-fit items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2.5 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Думаю…</div>}
                  <div ref={messagesEndRef} />
                </div>
              )}
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3">
                <input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") sendMessage(input); }} placeholder="Спросите о методологии…" disabled={isLoading} className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50" />
                <button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} aria-label="Отправить вопрос" className="rounded-xl bg-foreground p-2 text-background transition-all hover:opacity-80 disabled:opacity-30 active:scale-95"><Send className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border px-4 py-20 text-center sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Первый шаг — конкретный</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-4xl font-black leading-[0.95] tracking-[-0.05em] text-foreground sm:text-6xl">Откройте книгу. Найдите первую ситуацию, которую стоит понять.</h2>
          <button onClick={startReading} className={`${CTA_CLASS} mt-8`}>
            <BookOpen className="h-4 w-4" />
            {hasStarted ? "Продолжить чтение" : "Начать с первой главы"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      </main>

      <footer className="px-6 pb-8 text-center">
        <p className="text-xs text-muted-foreground/60">Synthetic JTBD · Дмитрий Михайлов</p>
      </footer>
    </div>
  );
}
