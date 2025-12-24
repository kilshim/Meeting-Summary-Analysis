import { GoogleGenAI, Chat } from "@google/genai";
import { AnalysisResult, AudioInput } from "../types";

const SYSTEM_INSTRUCTION = `
반드시 **한국어(Korean)**로 답변할 것.
출력 형식을 다음과 같이 엄격히 지킬 것:
📌 3줄 핵심 요약
(첫 번째 요약)
(두 번째 요약)
(세 번째 요약)
📝 상세 요약
(전체 내용을 흐름에 따라 상세하게 줄글로 작성)
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
        temperature: 0.3, // Lower temperature for more factual summaries
      }
    });

    const text = response.text || "";
    return parseResponse(text);

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "AI 분석 중 오류가 발생했습니다.");
  }
};

const parseResponse = (text: string): AnalysisResult => {
  // Simple parser based on the requested output format
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
        // Remove bullet points if the model adds them despite instructions, or just push logic
        const cleaned = line.replace(/^[-*•\d\.]+\s*/, '').trim();
        if (cleaned) summary3Lines.push(cleaned);
      }
    } else if (captureMode === 'detailed') {
      detailedSummary += line + "\n";
    }
  }

  // Fallback if parsing fails but text exists (e.g. model didn't follow exact format)
  if (summary3Lines.length === 0 && detailedSummary.length === 0 && text.length > 0) {
    detailedSummary = text;
  }

  return {
    summary3Lines: summary3Lines.slice(0, 3), // Ensure max 3
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
    { text: "이제부터 업로드된 모든 오디오 파일들의 내용에 기반하여 통합적으로 질문에 답변해줘." }
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
        parts: [{ text: "네, 알겠습니다. 업로드된 모든 오디오 파일들의 내용을 파악했습니다. 궁금한 점을 물어보시면 통합하여 답변해 드리겠습니다." }]
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
