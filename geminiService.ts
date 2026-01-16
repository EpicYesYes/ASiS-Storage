
import { GoogleGenAI } from "@google/genai";
import { Student } from "./types";

export const getBehaviorInsight = async (student: Student): Promise<string> => {
  const apiKey = process.env.API_KEY || '';
  const ai = new GoogleGenAI({ apiKey: apiKey as string });
  
  const recordSummary = student.records.map(r => 
    `${new Date(r.timestamp).toLocaleDateString()}: ${r.type} - ${r.reason} (${r.points} mata)`
  ).join('\n');

  const prompt = `
    Analisis tingkah laku murid bernama ${student.firstName} ${student.lastName} (Tingkatan ${student.grade}, Rumah ${student.house}).
    Jumlah Mata Merit Semasa: ${student.totalPoints}
    
    Sejarah Terkini:
    ${recordSummary || 'Tiada rekod terkini ditemui.'}
    
    Tugas: Berikan ulasan tingkah laku yang ringkas (2-3 ayat) dan profesional untuk kegunaan guru.
    Fokus pada trend disiplin, keperluan intervensi, atau cadangan galakan positif.
    Gunakan Bahasa Melayu yang profesional, mudah difahami, dan menyokong pembangunan sahsiah murid.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text ?? "Tidak dapat menjana ulasan buat masa ini.";
  } catch (error) {
    console.error("Ralat Gemini:", error);
    return "Ralat menyambung ke perkhidmatan analisis AI.";
  }
};
