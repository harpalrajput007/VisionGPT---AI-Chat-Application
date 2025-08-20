# VisionGPT

VisionGPT is a full‑stack AI chat application with user authentication, chat history, code‑aware message rendering, dark/light themes, and a clean, responsive UI.

## Table of Contents
1. Overview
2. Features
3. Architecture
4. Tech Stack
5. Project Structure
6. Setup and Installation
   - Backend
   - Frontend
7. Configuration
   - Environment Variables (Backend)
   - LLM Setup
   - Logo and Branding
8. Development Workflow
9. API Reference
10. Data Models
11. Scripts and Useful Commands
12. Build and Deployment
13. Testing
14. Troubleshooting
15. Security Notes
16. License

---

## 1) Overview
VisionGPT lets users register and log in, create and manage multiple chats, send prompts, and receive AI‑generated responses. Messages support code blocks with syntax highlighting. The UI includes a resizable sidebar, theme toggle, and polished Material UI styling.

## 2) Features
- Authentication with JWT (Register/Login)
- Protected API routes
- Chat management: create, load, delete chats
- Code‑aware message rendering (Markdown‑like code fences, syntax highlighting)
- Resizable sidebar with persistent width
- Dark/Light theme toggle
- Loading indicators while generating responses
- Clean, responsive Material UI design

## 3) Architecture
- Frontend: React SPA (Material UI), calls backend REST APIs via Axios
- Backend: Express API with JWT auth, MongoDB for persistence
- LLM: Local endpoint (LM Studio) for chat completions

## 4) Tech Stack
- Frontend
  - React 19
  - React Router 7
  - Material UI 7 and Emotion
  - Axios
  - react-syntax-highlighter
- Backend
  - Node.js + Express
  - Mongoose (MongoDB)
  - JSON Web Tokens (JWT)
  - bcryptjs
  - node-fetch (LLM calls)
- Database: MongoDB (Atlas or local)
- LLM: LM Studio (http://127.0.0.1:1234/v1)

## 5) Project Structure
```
VisionGPT/
├── backend/
│   ├── .env                      # Backend env vars (do not commit)
│   ├── package.json
│   └── src/
│       ├── app.js                # Express app bootstrap
│       ├── config/
│       │   └── db.js             # MongoDB connection
│       ├── controllers/
│       │   ├── authController.js
│       │   └── chatController.js
│       ├── middleware/
│       │   └── authMiddleware.js
│       ├── models/
│       │   ├── chatModel.js
│       │   └── userModel.js
│       ├── routes/
│       │   ├── api.js            # Chat routes
│       │   └── authRoutes.js     # Auth routes
│       └── services/
│           └── llmService.js
└── frontend/
    ├── package.json
    ├── public/
    │   ├── index.html
    │   ├── manifest.json
    │   └── VisionGPTLogo.png     # App/Tab icon
    └── src/
        ├── App.js
        ├── index.js
        ├── index.css
        ├── context/
        │   ├── AuthContext.js
        │   └── ColorModeContext.js
        └── components/
            ├── Login.js
            ├── Register.js
            └── Chat.js
```

## 6) Setup and Installation

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+
- A MongoDB database (local or Atlas)
- LM Studio (or a compatible OpenAI‑style server) running locally

### Backend Setup
1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Create a .env file (see Configuration below) and set required variables.
3. Start development server (with auto‑reload):
   ```bash
   npm run dev
   ```
   The API will run on http://localhost:5000 by default.

### Frontend Setup
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start development server:
   ```bash
   npm start
   ```
   The app runs on http://localhost:3000. It calls the backend at http://localhost:5000 (hardcoded in Axios calls).

## 7) Configuration

### Environment Variables (Backend)
Create `backend/.env` with:
```
PORT=5000
MONGO_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_random_secret>
LM_STUDIO_API_URL=http://127.0.0.1:1234/v1
```
Notes:
- Do not commit .env to version control.
- Ensure `MONGO_URI` is reachable from your machine/server.
- JWT_SECRET should be a strong random value.

### LLM Setup
- The backend calls an OpenAI‑style API at `LM_STUDIO_API_URL`.
- Default model is configured in `backend/src/services/llmService.js`:
  - Base URL: `http://127.0.0.1:1234/v1`
  - Endpoint: `/chat/completions`
  - Model: `gemma-3-4b-it-qat`
- To change the model or server:
  - Update `LM_STUDIO_API_URL` in the .env
  - Optionally adjust the `model` field in `llmService.js`
- Make sure LM Studio is running and the chosen model is loaded.

### Logo and Branding
- The browser/tab icon uses `frontend/public/VisionGPTLogo.png`.
- Login/Register and Chat header also use `/VisionGPTLogo.png`.
- Replace this file with your own image to change branding.

## 8) Development Workflow
1. Start MongoDB and LM Studio.
2. Start backend: `npm run dev` in `backend/`.
3. Start frontend: `npm start` in `frontend/`.
4. Register a new account at `/register` or log in at `/login`.
5. Create a new chat, send prompts, and view AI responses.

## 9) API Reference
Base URL: `http://localhost:5000/api`

Auth
- POST `/auth/register`
  - body: `{ username, email, password }`
  - returns: `{ _id, username, email, token }`
- POST `/auth/login`
  - body: `{ email, password }`
  - returns: `{ _id, username, email, token }`

Chats (All require `Authorization: Bearer <token>`)
- GET `/chats`
  - returns: `Chat[]` for current user
- POST `/chats/new`
  - returns: `Chat` (empty messages, default title)
- GET `/chats/:id`
  - returns: `Chat` by id (owned by user)
- POST `/chats/:id/messages`
  - body: `{ message: string }`
  - behavior: appends user message, calls LLM, appends assistant response; auto‑generates a title for new chats
  - returns: updated `Chat`
- DELETE `/chats/:id`
  - deletes chat owned by user

Response Codes
- 200/201: success
- 400: bad request
- 401: unauthorized/invalid token
- 404: not found
- 500: server error

## 10) Data Models

User (`backend/src/models/userModel.js`)
- username: string, unique, required
- email: string, unique, required
- password: string, required (hashed with bcrypt)
- timestamps

Chat (`backend/src/models/chatModel.js`)
- userId: ObjectId (User), required
- title: string (defaults to "New Chat"; auto‑generated on first message)
- messages: array of `{ role: 'user' | 'assistant', content: string, timestamp: Date }`
- timestamps

## 11) Scripts and Useful Commands

Backend (`backend/package.json`)
- `npm start` → `node src/app.js`
- `npm run dev` → `nodemon src/app.js`

Frontend (`frontend/package.json`)
- `npm start` → React dev server
- `npm run build` → Production build
- `npm test` → Test runner
- `npm run eject` → CRA eject (irreversible)

## 12) Build and Deployment

Frontend
- Build:
  ```bash
  cd frontend
  npm run build
  ```
  Outputs to `frontend/build/`. Deploy to any static host (Netlify, Vercel, S3, etc.).

Backend
- Deploy Node/Express app to services like Render, Railway, Fly.io, or a VPS.
- Set environment variables on the platform.
- Ensure outbound access to your LLM endpoint and inbound access to MongoDB.

Integration
- The frontend currently calls `http://localhost:5000`. For production, either:
  - Update Axios base URLs in the frontend components (Login.js, Register.js, Chat.js), or
  - Introduce a frontend environment variable (e.g., REACT_APP_API_BASE_URL) and refactor to use it.

## 13) Testing
- Frontend includes testing libraries (`@testing-library/*`). Run with `npm test` in `frontend/`.
- Backend currently has no test suite configured; you can add Jest + Supertest as needed.

## 14) Troubleshooting
- 401 Unauthorized
  - Ensure Authorization header is `Bearer <token>`.
  - Token expired or invalid JWT_SECRET mismatch.
- CORS issues
  - Backend enables CORS globally; verify frontend calls use the correct origin.
- MongoDB connection errors
  - Verify `MONGO_URI` and network access (IP allowlist in Atlas).
- LLM errors/timeouts
  - Ensure LM Studio is running at `LM_STUDIO_API_URL`.
  - Check model name in `llmService.js` and logs for error details.
- Port conflicts
  - Change `PORT` in `.env` or free the port.

## 15) Security Notes
- Never commit `.env` with secrets. Rotate any leaked credentials immediately.
- Use strong `JWT_SECRET`.
- Consider adding rate‑limiting, input validation, and logging in production.
- For production, serve the frontend over HTTPS and secure the backend behind a WAF or reverse proxy.

## 16) License
Add your preferred license here (e.g., MIT).

---

Made with ❤️ for building AI‑powered chat experiences.