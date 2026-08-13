import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  FileSearch,
  Layers3,
  Lightbulb,
  MessageSquare,
  ShieldAlert,
  UsersRound,
} from "lucide-react";
import {
  DOMAIN_PROFILES,
  type ResearchDomain,
  getConfidenceLabel,
  getReadinessScore,
  isReadyToSimulate,
} from "@/lib/researchWorkflow";

const workflow = [
  {
    index: "01",
    title: "Решение и границы",
    copy: "Сформулируйте решение, которое должно измениться после исследования. Не «изучить аудиторию», а «понять, какой сценарий уменьшит отток в первую неделю». ",
    output: "Вопрос решения + сегмент + контекст",
    icon: <Lightbulb className="w-4 h-4" />,
  },
  {
    index: "02",
    title: "Доказательства",
    copy: "Соберите первичные сигналы: интервью, тикеты, отзывы, логи и конкурентные переходы. Подписывайте каждый инсайт источником и не выдавайте гипотезу за факт.",
    output: "Карта сигналов: факт / интерпретация / гипотеза",
    icon: <FileSearch className="w-4 h-4" />,
  },
  {
    index: "03",
    title: "Контекст и цепочка",
    copy: "Соберите Context Canvas до Job Story. Затем разложите работу на Job Chain: до, во время и после ключевого момента.",
    output: "Canvas + Job Chain",
    icon: <Layers3 className="w-4 h-4" />,
  },
  {
    index: "04",
    title: "Гипотезы, не истины",
    copy: "Нейроперсона помогает увидеть вопросы, контрсценарии и пробелы. Её ответы всегда маркируются как гипотезы до проверки на людях.",
    output: "5–10 Job Stories + список допущений",
    icon: <MessageSquare className="w-4 h-4" />,
  },
  {
    index: "05",
    title: "Проверка и решение",
    copy: "Проверяйте не формулировку, а прошлое поведение: что человек делал в такой ситуации, что пробовал и почему сменил решение. Только после этого считайте приоритет.",
    output: "Валидированные Jobs + решение + confidence",
    icon: <ClipboardCheck className="w-4 h-4" />,
  },
];

export default function ResearchNavigatorPage() {
  const [, navigate] = useLocation();
  const [domain, setDomain] = useState<ResearchDomain>("consumer");
  const [decision, setDecision] = useState("");
  const [checks, setChecks] = useState({
    evidence: false,
    context: false,
    validation: false,
    roles: false,
  });
  const [copied, setCopied] = useState(false);

  const profile = DOMAIN_PROFILES[domain];
  const readinessInput = {
    decision,
    hasEvidence: checks.evidence,
    hasContext: checks.context,
    hasValidationPlan: checks.validation,
    hasRoleCoverage: checks.roles,
  };
  const score = getReadinessScore(readinessInput);
  const canSimulate = isReadyToSimulate(domain, readinessInput);

  const brief = useMemo(
    () => `SJTBD research brief\n\nРешение: ${decision || "[сформулируйте решение]"}\nДомен: ${profile.label}\n\nEvidence rule: ${profile.evidenceRule}\nValidation: ${profile.validation}\n\nОбязательные роли: ${profile.requiredRoles.join(", ")}\n\nGuardrails:\n${profile.safeguards.map((item) => `- ${item}`).join("\n")}`,
    [decision, profile],
  );

  const copyBrief = async () => {
    try {
      await navigator.clipboard.writeText(brief);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const updateCheck = (key: keyof typeof checks) => {
    setChecks((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Synthetic JTBD
          </button>
          <div className="hidden items-center gap-4 sm:flex">
            <button onClick={() => navigate("/book")} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Книга
            </button>
            <button onClick={() => navigate("/trainer")} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Тренажёр
            </button>
            <button onClick={() => navigate("/chat")} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              AI-чат
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-20 pt-12 sm:px-8 lg:pt-16">
        <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Research Navigator</p>
            <h1 className="max-w-3xl text-5xl font-black leading-[0.92] tracking-[-0.045em] text-foreground sm:text-6xl lg:text-7xl">
              Исследование, которое приводит к решению.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Это рабочий контур Synthetic JTBD: сначала опора на доказательства и контекст, затем синтетические гипотезы, и только потом — проверка и приоритизация.
            </p>
          </div>
          <div className="glass-card rounded-3xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Готовность исследования</span>
              <span className="text-lg font-black text-foreground">{score}/5</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-accent">
              <div className="h-full rounded-full bg-foreground transition-all duration-300" style={{ width: `${score * 20}%` }} />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">{getConfidenceLabel(score)}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {canSimulate ? "Есть минимальная опора для симуляции. Ответы AI всё равно остаются гипотезами." : "Не запускайте симуляцию как источник вывода: сначала заполните обязательные основания."}
            </p>
          </div>
        </section>

        <section className="mt-12 rounded-[2rem] border border-border bg-card p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-6 border-b border-border pb-6 lg:flex-row lg:items-start">
            <div>
              <p className="text-sm font-bold text-foreground">1. Настройте контур исследования</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Уровень риска меняет глубину проверки: один процесс не подходит одинаково для всех доменов.</p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {(Object.keys(DOMAIN_PROFILES) as ResearchDomain[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setDomain(item)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    domain === item ? "bg-foreground text-background" : "border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {DOMAIN_PROFILES[item].shortLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 pt-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground" htmlFor="decision">
                Какое решение должно измениться после исследования?
              </label>
              <textarea
                id="decision"
                value={decision}
                onChange={(event) => setDecision(event.target.value)}
                placeholder="Например: понять, какой сценарий сократит отток в первую неделю после регистрации."
                className="mt-3 min-h-28 w-full resize-none rounded-2xl border border-border bg-input px-4 py-3 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
              />
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {[
                  { key: "evidence" as const, label: "Есть первичные сигналы: интервью, тикеты, отзывы или логи" },
                  { key: "context" as const, label: "Выбран конкретный момент, а не абстрактная аудитория" },
                  { key: "validation" as const, label: "Запланирована проверка на реальных людях" },
                  { key: "roles" as const, label: "Покрыты критичные роли и конфликтующие интересы" },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => updateCheck(item.key)}
                    className="flex items-start gap-3 rounded-2xl border border-border p-3 text-left transition-colors hover:bg-accent/60"
                  >
                    <span className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${checks[item.key] ? "border-foreground bg-foreground text-background" : "border-muted-foreground"}`}>
                      {checks[item.key] && <Check className="w-3 h-3" />}
                    </span>
                    <span className="text-xs leading-relaxed text-muted-foreground">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <aside className="rounded-2xl bg-accent/60 p-5">
              <div className="flex items-center gap-2 text-foreground">
                {domain === "high-stakes" ? <ShieldAlert className="w-4 h-4" /> : <UsersRound className="w-4 h-4" />}
                <p className="text-sm font-bold">{profile.label}</p>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{profile.description}</p>
              <p className="mt-5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Правило доказательств</p>
              <p className="mt-1 text-xs leading-relaxed text-foreground">{profile.evidenceRule}</p>
              <p className="mt-5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Валидация</p>
              <p className="mt-1 text-xs leading-relaxed text-foreground">{profile.validation}</p>
            </aside>
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-foreground">2. Пройдите контур Synthetic JTBD</p>
              <p className="mt-1 text-sm text-muted-foreground">Каждый шаг оставляет артефакт, который снижает неопределённость следующего.</p>
            </div>
            <span className="hidden text-xs text-muted-foreground sm:block">От решения к проверенному действию</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {workflow.map((step) => (
              <article key={step.index} className="glass-card group rounded-3xl p-5 transition-transform duration-200 hover:-translate-y-1">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-black tracking-wide text-muted-foreground">{step.index}</span>
                  <span className="text-muted-foreground transition-colors group-hover:text-foreground">{step.icon}</span>
                </div>
                <h2 className="mt-10 text-base font-black tracking-tight text-foreground">{step.title}</h2>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{step.copy}</p>
                <div className="mt-5 border-t border-border pt-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">На выходе</p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-foreground">{step.output}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-[2rem] border border-border p-6 sm:p-8">
            <div className="flex items-center gap-2 text-foreground"><ShieldAlert className="w-4 h-4" /><p className="text-sm font-bold">3. Guardrails для выбранного контура</p></div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Эти ограничения появились после стресс-теста методологии: они защищают от самой опасной ошибки — принять правдоподобный ответ AI за доказанный инсайт.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {profile.safeguards.map((item) => (
                <div key={item} className="rounded-2xl bg-accent/50 p-4">
                  <CheckCircle2 className="w-4 h-4 text-foreground" />
                  <p className="mt-3 text-xs leading-relaxed text-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="glass-card rounded-[2rem] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Research brief</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-foreground">Заберите рабочий бриф</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Скопируйте заготовку для команды, интервью-гайда или следующего шага в AI-чате.</p>
            <button onClick={copyBrief} className="btn-primary mt-6 flex w-full items-center justify-center gap-2 px-4 py-3 text-sm">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Бриф скопирован" : "Скопировать бриф"}
            </button>
            <button onClick={() => navigate("/chat")} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent">
              Обсудить в AI-чате <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => navigate("/book")} className="mt-4 flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
              <BookOpen className="w-3.5 h-3.5" /> Открыть методологию в книге
            </button>
          </aside>
        </section>
      </main>
    </div>
  );
}
