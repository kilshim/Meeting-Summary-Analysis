import React, { useState, useEffect } from 'react';
import { Key, UploadCloud, Play, FileAudio, Moon, Sun, X, RotateCcw, Save, Trash2, ExternalLink, HelpCircle, ChevronDown, ChevronUp, Globe } from 'lucide-react';

interface SidebarProps {
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  onRemoveApiKey: () => void;
  files: File[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAnalyze: () => void;
  onReset: () => void;
  isProcessing: boolean;
  darkMode: boolean;
  toggleTheme: () => void;
  onRemoveFile: (index: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  apiKey,
  onSaveApiKey,
  onRemoveApiKey,
  files,
  onFileChange,
  onAnalyze,
  onReset,
  isProcessing,
  darkMode,
  toggleTheme,
  onRemoveFile,
  isOpen,
  onClose
}) => {
  const [inputValue, setInputValue] = useState(apiKey);
  const [showHelp, setShowHelp] = useState(false);
  
  // Sync local input with prop when it changes (e.g. on load from storage)
  useEffect(() => {
    setInputValue(apiKey);
  }, [apiKey]);

  const isReady = (apiKey.length > 0 || inputValue.trim().length > 0) && files.length > 0;

  const handleAnalyzeClick = () => {
    // If not saved but input has value, use that
    if (!apiKey && inputValue.trim()) {
      onSaveApiKey(inputValue.trim());
    }
    onAnalyze();
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const handleSave = () => {
    if (inputValue.trim()) {
      onSaveApiKey(inputValue.trim());
    }
  };

  const handleDelete = () => {
    onRemoveApiKey();
    setInputValue('');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed left-0 top-0 h-full w-80 bg-teal-900 text-white p-6 shadow-2xl flex flex-col z-40 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        {/* Header Area with Actions */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white/10 p-2 rounded-lg">
              <FileAudio className="w-5 h-5 text-teal-300" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">AI 회의 분석</h1>
          </div>
          
          <div className="flex items-center gap-1">
             {/* Theme Toggle */}
             <button 
               onClick={toggleTheme} 
               className="p-2 rounded-full hover:bg-white/10 transition-colors text-teal-200 hover:text-white"
               title={darkMode ? "라이트 모드" : "다크 모드"}
             >
               {darkMode ? <Sun size={18} /> : <Moon size={18} />}
             </button>
             
             {/* Reset Button */}
             <button 
               onClick={onReset} 
               disabled={isProcessing} 
               className={`p-2 rounded-full transition-colors ${
                 isProcessing 
                   ? 'opacity-30 cursor-not-allowed' 
                   : 'text-teal-200 hover:text-red-300 hover:bg-white/10'
               }`}
               title="초기화"
             >
               <RotateCcw size={18} />
             </button>

             {/* Mobile Close Button */}
             <button 
               onClick={onClose} 
               className="md:hidden p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white ml-1"
             >
               <X size={18} />
             </button>
          </div>
        </div>

        <div className="space-y-8 flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {/* API Key Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-teal-200 uppercase tracking-wider flex items-center gap-2">
                <Key className="w-3 h-3" /> API Key
              </label>
              {apiKey && (
                <span className="text-[10px] bg-teal-600 px-2 py-0.5 rounded text-white font-medium">
                  저장됨
                </span>
              )}
            </div>
            
            <div className="relative flex items-center">
              <input
                type="password"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Gemini API Key 입력"
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-4 pr-20 py-3 text-sm text-white placeholder-teal-300/50 focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all"
              />
              <div className="absolute right-1 flex items-center gap-1">
                {apiKey ? (
                  <button 
                    onClick={handleDelete}
                    className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-md transition-colors"
                    title="저장된 키 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <button 
                    onClick={handleSave}
                    disabled={!inputValue.trim()}
                    className="p-1.5 bg-teal-500/20 hover:bg-teal-500/40 text-teal-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-md transition-colors"
                    title="키 브라우저에 저장"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* API Key Guide Collapsible */}
            <div className="bg-white/5 rounded-lg overflow-hidden">
              <button 
                onClick={() => setShowHelp(!showHelp)}
                className="w-full px-3 py-2 flex items-center justify-between text-xs text-teal-200 hover:bg-white/5 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  API Key 발급 방법
                </span>
                {showHelp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              
              {showHelp && (
                <div className="px-3 pb-3 pt-1 space-y-2">
                  <ol className="list-decimal pl-4 text-[11px] text-teal-100/80 space-y-1.5 leading-relaxed">
                    <li>
                      <a 
                        href="https://aistudio.google.com/app/apikey" 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-teal-300 hover:text-white underline decoration-teal-300/30 flex items-center gap-1 inline-flex"
                      >
                        Google AI Studio <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      에 접속합니다.
                    </li>
                    <li>Google 계정으로 로그인합니다.</li>
                    <li><strong>"Create API key"</strong> 버튼을 클릭합니다.</li>
                    <li>생성된 키를 복사하여 위 입력창에 붙여넣고 저장하세요.</li>
                  </ol>
                  <p className="text-[10px] text-teal-300/50 pt-1 border-t border-white/10">
                    * 키는 브라우저에만 저장되며 서버로 전송되지 않습니다.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* File Upload Section */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-teal-200 uppercase tracking-wider flex items-center gap-2">
              <UploadCloud className="w-3 h-3" /> 오디오 파일
            </label>
            
            <div className="relative group">
              <input
                type="file"
                accept="audio/*"
                multiple
                onChange={onFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={isProcessing}
              />
              <div className={`
                border-2 border-dashed rounded-xl p-6 transition-all duration-300 flex flex-col items-center justify-center text-center
                ${files.length > 0 ? 'border-teal-400 bg-teal-500/20' : 'border-white/20 hover:border-white/40 hover:bg-white/5'}
              `}>
                <UploadCloud className={`w-8 h-8 mb-2 transition-colors ${files.length > 0 ? 'text-teal-300' : 'text-gray-400 group-hover:text-white'}`} />
                <span className="text-sm font-medium text-white">
                  {files.length > 0 ? '파일 추가 선택' : '오디오 업로드'}
                </span>
                <span className="text-xs text-teal-200 mt-1">
                  다중 선택 가능 (MP3, WAV, M4A)
                </span>
              </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-xs font-semibold text-teal-200 mb-2">선택된 파일 ({files.length})</div>
                {files.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="bg-white/10 rounded-lg p-3 flex items-center justify-between group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileAudio className="w-4 h-4 text-teal-300 flex-shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm text-white truncate">{file.name}</span>
                        <span className="text-[10px] text-teal-200">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                    {!isProcessing && (
                      <button 
                        onClick={() => onRemoveFile(index)}
                        className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 mt-6">
          {/* Analyze Button */}
          <button
            onClick={handleAnalyzeClick}
            disabled={!isReady || isProcessing}
            className={`
              w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-lg
              ${isReady && !isProcessing 
                ? 'bg-teal-600 hover:bg-teal-500 text-white translate-y-0' 
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                분석 진행 중...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                분석 및 요약 시작
              </>
            )}
          </button>

          {/* User Requested Link Footer */}
          <div className="pt-4 border-t border-white/10 text-center">
            <a 
              href="https://xn--design-hl6wo12cquiba7767a.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-teal-300 hover:text-white transition-colors py-2 px-4 rounded-lg hover:bg-white/5"
            >
              <Globe className="w-3 h-3" />
              <span>떨림과울림Design.com</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-50" />
            </a>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;