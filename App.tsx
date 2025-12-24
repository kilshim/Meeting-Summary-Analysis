import React, { useState, useEffect } from 'react';
import { Chat } from "@google/genai";
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ResultSection from './components/ResultSection';
import { fileToBase64, analyzeAudio, createChatSession } from './services/geminiService';
import { AnalysisResult, ProcessingState, AudioInput } from './types';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Theme State
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Toggle Theme Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };
  
  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    message: ''
  });
  
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [chatSession, setChatSession] = useState<Chat | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
      
      setResult(null);
      setChatSession(null);
      setProcessingState({ status: 'idle', message: '' });
      e.target.value = ''; 
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setResult(null);
    setChatSession(null);
    setProcessingState({ status: 'idle', message: '' });
  };

  const handleReset = () => {
    setFiles([]);
    setResult(null);
    setChatSession(null);
    setProcessingState({ status: 'idle', message: '' });
  };

  const handleAnalyze = async () => {
    if (!apiKey || files.length === 0) return;

    try {
      setProcessingState({ status: 'uploading', message: `${files.length}개의 오디오 파일 준비 중...` });
      
      const audioInputPromises: Promise<AudioInput>[] = files.map(async (file) => ({
        base64: await fileToBase64(file),
        mimeType: file.type
      }));

      const audioInputs = await Promise.all(audioInputPromises);
      
      setProcessingState({ status: 'processing', message: 'Gemini AI가 모든 회의 내용을 통합 분석 중입니다...' });

      const analysisResult = await analyzeAudio(apiKey, audioInputs);
      const session = createChatSession(apiKey, audioInputs);
      
      setChatSession(session);
      setResult(analysisResult);
      setProcessingState({ status: 'completed', message: '분석 완료' });

    } catch (error: any) {
      setProcessingState({ 
        status: 'error', 
        message: error.message || '알 수 없는 오류가 발생했습니다.' 
      });
    }
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row font-sans transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      
      {/* Mobile Header */}
      <header className={`
        md:hidden fixed top-0 left-0 right-0 h-16 z-30 flex items-center justify-between px-4 border-b
        ${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'}
      `}>
        <div className="font-bold text-lg flex items-center gap-2">
           <span className="text-teal-600 dark:text-teal-400">AI</span> 회의 분석
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      <Sidebar 
        apiKey={apiKey}
        setApiKey={setApiKey}
        files={files}
        onFileChange={handleFileChange}
        onRemoveFile={handleRemoveFile}
        onAnalyze={handleAnalyze}
        onReset={handleReset}
        isProcessing={processingState.status === 'uploading' || processingState.status === 'processing'}
        darkMode={darkMode}
        toggleTheme={toggleTheme}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      {/* Main Content */}
      <main className={`
        flex-1 w-full md:ml-80 transition-all duration-300
        ${isSidebarOpen ? 'overflow-hidden' : 'overflow-y-auto'}
        pt-16 md:pt-0 p-4 md:p-10
      `}>
        <div className="max-w-7xl mx-auto">
          <header className="mb-8 md:mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className={`text-2xl md:text-3xl font-extrabold transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                대시보드
              </h2>
              <p className={`mt-1 text-sm md:text-base transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                업로드한 회의 오디오의 핵심 내용을 확인하고 질문하세요.
              </p>
            </div>
            <div className={`text-xs md:text-sm px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-sm border transition-colors ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-gray-400' 
                : 'bg-white border-gray-100 text-gray-400'
            }`}>
               모델: <span className="text-teal-600 font-semibold">gemini-2.5-flash</span>
            </div>
          </header>

          <ResultSection 
            processingState={processingState}
            result={result}
            chatSession={chatSession}
          />
        </div>
      </main>
    </div>
  );
};

export default App;