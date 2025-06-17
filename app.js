// DOM Elements
const startBtn = document.getElementById('start-btn');
const statusEl = document.getElementById('status');
const chatMessages = document.getElementById('chat-messages');

// Check for browser support
const isSpeechRecognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
const isSpeechSynthesisSupported = 'speechSynthesis' in window;

// Initialize speech recognition
let recognition;
let isListening = false;

// Cohere API Configuration
// Get your API key from https://dashboard.cohere.ai/
const COHERE_API_KEY = 'AwcuyumJoRndC9e3WrjrH1MgUZVGcVFFotNZkqtF';
const COHERE_API_URL = 'https://api.cohere.ai/v1/generate';

// Initialize the application
function init() {
    if (!isSpeechRecognitionSupported || !isSpeechSynthesisSupported) {
        statusEl.textContent = 'Speech recognition or synthesis is not supported in this browser.';
        startBtn.disabled = true;
        return;
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    // Set up event listeners
    setupEventListeners();
}

// Set up event listeners
function setupEventListeners() {
    // Start/stop listening on button click
    startBtn.addEventListener('click', toggleListening);
    
    // Speech recognition events
    recognition.onstart = () => {
        isListening = true;
        startBtn.classList.add('listening');
        statusEl.textContent = 'Listening...';
    };

    recognition.onend = () => {
        isListening = false;
        startBtn.classList.remove('listening');
        statusEl.textContent = 'Click to speak';
    };

    recognition.onresult = async (event) => {
        let loadingMessage = null;
        try {
            const transcript = event.results[0][0].transcript.trim();
            if (!transcript) {
                console.log('No speech was detected');
                return;
            }

            console.log('User said:', transcript);
            
            // Display user message
            addMessage(transcript, 'user');
            
            // Show loading state
            loadingMessage = document.createElement('div');
            loadingMessage.className = 'message ai-message';
            loadingMessage.textContent = 'Thinking...';
            chatMessages.appendChild(loadingMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // Get AI response
            const aiResponse = await getAIResponse(transcript);
            
            // Remove loading message and show actual response
            if (loadingMessage && loadingMessage.parentNode) {
                chatMessages.removeChild(loadingMessage);
            }
            
            // Display and speak AI response
            addMessage(aiResponse, 'ai');
            speak(aiResponse);
            
        } catch (error) {
            console.error('Error in processing:', error);
            
            // Remove loading message if it exists
            if (loadingMessage && loadingMessage.parentNode) {
                chatMessages.removeChild(loadingMessage);
            }
            
            let errorMessage = "I'm sorry, I encountered an error. Please try again.";
            
            if (error.message.includes('401')) {
                errorMessage = "Authentication error: Please check your OpenAI API key.";
            } else if (error.message.includes('rate limit')) {
                errorMessage = "I'm getting too many requests. Please wait a moment and try again.";
            } else if (error.message.includes('network')) {
                errorMessage = "Network error: Please check your internet connection.";
            } else if (error.message.includes('speech recognition')) {
                errorMessage = "I'm having trouble with the microphone. Please check your permissions and try again.";
            }
            
            addMessage(errorMessage, 'ai');
            speak(errorMessage);
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        statusEl.textContent = 'Error: ' + event.error;
    };
}

// Toggle speech recognition
function toggleListening() {
    if (isListening) {
        recognition.stop();
    } else {
        try {
            recognition.start();
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            statusEl.textContent = 'Error: Could not start speech recognition';
        }
    }
}

// Add message to chat
function addMessage(text, sender) {
    const messageEl = document.createElement('div');
    messageEl.classList.add('message', `${sender}-message`);
    messageEl.textContent = text;
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageEl; // Return the created element
}

// Conversation history for context
let conversationHistory = [];

// Cohere API integration
let isRequestInProgress = false;

// Custom responses for specific questions
const CUSTOM_RESPONSES = {
    // Short responses (common questions)
    "how are you": "I'm doing great, thanks for asking! How about you?",
    "what's up": "Just here and ready to help! What's up with you?",
    "hello": "Hi there! How can I help you today?",
    "hi": "Hello! What can I do for you?",
    "thanks": "You're welcome! Is there anything else you'd like to know?",
    "thank you": "You're welcome! Happy to help.",
    "bye": "Goodbye! Have a great day!",
    "goodbye": "Take care! Come back if you need anything.",
    
    // Medium responses (slightly more detailed)
    "who are you": "I'm Khushal, your friendly AI assistant! I'm here to answer questions and help with various tasks. What would you like to know?",
    "what can you do": "I can answer questions, help with information, and assist with tasks. Try asking me anything!",
    "how old are you": "I'm an AI, so I don't have an age, but I was created to be your helpful assistant!",
    
    // Long responses (detailed answers)
    "what should we know about your life story": "I'm Khushal, a passionate tech enthusiast and developer. My journey in technology started at a young age when I first discovered programming. I've since dedicated myself to learning and creating innovative solutions. I believe in the power of technology to transform lives and am always excited about new developments in AI and software. What interests you most about technology?",
    "what's your #1 superpower": "My #1 superpower is my ability to quickly learn and adapt to new technologies. I can grasp complex concepts and turn them into practical solutions, making me a versatile problem-solver. This skill has been invaluable in the fast-paced world of technology, where being able to learn and adapt is crucial for success. How do you approach learning new things?",
    "what is your #1 superpower": "My #1 superpower is my ability to quickly learn and adapt to new technologies. I can grasp complex concepts and turn them into practical solutions, making me a versatile problem-solver. This skill has been invaluable in the fast-paced world of technology, where being able to learn and adapt is crucial for success. How do you approach learning new things?",
    "tell me about yourself": "I'm Khushal, a tech enthusiast with a deep passion for innovation and problem-solving. I love exploring how technology can be used to create meaningful solutions. When I'm not coding, you can find me staying updated with the latest tech trends, working on personal projects, or sharing knowledge with others. What are you passionate about?",
    "explain your background": "My background is in technology and software development. I've worked on various projects that combine creativity with technical skills. I'm particularly interested in AI, web development, and creating user-friendly applications. Each project has been a learning experience, helping me grow both technically and personally. Is there a specific area you'd like to know more about?"
};

// Questions that should trigger longer responses
const LONG_RESPONSE_TRIGGERS = [
    'tell me about',
    'explain',
    'how does',
    'what is',
    'what are',
    'describe',
    'why is',
    'could you tell me about',
    'can you explain',
    'life story',
    'background',
    'experience'
];

// Function to determine if a question should get a long response
function shouldGiveLongResponse(message) {
    const lowerMsg = message.toLowerCase();
    return LONG_RESPONSE_TRIGGERS.some(trigger => lowerMsg.includes(trigger));
}

async function getAIResponse(userMessage) {
    console.log('Processing message:', userMessage);
    const lowerMessage = userMessage.toLowerCase().trim();
    
    // 1. Check for exact matches in custom responses first
    for (const [question, response] of Object.entries(CUSTOM_RESPONSES)) {
        if (lowerMessage.includes(question)) {
            console.log('Using custom response for:', question);
            return response;
        }
    }
    
    // 2. Check if we should use a long or short response
    const shouldBeLong = shouldGiveLongResponse(lowerMessage);
    
    // 3. Prevent multiple simultaneous requests to the API
    if (isRequestInProgress) {
        return "I'm still processing your previous request. Please wait a moment.";
    }
    
    // 4. For very short queries, try to give a quick response
    if (userMessage.split(' ').length <= 3 && !shouldBeLong) {
        const quickResponses = [
            "Could you elaborate on that?",
            "I'd be happy to help with that!",
            "Interesting! Tell me more.",
            "I'm not sure I understand. Could you rephrase?",
            "That's a great point!"
        ];
        return quickResponses[Math.floor(Math.random() * quickResponses.length)];
    }
    
    try {
        isRequestInProgress = true;
        
        // Add user message to history
        conversationHistory.push({"role": "user", "content": userMessage});
        
        // Keep only the last 4 messages (2 exchanges) to manage context
        if (conversationHistory.length > 4) {
            conversationHistory = conversationHistory.slice(-4);
        }
        
        // Prepare the conversation history for the prompt
        const conversationContext = conversationHistory
            .map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`)
            .join('\n');
            
        // Prepare the prompt with instructions for response length
        const prompt = `The following is a conversation between a user and an AI assistant. 
The assistant is helpful, concise, and responds in a friendly manner.
${conversationContext}\nAI:`;
        
        // Adjust parameters based on whether we want a long or short response
        const requestBody = {
            prompt: prompt,
            max_tokens: shouldBeLong ? 150 : 60,  // More tokens for longer responses
            temperature: shouldBeLong ? 0.8 : 0.7,  // Slightly more creative for long responses
            k: 0,
            p: 0.75,
            frequency_penalty: 0.2,
            presence_penalty: 0.2,
            stop_sequences: ['User:', '\n'],
            return_likelihoods: 'NONE',
            truncate: 'END'  // Ensure we don't get cut-off responses
        };
        
        if (shouldBeLong) {
            // Add more context and detail for long responses
            requestBody.prompt = `The following is a conversation between a user and an AI assistant. 
The assistant provides detailed, informative responses that are helpful and engaging.
${conversationContext}\nAI:`;
        }
        
        console.log('Sending to Cohere API with', shouldBeLong ? 'long' : 'short', 'response settings');
        const response = await fetch(COHERE_API_URL, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${COHERE_API_KEY}`,
                'Content-Type': 'application/json',
                'Cohere-Version': '2022-12-06'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('Cohere API Error:', data);
            return "I'm having trouble connecting to the AI right now. Please try again later.";
        }

        const aiResponse = data.generations?.[0]?.text?.trim();
        
        if (!aiResponse) {
            return "I didn't get a proper response. Could you try asking something else?";
        }
        
        // Clean up the response (remove any remaining prompt parts)
        const cleanResponse = aiResponse.split('User:')[0].trim();
        
        // Add AI response to history
        conversationHistory.push({"role": "assistant", "content": cleanResponse});
        
        console.log('AI Response:', cleanResponse);
        return cleanResponse;
        
    } catch (error) {
        console.error('Error in getAIResponse:', error);
        // Fallback to local responses if API fails
        const fallbackResponses = [
            "I'm having trouble connecting to the AI service. Let's try again in a moment.",
            "I'm currently experiencing some technical difficulties. Could you repeat that?",
            "I'm having trouble understanding right now. Could you ask me something else?"
        ];
        return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
}

// Text-to-speech function
function speak(text) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Try to get a nice voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoices = voices.filter(voice => 
        voice.lang.includes('en') && voice.name.includes('Google')
    );
    
    if (preferredVoices.length > 0) {
        utterance.voice = preferredVoices[0];
    }
    
    window.speechSynthesis.speak(utterance);
}

// Load voices when they become available
window.speechSynthesis.onvoiceschanged = function() {
    // This event fires when the voices are loaded
};

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
