import { GoogleGenAI } from "@google/genai";
import { MemoryMode } from '../types';

let aiClient: GoogleGenAI | null = null;

const getClient = () => {
  if (!aiClient) {
    const apiKey = process.env.API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({ apiKey });
    }
  }
  return aiClient;
};

export const askAITutor = async (
  question: string, 
  context: MemoryMode, 
  currentStateDescription: string
): Promise<string> => {
  const client = getClient();
  if (!client) {
    return "API Key not configured. Please check environment variables.";
  }

  const systemPrompt = `
    你是一位精通操作系统原理的计算机科学教授，专门负责讲解内存管理（Memory Management）。
    当前学生正在学习：${context === MemoryMode.SEGMENTATION ? '段式存储 (Segmentation)' : context === MemoryMode.PAGING ? '页式存储 (Paging)' : '多级页表 (Multi-level Paging)'}。
    
    当前的模拟器状态如下：
    ${currentStateDescription}

    请用简洁、生动、易懂的中文回答学生的问题。如果涉及计算，请逐步解释。
    鼓励学生通过调整模拟器的参数来观察变化。
    回答长度控制在300字以内，除非需要详细解释概念。
    使用Markdown格式。
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: question,
      config: {
        systemInstruction: systemPrompt,
      }
    });
    return response.text || "抱歉，我现在无法回答。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 助手暂时离线，请稍后再试。";
  }
};