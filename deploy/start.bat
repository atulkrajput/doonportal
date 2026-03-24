@echo off
REM DoonPortal — Production Server Start (Windows)
set NODE_ENV=production
set PORT=3000
set HOSTNAME=0.0.0.0

echo Starting DoonPortal on port %PORT%...
node server.js
