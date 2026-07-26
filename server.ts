import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: AI Blood Donor Eligibility & Health Advisor
  app.post("/api/eligibility-advisor", async (req, res) => {
    try {
      const { question, bloodGroup, age, weightKg } = req.body;

      if (!question || typeof question !== "string" || !question.trim()) {
        return res.status(400).json({ error: "Please provide a valid query or health question." });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        // Fallback response if GEMINI_API_KEY is not configured yet
        return res.json({
          answer: `### 📋 General Blood Donation Guidance\n\n**Query:** "${question}"\n\n- **Tattoos/Piercings:** Standard deferral period is usually **3 to 6 months** after getting a tattoo or piercing from a licensed facility.\n- **Medications / Antibiotics:** Must complete full course of antibiotics and be symptom-free for **at least 7 days** before donating.\n- **Recent Illness / Fever:** Must be fully recovered and symptom-free for at least **14 days**.\n- **Donation Frequency:** Whole blood donation requires a minimum interval of **56 days (8 weeks)** between donations for men and **12 weeks** for women.\n\n*Note: GEMINI_API_KEY environment variable is not set. Please configure your API key in Settings > Secrets to unlock dynamic AI responses.*`,
          status: "Information",
          isFallback: true
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const promptContext = `
User Context:
- Question: "${question}"
- User Blood Group: ${bloodGroup || "Unspecified"}
- Age: ${age || "Unspecified"}
- Weight: ${weightKg ? weightKg + " kg" : "Unspecified"}

Provide a clear, helpful, empathetic response following standard international blood donation guidelines (e.g., WHO / American Red Cross / NHS).
Include:
1. **Eligibility Status** (Likely Eligible / Temporary Deferral / Permanent Deferral / Needs Blood Bank Review)
2. **Medical Explanation & Guidelines**
3. **Recommended Deferral Period** (if applicable)
4. **Important Medical Disclaimer**
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: promptContext,
        config: {
          systemInstruction:
            "You are the AI Blood Donor Eligibility & Health Advisor. You assist potential blood donors with medical eligibility questions regarding tattoos, medications, travel, surgeries, illnesses, and donation frequency. Provide accurate, clear, bulleted medical guidance. Always include a short disclaimer that final eligibility is determined at the donation center during physical screening.",
          temperature: 0.3,
        },
      });

      return res.json({
        answer: response.text || "No guidance available at this moment.",
        isFallback: false
      });

    } catch (error: any) {
      console.error("Gemini API Error:", error);
      return res.status(500).json({
        error: "Failed to consult AI Eligibility Advisor.",
        details: error?.message || "Internal server error"
      });
    }
  });

  // Vite middleware for development / Static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
