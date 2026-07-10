LOCAL DEV SETUP SUMMARY
========================

Project Location: /Users/leng199601/.openclaw/workspace/hec-dev/
  frontend/  - React + Vite
  backend/   - ThinkPHP 5

START FRONTEND DEV:
  cd /Users/leng199601/.openclaw/workspace/hec-dev/frontend
  npm run dev
  → http://localhost:5173

START BACKEND (optional - API already proxied):
  cd /Users/leng199601/.openclaw/workspace/hec-dev/backend
  php think run
  → http://localhost:8000

FRONTEND .env.development:
  VITE_DEV_API_PROXY=https://dys.suyan.life
  (frontend proxies /api to remote server)

TODO FOR LOCAL DEV:
  1. Import database locally
  2. Update .env.development VITE_DEV_API_PROXY to localhost if needed
