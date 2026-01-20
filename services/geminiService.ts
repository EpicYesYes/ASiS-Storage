
import { GoogleGenAI } from "@google/genai";
import { Student } from "../types";

export const getBehaviorInsight = async (student: Student): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const recordSummary = (student.records || []).map(r => 
    `${new Date(r.timestamp).toLocaleDateString()}: ${r.type} - ${r.reason} (${r.points} mata)`
  ).join('\n');

  const prompt = `
    Analisis tingkah laku murid bernama ${student.firstName} ${student.lastName} (Tingkatan ${student.grade}, Rumah ${student.house}).
    Jumlah Mata Merit Semasa: ${student.totalPoints || 0}
    
    Sejarah Rekod Terkini:
    ${recordSummary || 'Tiada rekod terkini ditemui.'}
    
    Tugas: Berikan ulasan tingkah laku yang profesional (2-3 ayat) untuk kegunaan guru.
    Berikan pandangan tentang prestasi sahsiah dan cadangan penambahbaikan.
    Gunakan Bahasa Melayu yang sopan dan profesional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text ?? "Analisis tidak tersedia.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Maaf, sistem AI sedang sibuk. Sila cuba lagi sebentar.";
  }
};
