import { GoogleGenAI } from "@google/genai";

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `Break down the following task into 3-5 logical subtasks.
Task: "test"
Estimated Duration: 1 hours
Respond ONLY with a JSON array of subtask objects. Do not include any markdown formatting or explanatory text.
Each object must have exactly these keys: "title" (string), "duration" (string, e.g. "30 mins", "1 hour"), and "description" (short string).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    console.log(response.text);
  } catch(e) {
    console.error("FAIL", e.message);
  }
}
run();
