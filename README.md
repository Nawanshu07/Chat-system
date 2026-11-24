# Xwhispers

Xwhispers is a simple chat app. Sign in, choose **New chat**, search for a username, and send a message. Conversations are private to their members, and message history is available after signing back in.

## How it works

- React displays the account form, conversation list, and selected chat.
- Express checks the user's session and room membership before reading or saving messages with Prisma.
- Socket.IO tells the participants' browsers when a message arrives. Opening or reconnecting to a chat loads its saved history.

## Run locally

Use Node.js 22.12 or later. In `backend`, copy `.env.example` to `.env` for a new checkout, set a private `JWT_SECRET`, then run:

```sh
npm ci
npm run build
npm start
```

The default local database is SQLite. Set an email provider in the backend environment for registration and password recovery. The app supports `BREVO_API_KEY` with `BREVO_SENDER_EMAIL`, `RESEND_API_KEY` with `RESEND_FROM`, or Gmail with `SMTP_USER` and `SMTP_PASS`.

For a local demo on a fresh SQLite database, run `npm run db:seed` in `backend`. Sign in as `demo@example.com` and `mina@example.com` in separate browser sessions with password `Password1`. These sample accounts can chat immediately.

In another terminal, open `frontend` and run:

```sh
npm ci
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`. The frontend connects to `http://localhost:5000/api` by default. See [deployment instructions](DEPLOYMENT.md) for the hosted configuration.
