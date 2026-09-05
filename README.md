# DevLens

DevLens is an AI-powered code review web app. Paste a code snippet, pick a language, and get a structured review: bugs, security vulnerabilities, performance issues, refactor suggestions, maintainability scores, and a fully rewritten clean version of the code — powered by Google Gemini.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, react-router-dom, react-syntax-highlighter
- **Backend:** Node.js, Express.js, MongoDB, Mongoose
- **AI:** Google Gemini API (`@google/generative-ai`)
- **Auth:** JWT (jsonwebtoken, bcryptjs)

## Project Structure

```
DevLens/
├── client/            React frontend (Vite)
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── context/
├── server/            Express backend
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── server.js
├── README.md
└── .gitignore
```

## Setup

### Prerequisites

- Node.js 18+
- A MongoDB instance (local or Atlas)
- A Google Gemini API key ([Google AI Studio](https://aistudio.google.com/app/apikey))

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
```

Then open `server/.env` and fill in your own values for the variables listed in `server/.env.example` (Mongo connection string, JWT secret, Gemini API key, etc).

Run the API:

```bash
npm run dev
```

The API starts on `http://localhost:5000`.

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env
```

Then open `client/.env` and fill in your own value for the variable listed in `client/.env.example` (the API base URL).

Run the dev server:

```bash
npm run dev
```

The app is served at `http://localhost:5173`.

## API Reference

All routes are prefixed with `/api/v1`.

### Auth

| Method | Route            | Description                | Auth |
|--------|------------------|-----------------------------|------|
| POST   | `/auth/register` | Create an account           | No   |
| POST   | `/auth/login`     | Log in, returns JWT         | No   |
| GET    | `/auth/me`        | Get current user profile    | Yes  |

### Reviews

| Method | Route              | Description                          | Auth |
|--------|--------------------|---------------------------------------|------|
| POST   | `/review`          | Submit code for AI review             | Yes  |
| GET    | `/review/history`  | List paginated past reviews           | Yes  |
| GET    | `/review/:id`       | Get a single review with full code    | Yes  |
| DELETE | `/review/:id`       | Delete a review                       | Yes  |

#### `POST /review`

Request body:

```json
{
  "code": "function add(a, b) { return a + b }",
  "language": "javascript"
}
```

Response includes `bugs`, `security`, `performance`, `refactor`, `scores` (readability/security/overall out of 10), and `cleanCode` (the rewritten version).

## Supported Languages

JavaScript, Python, Java, C++, TypeScript, Go, Rust, PHP, Ruby.

## License

MIT
