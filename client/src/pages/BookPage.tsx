import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Menu, X, BookOpen, ChevronDown, ChevronUp, Moon, Sun } from 'lucide-react';
import { Streamdown } from 'streamdown';
import { useTheme } from '@/contexts/ThemeContext';
import chapters from '@/data/chapters.json';
import chaptersContent from '@/data/chapters_content.json';

interface Chapter {
  id: number;
  title: string;
  type: string;
  preview: string;
}

interface ChapterContent extends Chapter {
  content: string;
  start_line: number;
  end_line: number;
}

export default function BookPage() {
  const [currentChapterId, setCurrentChapterId] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedParts, setExpandedParts] = useState<Set<number>>(new Set([0, 1]));
  const { theme, toggleTheme } = useTheme();

  const chaptersArray = chapters as Chapter[];
  const contentArray = chaptersContent as ChapterContent[];

  // Group chapters by parts
  const groupedChapters = useMemo(() => {
    const groups: { [key: string]: Chapter[] } = {
      'Введение': [],
      'Часть I': [],
      'Часть II': [],
      'Часть III': [],
      'Часть IV': [],
      'Часть V': [],
      'Часть VI': [],
      'Часть VII': [],
      'Часть VIII': [],
      'Часть IX': [],
      'Часть X': [],
      'Часть XI': [],
      'Заключение': [],
    };

    chaptersArray.forEach((ch) => {
      if (ch.type === 'intro') {
        groups['Введение'].push(ch);
      } else if (ch.type === 'conclusion') {
        groups['Заключение'].push(ch);
      } else {
        if (ch.id <= 3) groups['Часть I'].push(ch);
        else if (ch.id <= 6) groups['Часть II'].push(ch);
        else if (ch.id <= 10) groups['Часть III'].push(ch);
        else if (ch.id <= 15) groups['Часть IV'].push(ch);
        else if (ch.id <= 19) groups['Часть V'].push(ch);
        else if (ch.id <= 24) groups['Часть VI'].push(ch);
        else if (ch.id <= 34) groups['Часть VII'].push(ch);
        else if (ch.id <= 37) groups['Часть VIII'].push(ch);
        else if (ch.id <= 42) groups['Часть IX'].push(ch);
        else if (ch.id <= 47) groups['Часть X'].push(ch);
        else groups['Часть XI'].push(ch);
      }
    });

    return groups;
  }, [chaptersArray]);

  // Filter chapters based on search
  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return chaptersArray;

    const query = searchQuery.toLowerCase();
    return chaptersArray.filter((ch) =>
      ch.title.toLowerCase().includes(query) ||
      ch.preview.toLowerCase().includes(query)
    );
  }, [searchQuery, chaptersArray]);

  const currentChapter = contentArray.find((ch) => ch.id === currentChapterId);

  const togglePart = (partIndex: number) => {
    const newExpanded = new Set(expandedParts);
    if (newExpanded.has(partIndex)) {
      newExpanded.delete(partIndex);
    } else {
      newExpanded.add(partIndex);
    }
    setExpandedParts(newExpanded);
  };

  const partKeys = Object.keys(groupedChapters);

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-50' : 'bg-white text-slate-950'}`}>
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-72' : 'w-0'
        } ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'} border-r transition-all duration-300 flex flex-col overflow-hidden`}
      >
        {/* Search */}
        <div className={`p-6 border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="relative">
            <Search className={`absolute left-3 top-3.5 w-4 h-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
            <Input
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 text-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-50' : 'bg-white border-slate-300 text-slate-950'}`}
            />
          </div>
        </div>

        {/* Chapters List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-1">
            {searchQuery ? (
              <div className="space-y-2">
                <div className={`text-xs font-semibold uppercase tracking-wide ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} px-3 py-2`}>
                  Результаты ({filteredChapters.length})
                </div>
                {filteredChapters.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setCurrentChapterId(ch.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded transition-colors text-sm ${
                      currentChapterId === ch.id
                        ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-medium'
                        : theme === 'dark'
                        ? 'hover:bg-slate-800 text-slate-300'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="truncate">{ch.title}</div>
                  </button>
                ))}
              </div>
            ) : (
              partKeys.map((partKey, partIndex) => {
                const partChapters = groupedChapters[partKey];
                if (partChapters.length === 0) return null;

                const isExpanded = expandedParts.has(partIndex);

                return (
                  <div key={partKey} className="space-y-0.5">
                    <button
                      onClick={() => togglePart(partIndex)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded transition-colors text-xs font-semibold uppercase tracking-wide ${
                        theme === 'dark'
                          ? 'hover:bg-slate-800 text-slate-400'
                          : 'hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <span>{partKey}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="pl-2 space-y-0.5">
                        {partChapters.map((ch) => (
                          <button
                            key={ch.id}
                            onClick={() => {
                              setCurrentChapterId(ch.id);
                              setSidebarOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded transition-colors text-sm ${
                              currentChapterId === ch.id
                                ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-medium'
                                : theme === 'dark'
                                ? 'hover:bg-slate-800 text-slate-400'
                                : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <div className="truncate">{ch.title}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`border-b ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} px-6 py-4 flex items-center justify-between sticky top-0 z-10`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-slate-800'
                  : 'hover:bg-slate-100'
              }`}
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <BookOpen className="w-3 h-3 text-white" />
              </div>
              <h1 className="text-sm font-semibold tracking-tight">Synthetic JTBD</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              {currentChapterId + 1} / {chaptersArray.length}
            </div>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="w-full flex justify-center px-6 py-12">
            <div className="w-full max-w-2xl">
              {currentChapter ? (
                <article className="space-y-8">
                  {/* Title Section */}
                  <div className="space-y-4 pb-8 border-b border-slate-200 dark:border-slate-800">
                    <h1 className={`text-4xl md:text-5xl font-bold leading-tight tracking-tight ${theme === 'dark' ? 'text-slate-50' : 'text-slate-950'}`}>
                      {currentChapter.title}
                    </h1>
                    <div className="flex gap-2 flex-wrap pt-4">
                      {currentChapterId > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentChapterId(currentChapterId - 1)}
                          className={`text-xs font-medium ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'}`}
                        >
                          ← Предыдущая
                        </Button>
                      )}
                      {currentChapterId < chaptersArray.length - 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentChapterId(currentChapterId + 1)}
                          className={`text-xs font-medium ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'}`}
                        >
                          Следующая →
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`prose prose-lg max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}>
                    <style>{`
                      .prose {
                        --tw-prose-body: ${theme === 'dark' ? '#cbd5e1' : '#475569'};
                        --tw-prose-headings: ${theme === 'dark' ? '#f1f5f9' : '#0f172a'};
                        --tw-prose-lead: ${theme === 'dark' ? '#cbd5e1' : '#475569'};
                        --tw-prose-links: #06b6d4;
                        --tw-prose-bold: ${theme === 'dark' ? '#f1f5f9' : '#0f172a'};
                        --tw-prose-counters: #06b6d4;
                        --tw-prose-bullets: #06b6d4;
                        --tw-prose-hr: ${theme === 'dark' ? '#334155' : '#e2e8f0'};
                        --tw-prose-quotes: ${theme === 'dark' ? '#cbd5e1' : '#475569'};
                        --tw-prose-quote-borders: #06b6d4;
                        --tw-prose-captions: ${theme === 'dark' ? '#94a3b8' : '#64748b'};
                        --tw-prose-kbd: ${theme === 'dark' ? '#f1f5f9' : '#0f172a'};
                        --tw-prose-kbd-shadows: rgb(6 182 212 / 0.1);
                        --tw-prose-code: #06b6d4;
                        --tw-prose-pre-bg: ${theme === 'dark' ? '#1e293b' : '#f1f5f9'};
                        --tw-prose-pre-code: ${theme === 'dark' ? '#cbd5e1' : '#0f172a'};
                        --tw-prose-pre-border: ${theme === 'dark' ? '#334155' : '#e2e8f0'};
                        --tw-prose-th-borders: ${theme === 'dark' ? '#334155' : '#e2e8f0'};
                        --tw-prose-td-borders: ${theme === 'dark' ? '#334155' : '#e2e8f0'};
                      }

                      .prose h2 {
                        margin-top: 2rem;
                        margin-bottom: 1rem;
                        font-size: 1.875rem;
                        font-weight: 700;
                        line-height: 1.2;
                      }

                      .prose h3 {
                        margin-top: 1.5rem;
                        margin-bottom: 0.75rem;
                        font-size: 1.25rem;
                        font-weight: 600;
                        line-height: 1.3;
                      }

                      .prose h4 {
                        margin-top: 1rem;
                        margin-bottom: 0.5rem;
                        font-size: 1.1rem;
                        font-weight: 600;
                      }

                      .prose p {
                        margin-bottom: 1.25rem;
                        line-height: 1.75;
                        font-size: 1.0625rem;
                      }

                      .prose ul, .prose ol {
                        margin-bottom: 1.25rem;
                        padding-left: 1.625rem;
                      }

                      .prose li {
                        margin-bottom: 0.5rem;
                        line-height: 1.75;
                      }

                      .prose blockquote {
                        margin-top: 1.5rem;
                        margin-bottom: 1.5rem;
                        padding-left: 1.25rem;
                        border-left: 4px solid #06b6d4;
                        font-style: italic;
                      }

                      .prose table {
                        margin-top: 1.5rem;
                        margin-bottom: 1.5rem;
                        width: 100%;
                        border-collapse: collapse;
                      }

                      .prose th {
                        padding: 0.75rem;
                        text-align: left;
                        font-weight: 600;
                        border-bottom: 2px solid var(--tw-prose-th-borders);
                      }

                      .prose td {
                        padding: 0.75rem;
                        border-bottom: 1px solid var(--tw-prose-td-borders);
                      }

                      .prose code {
                        padding: 0.125rem 0.375rem;
                        border-radius: 0.25rem;
                        background-color: ${theme === 'dark' ? '#1e293b' : '#f1f5f9'};
                        font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
                        font-size: 0.9em;
                      }

                      .prose pre {
                        margin-top: 1.5rem;
                        margin-bottom: 1.5rem;
                        padding: 1rem;
                        border-radius: 0.5rem;
                        overflow-x: auto;
                      }

                      .prose pre code {
                        padding: 0;
                        background-color: transparent;
                      }

                      .prose strong {
                        font-weight: 600;
                      }

                      .prose em {
                        font-style: italic;
                      }

                      .prose a {
                        text-decoration: underline;
                        text-decoration-color: rgba(6, 182, 212, 0.3);
                        transition: all 0.2s;
                      }

                      .prose a:hover {
                        text-decoration-color: #06b6d4;
                      }

                      .prose hr {
                        margin-top: 2rem;
                        margin-bottom: 2rem;
                        border: none;
                        border-top: 1px solid var(--tw-prose-hr);
                      }
                    `}</style>
                    <Streamdown>{currentChapter.content}</Streamdown>
                  </div>

                  {/* Navigation Footer */}
                  <div className={`flex gap-4 pt-8 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                    {currentChapterId > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => setCurrentChapterId(currentChapterId - 1)}
                        className={`flex-1 ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'}`}
                      >
                        ← Предыдущая
                      </Button>
                    )}
                    {currentChapterId < chaptersArray.length - 1 && (
                      <Button
                        variant="outline"
                        onClick={() => setCurrentChapterId(currentChapterId + 1)}
                        className={`flex-1 ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'}`}
                      >
                        Следующая →
                      </Button>
                    )}
                  </div>
                </article>
              ) : (
                <div className="flex items-center justify-center h-96">
                  <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>
                    Выберите главу для чтения
                  </p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
