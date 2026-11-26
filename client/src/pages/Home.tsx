import { useLocation } from "wouter";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import chaptersData from "@/data/chapters_full.json";
import { getBookStats, getReadingCtaLabel } from "@/lib/homeExperience";

const stats = getBookStats(chaptersData);

const forces = [
  { name: "Push", text: "Что выталкивает человека из текущего решения." },
  { name: "Pull", text: "Что притягивает к новому." },
  { name: "Habit", text: "Что удерживает привычку." },
  { name: "Anxiety", text: "Что тревожит в переходе." },
];

const ladder = [
  { level: "E0", text: "Гипотеза: правдоподобно, но не проверено." },
  { level: "E1", text: "Косвенные сигналы: отзывы, тикеты, логи." },
  { level: "E2", text: "Прямое свидетельство: интервью о прошлом поведении." },
  { level: "E3", text: "Подтверждено поведением в продукте." },
];

export default function Home() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const hasStarted = typeof window !== "undefined" && !!localStorage.getItem("lastReadChapter");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <span className="font-serif text-lg font-semibold">Synthetic JTBD</span>
        <nav className="flex items-center gap-5 text-sm">
          <button onClick={() => navigate("/book")} className="text-muted-foreground hover:text-foreground">Книга</button>
          <button onClick={() => navigate("/cases")} className="text-muted-foreground hover:text-foreground">Кейсы</button>
          <button onClick={toggleTheme} aria-label={theme === "dark" ? "Светлая тема" : "Тёмная тема"} className="text-muted-foreground hover:text-foreground">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="pb-20 pt-16 sm:pt-24">
          <h1 className="display max-w-[15ch] text-[clamp(2.5rem,1.6rem+3.6vw,4.75rem)]">
            Начните разработку не с&nbsp;фичи, а&nbsp;с&nbsp;понимания контекста
          </h1>
          <p className="lede mt-8 max-w-xl">
            Практическое руководство по Jobs To Be Done для продуктовых и UX-команд: как собрать контекст,
            отделить факт от гипотезы и принять решение, которое можно проверить.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <button
              onClick={() => navigate("/book")}
              className="rounded bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
            >
              {getReadingCtaLabel(hasStarted)}
            </button>
            <span className="text-sm text-muted-foreground">
              {stats.chapters}&nbsp;глав в&nbsp;{stats.parts}&nbsp;частях
            </span>
          </div>
        </section>

        <section className="border-t border-border py-16">
          <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
            <h2 className="display text-3xl sm:text-4xl">Четыре силы, которые решают всё</h2>
            <div>
              <p className="font-serif text-lg leading-relaxed" style={{ textWrap: "pretty" }}>
                Человек меняет решение, когда выталкивающие и притягивающие силы пересиливают привычку и тревогу.
                Метод учит находить эти силы в конкретной ситуации, а не в абстрактной аудитории.
              </p>
              <dl className="mt-8 divide-y divide-border border-y border-border">
                {forces.map((force) => (
                  <div key={force.name} className="grid grid-cols-[6rem_1fr] gap-4 py-3 text-sm">
                    <dt className="font-semibold">{force.name}</dt>
                    <dd className="text-muted-foreground">{force.text}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section className="border-t border-border py-16">
          <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
            <h2 className="display text-3xl sm:text-4xl">Лестница доказательств</h2>
            <div>
              <p className="font-serif text-lg leading-relaxed" style={{ textWrap: "pretty" }}>
                Синтетические нейроперсоны помогают формулировать гипотезы и вопросы. Выводом они становятся
                только после проверки на живых людях.
              </p>
              <dl className="mt-8 divide-y divide-border border-y border-border">
                {ladder.map((step) => (
                  <div key={step.level} className="grid grid-cols-[6rem_1fr] gap-4 py-3 text-sm">
                    <dt className="font-semibold tabular-nums">{step.level}</dt>
                    <dd className="text-muted-foreground">{step.text}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-5xl border-t border-border px-6 py-8 text-sm text-muted-foreground">
        Synthetic JTBD, Дмитрий Михайлов
      </footer>
    </div>
  );
}
