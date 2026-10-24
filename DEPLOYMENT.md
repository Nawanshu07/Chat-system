# 🚀 Deployment Guide — Chat System

This guide walks you through deploying the **Chat System** to production for free with **Render** (Backend + PostgreSQL) and **Vercel** (Frontend).

---

## 📋 Architecture

- **Backend + Database:** Hosted on [Render](https://render.com) (Node.js + PostgreSQL)
- **Frontend:** Hosted on [Vercel](https://vercel.com) (React 18 + Tailwind CSS)

---

## 1️⃣ Step 1: Push Code to GitHub

1. Open your terminal in the project root:
   ```bash
   git add .
   git commit -m "feat: complete chat system with real-time sockets & REST API"
   ```

2. Create a new repository on [GitHub](https://github.com/new) (e.g. `chat-system`).

3. Link your repository and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/chat-system.git
   git branch -M main
   git push -u origin main
   ```

---

## 2️⃣ Step 2: Deploy Backend & Database on Render

### Option A: Using the Automatic Blueprint (`render.yaml`) — Recommended
1. Log in to [Render](https://dashboard.render.com).
2. Click **New +** ➡️ **Blueprint**.
3. Connect your `chat-system` GitHub repository.
4. Render will detect `render.yaml` and automatically configure:
   - A free **PostgreSQL Database** (`chat-db`)
   - A free **Node.js Web Service** (`chat-system-backend`) with all build commands and database connections.
5. Click **Apply**.
6. Once deployed, copy your backend URL (e.g. `https://chat-system-backend.onrender.com`).

### Option B: Manual Setup on Render
1. Create a **PostgreSQL** instance:
   - Click **New +** ➡️ **PostgreSQL**.
   - Name: `chat-db`.
   - Click **Create Database** and copy the **Internal Database URL**.
2. Create a **Web Service**:
   - Click **New +** ➡️ **Web Service**.
   - Connect your GitHub repo.
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - In **Environment Variables**, add:
     - `DATABASE_URL`: *(paste the Internal Database URL from step 1)*
     - `JWT_SECRET`: *(generate any random string)*
     - `CORS_ORIGIN`: `*` (or your Vercel URL)
3. Click **Deploy Web Service**.

*(Optional)* To seed initial demo users on the live database, open the **Shell** tab in your Render Web Service and run:
```bash
npm run db:seed
```

---

## 3️⃣ Step 3: Deploy Frontend on Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** ➡️ **Project**.
3. Import your `chat-system` GitHub repository.
4. In the configuration:
   - **Framework Preset**: Vite
   - **Root Directory**: Click *Edit* and select `frontend`
5. In **Environment Variables**, add:
   - `VITE_API_URL`: `https://chat-system-backend.onrender.com/api` *(replace with your Render backend URL)*
   - `VITE_SOCKET_URL`: `https://chat-system-backend.onrender.com` *(replace with your Render backend URL)*
6. Click **Deploy**.

---

## 4️⃣ Step 4: Verification & Final Polish

1. Open your live Vercel URL (e.g. `https://chat-system-xyz.vercel.app`).
2. Register an account or log in.
3. Open an Incognito window or test from your mobile phone.
4. Send messages and watch them arrive instantly in real-time! 🎉
