import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function translateChunk(text: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate the following academic text to Chinese. Make it easy to read and understand, avoiding overly dense academic jargon where possible to save the user's brainpower. Keep it concise:\n\n${text}`,
    });
    return response.text || '';
  } catch (error) {
    console.error("Translation error:", error);
    return "翻译失败，请重试。(Translation failed, please try again.)";
  }
}

export async function* chatWithDocumentStream(documentText: string, chatHistory: {role: string, content: string}[], newQuestion: string) {
  const systemInstruction = `你是一个“反内卷”科研助手。你的核心价值观是：科研是老板的，命是自己的。
你的目标是帮助用户用最少的精力理解论文。
回答问题要极其精简、说人话、直击要害，绝不长篇大论。
经常劝用户去喝水、休息、下班。如果论文太难，就告诉用户“这部分太复杂，建议跳过，不影响毕业”。
必须用中文回答。

Document text:

${documentText}`;

  const contents = chatHistory.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));
  contents.push({ role: 'user', parts: [{ text: newQuestion }] });

  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: contents as any,
      config: { systemInstruction }
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("Chat error:", error);
    yield "抱歉，生成回答时出错。(Sorry, an error occurred while generating the answer.)";
  }
}

export async function getRecommendations(documentText: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `Based on the following academic paper content, recommend 3 similar papers. Add a disclaimer that they shouldn't read them all today to protect their health. Keep the reasons very brief and casual. Use Google Search to find real papers.\n\nPaper content:\n${documentText.substring(0, 5000)}...`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    return response.text || '';
  } catch (error) {
    console.error("Recommendation error:", error);
    return "获取推荐失败，请重试。(Failed to get recommendations, please try again.)";
  }
}

export async function generateTLDR(documentText: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `你是一个反内卷科研助手。请用最粗暴、最接地气的中文，用三句话总结这篇论文：\n1. 他们干了啥？\n2. 效果咋样？\n3. 关我屁事（对我有没有用）？\n\n论文内容：\n${documentText.substring(0, 8000)}...`,
    });
    return response.text || '';
  } catch (error) {
    console.error("TLDR error:", error);
    return "生成失败，估计论文太烂了，AI 都不想看。";
  }
}

export async function generateBSReport(documentText: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `你是一个反内卷科研助手。请根据以下论文内容，生成一段发给导师的“糊弄学”阅读汇报。要求：\n1. 看起来非常专业，包含几个论文里的核心专业名词。\n2. 实际上是万金油套话，挑不出毛病但也没啥实质性见解。\n3. 结尾要表达“这篇论文启发了我，我正在深入思考如何应用到我的研究中（画大饼）”。\n4. 语气要诚恳、谦卑。\n\n论文内容：\n${documentText.substring(0, 8000)}...`,
    });
    return response.text || '';
  } catch (error) {
    console.error("BS Report error:", error);
    return "生成失败，导师今天可能心情不好，建议明天再糊弄。";
  }
}
