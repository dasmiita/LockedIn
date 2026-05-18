# LockedIn 🔒

A Chrome extension that tracks your browsing habits and tells you 
how productive your day actually was.

## Features
- Tracks time spent on every site
- Detects YouTube videos and classifies them as educational or entertainment using AI
- Handles YouTube Shorts and surfing separately
- Daily productivity score with rank
- Highlights productive sites like LeetCode, GitHub, GeeksForGeeks

## Setup
1. Clone this repo
2. Get a free API key at console.groq.com
3. Paste your key in `classifier.js`
4. Go to chrome://extensions
5. Enable Developer Mode
6. Click Load Unpacked and select this folder

## Tech
- Vanilla JS
- Chrome Extensions Manifest V3
- Groq API (llama-3.1-8b-instant)
- Chrome Storage API
- WebSockets for tab tracking