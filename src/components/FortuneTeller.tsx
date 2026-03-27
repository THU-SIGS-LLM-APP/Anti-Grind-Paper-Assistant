import React, { useState, useRef, useEffect } from 'react';
import { Upload, Wand2, RefreshCw } from 'lucide-react';
import Markdown from 'react-markdown';
import { generateFortune } from '../services/gemini';
import { extractTextFromPDF } from '../services/pdf';

type AppState = 'upload' | 'generating' | 'result';

export function FortuneTeller() {
  const [appState, setAppState] = useState<AppState>('upload');
  const [fortuneResult, setFortuneResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError("请上传 PDF 文件。");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("文件大小不能超过 20MB。");
      return;
    }

    setFileName(file.name);
    setAppState('generating');
    setError(null);

    try {
      const extractedPages = await extractTextFromPDF(file);
      const text = extractedPages.join('\n\n');
      const result = await generateFortune(text);
      setFortuneResult(result);
      setAppState('result');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "算命过程中发生意外，请重试。");
      setAppState('upload');
    }
  };

  const resetApp = () => {
    setFortuneResult(null);
    setError(null);
    setAppState('upload');
  };

  return (
    <div className="h-full overflow-y-auto font-sans text-slate-900 bg-slate-50">
      {appState === 'upload' && <UploadScreen onUpload={handleFileUpload} error={error} />}
      {appState === 'generating' && <GeneratingScreen fileName={fileName} />}
      {appState === 'result' && fortuneResult && (
        <ResultScreen result={fortuneResult} onReset={resetApp} fileName={fileName} />
      )}
    </div>
  );
}

const UploadScreen = ({ onUpload, error }: { onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void, error: string | null }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-slate-50">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div className="space-y-4">
          <div className="flex items-center justify-center w-16 h-16 mx-auto text-purple-600 bg-purple-100 rounded-2xl mb-6 shadow-sm">
            <Wand2 size={32} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">科研算命 🔮</h1>
          <p className="text-lg text-slate-600">上传论文 (PDF)，赛博算命大师为你卜算它的投稿命运。</p>
        </div>

        <div 
          onClick={() => fileInputRef.current?.click()}
          className="p-12 mt-8 transition-colors bg-white border-2 border-slate-300 border-dashed cursor-pointer rounded-2xl hover:bg-slate-50 hover:border-purple-400 group shadow-sm"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={onUpload} 
            accept="application/pdf" 
            className="hidden" 
          />
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 transition-colors bg-slate-50 rounded-full group-hover:bg-purple-50">
              <Upload className="w-8 h-8 text-slate-400 group-hover:text-purple-500" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-medium text-slate-900">点击上传或拖拽文件</p>
              <p className="text-sm text-slate-500">支持最大 20MB 的 PDF 文件</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 text-sm font-medium text-red-700 bg-red-50 rounded-lg border border-red-100">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

const GeneratingScreen = ({ fileName }: { fileName: string }) => {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  
  const messages = [
    "正在焚香沐浴...",
    "正在夜观天象...",
    "正在翻阅学术生死簿...",
    "正在解析 Reviewer 2 的怨气...",
    "正在计算中稿概率...",
    "天机即将泄露..."
  ];

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(p => {
        if (p < 30) return p + 1.5;
        if (p < 60) return p + 0.5;
        if (p < 85) return p + 0.2;
        if (p < 98) return p + 0.05;
        return p;
      });
    }, 100);

    const messageInterval = setInterval(() => {
      setMessageIndex(prev => Math.min(prev + 1, messages.length - 1));
    }, 4000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-slate-50">
      <div className="w-full max-w-md p-8 space-y-8 text-center bg-white border border-slate-100 shadow-sm rounded-2xl">
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 border-4 border-purple-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-purple-600">
            <Wand2 size={24} />
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900 transition-opacity duration-500">
            {messages[messageIndex]}
          </h2>
          {fileName && <p className="text-sm text-slate-500 truncate px-4" title={fileName}>{fileName}</p>}
        </div>
        
        <div className="space-y-2">
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-600 transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-400 font-medium text-right">{Math.round(progress)}%</p>
        </div>
      </div>
    </div>
  );
}

const ResultScreen = ({ result, onReset, fileName }: { result: string, onReset: () => void, fileName: string }) => {
  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm z-10">
         <div className="flex items-center gap-4">
           <div className="p-2 text-purple-600 bg-purple-100 rounded-lg">
             <Wand2 size={20} />
           </div>
           <h1 className="max-w-xl text-xl font-semibold text-slate-800 truncate">算命结果：{fileName}</h1>
         </div>
         <button onClick={onReset} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 transition-colors bg-slate-100 rounded-lg hover:bg-slate-200">
           <RefreshCw size={16} /> 再算一卦
         </button>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-purple-100 p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-400 via-fuchsia-500 to-purple-600"></div>
          <div className="markdown-body prose prose-slate prose-purple max-w-none prose-lg">
            <Markdown>{result}</Markdown>
          </div>
        </div>
      </div>
    </div>
  );
}
