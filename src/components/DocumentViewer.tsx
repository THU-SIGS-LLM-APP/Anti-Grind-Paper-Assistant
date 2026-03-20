import { useState } from 'react';
import { cn } from '../lib/utils';
import { translateChunk } from '../services/gemini';
import { Loader2, Languages } from 'lucide-react';

export interface Page {
  original: string;
  translated?: string;
  isTranslating?: boolean;
}

export function DocumentViewer({ pages, setPages }: { pages: Page[], setPages: React.Dispatch<React.SetStateAction<Page[]>> }) {
  const [viewMode, setViewMode] = useState<'original' | 'translated'>('original');

  const handleTranslateAll = async () => {
    setViewMode('translated');
    for (let i = 0; i < pages.length; i++) {
      if (!pages[i].translated && !pages[i].isTranslating) {
        // Mark as translating
        setPages(prev => {
          const newPages = [...prev];
          newPages[i] = { ...newPages[i], isTranslating: true };
          return newPages;
        });

        const translatedText = await translateChunk(pages[i].original);

        setPages(prev => {
          const newPages = [...prev];
          newPages[i] = { ...newPages[i], translated: translatedText, isTranslating: false };
          return newPages;
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/50">
        <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('original')}
            className={cn("px-3 py-1.5 text-sm font-medium rounded-md transition-all", viewMode === 'original' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900")}
          >
            原汁原味 (费脑)
          </button>
          <button
            onClick={() => setViewMode('translated')}
            className={cn("px-3 py-1.5 text-sm font-medium rounded-md transition-all", viewMode === 'translated' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900")}
          >
            中文直译 (护肝)
          </button>
        </div>
        <button
          onClick={handleTranslateAll}
          className="flex items-center px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-md hover:bg-emerald-200 transition-colors"
        >
          <Languages className="w-4 h-4 mr-2" />
          一键机翻 (拒绝烧脑)
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-12">
        {pages.map((page, index) => (
          <div key={index} className="relative group">
            <div className="absolute -left-6 top-1 text-xs font-mono text-slate-300 select-none group-hover:text-slate-400 transition-colors">
              {index + 1}
            </div>
            {viewMode === 'original' ? (
              <p className="text-slate-800 leading-loose whitespace-pre-wrap font-serif text-lg">
                {page.original}
              </p>
            ) : (
              <div className="text-slate-800 leading-loose whitespace-pre-wrap font-serif text-lg min-h-[100px]">
                {page.isTranslating ? (
                  <div className="flex items-center text-emerald-600 text-sm font-sans bg-emerald-50 p-4 rounded-lg">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    正在努力翻译第 {index + 1} 页，你可以先刷会儿手机...
                  </div>
                ) : page.translated ? (
                  page.translated
                ) : (
                  <div className="text-slate-400 italic text-sm font-sans bg-slate-50 p-4 rounded-lg border border-slate-100">
                    点击右上角的“一键机翻”，放过你的脑细胞吧。
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
