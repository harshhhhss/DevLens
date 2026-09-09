# DevLens

[![CI](https://github.com/harshhhhss/DevLens/actions/workflows/ci.yml/badge.svg)](https://github.com/harshhhhss/DevLens/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**DevLens is an AI-powered code review web app.** Paste a snippet, pick a language, and get a
structured review back in seconds — powered by Google Gemini.

Every review returns:

- **Bugs** — logic errors and edge cases, with the line and a suggested fix
- **Security vulnerabilities** — each rated Low / Medium / High / Critical
- **Performance issues** — inefficiencies and their optimisations
- **Refactor suggestions** — maintainability and readability improvements
- **Maintainability scores** — readability, security and overall, each out of 10
- **A rewritten clean version** of the submitted code

Reviews are saved per user, so you can revisit past findings from the History page.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router, react-syntax-highlighter
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **AI:** Google Gemini (`@google/generative-ai`)
- **Auth:** JWT (`jsonwebtoken`, `bcryptjs`)
- **Security:** Helmet, express-rate-limit, express-validator
- **Testing:** Vitest, Supertest, mongodb-memory-server, React Testing Library
- **CI:** GitHub Actions

## Project Structure

```
DevLens/
├── .github/workflows/     CI pipeline
├── client/                React frontend (Vite)
│   ├── public/            favicon, social card
│   └── src/
│       ├── components/    UI components (+ tests)
│       ├── pages/         Review, Login, Register, History
│       ├── services/      API client (+ tests)
│       ├── context/       auth state
│       ├── utils/         error-message mapping (+ tests)
│       └── tests/         test setup
├── server/                Express API
│   ├── config/            DB connection, env validation
│   ├── controllers/       auth and review handlers
│   ├── middleware/        auth, validation, rate limits, errors
│   ├── models/            User, Review
│   ├── routes/            /auth, /review
│   ├── services/          Gemini integration
│   ├── tests/             API tests
│   ├── app.js             builds the Express app
│   └── server.js          startup (env check, DB, listen)
├── LICENSE
└── README.md
```

`app.js` is separate from `server.js` so tests can mount the API with Supertest without
connecting to a database or binding a port.

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

Open `server/.env` and fill in the values listed in `server/.env.example` — the Mongo
connection string, a JWT secret, and your Gemini API key. The server validates these on
startup and exits with the name of any variable that is missing.

```bash
npm run dev
```

The API starts on `http://localhost:5055`. A deliberate non-default port, so it does not
collide with other services running locally.

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

The app is served at `http://localhost:5173`.

> `VITE_*` variables are baked in at build time, so restart the dev server after changing
> `client/.env`.

## Testing

```bash
cd server && npm test     # API tests: auth flow, review endpoint, env + security middleware
cd client && npm test     # API client, error mapping, component tests
```

Backend tests run against an in-memory MongoDB and stub `fetch`, so they never touch a real
database and never spend a Gemini call. Both suites run on every push and pull request to
`main` via GitHub Actions.

## Security

- **Helmet** sets standard security headers and removes the framework fingerprint
- **Rate limiting** on `/auth/login` and `/auth/register` (10 per 15 min, failed attempts only)
  and on review submission (30/hour) to protect the Gemini quota
- **Server-side validation** on every auth and review route — the frontend's checks are a
  convenience, not the boundary
- Passwords are hashed with bcrypt and never returned by the API
- Reviews are scoped to their owner; another user's review returns 404, not 403

## API Reference

All routes are prefixed with `/api/v1`.

### Auth

| Method | Route            | Description              | Auth |
| ------ | ---------------- | ------------------------ | ---- |
| POST   | `/auth/register` | Create an account        | No   |
| POST   | `/auth/login`    | Log in, returns a JWT    | No   |
| GET    | `/auth/me`       | Get current user profile | Yes  |

### Reviews

| Method | Route             | Description                        | Auth |
| ------ | ----------------- | ---------------------------------- | ---- |
| POST   | `/review`         | Submit code for AI review          | Yes  |
| GET    | `/review/history` | List paginated past reviews        | Yes  |
| GET    | `/review/:id`     | Get a single review with full code | Yes  |
| DELETE | `/review/:id`     | Delete a review                    | Yes  |

#### `POST /review`

```json
{
  "code": "function add(a, b) { return a + b }",
  "language": "javascript"
}
```

The response contains the saved review, whose `result` holds `bugs`, `security`,
`performance`, `refactor`, `scores` (readability / security / overall, out of 10) and
`cleanCode`.

## Supported Languages

JavaScript, TypeScript, Python, Java, C++, Go, Rust, PHP, Ruby.

## License

[MIT](LICENSE)
