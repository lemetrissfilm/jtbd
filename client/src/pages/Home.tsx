import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { useTheme } from '@/contexts/ThemeContext';
import { ArrowRight, BookOpen, Zap, Users, Lightbulb, Moon, Sun } from 'lucide-react';

export default function Home() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-50' : 'bg-white text-slate-950'}`}>
      {/* Header */}
      <header className={`fixed top-0 w-full z-50 ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'} border-b backdrop-blur-sm`}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Synthetic JTBD</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            <Button
              onClick={() => setLocation('/book')}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
            >
              Читать книгу
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('https://d2xsxph8kpxj0f.cloudfront.net/310419663030561875/gQ2RrBAup3XVtLNVuNrJh7/synthetic_jtbd_hero-R6JqusyzNxvyEgcTQbuj55.webp')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className={`absolute inset-0 ${isDark ? 'bg-slate-950/60' : 'bg-white/40'}`} />
        </div>

        {/* Content */}
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
                Synthetic JTBD
              </h1>
              <p className={`text-xl md:text-2xl ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Новая методология исследований, которая объединяет Jobs to Be Done с искусственным интеллектом
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button
                onClick={() => setLocation('/book')}
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-lg px-8"
              >
                Начать чтение <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className={`text-lg px-8 ${
                  isDark
                    ? 'border-slate-700 hover:bg-slate-800'
                    : 'border-slate-300 hover:bg-slate-100'
                }`}
              >
                Узнать больше
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-12 max-w-xl mx-auto">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-cyan-500">100</div>
                <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Страниц</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-blue-500">48</div>
                <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Глав</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-purple-500">11</div>
                <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Частей</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-20 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">Что вы узнаете</h2>
            <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Полный путь от теории к практике
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Lightbulb,
                title: 'Основы JTBD',
                description: 'Поймите, почему классические методы не работают и как Synthetic JTBD решает эту проблему',
              },
              {
                icon: Users,
                title: 'Нейроперсоны',
                description: 'Научитесь создавать синтетические персоны, которые максимально соответствуют реальной аудитории',
              },
              {
                icon: Zap,
                title: 'Процесс',
                description: 'Пошаговый алгоритм от сбора данных до формирования задач в бэклоге',
              },
              {
                icon: BookOpen,
                title: 'Кейсы',
                description: 'Реальные примеры применения методологии в B2B, EdTech, финтехе и маркетплейсах',
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className={`p-6 rounded-lg border transition-all hover:shadow-lg ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 hover:border-cyan-500'
                      : 'bg-white border-slate-200 hover:border-cyan-500'
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-cyan-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Content Preview Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                Структурированное обучение
              </h2>
              <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Книга разделена на 11 частей, каждая из которых логически связана с предыдущей. Начиная с основ JTBD и классических методологий, вы постепенно погружаетесь в Synthetic JTBD, создание нейроперсон и практическое применение.
              </p>
              <ul className="space-y-3">
                {[
                  'Теоретическая база с примерами',
                  'Пошаговые инструкции и шаблоны',
                  'Реальные кейсы из разных индустрий',
                  'Практические упражнения и тесты',
                  'Продвинутые техники и лучшие практики',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={`rounded-lg overflow-hidden border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
              <div className="aspect-video bg-gradient-to-br from-cyan-500/10 to-blue-500/10 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <BookOpen className="w-16 h-16 mx-auto text-cyan-500 opacity-50" />
                  <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                    Красивая типография<br />
                    как на Medium
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-20 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="container mx-auto px-6 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">Готовы начать?</h2>
            <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Погрузитесь в новую методологию исследований и трансформируйте ваш подход к UX
            </p>
          </div>
          <Button
            onClick={() => setLocation('/book')}
            size="lg"
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-lg px-8"
          >
            Начать чтение <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'} py-12`}>
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-gradient-to-br from-cyan-500 to-blue-500" />
              <span className="font-semibold">Synthetic JTBD</span>
            </div>
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
              © 2026 Synthetic JTBD. Все права защищены.
            </p>
            <div className="flex gap-6">
              <a href="#" className={`text-sm transition-colors ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'}`}>
                О проекте
              </a>
              <a href="#" className={`text-sm transition-colors ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'}`}>
                Контакты
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
