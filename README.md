# Voice-Enabled AI Assistant
link for use : voice-bot-pearl.vercel.app

A voice-controlled AI assistant that uses the Web Speech API for speech recognition and synthesis, and OpenAI's GPT-3.5-turbo for generating responses.

## Features

- 🎤 Voice input using the Web Speech API
- 🔊 Text-to-speech responses
- 🤖 AI-powered responses using OpenAI's API
- 🎨 Clean, responsive UI
- 📱 Mobile-friendly design

## Prerequisites

- A modern web browser (Chrome, Firefox, Edge, or Safari)
- An OpenAI API key (get one from [OpenAI's website](https://platform.openai.com/))
- A local web server (for testing)

## Setup

1. Clone or download this repository
2. Open the project directory in your code editor
3. In `app.js`, replace `'YOUR_OPENAI_API_KEY'` with your actual OpenAI API key

## Running the Application

### Option 1: Using a Local Web Server (Recommended)

1. Install a simple HTTP server if you don't have one:
   ```bash
   npm install -g http-server
   ```
2. Navigate to the project directory in your terminal
3. Run the server:
   ```bash
   http-server -p 8000
   ```
4. Open your browser and go to `http://localhost:8000`

### Option 2: Direct File Access
You can also open the `index.html` file directly in your browser, but note that some features might be limited due to browser security restrictions.

## How to Use

1. Click the microphone button to start speaking
2. Ask your question or give a command
3. The AI will process your speech and respond both visually and audibly
4. Click the microphone again to stop listening

## Browser Support

- Chrome (recommended)
- Edge
- Firefox
- Safari (partial support)

## Security Note

Never commit your OpenAI API key to version control. In a production environment, you should handle the API key on the server side.

## License

This project is open source and available under the [MIT License](LICENSE).
