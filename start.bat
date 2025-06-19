@echo off
start cmd /k "cd backend && uvicorn app:app --reload"
timeout /t 3
start cmd /k "cd frontend && npm start"
