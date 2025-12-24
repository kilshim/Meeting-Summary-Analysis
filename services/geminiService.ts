import { GoogleGenAI, Chat } from "@google/genai";
import { AnalysisResult, AudioInput } from "../types";

const SYSTEM_INSTRUCTION = `
당신은 회의록 전문 AI 비서입니다. 제공된 오디오 파일을 분석하여 다음 형식으로 **반드시 한국어**로 요약하세요.

출력 형식:
📌 3줄 핵심 요약
- (핵심 결론 1)
- (핵심 결론 2)
- (핵심 결론 3)

📝 상세 요약
(회의의 시작부터 끝까지 주요 논의 사항, 결정 사항, 향후 계획 등을 포함하여 줄글 형태로 상세히 작성)

**주의사항:**
1. 불필요한 인사말이나 서론은 생략하고 본론만 작성하세요.
2. "📌 3줄 핵심 요약"과 "📝 상세 요약" 헤더를 정확히 사용하세요.
`;

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the Data URL prefix to get just the base64 string
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const analyzeAudio = async (
  apiKey: string,
  audioFiles: AudioInput[]
): Promise<AnalysisResult> => {
  
  if (!apiKey) throw new Error("API Key가 필요합니다.");
  if (audioFiles.length === 0) throw new Error("분석할 오디오 파일이 없습니다.");

  // Initialize the client with the user-provided key
  const ai = new GoogleGenAI({ apiKey });

  try {
    // Construct parts from multiple audio files
    const parts = [
      ...audioFiles.map(audio => ({
        inlineData: {
          mimeType: audio.mimeType,
          data: audio.base64
        }
      })),
      {
        text: "이 오디오 파일들을 모두 분석해서 하나의 통합된 내용으로 시스템 지시사항에 맞춰 요약해줘."
      }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3,
      }
    });

    const text = response.text || "";
    if (!text) {
      throw new Error("AI가 응답을 생성하지 못했습니다. (빈 응답)");
    }
    
    return parseResponse(text);

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    let errorMsg = "AI 분석 중 오류가 발생했습니다.";
    
    if (error.message?.includes("API key not valid")) {
      errorMsg = "API Key가 유효하지 않습니다. 다시 확인해주세요.";
    } else if (error.message?.includes("Mime type is required")) {
      errorMsg = "지원되지 않는 오디오 형식이거나 MIME Type 오류입니다.";
    } else if (error.message?.includes("fetch failed")) {
      errorMsg = "네트워크 연결을 확인하거나, API Key에 과금 프로젝트가 연결되었는지 확인하세요.";
    } else {
      errorMsg = error.message;
    }
    
    throw new Error(errorMsg);
  }
};

const parseResponse = (text: string): AnalysisResult => {
  const lines = text.split('\n');
  const summary3Lines: string[] = [];
  let detailedSummary = "";
  
  let captureMode: 'none' | '3lines' | 'detailed' = 'none';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.includes("📌 3줄 핵심 요약")) {
      captureMode = '3lines';
      continue;
    } else if (line.includes("📝 상세 요약")) {
      captureMode = 'detailed';
      continue;
    }

    if (captureMode === '3lines') {
      if (line.length > 0) {
        // Remove common list markers
        const cleaned = line.replace(/^[-*•\d\.]+\s*/, '').trim();
        if (cleaned) summary3Lines.push(cleaned);
      }
    } else if (captureMode === 'detailed') {
      detailedSummary += line + "\n";
    }
  }

  // Fallback: if parsing failed but we have text, treat it as detailed summary
  if (summary3Lines.length === 0 && !detailedSummary.trim()) {
     detailedSummary = text;
  }

  return {
    summary3Lines: summary3Lines.slice(0, 3), 
    detailedSummary: detailedSummary.trim()
  };
};

export const createChatSession = (
  apiKey: string,
  audioFiles: AudioInput[]
): Chat => {
  const ai = new GoogleGenAI({ apiKey });
  
  const historyParts = [
    ...audioFiles.map(audio => ({
      inlineData: {
        mimeType: audio.mimeType,
        data: audio.base64
      }
    })),
    { text: "이제부터 위 오디오 파일들의 내용에 기반하여 질문에 답변해줘." }
  ];

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    history: [
      {
        role: 'user',
        parts: historyParts
      },
      {
        role: 'model',
        parts: [{ text: "네, 회의 내용을 모두 숙지했습니다. 궁금한 점을 물어보세요." }]
      }
    ],
  });
};

export const sendChatMessage = async (chat: Chat, message: string): Promise<string> => {
  try {
    const result = await chat.sendMessage({ message });
    return result.text || "답변을 생성할 수 없습니다.";
  } catch (error: any) {
    console.error("Chat Error:", error);
    throw new Error("답변 생성 중 오류가 발생했습니다.");
  }
};