import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, BookOpen, Loader2, Zap, MessageSquare } from 'lucide-react';
import { chatWithDocumentStream, getRecommendations, generateTLDR, generateBSReport } from '../services/gemini';
import Markdown from 'react-markdown';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export function AssistantPanel({ documentText }: { documentText: string }) {
  const [activeTab, setActiveTab] = useState<'chat' | 'recommendations'>('chat');
  const [messages, setMessages] = useState<Message[]>([{ role: 'model', content: '你好！我是你的反内卷科研助手 🍵。我的宗旨是：能不看就不看，能少看就少看。有什么问题随便问，我会尽量用最少的话回答你，绝不耽误你摸鱼的时间。' }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [recommendations, setRecommendations] = useState('');
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    setMessages(prev => [...prev, { role: 'model', content: '' }]);

    try {
      const stream = chatWithDocumentStream(documentText, messages.slice(1), userMsg);
      
      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = fullResponse;
          return newMessages;
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGetRecommendations = async () => {
    if (recommendations || isLoadingRecs) return;
    setIsLoadingRecs(true);
    try {
      const recs = await getRecommendations(documentText);
      setRecommendations(recs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingRecs(false);
    }
  };

  const handleTLDR = async () => {
    if (isTyping) return;
    const userMsg = "太长不看 (TL;DR)";
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);
    setMessages(prev => [...prev, { role: 'model', content: '正在替你受苦，提炼精华中...' }]);

    try {
      const tldr = await generateTLDR(documentText);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].content = tldr;
        return newMessages;
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  const handleBSReport = async () => {
    if (isTyping) return;
    const userMsg = "糊弄导师 (生成汇报)";
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);
    setMessages(prev => [...prev, { role: 'model', content: '正在酝酿学术废话，请稍候...' }]);

    try {
      const report = await generateBSReport(documentText);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].content = report;
        return newMessages;
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <div className="flex border-b border-slate-200 bg-white">
        <button
          onClick={() => setActiveTab('chat')}
          className={cn("flex-1 py-4 text-sm font-medium flex items-center justify-center border-b-2 transition-colors", activeTab === 'chat' ? "border-emerald-500 text-emerald-600 bg-emerald-50/30" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50")}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          佛系问答
        </button>
        <button
          onClick={() => { setActiveTab('recommendations'); handleGetRecommendations(); }}
          className={cn("flex-1 py-4 text-sm font-medium flex items-center justify-center border-b-2 transition-colors", activeTab === 'recommendations' ? "border-emerald-500 text-emerald-600 bg-emerald-50/30" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50")}
        >
          <BookOpen className="w-4 h-4 mr-2" />
          随便推推
        </button>
      </div>

      {activeTab === 'chat' ? (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={handleTLDR}
                disabled={isTyping}
                className="flex items-center px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium hover:bg-amber-200 transition-colors whitespace-nowrap disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 mr-1" />
                太长不看 (TL;DR)
              </button>
              <button
                onClick={handleBSReport}
                disabled={isTyping}
                className="flex items-center px-3 py-1.5 bg-teal-100 text-teal-700 rounded-full text-xs font-medium hover:bg-teal-200 transition-colors whitespace-nowrap disabled:opacity-50"
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1" />
                糊弄导师汇报
              </button>
            </div>
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[85%] rounded-2xl px-5 py-3.5", msg.role === 'user' ? "bg-emerald-600 text-white" : "bg-white border border-slate-200 text-slate-800 shadow-sm")}>
                  <div className={cn("markdown-body text-sm leading-relaxed", msg.role === 'user' && "text-white [&_*]:text-white")}>
                    <Markdown>{msg.content}</Markdown>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 bg-white border-t border-slate-200">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="问点核心的就行，别深究..."
                className="w-full pl-5 pr-12 py-3.5 bg-slate-100 border-transparent rounded-full focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="absolute right-2 p-2.5 text-white bg-emerald-600 rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {isLoadingRecs ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              <p>正在随便找找相关论文...</p>
            </div>
          ) : recommendations ? (
            <div className="markdown-body prose prose-slate max-w-none prose-sm">
              <Markdown>{recommendations}</Markdown>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
