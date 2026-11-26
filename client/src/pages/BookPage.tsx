import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'wouter';
import { ChevronDown, ChevronUp, Search, Home, Menu, X, Moon, Sun, ArrowLeft, ArrowRight, BookOpenText } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import chaptersData from '@/data/chapters_full.json';
import { Streamdown } from 'streamdown';
import { createBookMarkdownPlugins } from '@/lib/bookMarkdown';

interface Chapter {
  title: string;
  content: string;
}

interface Part {
  name: string;
  chapters: Chapter[];
}

const readableChapterIndexes = chaptersData.reduce<number[]>((indexes, chapter, index) => {
  if (!chapter.title.includes('ЧАСТЬ')) indexes.push(index);
  return indexes;
}, []);

const getReadingMinutes = (content: string) => Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 220));

const ROMAN = /^[IVXLC]+\.?$/;
const formatPartName = (name: string) => {
  const words = name.replace('ЧАСТЬ ', 'Часть ').split(' ');
  return words
    .map((word, i) => (i === 0 || ROMAN.test(word) ? word : word.toLowerCase()))
    .join(' ')
    .replace(/^(Часть [IVXLC]+\.? )(.)/, (_m, a, b) => a + b.toUpperCase());
};

export default function BookPage() {
  const bookMarkdownPlugins = useMemo(() => createBookMarkdownPlugins(window.location.origin), []);
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [currentChapterIndex, setCurrentChapterIndex] = useState(readableChapterIndexes[0] ?? 0);
  const [expandedParts, setExpandedParts] = useState<Set<number>>(new Set([0]));
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [readChapters, setReadChapters] = useState<Set<number>>(new Set());
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const prevChapterIndexRef = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem('readChapters');
    if (saved) setReadChapters(new Set(JSON.parse(saved)));
  }, []);

  useEffect(() => {
    localStorage.setItem('readChapters', JSON.stringify(Array.from(readChapters)));
  }, [readChapters]);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('ch');
    const lastRead = requested ?? localStorage.getItem('lastReadChapter');
    if (lastRead) {
      const index = parseInt(lastRead);
      if (readableChapterIndexes.includes(index)) setCurrentChapterIndex(index);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lastReadChapter', currentChapterIndex.toString());
    localStorage.setItem('jtbd-last-chapter', currentChapterIndex.toString());
    setReadChapters(prev => {
      const next = new Set(Array.from(prev));
      next.add(currentChapterIndex);
      return next;
    });
  }, [currentChapterIndex]);

  const parts: Part[] = [];
  let currentPart: Part | null = null;
  chaptersData.forEach((ch: Chapter) => {
    if (ch.title.includes('ЧАСТЬ')) {
      if (currentPart) parts.push(currentPart);
      currentPart = { name: ch.title, chapters: [] };
    } else if (currentPart) {
      currentPart.chapters.push(ch);
    }
  });
  if (currentPart) parts.push(currentPart);

  const filteredParts = parts.map(part => ({
    ...part,
    chapters: part.chapters.filter(ch =>
      ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(part => part.chapters.length > 0 || part.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const currentChapter = chaptersData[currentChapterIndex];
  const currentReadablePosition = Math.max(0, readableChapterIndexes.indexOf(currentChapterIndex));
  const readingProgress = ((currentReadablePosition + 1) / readableChapterIndexes.length) * 100;
  const previousChapterIndex = readableChapterIndexes[Math.max(0, currentReadablePosition - 1)];
  const nextChapterIndex = readableChapterIndexes[Math.min(readableChapterIndexes.length - 1, currentReadablePosition + 1)];

  useEffect(() => {
    let part = -1;
    for (let i = 0; i <= currentChapterIndex; i++) if (chaptersData[i].title.includes('ЧАСТЬ')) part++;
    if (part >= 0) setExpandedParts(prev => (prev.has(part) ? prev : new Set([...Array.from(prev), part])));
  }, [currentChapterIndex]);

  const togglePart = (index: number) => {
    const next = new Set(Array.from(expandedParts));
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setExpandedParts(next);
  };

  const scrollContent = useCallback((toTop: boolean) => {
    requestAnimationFrame(() => {
      const el = contentScrollRef.current;
      if (!el) return;
      el.scrollTo({ top: toTop ? 0 : el.scrollHeight, behavior: 'smooth' });
    });
  }, []);

  const handleChapterClick = (index: number) => {
    const goingForward = index > currentChapterIndex;
    prevChapterIndexRef.current = currentChapterIndex;
    setCurrentChapterIndex(index);
    setMobileMenuOpen(false);
    // Scroll top when going forward, bottom when going back
    setTimeout(() => scrollContent(goingForward), 30);
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed lg:relative w-72 h-screen z-50 lg:z-auto flex flex-col transition-transform duration-300 bg-sidebar ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ borderRight: "1px solid var(--border)" }}
      >
        {/* Sidebar header */}
        <div
          className="flex items-center justify-between px-4 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
          >
            <Home className="w-4 h-4" />
            Synthetic JTBD
          </button>
          <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              placeholder="Поиск по главам"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 bg-input"
              style={{ border: "1px solid var(--border)" }}
            />
          </div>
        </div>

        {/* Chapters list */}
        <div className="flex-1 overflow-y-auto py-3 px-2">
          {filteredParts.map((part, partIndex) => (
            <div key={partIndex} className="mb-1">
              <button
                onClick={() => togglePart(partIndex)}
                className="w-full flex items-center justify-between px-3 py-2 rounded text-left transition-colors hover:bg-accent/10"
              >
                <span className="text-sm font-semibold text-foreground line-clamp-2 flex-1 pr-2">
                  {formatPartName(part.name)}
                </span>
                {expandedParts.has(partIndex)
                  ? <ChevronUp className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  : <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
              </button>

              {expandedParts.has(partIndex) && (
                <div className="ml-1 mt-0.5 space-y-0.5">
                  {part.chapters.map((chapter) => {
                    const globalIndex = chaptersData.indexOf(chapter);
                    const isRead = readChapters.has(globalIndex);
                    const isActive = currentChapterIndex === globalIndex;

                    return (
                      <button
                        key={globalIndex}
                        onClick={() => handleChapterClick(globalIndex)}
                        className={`w-full text-left px-3 py-2 rounded text-sm leading-snug transition-colors line-clamp-3 ${
                          isActive
                            ? 'bg-primary text-primary-foreground font-semibold'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
                        }`}
                      >
                        <span className="flex items-start gap-1.5">
                          {isRead && !isActive && (
                            <span className="text-muted-foreground opacity-50 mt-0.5 flex-shrink-0">✓</span>
                          )}
                          <span className="flex-1">{chapter.title}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sidebar footer */}
        <div
          className="px-3 py-3 space-y-1.5"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            onClick={() => navigate('/cases')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-all"
          >
            <BookOpenText className="w-3.5 h-3.5" />
            Кейсы
          </button>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-all"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-4 py-3 bg-background"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-muted-foreground flex-1 lg:flex-none">
            {currentReadablePosition + 1} <span className="opacity-40">/ {readableChapterIndexes.length}</span>
          </span>
          <div className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => navigate('/cases')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <BookOpenText className="w-3.5 h-3.5" />
              Кейсы
            </button>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="h-0.5 bg-border" aria-label={`Прогресс чтения: ${Math.round(readingProgress)}%`}>
          <div className="h-full bg-foreground transition-all duration-300" style={{ width: `${readingProgress}%` }} />
        </div>

        {/* Content */}
        <div ref={contentScrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[52rem] px-6 lg:px-12 py-12 lg:py-16">
            <article className="book-prose">
              <h1>{currentChapter.title}</h1>
              <p className="not-prose text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-sans)', hyphens: 'manual', marginBottom: '2.5rem' }}>
                Глава {currentReadablePosition + 1} из {readableChapterIndexes.length}, около {getReadingMinutes(currentChapter.content)}&nbsp;мин чтения
              </p>
              <Streamdown rehypePlugins={bookMarkdownPlugins}>{currentChapter.content}</Streamdown>
            </article>

            {/* Chapter navigation */}
            <div
              className="flex gap-3 mt-16 pt-8 max-w-[34rem]" 
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <button
                onClick={() => handleChapterClick(previousChapterIndex)}
                disabled={currentReadablePosition === 0}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded text-sm font-medium text-foreground transition-all disabled:opacity-20 hover:bg-muted"
                style={{ border: "1px solid var(--border)" }}
              >
                <ArrowLeft className="w-4 h-4" />
                Предыдущая
              </button>
              <button
                onClick={() => handleChapterClick(nextChapterIndex)}
                disabled={currentReadablePosition === readableChapterIndexes.length - 1}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded text-sm font-medium bg-primary text-primary-foreground disabled:opacity-20"
              >
                Следующая
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
