# 🩸 LifeFlow — Emergency Blood Donation & AI Health Advisor Platform

[![Deployment Status](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)](YOUR_DEPLOYED_URL_HERE)
[![AI Powered](https://img.shields.io/badge/AI-Gemini%203.6%20Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Express%20%7C%20Firebase-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)

---

## 📌 1. Project Overview & Problem Statement

### **What is LifeFlow?**
**LifeFlow** is an end-to-end emergency blood donation network and health advisor platform. It bridges the critical gap between patients needing urgent blood transfusions and compatible voluntary blood donors within their local community.

### **The Real Problem It Solves**
* **Time-Critical Emergencies:** In medical crises (trauma, surgeries, childbirth complications), finding compatible blood donors quickly is often a matter of life or death. Traditional blood bank inventories suffer from frequent shortages, and social media pleas are fragmented and slow.
* **Donor Eligibility Uncertainty:** Millions of potential donors hesitate or get turned away at donation centers because they are unsure if recent life events (e.g., getting a tattoo, taking antibiotics, international travel, or recent fever) temporarily disqualify them.
* **Target Audience:** Emergency patients and family members searching for blood donors, voluntary blood donors seeking nearby urgent requests, and individuals seeking quick, verified medical eligibility guidance before donating.

---

## 🌐 2. Live Application URL

🔗 **Live Demo:** [https://your-deployed-app-url.vercel.app](https://your-deployed-app-url.vercel.app) *(Replace with your Vercel deployment link)*  
⚡ **Repository:** `https://github.com/your-username/lifeflow-blood-donor-app` *(Replace with your GitHub repo link)*

---

## 🖼️ 3. Application Screenshots

| 1. Emergency Feed & Proximity Matching | 2. AI Blood Donor Health Advisor |
| :---: | :---: |
| ![Home Feed & Emergency Requests](./assets/screenshot-feed.png) | ![AI Blood Donor Eligibility & Health Advisor](./assets/screenshot-ai-advisor.png) |

| 3. Nearby Donor Directory & Compatibility Search | 4. Emergency Request Detail & Direct Dispatch |
| :---: | :---: |
| ![Nearby Donor Directory](./assets/screenshot-donor-search.png) | ![Request Detail & Email Dispatch](./assets/screenshot-request-detail.png) |

---

## ✨ 4. Complete Features List

### 🩸 **Emergency Blood Request System**
* **Real-Time Request Feed:** Browse active emergency blood requests filtered by Blood Group, Urgency (Critical / Urgent / Standard), and Distance radius.
* **Proximity Distance Calculation:** Uses the Haversine formula to compute exact distance (in km) between the user and hospital/patient locations.
* **Automated Emergency Alerts:** When an emergency request is published, compatible registered donors within 20 km automatically receive instant in-app notification alerts.

### 🤖 **AI Blood Donor Eligibility & Health Advisor**
* **Instant Medical Guidance:** Ask any health or lifestyle query regarding donation eligibility (e.g., tattoos, medications, travel, dental surgery, fever).
* **Interactive One-Click Scenarios:** Quick-test preset scenarios for fast answers.
* **User Context Awareness:** Synthesizes user age, weight, and blood group for tailored medical advice.
* **Privacy Assurance:** Fully isolated session handling ensures data is private to the current active session.

### 👥 **Donor Directory & Search Engine**
* **Compatible ABO/Rh Donor Search:** Advanced algorithm matching universal donors ($O-$), universal recipients ($AB+$), and specific antigen compatibility rules.
* **Donor Availability Status:** Real-time toggles for donor availability and last donation dates.
* **Direct Email Dispatch:** Send emergency email alerts directly to compatible donors via an integrated dispatch modal.

### 🔔 **Real-Time Notifications & User Profiles**
* **Notification Center:** Badge counter and drawer for emergency alerts, request updates, and donor responses.
* **User Profiles:** Manage personal blood group, location coordinates, availability status, and contact information.
* **Multi-Mode Authentication:** Firebase Email/Password Auth, One-Click Guest Donor Login, and Google OAuth integration.

---

## 🧠 5. AI Feature & System Prompt Architecture

### **AI Feature Description**
The **AI Blood Donor Eligibility & Health Advisor** is an intelligent medical advisory module built into LifeFlow. It leverages the latest **Google Gemini 3.6 Flash model** via `@google/genai` to analyze potential donor medical queries against international blood bank safety standards (WHO, American Red Cross, NHS).

### **System Instructions / Prompt behind the AI Advisor**

```typescript
// System Instruction configured for Gemini 3.6 Flash
const systemInstruction = `
You are the AI Blood Donor Eligibility & Health Advisor. 
You assist potential blood donors with medical eligibility questions regarding 
tattoos, medications, travel, surgeries, illnesses, and donation frequency. 
Provide accurate, clear, bulleted medical guidance. 
Always include a short disclaimer that final eligibility is determined 
at the donation center during physical screening.
`;
```

### **Prompt Context Payload**
```typescript
const promptContext = `
User Context:
- Question: "${question}"
- User Blood Group: ${bloodGroup || "Unspecified"}
- Age: ${age || "Unspecified"}
- Weight: ${weightKg ? weightKg + " kg" : "Unspecified"}

Provide a clear, helpful, empathetic response following standard international blood donation guidelines.
Include:
1. Eligibility Status (Likely Eligible / Temporary Deferral / Permanent Deferral / Needs Blood Bank Review)
2. Medical Explanation & Guidelines
3. Recommended Deferral Period (if applicable)
4. Important Medical Disclaimer
`;
```

---

## 🛠️ 6. Tech Stack, Services & AI Models

| Layer | Technology / Service | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18, Vite, TypeScript | Modern, high-performance UI build |
| **Styling & UI** | Tailwind CSS, Lucide Icons, Motion | Responsive, accessible, animated design |
| **Backend Server** | Express.js + Node.js (bundled with `esbuild`) | Full-stack API router serving Vite SPA & AI endpoints |
| **AI Integration** | Google Gen AI SDK (`@google/genai`) | Model: **Gemini 3.6 Flash** (`gemini-3.6-flash`) |
| **Database & Auth** | Firebase Firestore & Firebase Auth | Persistent NoSQL database & secure multi-method authentication |
| **Markdown Rendering** | `react-markdown` | Rich formatted output for medical advisor responses |

---

## 🚀 7. How to Run the Project Locally

### **Prerequisites**
* Node.js (v18.x or higher)
* npm or yarn

### **1. Clone the Repository**
```bash
git clone https://github.com/your-username/lifeflow-blood-donor-app.git
cd lifeflow-blood-donor-app
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Configure Environment Variables**
Create a `.env` file in the root directory (refer to `.env.example`):
```env
# Gemini API Key (Required for AI Eligibility Advisor)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration (Required for Database & Auth)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### **4. Start Development Server**
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### **5. Build for Production & Deployment (Vercel)**
```bash
# Verify TypeScript types and build bundled assets
npm run build

# Start production server
npm start
```

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
