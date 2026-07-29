# CareerNodes

CareerNodes is a full-stack, AI-driven placement preparation platform designed for software engineering candidates preparing for campus recruitment, technical interviews, and corporate roles. The platform combines automated technical mock interviews, real-time computer science query evaluation, company-specific preparation roadmaps, Data Structures and Algorithms (DSA) progress tracking, and gamified retention metrics.

---

## Author

**Meenakshi Kaur Labana**
* Repository: 

---

## Architectural Overview

The application follows a decoupled client-server architecture (monorepo structure) designed for maintainability and scalability:

* **Frontend Client:** Built using React 18 and Vite for modern, fast client-side rendering. User interface components utilize Tailwind CSS for responsive styling, and `react-markdown` to parse formatted technical responses from the generative AI interface.
* **Backend Server:** Built on Node.js and Express.js, providing RESTful API endpoints. It implements JWT middleware for route protection and interfaces with MongoDB via Mongoose ORM.
* **AI Orchestration Layer:** Integrated with OpenRouter/OpenAI API to generate company-tailored coding and system design interview questions, render real-time evaluation feedback with numeric scoring, and answer complex technical doubts with Big-O complexity analysis.

---

## Key Features

### 1. AI-Powered Technical Mock Interviews
* Dynamically generates interview questions tailored to specific target companies across tech industries.
* Evaluates candidate explanations, pseudocode, and Big-O analysis in real time.
* Returns structured evaluation scores (1–10) and actionable markdown feedback, which are logged directly to the candidate's MongoDB profile.

### 2. Intelligent CS Technical Assistant
* Acts as an AI mentor for core computer science concepts (Operating Systems, Database Management Systems, System Design, Concurrency, and Low-Level Design).
* Provides optimized code snippets along with space and time complexity breakdowns.

### 3. Data Structures & Algorithms (DSA) Tracker
* Interactive tracker allowing students to monitor solved problem counts across core DSA topics (Dynamic Programming, Graphs, Heaps, Trees).
* Supports custom topic creation and dynamic topic mastery threshold calculation.

### 4. Enterprise-Grade Authentication & Security
* User authentication powered by JSON Web Tokens (JWT) with persistent state management via LocalStorage.
* Sensitive credential protection using `bcryptjs` for multi-pass password hashing.
* Request body limits configured (`10mb`) to handle detailed technical submissions securely.

### 5. Progress Gamification & Tracking Metrics
* Automatic activity calculation based on timestamp deltas to update and maintain active preparation streaks.
* Metrics breakdown for weekly goals and company-specific category roadmaps (DSA, Core CS, System Design, HR).

---

## Technology Stack

### Frontend
* **Core Library:** React 18
* **Build Tool:** Vite 5
* **Styling Framework:** Tailwind CSS 4
* **Markdown Renderer:** React Markdown 10

### Backend
* **Runtime:** Node.js
* **Web Framework:** Express.js 5
* **Database & ORM:** MongoDB & Mongoose 9
* **Authentication:** JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
* **AI Client Interface:** OpenAI SDK configured via OpenRouter endpoints
* **Environment Management:** `dotenv`
* **Cross-Origin Handling:** `cors`

---

## Database Schema (User Model)

The application utilizes a rich, embedded Mongoose document structure:

```javascript
UserSchema {
  name: String (Required, Trimmed),
  email: String (Required, Unique, Lowercase, Regex Validated),
  passwordHash: String (Required),
  targetCompany: String (Default: 'Google'),
  skills: Array [{ name, proficiency }],
  companyRoadmap: Array [{ stepTitle, category, completed }],
  weeklyGoals: Array [{ goalText, isCompleted }],
  dsaTopics: Array [{ topicName, solvedCount, totalCount, isMastered }],
  streakCount: Number (Default: 1),
  lastActiveDate: Date,
  mockInterviewLogs: Array [{ question, userAnswer, aiFeedback, score, timestamp }]
}


## Repository structure

CareerNodes/
├── backend/
│   ├── models/
│   │   └── User.js             # Mongoose database model
│   ├── .env.example            # Template for environment variables
│   ├── .gitignore              # Backend exclusion rules
│   ├── package.json            # Node.js dependencies and scripts
│   ├── package-lock.json       # Backend dependency lockfile
│   └── server.js               # Express application entry point & API routes
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main React application component
│   │   ├── main.jsx            # React DOM mounting entry point
│   │   └── index.css           # Global Tailwind CSS imports
│   ├── .gitignore              # Frontend exclusion rules
│   ├── index.html              # HTML shell
│   ├── package.json            # React dependencies and scripts
│   ├── package-lock.json       # Frontend dependency lockfile
│   └── vite.config.js          # Vite build & plugin configuration
│
└── README.md                   # Project documentation


Local Setup and Installation
Prerequisites
1. Node.js version 18.0.0 or higher
2. npm version 9.0.0 or higher
3. Active MongoDB instance (Local or MongoDB Atlas)
4. OpenRouter API key

A. Backend Setup

1. Navigate to the backend directory:
cd backend

2. Install server dependencies:
npm install

3. Create a .env file based on .env.example:
PORT=5001
JWT_SECRET=your_jwt_secret_key
MONGODB_URI=your_mongodb_connection_string
OPENROUTER_API_KEY=your_openrouter_api_key

4. Start the backend server:
node server.js


B. Frontend Setup

1. Navigate to the frontend directory in a new terminal window:
cd frontend

2. Install client dependencies:
npm install

3. Start the Vite development server:
npm run dev


## API Endpoints Summary

### Authentication Routes
* `POST /api/auth/register` - Registers a new candidate, hashes passwords, initializes default DSA topics and roadmaps, and returns a JWT.
* `POST /api/auth/login` - Authenticates user credentials, calculates streak tracking logic, and returns a JWT.

### User & DSA Management
* `GET /api/user/profile` - Fetches authenticated user metadata, skills, roadmaps, and interview logs.
* `POST /api/user/dsa/update` - Increments/decrements solved problem count for a DSA topic and calculates topic mastery.
* `POST /api/user/dsa/add` - Adds custom DSA topics to the user's checklist.

### Generative AI Features
* `POST /api/ai/ask-doubt` - Analyzes user CS queries and returns clean explanations with code snippets and Big-O evaluation.
* `GET /api/ai/generate-question` - Generates a company-tailored technical interview question based on the candidate's target company.
* `POST /api/ai/mock-interview` - Evaluates user answers against generated interview questions, provides a score out of 10 with feedback, and logs results to the candidate's profile history.
