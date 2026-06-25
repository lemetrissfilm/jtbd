import { useLocation } from 'wouter';
import { ArrowRight, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

export default function Home() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
              S
            </div>
            <span className="font-semibold text-lg">Synthetic JTBD</span>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-16 space-y-24">
        {/* Hero */}
        <section className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold leading-tight">
              Понимайте своих пользователей через их действия, а не слова
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Synthetic JTBD — методология для исследования реальных потребностей пользователей. Без дорогих фокус-групп. Без предвзятых интервью. Только данные.
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => navigate('/book')}
              size="lg"
              className="gap-2"
            >
              Начать чтение
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={toggleTheme}
            >
              {theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
            </Button>
          </div>
        </section>

        {/* Problem section */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold">Проблема</h2>
          <div className="space-y-6">
            <div className="p-6 rounded-lg bg-secondary/50 border border-border">
              <p className="text-lg leading-relaxed">
                <strong>80% новых фич в продуктах не достигают своих целей.</strong> Не потому что они сделаны плохо. Потому что они решают не ту проблему, или решают её не в тот момент.
              </p>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Традиционные методы исследования — фокус-группы, анкеты, интервью — дают искажённые результаты. Люди рационализируют свои ответы. Они говорят то, что считают правильным, а не то, что на самом деле делают.
            </p>
          </div>
        </section>

        {/* Solution section */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold">Решение</h2>
          <div className="space-y-6">
            <p className="text-lg leading-relaxed">
              <strong>Synthetic JTBD</strong> — это методология, которая объединяет Jobs to Be Done с искусственным интеллектом. Вы создаёте синтетических пользователей на основе реальных поведенческих данных, симулируете с ними интервью и извлекаете истинные потребности.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                <h3 className="font-semibold mb-2">Быстро</h3>
                <p className="text-sm text-muted-foreground">
                  Получите результаты за дни, а не месяцы
                </p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                <h3 className="font-semibold mb-2">Дёшево</h3>
                <p className="text-sm text-muted-foreground">
                  Без дорогостоящих исследовательских агентств
                </p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                <h3 className="font-semibold mb-2">Масштабируемо</h3>
                <p className="text-sm text-muted-foreground">
                  Исследуйте неограниченное количество сценариев
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What you'll learn */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold">Что вы узнаете</h2>
          <div className="space-y-4">
            {[
              'Как устроена методология JTBD и почему она работает',
              'Как создавать синтетических пользователей на основе данных',
              'Как проводить интервью с AI и извлекать реальные потребности',
              'Как переводить потребности в конкретные задачи для разработки',
              'Как избежать типичных ошибок при применении методологии',
              'Как интегрировать JTBD в ваш процесс разработки'
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-lg bg-secondary/20 border border-border">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                  {i + 1}
                </div>
                <p className="text-lg leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="space-y-6 py-12 border-t border-border">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Готовы начать?</h2>
            <p className="text-lg text-muted-foreground">
              Книга содержит ~100 страниц теории, примеров и практических упражнений. Рассчитана на 2-3 часа чтения.
            </p>
          </div>
          <Button
            onClick={() => navigate('/book')}
            size="lg"
            className="gap-2"
          >
            Открыть книгу
            <ArrowRight className="w-4 h-4" />
          </Button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-24">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>Synthetic JTBD — открытая методология для понимания пользователей</p>
        </div>
      </footer>
    </div>
  );
}
