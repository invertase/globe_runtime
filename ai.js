import { GoogleGenerativeAI } from "@google/generative-ai";

globalThis.ai_generate = async (model, prompt, callbackId) => {
  const genAI = new GoogleGenerativeAI(
    "AIzaSyCYzKkGgvzI2snmm2rQ5uR924NYxIGSO0E"
  );
  const geminiModel = genAI.getGenerativeModel({ model });

  const result = await geminiModel.generateContent([prompt]);

  send_to_dart(callbackId, result.response.text());
};
