# 🌿 Sera — AI CBT Mental Health Companion

<div align="center">

 Sera Banner
<img width="1774" height="887" alt="sera-banner" src="https://github.com/user-attachments/assets/4b173ec8-ac91-4add-928b-f603364de606" />

# 🧠 Sera — Live Agentic AI CBT Companion

**A production-grade AI-powered CBT (Cognitive Behavioral Therapy) companion built with Multi-Agent Architecture, LangGraph, FastAPI, WebSockets, and Supabase.**

Designed to provide a **safe, private, and real-time mental wellness experience** through intelligent conversations, emotional support, and crisis detection.

<p align="center">
  <a href="https://github.com/himanshukumar-web/mental-health-cbt-companion">
    <img src="https://img.shields.io/github/stars/himanshukumar-web/mental-health-cbt-companion?style=for-the-badge" />
  </a>
  <img src="https://img.shields.io/badge/AI-LangGraph-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi" />
  <img src="https://img.shields.io/badge/Frontend-Next.js-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" />
</p>

### 🚀 Built for Real-Time Emotional Support, Safety Monitoring & CBT Guidance

🔗 **GitHub Repository**
[https://github.com/himanshukumar-web/mental-health-cbt-companion](https://github.com/himanshukumar-web/mental-health-cbt-companion)

👨‍💻 **Developer:** Himanshu Kumar
🔗 **LinkedIn:** [https://www.linkedin.com/in/himanshu-kumar-813626327](https://www.linkedin.com/in/himanshu-kumar-813626327)

</div>

---

# 📸 Project Preview

## 🏠 Landing Page

> Add your screenshot here:

```txt
README.md ke same folder me screenshot upload karo
naam rakho: landing-page.png
```
<img width="1294" height="942" alt="landing-page png" src="https://github.com/user-attachments/assets/f8c7f3f8-c7e8-4f83-b413-89eed77809cb" />



---

## 💬 AI CBT Chat Interface


<img width="1296" height="945" alt="chat-interface png" src="https://github.com/user-attachments/assets/7ae9587b-fae9-45f1-b572-387fc8da383a" />

---

# ✨ Why Sera?

Mental health support should be **accessible, private, and immediate**.

**Sera** is an intelligent AI companion designed to help users:

✅ Talk through emotions
✅ Identify negative thought patterns
✅ Apply CBT-based mental wellness techniques
✅ Detect emotional distress and crisis situations
✅ Receive real-time compassionate responses
✅ Stay emotionally supported in a safe environment

Unlike a traditional chatbot, **Sera uses a Multi-Agent AI System** where multiple intelligent agents work together to ensure better safety and emotional awareness.

---

# 🧠 Key Features

## ⚡ Real-Time AI Conversation

* Fast token-by-token streaming responses using **WebSockets**.
* Natural conversational flow.
* Low latency interaction.

## 🧩 Multi-Agent Architecture

Sera uses two intelligent agents:

### 🩺 Therapist Agent

* Generates CBT-based supportive responses.
* Helps users process emotions.
* Suggests grounding techniques.

### 🛡️ Safety Monitor Agent

* Detects crisis language.
* Monitors emotional severity.
* Activates emergency protocol instantly.

## 🚨 Crisis Intervention System

When high-risk emotional signals are detected:

* Crisis Mode activates instantly.
* Safety recommendations appear.
* Emergency helpline numbers are shown.
* Grounding techniques are suggested.

## 🔒 Secure & Private

* **Encrypted message storage** using Fernet encryption.
* Secure user authentication via Supabase.
* Protected conversation history.

## 🎨 Modern UI/UX

* Dark premium interface
* Smooth animations
* Responsive design
* Clean conversation experience
* Real-time interaction

---

# 🏗️ System Architecture

```mermaid


```
     User (Next.js) ──WebSocket──► FastAPI ──► LangGraph Pipeline
                                              │
                                   ┌──────────┴──────────┐
                                   ▼                     ▼
                           Agent 2: Monitor       Agent 1: Therapist
                           (Safety Guardrail)     (CBT Streaming)
                                   │                     │
                              crisis? YES           stream tokens
                                   │                     │
                          CrisisPanel UI ◄────────────────┘
                          + Grounding + Hotlines
```

---
# 🛠️ Tech Stack

| Category           | Technologies                       |
| ------------------ | ---------------------------------- |
| **Frontend**       | Next.js 14, React 19, Tailwind CSS |
| **Backend**        | FastAPI, Uvicorn, Python           |
| **AI Agents**      | LangGraph, LangChain               |
| **LLM**            | Claude / Anthropic                 |
| **Database**       | Supabase PostgreSQL                |
| **Realtime**       | WebSockets                         |
| **Authentication** | Supabase Auth                      |
| **Security**       | Fernet Encryption                  |
| **Deployment**     | Vercel / Render                    |

---

# 📂 Folder Structure

```bash
mental-health-cbt-companion/
│── backend/
│   ├── agents/
│   ├── config.py
│   ├── security.py
│   ├── main.py
│   └── requirements.txt
│
│── frontend/
│   ├── app/
│   ├── components/
│   ├── public/
│   └── package.json
│
│── README.md
│── .gitignore
```

---

# 🚀 Getting Started

## 1️⃣ Clone Repository

```bash
git clone https://github.com/himanshukumar-web/mental-health-cbt-companion.git

cd mental-health-cbt-companion
```

---

## 2️⃣ Backend Setup

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt
```

### Configure Environment Variables

Create `.env`

```env
ANTHROPIC_API_KEY=your_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
ENCRYPTION_KEY=your_generated_key
CORS_ORIGINS=http://localhost:3000
```

Run Backend:

```bash
python -m uvicorn app.main:app --reload --port 8000
```

---

## 3️⃣ Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Open:

```txt
http://localhost:3000
```

---

# 🔌 WebSocket Events

| Event          | Purpose              |
| -------------- | -------------------- |
| message        | Send user message    |
| stream_start   | Starts AI streaming  |
| token          | Stream AI tokens     |
| monitor_result | Safety check result  |
| crisis         | Trigger crisis panel |
| stream_end     | End response stream  |

---

# 🔒 Security & Privacy

Sera prioritizes user safety and privacy:

✔ Encrypted Messages
✔ Secure Authentication
✔ Crisis Monitoring
✔ Safe CBT Conversations
✔ Privacy-First Design

---

# ⚠️ Mental Health Disclaimer

**Sera is NOT a licensed therapist or medical professional.**

This project is built for **educational, emotional support, and research purposes only.**

If you or someone you know is experiencing a mental health crisis, please contact professional services immediately.

### 🇮🇳 India Mental Health Helplines

📞 **iCall India:** `9152987821`
📞 **AASRA:** `91-22-27546669`

### 🇺🇸 US Crisis Hotline

📞 `988`

---

# 🧑‍💻 About the Developer

## Himanshu Kumar

B.Tech Student | Full Stack Developer | AI/ML Enthusiast | Open Source Learner

### Skills

* Python
* JavaScript
* C / C++
* React.js
* Next.js
* FastAPI
* Full Stack Development
* AI & Machine Learning

🔗 **GitHub:**
[https://github.com/himanshukumar-web](https://github.com/himanshukumar-web)

🔗 **LinkedIn:**
[https://www.linkedin.com/in/himanshu-kumar-813626327](https://www.linkedin.com/in/himanshu-kumar-813626327)

---

# 🌟 Support This Project

If you like this project:

⭐ Star the repository
🍴 Fork the project
📢 Share it with others

---

<div align="center">

### 🌿 Built with ❤️ by Himanshu Kumar

**Making mental wellness more accessible through AI.**

</div>





