import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API constraints setup
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // AI Task Breakdown
  app.post("/api/breakdown", async (req, res) => {
    try {
      const { taskTitle, duration } = req.body;
      const prompt = `Break down the following task into 3-5 logical subtasks.
Task: "${taskTitle}"
Estimated Duration: ${duration} hours
Respond ONLY with a JSON array of subtask objects. Do not include any markdown formatting or explanatory text.
Each object must have exactly these keys: "title" (string), "duration" (string, e.g. "30 mins", "1 hour"), and "description" (short string).`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                duration: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["title", "duration", "description"]
            }
          }
        }
      });
      
      let text = response.text;
      const subtasks = JSON.parse(text || "[]");
      res.json({ subtasks });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // AI Smart Scheduler
  app.post("/api/schedule", async (req, res) => {
    try {
      const { tasks, focusHoursMax } = req.body;
      const prompt = `Given the following list of pending tasks, suggest a smart schedule for today.
Tasks: ${JSON.stringify(tasks)}
Max Focus Hours: ${focusHoursMax}
Provide a recommended schedule. Prioritize high-priority tasks and those close to deadline.
Respond ONLY with a JSON array of scheduling session objects.
Each object must have exactly these keys: "timeBlock" (string e.g. "2:00 PM - 3:00 PM"), "taskTitle" (string), "reason" (short string explaining why it was scheduled).`;

      const response = await ai.models.generateContent({
         model: "gemini-2.5-flash",
         contents: prompt,
         config: {
           responseMimeType: "application/json",
           responseSchema: {
             type: Type.ARRAY,
             items: {
               type: Type.OBJECT,
               properties: {
                 timeBlock: { type: Type.STRING },
                 taskTitle: { type: Type.STRING },
                 reason: { type: Type.STRING }
               },
               required: ["timeBlock", "taskTitle", "reason"]
             }
           }
         }
      });
      
      const schedule = JSON.parse(response.text || "[]");
      res.json({ schedule });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Parse Spoken Task
  app.post("/api/parse-task", async (req, res) => {
    try {
      const { transcript } = req.body;
      const prompt = `Convert the following spoken task into structured fields.
Spoken Text: "${transcript}"
Current Date Context: ${new Date().toISOString()}

Respond ONLY with a JSON object.
Keys required:
- "title" (string, short descriptive title)
- "description" (string, any extra details from the speech)
- "deadlineDate" (string, YYYY-MM-DD format if a date was mentioned, otherwise empty)
- "deadlineTime" (string, HH:mm 24-hour format if a time was mentioned, otherwise empty)
- "estimatedTime" (number, estimated hours if mentioned, otherwise 1)
- "priority" (string, "low", "medium", "high" - infer from urgency words, default "medium")
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              deadlineDate: { type: Type.STRING },
              deadlineTime: { type: Type.STRING },
              estimatedTime: { type: Type.NUMBER },
              priority: { type: Type.STRING }
            },
            required: ["title"]
          }
        }
      });
      
      const parsedTask = JSON.parse(response.text || "{}");
      res.json({ parsedTask });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // AI Productivity Coach
  app.post("/api/coach", async (req, res) => {
    try {
      const { tasks, completedTasks } = req.body;
      const prompt = `Analyze the user's workload and provide personalized productivity insights.
Total Pending: ${tasks.length}
Total Completed: ${completedTasks.length}
Pending Details: ${JSON.stringify(tasks.map((t:any) => ({title: t.title, priority: t.priority, risk: t.risk})))}
Respond ONLY with a JSON object.
Keys required: "insight" (string, main takeaway), "recommendation" (string, actionable advice), "focusArea" (string, short category).`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              insight: { type: Type.STRING },
              recommendation: { type: Type.STRING },
              focusArea: { type: Type.STRING }
            },
            required: ["insight", "recommendation", "focusArea"]
          }
        }
      });
      
      const insights = JSON.parse(response.text || "{}");
      res.json({ insights });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
