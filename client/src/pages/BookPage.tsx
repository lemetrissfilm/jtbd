import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ChevronDown, ChevronUp, Search, Home, Menu, X, Moon, Sun, MessageSquare, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import chaptersData from '@/data/chapters_full.json';
import { Streamdown } from 'streamdown';

interface Chapter {
  title: string;
  content: string;
}

interface Part {
  name: string;
  chapters: Chapter[];
}

export default function BookPage() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [expandedParts, setExpandedParts] = useState<Set<number>>(new Set([0]));
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [readChapters, setReadChapters] = useState<Set<number>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem('readChapters');
    if (saved) setReadChapters(new Set(JSON.parse(saved)));
  }, []);

  useEffect(() => {
    localStorage.setItem('readChapters', JSON.stringify(Array.from(readChapters)));
  }, [readChapters]);

  useEffect(() => {
    const lastRead = localStorage.getItem('lastReadChapter');
    if (lastRead) {
      const index = parseInt(lastRead);
      if (index >= 0 && index < chaptersData.length) setCurrentChapterIndex(index);
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

  const togglePart = (index: number) => {
    const next = new Set(Array.from(expandedParts));
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setExpandedParts(next);
  };

  const handleChapterClick = (index: number) => {
    setCurrentChapterIndex(index);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed lg:relative w-72 h-screen z-50 lg:z-auto flex flex-col transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          background: '#0a0a0a',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-medium"
          >
            <Home className="w-4 h-4" />
            Synthetic JTBD
          </button>
          <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden text-white/40 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              placeholder="Поиск по главам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:ring-1 focus:ring-white/20"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>
        </div>

        {/* Chapters list */}
        <div className="flex-1 overflow-y-auto py-3 px-2">
          {filteredParts.map((part, partIndex) => (
            <div key={partIndex} className="mb-1">
              <button
                onClick={() => togglePart(partIndex)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors hover:bg-white/[0.05]"
              >
                <span className="text-xs font-bold tracking-wide text-white/40 uppercase line-clamp-2 flex-1 pr-2">
                  {part.name.replace('ЧАСТЬ ', 'Ч. ')}
                </span>
                {expandedParts.has(partIndex)
                  ? <ChevronUp className="w-3 h-3 text-white/30 flex-shrink-0" />
                  : <ChevronDown className="w-3 h-3 text-white/30 flex-shrink-0" />}
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
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all line-clamp-2 ${
                          isActive
                            ? 'bg-white text-black font-semibold'
                            : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                        }`}
                      >
                        <span className="flex items-start gap-1.5">
                          {isRead && !isActive && (
                            <span className="text-white/25 mt-0.5 flex-shrink-0">✓</span>
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
        <div className="px-3 py-3 space-y-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => navigate('/chat')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            AI-чат по книге
          </button>
          <button
            onClick={() => navigate('/trainer')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Тренажёр JTBD
          </button>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all"
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
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#000000' }}
        >
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-white/50 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-white/40 flex-1 lg:flex-none">
            {currentChapterIndex + 1} <span className="text-white/20">/ {chaptersData.length}</span>
          </span>
          <div className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => navigate('/chat')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-white/40 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              AI-чат
            </button>
            <button
              onClick={() => navigate('/trainer')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-white/40 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Тренажёр
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 lg:px-10 py-12">
            <article className="prose prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-4xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-white/80 prose-p:leading-relaxed prose-strong:text-white prose-code:text-white/90 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-blockquote:border-white/20 prose-blockquote:text-white/60 prose-table:text-sm prose-th:text-white prose-td:text-white/70 prose-a:text-white prose-a:underline prose-a:underline-offset-2 prose-li:text-white/80">
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white mb-8" style={{ letterSpacing: '-0.025em' }}>
                {currentChapter.title}
              </h1>
              <Streamdown>{currentChapter.content}</Streamdown>
            </article>

            {/* Chapter navigation */}
            <div className="flex gap-3 mt-16 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                onClick={() => setCurrentChapterIndex(i => Math.max(0, i - 1))}
                disabled={currentChapterIndex === 0}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium transition-all disabled:opacity-20 hover:bg-white/[0.07]"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <ArrowLeft className="w-4 h-4" />
                Предыдущая
              </button>
              <button
                onClick={() => setCurrentChapterIndex(i => Math.min(chaptersData.length - 1, i + 1))}
                disabled={currentChapterIndex === chaptersData.length - 1}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold bg-white text-black transition-all disabled:opacity-20 hover:bg-white/90"
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
