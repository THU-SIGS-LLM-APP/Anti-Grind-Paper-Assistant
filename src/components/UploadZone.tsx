import { UploadCloud, AlertTriangle } from 'lucide-react';
import { useCallback, useState } from 'react';
import { cn } from '../lib/utils';

export function UploadZone({ onUpload }: { onUpload: (file: File) => void }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        onUpload(file);
      } else {
        alert('Please upload a PDF file.');
      }
    }
  }, [onUpload]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col items-center justify-center w-full max-w-2xl p-12 mx-auto mt-20 border-2 border-dashed rounded-2xl transition-colors duration-200",
        isDragging ? "border-emerald-500 bg-emerald-50/50" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
      )}
    >
      <UploadCloud className={cn("w-16 h-16 mb-4", isDragging ? "text-emerald-500" : "text-slate-400")} />
      <h3 className="mb-2 text-xl font-semibold text-slate-700">上传文献 (意思一下就行)</h3>
      <p className="mb-6 text-sm text-slate-500 text-center">
        把 PDF 扔进来吧。AI 会帮你读，你负责喝茶就行。<br/>
        别太拼命，我们会帮你提炼核心，省下时间去摸鱼。
      </p>
      <label className="px-6 py-3 text-sm font-medium text-white bg-emerald-600 rounded-full cursor-pointer hover:bg-emerald-700 transition-colors shadow-sm hover:shadow-md">
        选择 PDF 文件 (别选太长的)
        <input
          type="file"
          className="hidden"
          accept="application/pdf"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onUpload(e.target.files[0]);
            }
          }}
        />
      </label>

      <div className="mt-10 p-4 bg-amber-50 rounded-xl border border-amber-200 max-w-md mx-auto text-left shadow-sm">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 leading-relaxed">
            <strong className="block mb-1 text-amber-900">⚠️ 反内卷协议已生效</strong>
            <ul className="list-disc pl-4 space-y-1 text-amber-700/90">
              <li>连续阅读 <strong>1 小时</strong> 将触发强制休息提示。</li>
              <li>连续阅读 <strong>2 小时</strong> 将触发<strong className="text-red-600">终极惩罚</strong>（物理粉碎当前论文，且不可恢复）。</li>
            </ul>
            <p className="mt-2 text-xs text-amber-600">科研诚可贵，生命价更高。请合理安排作息。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
