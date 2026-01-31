
import { GoogleGenAI, Type } from "@google/genai";
import { AISuggestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSmartContext = async (url: string): Promise<AISuggestion> => {
  try {
    const prompt = `
      Bạn là chuyên gia thiết kế thương hiệu. Hãy phân tích URL sản phẩm sau: "${url}"
      
      Nhiệm vụ:
      1. Trích xuất Tên sản phẩm/thương hiệu ngắn gọn (Title) - tối đa 25 ký tự.
      2. Trích xuất Mô tả ngắn (Description) - tối đa 50 ký tự.
      3. Gợi ý 1 Mã màu Hex (Suggested Color) chủ đạo phù hợp với thương hiệu đó (ví dụ Shopee là #EE4D2D, Lazada là #0f146d, Tiki là #1A94FF).

      Trả về JSON.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            suggestedColor: { type: Type.STRING }
          },
          required: ["title", "description", "suggestedColor"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AISuggestion;
    }
    
    throw new Error("No response from AI");
  } catch (error) {
    console.error("Gemini Error:", error);
    // Fallback default
    return {
      title: "Sản phẩm mới",
      description: "Quét để xem chi tiết",
      suggestedColor: "#000000"
    };
  }
};
