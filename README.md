# 🚀 AI Goal Planner

Welcome to the **AI Goal Planner**! This is a modern, lightweight web application built to help you turn your ambitions into actionable steps. Powered by Google's cutting-edge **Gemini 3 API**, this app takes any high-level goal you input and instantly generates a precise, 5-step implementation plan.

## ✨ Features
- **AI-Powered Planning**: Uses the `gemini-3-flash-preview` model to break down complex goals into a 5-step JSON-formatted roadmap.
- **Interactive UI**: A beautiful, glassmorphic design featuring animated hover states, checkable task cards, and a dynamic progress bar.
- **Light & Dark Mode**: Fully responsive theme toggling using Tailwind CSS, complete with Sun/Moon micro-animations.
- **No-Build Architecture**: The entire application runs directly in the browser. It uses React via CDN and Babel Standalone for an instant setup with zero dependencies or complex build steps (No Node.js or npm required!).

## 🛠️ Technology Stack
- **Frontend**: [React 18](https://react.dev/) (via CDN)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (via CDN)
- **Icons**: SVG-based custom icons inspired by Lucide
- **Typography**: [Poppins](https://fonts.google.com/specimen/Poppins) (Google Fonts)
- **AI Engine**: [Google Gemini 3 API](https://ai.google.dev/) (REST endpoint)

## 🚀 Getting Started

Since this project uses a no-build CDN setup, you don't need to install any packages. You just need a simple HTTP server to serve the files locally.

### Prerequisites
1. **Python** (for running a local HTTP server).
2. A **Gemini API Key**. You can get one from Google AI Studio.

### Running the App
1. Clone or download this repository.
2. Open a terminal in the project directory.
3. Start a local server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   ```
4. Open your web browser and navigate to: `http://localhost:8000`
5. Enter your Gemini API key in the top input field.
6. Type in your goal, click **Generate**, and watch your personalized plan come to life!

## 🔐 Privacy Note
Your Gemini API key is securely saved entirely on the client side using your browser's `localStorage`. No server is deployed, meaning your key and your goals never leave your computer other than directly contacting the official Google API.

---
*Built with ❤️ and AI.*
