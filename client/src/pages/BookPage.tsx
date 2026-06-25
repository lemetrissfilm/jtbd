import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronDown, ChevronUp, Search, Home, Moon, Sun, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Streamdown } from 'streamdown';
import chaptersData from '@/data/chapters_structure.json';

interface Chapter {
  id: string;
  title: string;
  number: number;
}

interface Part {
  id: string;
  title: string;
  chapters: Chapter[];
}

export default function BookPage() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [expandedParts, setExpandedParts] = useState<Set<string>>(
    new Set(['part1'])
  );
  const [currentChapter, setCurrentChapter] = useState<string>('ch1');
  const [searchQuery, setSearchQuery] = useState('');
  const [readChapters, setReadChapters] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile and handle resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('readChapters');
    if (saved) {
      setReadChapters(new Set(JSON.parse(saved)));
    }
    const lastChapter = localStorage.getItem('lastChapter');
    if (lastChapter) {
      setCurrentChapter(lastChapter);
      // Expand the part containing the last chapter
      const part = (chaptersData as { parts: Part[] }).parts.find(p =>
        p.chapters.some(c => c.id === lastChapter)
      );
      if (part) {
        setExpandedParts(new Set([part.id]));
      }
    }
  }, []);

  // Save read chapters and current chapter
  useEffect(() => {
    localStorage.setItem('readChapters', JSON.stringify(Array.from(readChapters)));
    localStorage.setItem('lastChapter', currentChapter);
  }, [readChapters, currentChapter]);

  const togglePart = (partId: string) => {
    const newExpanded = new Set(expandedParts);
    if (newExpanded.has(partId)) {
      newExpanded.delete(partId);
    } else {
      newExpanded.add(partId);
    }
    setExpandedParts(newExpanded);
  };

  const handleChapterClick = (chapterId: string) => {
    setCurrentChapter(chapterId);
    // Mark as read
    const newRead = new Set(readChapters);
    newRead.add(chapterId);
    setReadChapters(newRead);
    // Close sidebar on mobile
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const parts = (chaptersData as { parts: Part[] }).parts;

  // Filter chapters based on search
  const filteredParts = parts
    .map(part => ({
      ...part,
      chapters: part.chapters.filter(
        ch =>
          ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          part.title.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter(part => part.chapters.length > 0);

  // Get current chapter info
  const currentChapterObj = parts
    .flatMap(p => p.chapters)
    .find(ch => ch.id === currentChapter);

  // Get chapter content (placeholder - in real app would load from markdown)
  const chapterContent = `# ${currentChapterObj?.title || 'Глава'}

Содержание главы ${currentChapterObj?.number} будет загружено здесь.

## Введение

Это содержимое главы. В реальном приложении здесь будет полный текст из markdown файла.

## Основные идеи

- Пункт 1
- Пункт 2
- Пункт 3

## Заключение

Дополнительная информация и выводы.`;

  const allChapters = parts.flatMap(p => p.chapters);
  const currentIndex = allChapters.findIndex(ch => ch.id === currentChapter);
  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

  return (
    <div className={`flex h-screen ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          isMobile
            ? `fixed left-0 top-0 h-full z-40 transition-transform duration-300 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : 'relative'
        } w-80 border-r overflow-y-auto flex flex-col ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 p-4 border-b space-y-4 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setLocation('/')}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
              }`}
              title="На главную"
            >
              <Home className="w-5 h-5" />
            </button>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                    : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="relative">
            <Search className={`absolute left-3 top-3 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <Input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`pl-10 text-sm ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
              }`}
            />
          </div>
        </div>

        {/* Chapters List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredParts.map(part => (
            <div key={part.id}>
              <button
                onClick={() => togglePart(part.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  isDark
                    ? 'hover:bg-slate-800 text-slate-200'
                    : 'hover:bg-slate-200 text-slate-900'
                }`}
              >
                <span className="truncate text-left flex-1">{part.title}</span>
                {expandedParts.has(part.id) ? (
                  <ChevronUp className="w-4 h-4 flex-shrink-0 ml-2" />
                ) : (
                  <ChevronDown className="w-4 h-4 flex-shrink-0 ml-2" />
                )}
              </button>

              {expandedParts.has(part.id) && (
                <div className="mt-1 space-y-1 border-l-2 border-slate-700 pl-3">
                  {part.chapters.map(chapter => {
                    const isRead = readChapters.has(chapter.id);
                    const isActive = currentChapter === chapter.id;

                    return (
                      <button
                        key={chapter.id}
                        onClick={() => handleChapterClick(chapter.id)}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                          isActive
                            ? isDark
                              ? 'bg-cyan-500/20 text-cyan-400'
                              : 'bg-cyan-100 text-cyan-700'
                            : isDark
                            ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                        }`}
                        title={chapter.title}
                      >
                        <div className="flex items-center gap-2">
                          {isRead && (
                            <span className="text-xs text-green-500 flex-shrink-0">✓</span>
                          )}
                          <span className="flex-1 truncate">
                            {chapter.number}. {chapter.title}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div
          className={`border-b ${
            isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
          } px-4 md:px-8 py-4 flex items-center justify-between`}
        >
          <div className="flex items-center gap-4 flex-1">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                    : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="min-w-0">
              <h1 className={`text-lg md:text-2xl font-bold truncate ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                {currentChapterObj?.title}
              </h1>
              <p className={`text-xs md:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Глава {currentChapterObj?.number} • Прочитано {readChapters.size} из{' '}
                {allChapters.length}
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 md:py-12">
            <article
              className={`prose ${
                isDark
                  ? 'prose-invert'
                  : 'prose'
              } max-w-none text-base md:text-lg leading-relaxed`}
            >
              <Streamdown>{chapterContent}</Streamdown>
            </article>
          </div>
        </div>

        {/* Navigation Footer */}
        <div
          className={`border-t ${
            isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
          } px-4 md:px-8 py-4 md:py-6`}
        >
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-2 md:gap-4">
            <Button
              variant="outline"
              onClick={() => prevChapter && handleChapterClick(prevChapter.id)}
              disabled={!prevChapter}
              className={`flex items-center gap-1 md:gap-2 text-sm md:text-base ${
                isDark
                  ? 'border-slate-700 hover:bg-slate-800'
                  : 'border-slate-300 hover:bg-slate-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden md:inline">Предыдущая</span>
            </Button>

            <div className={`text-xs md:text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {currentChapterObj?.number} / {allChapters.length}
            </div>

            <Button
              onClick={() => nextChapter && handleChapterClick(nextChapter.id)}
              disabled={!nextChapter}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white flex items-center gap-1 md:gap-2 text-sm md:text-base"
            >
              <span className="hidden md:inline">Следующая</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
