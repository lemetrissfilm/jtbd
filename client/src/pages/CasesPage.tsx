import { useLocation } from "wouter";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { BOOK_CASES, type BookCase } from "@/data/cases";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-t border-border py-4 sm:grid-cols-[11rem_1fr] sm:gap-6">
      <dt className="text-sm font-semibold">{label}</dt>
      <dd className="font-serif text-[1.0625rem] leading-relaxed" style={{ textWrap: "pretty" }}>
        {children}
      </dd>
    </div>
  );
}

function CaseSection({ item, onOpenChapter }: { item: BookCase; onOpenChapter: (chapter: number) => void }) {
  return (
    <section id={item.id} className="scroll-mt-8 border-t border-foreground py-14">
      <p className="text-sm text-muted-foreground">
        {item.domain}, {item.area.toLowerCase()}
      </p>
      <h2 className="display mt-2 text-3xl sm:text-4xl">{item.title}</h2>
      <p className="lede mt-4 max-w-2xl">{item.problem}</p>

      <dl className="mt-10">
        <Row label="Сигналы">
          <span className="block text-sm text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>
            {item.sources}
          </span>
          <ul className="mt-2 space-y-1">
            {item.signals.map((signal) => (
              <li key={signal.text} className="flex gap-4">
                <span className="w-8 shrink-0 text-right text-sm tabular-nums text-muted-foreground" style={{ fontFamily: "var(--font-sans)", paddingTop: "0.2em" }}>
                  {signal.count ?? ""}
                </span>
                <span>«{signal.text}»</span>
              </li>
            ))}
          </ul>
        </Row>
        <Row label="Что показала симуляция">{item.simulation}</Row>
        <Row label="Гипотеза (E0)">{item.hypothesis}</Row>
        <Row label="Job Story">
          <span className="block border-l-2 border-foreground pl-4 italic">{item.jobStory}</span>
        </Row>
        {item.criterion && <Row label="Критерий выполнения">{item.criterion}</Row>}
        <Row label="Как проверить">{item.check}</Row>
        <Row label="Осторожно">{item.watchOut}</Row>
      </dl>

      <button
        onClick={() => onOpenChapter(item.chapter)}
        className="mt-6 text-sm text-accent underline underline-offset-4 hover:decoration-2"
      >
        Полный разбор в книге: {item.chapterLabel}
      </button>
    </section>
  );
}

export default function CasesPage() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const openChapter = (chapter: number) => navigate(`/book?ch=${chapter}`);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <button onClick={() => navigate("/")} className="font-serif text-lg font-semibold">
          Synthetic JTBD
        </button>
        <nav className="flex items-center gap-5 text-sm">
          <button onClick={() => navigate("/book")} className="text-muted-foreground hover:text-foreground">Книга</button>
          <span className="text-foreground" aria-current="page">Кейсы</span>
          <button onClick={toggleTheme} aria-label={theme === "dark" ? "Светлая тема" : "Тёмная тема"} className="text-muted-foreground hover:text-foreground">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24">
        <section className="pb-14 pt-12 sm:pt-20">
          <h1 className="display text-[clamp(2.5rem,1.6rem+3.6vw,4.75rem)]">Кейсы</h1>
          <p className="lede mt-6 max-w-2xl">
            Шесть разборов из книги в одном формате: что говорят данные, что предположила нейроперсона,
            какая получилась Job Story и как её проверить на людях. Цифры в кейсах условные.
          </p>
          <ul className="mt-10 grid gap-x-10 gap-y-2 text-sm sm:grid-cols-2">
            {BOOK_CASES.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="hover:text-accent">
                  {item.title}
                </a>
                <span className="text-muted-foreground">, {item.domain}</span>
              </li>
            ))}
          </ul>
        </section>

        {BOOK_CASES.map((item) => (
          <CaseSection key={item.id} item={item} onOpenChapter={openChapter} />
        ))}
      </main>
    </div>
  );
}
