import { useState, useEffect } from 'react';
import { UploadZone } from './components/UploadZone';
import { DocumentViewer, Page } from './components/DocumentViewer';
import { AssistantPanel } from './components/AssistantPanel';
import { extractTextFromPDF } from './services/pdf';
import { FileText, Loader2, RefreshCw, Clock, Coffee, AlertTriangle, Zap, Presentation, Wand2 } from 'lucide-react';
import { PPTGenerator } from './components/PPTGenerator';
import { FortuneTeller } from './components/FortuneTeller';

type AppMode = 'reader' | 'ppt' | 'fortune';

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('reader');
  const [pages, setPages] = useState<Page[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [fileName, setFileName] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [isOneHourWarningDismissed, setIsOneHourWarningDismissed] = useState(false);
  const [isTwoHourPunished, setIsTwoHourPunished] = useState(false);
  const [merit, setMerit] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pages.length > 0 && !isTwoHourPunished) {
      interval = setInterval(() => {
        setTimeSpent((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [pages.length, isTwoHourPunished]);

  useEffect(() => {
    if (timeSpent >= 7200 && pages.length > 0) {
      setIsTwoHourPunished(true);
      setPages([]);
      setFileName('');
    }
  }, [timeSpent, pages.length]);

  const handleUpload = async (file: File) => {
    setFileName(file.name);
    setIsExtracting(true);
    setTimeSpent(0);
    setIsOneHourWarningDismissed(false);
    setIsTwoHourPunished(false);
    try {
      const extractedPages = await extractTextFromPDF(file);
      setPages(extractedPages.map(text => ({ original: text })));
    } catch (error) {
      console.error("Error extracting PDF:", error);
      alert("Failed to extract text from PDF. Please try another file.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleReset = () => {
    setPages([]);
    setFileName('');
    setTimeSpent(0);
    setIsOneHourWarningDismissed(false);
    setIsTwoHourPunished(false);
    setMerit(0);
  };

  const fullDocumentText = pages.map(p => p.original).join('\n\n');

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans">
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Coffee className="w-6 h-6 text-emerald-600" />
          </div>
          <h1 className="text-xl font-semibold text-slate-800 tracking-tight">反内卷科研助手 🍵</h1>
          
          <div className="ml-8 flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button 
              onClick={() => setAppMode('reader')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${appMode === 'reader' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              论文摸鱼
            </button>
            <button 
              onClick={() => setAppMode('ppt')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${appMode === 'ppt' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Presentation size={16} />
              组会 PPT 救星
            </button>
            <button 
              onClick={() => setAppMode('fortune')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${appMode === 'fortune' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Wand2 size={16} />
              科研算命
            </button>
          </div>
        </div>
        {fileName && appMode === 'reader' && (
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setTimeSpent(7200)}
              className="flex items-center px-2 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 rounded-md hover:bg-amber-200 transition-colors"
              title="课堂展示专用：直接触发2小时惩罚"
            >
              <Zap className="w-3 h-3 mr-1" />
              演示惩罚
            </button>
            <div className="flex items-center text-slate-600 bg-slate-100 px-3 py-1.5 rounded-md font-mono text-sm">
              <Clock className="w-4 h-4 mr-2" />
              {Math.floor(timeSpent / 3600) > 0 ? `${Math.floor(timeSpent / 3600)}:` : ''}{Math.floor((timeSpent % 3600) / 60).toString().padStart(2, '0')}:{(timeSpent % 60).toString().padStart(2, '0')}
            </div>
            <span className="text-sm font-medium text-slate-500 truncate max-w-[300px]" title={fileName}>
              {fileName}
            </span>
            <button
              onClick={handleReset}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              提桶跑路 (重置)
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-hidden">
        {appMode === 'ppt' ? (
          <PPTGenerator />
        ) : appMode === 'fortune' ? (
          <FortuneTeller />
        ) : isExtracting ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            <p className="text-slate-600 font-medium">AI 正在替你受苦 (解析 PDF 中)...</p>
          </div>
        ) : isTwoHourPunished ? (
          <div className="flex flex-col items-center justify-center h-full bg-slate-900 p-6 text-white">
            <div className="p-8 bg-slate-800 rounded-2xl shadow-2xl border border-red-500/30 text-center max-w-lg">
              <div className="text-6xl mb-6">💥</div>
              <h2 className="text-3xl font-bold text-red-400 mb-4">反内卷终极协议已触发</h2>
              <p className="text-slate-300 mb-6 leading-relaxed text-lg">
                检测到你连续科研超过 2 小时！为了防止你猝死，本助手已将刚才的论文<span className="text-red-400 font-bold">物理粉碎并永久删除</span>。
              </p>
              <div className="bg-slate-900 p-4 rounded-lg mb-8 font-mono text-sm text-emerald-400 text-left">
                &gt; rm -rf /brain/papers/* <br/>
                &gt; echo "Go to sleep!" <br/>
                &gt; exit
              </div>
              
              <div className="mb-8 flex flex-col items-center justify-center">
                <button
                  onClick={() => setMerit(m => m + 1)}
                  className="text-7xl active:scale-90 transition-transform cursor-pointer select-none hover:drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                  title="敲击木鱼，积攒功德"
                >
                  🪔
                </button>
                <div className="mt-4 flex flex-col items-center">
                  <span className="text-amber-400 font-mono text-xl font-bold tracking-wider">功德 + {merit}</span>
                  <span className="text-slate-500 text-sm mt-1">既然不能卷了，不如敲敲赛博木鱼</span>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors shadow-sm"
              >
                我错了，我这就去睡觉 (重置)
              </button>
            </div>
          </div>
        ) : pages.length === 0 ? (
          <div className="h-full overflow-y-auto">
            <UploadZone onUpload={handleUpload} />
          </div>
        ) : timeSpent >= 3600 && !isOneHourWarningDismissed ? (
          <div className="flex flex-col items-center justify-center h-full bg-slate-50 p-6">
            <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center max-w-md">
              <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-slate-800 mb-3">温馨提示：你已看了一小时</h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                科研是老板的，命是自己的。建议闭上眼睛，去喝杯水。如果强行继续，满2小时将触发<strong className="text-red-500">终极惩罚</strong>！
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleReset}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors shadow-sm"
                >
                  听劝，立刻去摸鱼
                </button>
                <button
                  onClick={() => setIsOneHourWarningDismissed(true)}
                  className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-medium transition-colors shadow-sm"
                >
                  我偏要卷 (继续看)
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full">
            <div className="w-3/5 h-full">
              <DocumentViewer pages={pages} setPages={setPages} />
            </div>
            <div className="w-2/5 h-full border-l border-slate-200 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-10">
              <AssistantPanel documentText={fullDocumentText} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
