import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import pptxgen from 'pptxgenjs';
import { Upload, FileText, Download, Presentation, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface SlideData {
  title: string;
  content: string[];
  speakerNotes: string;
}

interface PresentationData {
  presentationTitle: string;
  authors: string;
  slides: SlideData[];
}

type AppState = 'upload' | 'generating' | 'preview';

const slideSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "The title of the slide" },
    content: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Bullet points for the slide content. Keep them concise."
    },
    speakerNotes: { type: Type.STRING, description: "Detailed speaker notes explaining the slide content." }
  },
  required: ["title", "content"]
};

const presentationSchema = {
  type: Type.OBJECT,
  properties: {
    presentationTitle: { type: Type.STRING, description: "The main title of the presentation" },
    authors: { type: Type.STRING, description: "The authors of the paper" },
    slides: {
      type: Type.ARRAY,
      items: slideSchema,
      description: "The slides of the presentation. Typically 10-15 slides covering Introduction, Related Work, Methodology, Experiments, Results, and Conclusion."
    }
  },
  required: ["presentationTitle", "authors", "slides"]
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to read file as base64"));
      }
    };
    reader.onerror = error => reject(error);
  });
};

const generatePPTX = (data: PresentationData) => {
  const pres = new pptxgen();
  
  // Title Slide
  const titleSlide = pres.addSlide();
  titleSlide.addText(data.presentationTitle, { x: 1, y: 2, w: 8, h: 1.5, fontSize: 36, bold: true, align: 'center' });
  titleSlide.addText(data.authors, { x: 1, y: 3.5, w: 8, h: 1, fontSize: 24, align: 'center' });

  // Content Slides
  data.slides.forEach(slideData => {
    const slide = pres.addSlide();
    slide.addText(slideData.title, { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 32, bold: true });
    
    const bulletPoints = slideData.content.map(text => ({ text, options: { bullet: true, fontSize: 20, breakLine: true } }));
    slide.addText(bulletPoints, { x: 0.5, y: 1.8, w: 9, h: 3.5, valign: 'top' });
    
    if (slideData.speakerNotes) {
      slide.addNotes(slideData.speakerNotes);
    }
  });

  pres.writeFile({ fileName: `${data.presentationTitle || 'Presentation'}.pptx` });
};

export function PPTGenerator() {
  const [appState, setAppState] = useState<AppState>('upload');
  const [presentationData, setPresentationData] = useState<PresentationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError("Please upload a valid PDF file.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("File size exceeds 20MB limit.");
      return;
    }

    setFileName(file.name);
    setAppState('generating');
    setError(null);

    try {
      const base64Data = await fileToBase64(file);
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: "application/pdf"
            }
          },
          "You are an expert academic presenter. I have provided a research paper. Please generate a comprehensive presentation slide deck for a group meeting. The presentation should clearly explain the paper's motivation, related work, methodology, experiments, results, and conclusion. Keep slide content concise (bullet points) and provide detailed speaker notes for each slide."
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: presentationSchema,
          temperature: 0.2
        }
      });

      const jsonStr = response.text;
      if (!jsonStr) throw new Error("No response from AI");
      
      const data = JSON.parse(jsonStr) as PresentationData;
      setPresentationData(data);
      setAppState('preview');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while generating the presentation.");
      setAppState('upload');
    }
  };

  const resetApp = () => {
    setPresentationData(null);
    setError(null);
    setAppState('upload');
  };

  return (
    <div className="h-full overflow-y-auto font-sans text-slate-900 bg-slate-50">
      {appState === 'upload' && <UploadScreen onUpload={handleFileUpload} error={error} />}
      {appState === 'generating' && <GeneratingScreen fileName={fileName} />}
      {appState === 'preview' && presentationData && (
        <PreviewScreen data={presentationData} onDownload={() => generatePPTX(presentationData)} onReset={resetApp} />
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
          <div className="flex items-center justify-center w-16 h-16 mx-auto text-emerald-600 bg-emerald-100 rounded-2xl mb-6">
            <Presentation size={32} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">组会糊弄神器 (PPT 一键生成)</h1>
          <p className="text-lg text-slate-600">把 PDF 扔进来，AI 自动帮你做 PPT 和演讲稿。早点做完早点下班。</p>
        </div>

        <div 
          onClick={() => fileInputRef.current?.click()}
          className="p-12 mt-8 transition-colors bg-white border-2 border-slate-300 border-dashed cursor-pointer rounded-2xl hover:bg-slate-50 hover:border-emerald-400 group"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={onUpload} 
            accept="application/pdf" 
            className="hidden" 
          />
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 transition-colors bg-slate-50 rounded-full group-hover:bg-emerald-50">
              <Upload className="w-8 h-8 text-slate-400 group-hover:text-emerald-500" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-medium text-slate-900">点击上传或拖拽文件</p>
              <p className="text-sm text-slate-500">支持最大 20MB 的 PDF 文件</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 text-sm font-medium text-red-700 bg-red-50 rounded-lg">
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
    "正在痛苦地阅读文献...",
    "正在编造...啊不，提炼方法论...",
    "正在寻找可以吹水的亮点...",
    "正在疯狂复制粘贴成 PPT...",
    "正在为你准备糊弄导师的演讲稿...",
    "正在进行最后的表面功夫...",
    "这论文太长了，AI 都看困了...",
    "马上搞定，准备下班！"
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
    }, 6000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-slate-50">
      <div className="w-full max-w-md p-8 space-y-8 text-center bg-white border border-slate-100 shadow-sm rounded-2xl">
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 border-4 border-emerald-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-emerald-600">
            <FileText size={24} />
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
              className="h-full bg-emerald-600 transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-400 font-medium text-right">{Math.round(progress)}%</p>
        </div>
      </div>
    </div>
  );
}

const PreviewScreen = ({ data, onDownload, onReset }: { data: PresentationData, onDownload: () => void, onReset: () => void }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = data.slides.length + 1;

  const nextSlide = () => setCurrentSlide(p => Math.min(p + 1, totalSlides - 1));
  const prevSlide = () => setCurrentSlide(p => Math.max(p - 1, 0));

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm z-10">
         <div className="flex items-center gap-4">
           <div className="p-2 text-emerald-600 bg-emerald-100 rounded-lg">
             <Presentation size={20} />
           </div>
           <h1 className="max-w-xl text-xl font-semibold text-slate-800 truncate">{data.presentationTitle}</h1>
         </div>
         <div className="flex gap-3">
           <button onClick={onReset} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 transition-colors bg-slate-100 rounded-lg hover:bg-slate-200">
             <RefreshCw size={16} /> 重新生成
           </button>
           <button onClick={onDownload} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-emerald-600 rounded-lg shadow-sm hover:bg-emerald-700">
             <Download size={16} /> 下载 PPTX
           </button>
         </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (Thumbnails) */}
        <div className="w-64 p-4 space-y-4 overflow-y-auto bg-slate-100 border-r border-slate-200">
           {/* Title Slide Thumbnail */}
           <div 
             onClick={() => setCurrentSlide(0)} 
             className={`cursor-pointer aspect-video bg-white border-2 rounded-lg p-3 flex flex-col items-center justify-center text-center transition-all ${currentSlide === 0 ? 'border-emerald-500 shadow-md ring-2 ring-emerald-200' : 'border-transparent hover:border-slate-300 shadow-sm'}`}
           >
             <div className="text-[10px] font-bold line-clamp-3 text-slate-800">{data.presentationTitle}</div>
             <div className="text-[8px] text-slate-500 mt-2 line-clamp-1">{data.authors}</div>
           </div>
           
           {/* Content Slide Thumbnails */}
           {data.slides.map((slide, idx) => (
             <div 
               key={idx} 
               onClick={() => setCurrentSlide(idx + 1)} 
               className={`cursor-pointer aspect-video bg-white border-2 rounded-lg p-3 flex flex-col transition-all ${currentSlide === idx + 1 ? 'border-emerald-500 shadow-md ring-2 ring-emerald-200' : 'border-transparent hover:border-slate-300 shadow-sm'}`}
             >
               <div className="text-[10px] font-bold mb-1 truncate text-slate-800">{slide.title}</div>
               <div className="text-[6px] text-slate-500 line-clamp-4 space-y-0.5 mt-1">
                 {slide.content.map((c, i) => <div key={i}>• {c}</div>)}
               </div>
             </div>
           ))}
        </div>

        {/* Slide View */}
        <div className="flex flex-col flex-1 bg-slate-200">
          <div className="relative flex items-center justify-center flex-1 p-8 overflow-hidden">
            
            {/* Navigation Buttons */}
            <button 
              onClick={prevSlide} 
              disabled={currentSlide === 0}
              className="absolute z-10 p-2 transition-all rounded-full shadow-md left-4 bg-white/80 backdrop-blur text-slate-600 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={24} />
            </button>
            
            <button 
              onClick={nextSlide} 
              disabled={currentSlide === totalSlides - 1}
              className="absolute z-10 p-2 transition-all rounded-full shadow-md right-4 bg-white/80 backdrop-blur text-slate-600 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={24} />
            </button>

            {/* Slide Canvas */}
            <div className="relative flex flex-col w-full max-w-4xl p-12 bg-white rounded-sm shadow-xl aspect-video">
               {currentSlide === 0 ? (
                 <div className="flex flex-col items-center justify-center flex-1 px-8 text-center">
                   <h2 className="mb-8 text-4xl font-bold leading-tight text-slate-900">{data.presentationTitle}</h2>
                   <p className="text-xl font-medium text-slate-600">{data.authors}</p>
                 </div>
               ) : (
                 <div className="flex flex-col flex-1">
                   <h2 className="pb-4 mb-6 text-3xl font-bold text-slate-900 border-b-2 border-emerald-100">{data.slides[currentSlide - 1].title}</h2>
                   <ul className="flex-1 px-2 space-y-4 text-xl text-slate-700 list-disc list-inside overflow-y-auto">
                     {data.slides[currentSlide - 1].content.map((point, idx) => (
                       <li key={idx} className="pl-2 leading-relaxed">{point}</li>
                     ))}
                   </ul>
                 </div>
               )}
               
               {/* Slide Number */}
               <div className="absolute text-sm font-medium text-slate-400 bottom-6 right-8">
                 {currentSlide + 1} / {totalSlides}
               </div>
            </div>
          </div>

          {/* Speaker Notes */}
          <div className="h-48 bg-white border-t border-slate-200 p-6 overflow-y-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
            <h3 className="mb-3 text-xs font-bold tracking-wider text-slate-400 uppercase">演讲稿 (Speaker Notes)</h3>
            <p className="text-lg leading-relaxed text-slate-700">
              {currentSlide === 0 ? "介绍论文题目和作者。" : data.slides[currentSlide - 1].speakerNotes || "没有提供演讲稿。"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
