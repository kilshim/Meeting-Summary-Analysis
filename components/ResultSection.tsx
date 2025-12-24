import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Chat } from "@google/genai";
import { CheckCircle2, List, FileText, Copy, Download, Check } from 'lucide-react';
import { AnalysisResult, ProcessingState } from '../types';
import ChatSection from './ChatSection';

interface ResultSectionProps {
  processingState: ProcessingState;
  result: AnalysisResult | null;
  chatSession: Chat | null;
}

const ResultSection: React.FC<ResultSectionProps> = ({ processingState, result, chatSession }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    if (!result?.detailedSummary) return;
    try {
      await navigator.clipboard.writeText(result.detailedSummary);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    if (!result?.detailedSummary) return;
    const element = document.createElement("a");
    const file = new Blob([result.detailedSummary], {type: 'text/markdown;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = `meeting_summary_${new Date().toISOString().slice(0,10)}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  if (processingState.status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] md:h-[80vh] text-gray-400 dark:text-gray-500">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-full shadow-sm mb-4 transition-colors">
          <List className="w-12 h-12 text-gray-300 dark:text-gray-600" />
        </div>
        <p className="text-base md:text-lg text-center px-4">왼쪽 사이드바(모바일은 메뉴)에서 파일을 업로드하고 분석을 시작하세요.</p>
      </div>
    );
  }

  if (processingState.status === 'error') {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-6 py-4 rounded-xl shadow-sm mt-10">
        <h3 className="font-bold mb-2">오류 발생</h3>
        <p>{processingState.message}</p>
      </div>
    );
  }

  if (processingState.status !== 'completed' && processingState.status !== 'idle') {
     return (
       <div className="flex flex-col items-center justify-center h-[60vh] md:h-[80vh]">
         <div className="relative w-24 h-24 mb-6">
           <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
           <div className="absolute inset-0 border-4 border-teal-600 rounded-full border-t-transparent animate-spin"></div>
         </div>
         <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 transition-colors text-center">
            {processingState.status === 'uploading' && '파일 준비 중...'}
            {processingState.status === 'processing' && 'AI 분석 및 요약 생성 중...'}
         </h2>
         <p className="text-gray-500 dark:text-gray-400 text-center px-4">잠시만 기다려주세요. 회의 길이에 따라 시간이 소요될 수 있습니다.</p>
       </div>
     );
  }

  // Completed State
  return (
    <div className="animate-fade-in pb-20">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 p-2 rounded-full">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white transition-colors">분석 완료</h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm transition-colors">Gemini 2.5 Flash 모델이 회의 내용을 요약했습니다.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column: Summaries */}
        <div className="lg:col-span-3 space-y-6 md:space-y-8">
          {/* 3-Line Summary Card */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transform transition-all hover:shadow-2xl">
            <div className="bg-gradient-to-r from-teal-700 to-cyan-800 px-6 py-4 flex items-center gap-3">
              <List className="text-white w-5 h-5" />
              <h3 className="text-lg font-bold text-white">3줄 핵심 요약</h3>
            </div>
            <div className="p-6 md:p-8">
              <div className="space-y-4">
                {result?.summary3Lines.map((line, index) => (
                  <div key={index} className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 font-bold flex items-center justify-center text-sm">
                      {index + 1}
                    </span>
                    <p className="text-base md:text-lg text-gray-700 dark:text-gray-200 font-medium leading-relaxed pt-1 transition-colors">
                      {line}
                    </p>
                  </div>
                ))}
                {(!result?.summary3Lines || result.summary3Lines.length === 0) && (
                  <p className="text-gray-400 italic">요약된 내용이 없습니다.</p>
                )}
              </div>
            </div>
          </section>

          {/* Detailed Summary Card */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transform transition-all hover:shadow-2xl">
            <div className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="text-slate-600 dark:text-gray-300 w-5 h-5" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-gray-100">상세 줄글 요약</h3>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                    onClick={handleCopy}
                    disabled={!result?.detailedSummary}
                    className="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="클립보드에 복사"
                >
                    {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                    onClick={handleDownload}
                    disabled={!result?.detailedSummary}
                    className="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="파일로 저장 (.md)"
                >
                    <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6 md:p-8 prose prose-slate dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed transition-colors">
              {result?.detailedSummary ? (
                 <ReactMarkdown 
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-6" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3 mt-5" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2 mt-4" {...props} />,
                    p: ({node, ...props}) => <p className="mb-4 text-gray-600 dark:text-gray-300 leading-7" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1 text-gray-600 dark:text-gray-300" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1 text-gray-600 dark:text-gray-300" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold text-gray-900 dark:text-white" {...props} />,
                  }}
                 >
                   {result.detailedSummary}
                 </ReactMarkdown>
              ) : (
                <p className="text-gray-400 italic">상세 요약 내용이 없습니다.</p>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Chat */}
        <div className="lg:col-span-2">
           <ChatSection chatSession={chatSession} />
        </div>
      </div>
    </div>
  );
};

export default ResultSection;