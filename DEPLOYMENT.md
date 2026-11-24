# Deploying Smalltalk

The existing Vercel project serves the React frontend. The Render web service runs Express and Socket.IO with PostgreSQL. Keep the existing projects and database when deploying an update.

| Service | Root directory | Build | Start or output |
| --- | --- | --- | --- |
| Render | `backend` | `npm ci && npm run build` | `npm start` |
| Vercel | `frontend` | `npm run build` | `dist` |

On Render, keep `DATABASE_URL` and `JWT_SECRET` set and configure `CORS_ORIGIN` with the frontend origin. Keep the existing email provider configured for verification and password resets.

On Vercel, set `VITE_API_URL` to the backend URL ending in `/api`. Set `VITE_SOCKET_URL` to the backend origin if it differs from the API origin. The existing service names in `render.yaml` identify hosting resources.

Deploy both services from the same revision. Check `/api/health` on Render, open the frontend in two browser sessions, sign in as different people, and exchange a message.
