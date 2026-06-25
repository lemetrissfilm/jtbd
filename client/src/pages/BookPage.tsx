import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
          sidebarOpen ? 'w-80' : 'w-0'
        } ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'} border-r transition-all duration-300 flex flex-col overflow-hidden`}
      >
        {/* Search */}
        <div className={`p-4 border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="relative">
            <Search className={`absolute left-3 top-3 w-4 h-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
            <Input
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-50' : 'bg-white border-slate-300 text-slate-950'}`}
            />
          </div>
        </div>

        {/* Chapters List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {searchQuery ? (
              <div className="space-y-2">
                <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} px-2`}>
                  Результаты поиска ({filteredChapters.length})
                </div>
                {filteredChapters.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setCurrentChapterId(ch.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      currentChapterId === ch.id
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                        : theme === 'dark'
                        ? 'hover:bg-slate-800'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-sm font-medium truncate">{ch.title}</div>
                    <div className={`text-xs line-clamp-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      {ch.preview}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              partKeys.map((partKey, partIndex) => {
                const partChapters = groupedChapters[partKey];
                if (partChapters.length === 0) return null;

                const isExpanded = expandedParts.has(partIndex);

                return (
                  <div key={partKey} className="space-y-1">
                    <button
                      onClick={() => togglePart(partIndex)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm font-semibold ${
                        theme === 'dark'
                          ? 'hover:bg-slate-800 text-slate-50'
                          : 'hover:bg-slate-100 text-slate-950'
                      }`}
                    >
                      <span>{partKey}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="pl-2 space-y-1">
                        {partChapters.map((ch) => (
                          <button
                            key={ch.id}
                            onClick={() => {
                              setCurrentChapterId(ch.id);
                              setSidebarOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                              currentChapterId === ch.id
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                                : theme === 'dark'
                                ? 'hover:bg-slate-800 text-slate-50'
                                : 'hover:bg-slate-100 text-slate-950'
                            }`}
                          >
                            <div className="truncate font-medium">{ch.title}</div>
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
        <div className={`border-b ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} p-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-lg transition-colors ${
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
              <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold">Synthetic JTBD</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              {currentChapterId + 1} / {chaptersArray.length}
            </div>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto p-8">
            {currentChapter ? (
              <div className="prose prose-invert max-w-none">
                <div className="mb-8">
                  <h1 className={`text-4xl font-bold mb-2 ${theme === 'dark' ? 'text-slate-50' : 'text-slate-950'}`}>
                    {currentChapter.title}
                  </h1>
                  <div className="flex gap-2 flex-wrap">
                    {currentChapterId > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentChapterId(currentChapterId - 1)}
                        className={theme === 'dark' ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'}
                      >
                        ← Предыдущая
                      </Button>
                    )}
                    {currentChapterId < chaptersArray.length - 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentChapterId(currentChapterId + 1)}
                        className={theme === 'dark' ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'}
                      >
                        Следующая →
                      </Button>
                    )}
                  </div>
                </div>

                <div className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                  <Streamdown>{currentChapter.content}</Streamdown>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-96">
                <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>
                  Выберите главу для чтения
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
