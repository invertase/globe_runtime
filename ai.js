import { GoogleGenerativeAI } from "@google/generative-ai";

export const generate = async (prompt) => {
  const genAI = new GoogleGenerativeAI(
    "AIzaSyCYzKkGgvzI2snmm2rQ5uR924NYxIGSO0E"
  );
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent([prompt]);

  return result.response.text();
};
