import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ChevronDown, ChevronUp, Search, Home, Menu, X, Moon, Sun, MessageSquare, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  // Load read chapters from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('readChapters');
    if (saved) {
      setReadChapters(new Set(JSON.parse(saved)));
    }
  }, []);

  // Save read chapters to localStorage
  useEffect(() => {
    const readArray = Array.from(readChapters);
    localStorage.setItem('readChapters', JSON.stringify(readArray));
  }, [readChapters]);

  // Load last read chapter
  useEffect(() => {
    const lastRead = localStorage.getItem('lastReadChapter');
    if (lastRead) {
      const index = parseInt(lastRead);
      if (index >= 0 && index < chaptersData.length) {
        setCurrentChapterIndex(index);
      }
    }
  }, []);

  // Save current chapter
  useEffect(() => {
    localStorage.setItem('lastReadChapter', currentChapterIndex.toString());
    setReadChapters(prev => {
      const newSet = new Set(Array.from(prev));
      newSet.add(currentChapterIndex);
      return newSet;
    });
  }, [currentChapterIndex]);

  // Organize chapters into parts
  const parts: Part[] = [];
  let currentPart: Part | null = null;

  chaptersData.forEach((ch: Chapter) => {
    if (ch.title.includes('ЧАСТЬ')) {
      if (currentPart) {
        parts.push(currentPart);
      }
      currentPart = {
        name: ch.title,
        chapters: []
      };
    } else if (currentPart) {
      currentPart.chapters.push(ch);
    }
  });

  if (currentPart) {
    parts.push(currentPart);
  }

  // Filter chapters based on search
  const filteredParts = parts.map(part => ({
    ...part,
    chapters: part.chapters.filter(ch =>
      ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(part => part.chapters.length > 0 || part.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const currentChapter = chaptersData[currentChapterIndex];

  const togglePart = (index: number) => {
    const expandedArray = Array.from(expandedParts);
    const newExpanded = new Set(expandedArray);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedParts(newExpanded);
  };

  const handleChapterClick = (index: number) => {
    setCurrentChapterIndex(index);
    setMobileMenuOpen(false);
  };

  const goToPreviousChapter = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(currentChapterIndex - 1);
    }
  };

  const goToNextChapter = () => {
    if (currentChapterIndex < chaptersData.length - 1) {
      setCurrentChapterIndex(currentChapterIndex + 1);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:relative w-full lg:w-80 h-screen bg-background border-r border-border z-50 lg:z-auto transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            >
              <Home className="w-5 h-5" />
              <span className="font-semibold">На главную</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Chapters list */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-2">
              {filteredParts.map((part, partIndex) => (
                <div key={partIndex}>
                  <button
                    onClick={() => togglePart(partIndex)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-secondary transition-colors text-left font-semibold text-sm"
                  >
                    <span className="line-clamp-2">{part.name}</span>
                    {expandedParts.has(partIndex) ? (
                      <ChevronUp className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    )}
                  </button>

                  {expandedParts.has(partIndex) && (
                    <div className="ml-2 space-y-1 mt-1">
                      {part.chapters.map((chapter, chIndex) => {
                        const globalIndex = chaptersData.indexOf(chapter);
                        const isRead = readChapters.has(globalIndex);
                        const isActive = currentChapterIndex === globalIndex;

                        return (
                          <button
                            key={globalIndex}
                            onClick={() => handleChapterClick(globalIndex)}
                            className={`w-full text-left p-2 rounded-lg text-sm transition-colors line-clamp-2 ${
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-secondary text-foreground'
                            }`}
                          >
                            <span className="flex items-start gap-2">
                              {isRead && <span className="text-xs mt-0.5">✓</span>}
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
          </div>

          {/* Theme toggle */}
          <div className="p-4 border-t border-border space-y-2">
            <Button
              onClick={() => navigate('/chat')}
              variant="outline"
              size="sm"
              className="w-full gap-2 justify-start"
            >
              <MessageSquare className="w-4 h-4 text-primary" />
              AI-чат по книге
            </Button>
            <Button
              onClick={() => navigate('/trainer')}
              variant="outline"
              size="sm"
              className="w-full gap-2 justify-start"
            >
              <CheckCircle className="w-4 h-4 text-primary" />
              Тренажёр JTBD
            </Button>
            <Button
              onClick={toggleTheme}
              variant="ghost"
              size="sm"
              className="w-full"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-4 h-4 mr-2" />
                  Тёмная тема
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 mr-2" />
                  Светлая тема
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="border-b border-border bg-background p-4 flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold flex-1 text-center lg:text-left">
            Synthetic JTBD
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/chat')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              AI-чат
            </button>
            <button
              onClick={() => navigate('/trainer')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Тренажёр
            </button>
            <span className="text-sm text-muted-foreground">
              {currentChapterIndex + 1} / {chaptersData.length}
            </span>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-secondary transition-colors lg:hidden"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 lg:px-8 py-12">
            <article className="prose prose-sm dark:prose-invert max-w-none">
              <h1 className="text-4xl font-bold mb-8">{currentChapter.title}</h1>
              <div className="text-lg leading-relaxed whitespace-pre-wrap">
                <Streamdown>{currentChapter.content}</Streamdown>
              </div>
            </article>

            {/* Navigation */}
            <div className="flex gap-4 mt-12 pt-8 border-t border-border">
              <Button
                onClick={goToPreviousChapter}
                disabled={currentChapterIndex === 0}
                variant="outline"
                className="flex-1"
              >
                ← Предыдущая
              </Button>
              <Button
                onClick={goToNextChapter}
                disabled={currentChapterIndex === chaptersData.length - 1}
                className="flex-1"
              >
                Следующая →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
