import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

// This is the Vercel Serverless Function equivalent of the /api/eligibility-advisor
// route in server.ts. server.ts is still used for local development (npm run dev);
// on Vercel, any file inside /api is automatically deployed as its own serverless
// endpoint at the matching path, so this file handles that route in production.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question, bloodGroup, age, weightKg } = req.body || {};

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Please provide a valid query or health question.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.json({
        answer: `### 📋 General Blood Donation Guidance\n\n**Query:** "${question}"\n\n- **Tattoos/Piercings:** Standard deferral period is usually **3 to 6 months** after getting a tattoo or piercing from a licensed facility.\n- **Medications / Antibiotics:** Must complete full course of antibiotics and be symptom-free for **at least 7 days** before donating.\n- **Recent Illness / Fever:** Must be fully recovered and symptom-free for at least **14 days**.\n- **Donation Frequency:** Whole blood donation requires a minimum interval of **56 days (8 weeks)** between donations for men and **12 weeks** for women.\n\n*Note: GEMINI_API_KEY environment variable is not set. Please configure it in your Vercel Project Settings > Environment Variables.*`,
        status: 'Information',
        isFallback: true,
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const promptContext = `
User Context:
- Question: "${question}"
- User Blood Group: ${bloodGroup || 'Unspecified'}
- Age: ${age || 'Unspecified'}
- Weight: ${weightKg ? weightKg + ' kg' : 'Unspecified'}

Provide a clear, helpful, empathetic response following standard international blood donation guidelines (e.g., WHO / American Red Cross / NHS).
Include:
1. **Eligibility Status** (Likely Eligible / Temporary Deferral / Permanent Deferral / Needs Blood Bank Review)
2. **Medical Explanation & Guidelines**
3. **Recommended Deferral Period** (if applicable)
4. **Important Medical Disclaimer**
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: promptContext,
      config: {
        systemInstruction:
          'You are the AI Blood Donor Eligibility & Health Advisor. You assist potential blood donors with medical eligibility questions regarding tattoos, medications, travel, surgeries, illnesses, and donation frequency. Provide accurate, clear, bulleted medical guidance. Always include a short disclaimer that final eligibility is determined at the donation center during physical screening.',
        temperature: 0.3,
      },
    });

    return res.json({
      answer: response.text || 'No guidance available at this moment.',
      isFallback: false,
    });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({
      error: 'Failed to consult AI Eligibility Advisor.',
      details: error?.message || 'Internal server error',
    });
  }
}