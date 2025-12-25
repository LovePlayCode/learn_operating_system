
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
    你是一位精通操作系统原理的计算机科学教授。
    当前学生正在学习：${context === MemoryMode.SEGMENTATION ? '段式存储' : context === MemoryMode.PAGING ? '页式存储' : context === MemoryMode.FILE_SYSTEM ? '文件系统管理（Inode, 软硬链接, FD, RAID, 日志恢复）' : '操作系统通用概念'}。
    
    当前的模拟器状态如下：
    ${currentStateDescription}

    请用简洁、生动、易懂的中文回答学生的问题。
    如果涉及文件描述符，请强调它是三级表的映射过程。
    如果涉及链接，请解释 Inode 编号的作用。
    如果涉及 RAID，请对比性能与冗余。
    如果涉及日志系统，请通过“事务”的概念解释原子性。

    鼓励学生通过操作模拟器观察变化。回答长度控制在300字以内。
    使用Markdown格式。
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
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
