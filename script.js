// ========================================
// SYNODIC AI CHATBOT - JAVASCRIPT
// ========================================

// DOM Elements
const chatbox = document.getElementById("chatbox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const thinkingIndicator = document.getElementById("thinkingIndicator");
const attachBtn = document.getElementById("attachBtn");
const voiceBtn = document.getElementById("voiceBtn");
const themeToggle = document.getElementById("themeToggle");
const sidebar = document.getElementById("sidebar");
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const sidebarToggle = document.getElementById("sidebarToggle");
const newChatBtn = document.getElementById("newChatBtn");

// Create sidebar overlay for mobile
const overlay = document.createElement("div");
overlay.className = "sidebar-overlay";
document.body.appendChild(overlay);

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  console.log("Synodic AI Chatbot initialized");
  userInput.focus();
});

// ========================================
// MESSAGE HANDLING
// ========================================

// Send message on button click
sendBtn.addEventListener("click", sendMessage);

// Send message on Enter key (Shift+Enter for new line)
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Function to send message
function sendMessage() {
  const message = userInput.value.trim();

  // Validation: Empty message
  if (message === "") {
    shakeInput();
    return;
  }

  // Validation: Message too long (max 5000 characters)
  if (message.length > 5000) {
    displaySystemMessage(
      "⚠️ Message is too long. Please keep it under 5000 characters."
    );
    return;
  }

  // Validation: Prevent spam (minimum 0.5 seconds between messages)
  const now = Date.now();
  if (window.lastMessageTime && now - window.lastMessageTime < 500) {
    shakeInput();
    return;
  }
  window.lastMessageTime = now;

  // Validation: Check for only special characters or numbers
  if (/^[^a-zA-Z]+$/.test(message) && message.length < 3) {
    displaySystemMessage(
      "🤔 I need a bit more context. Could you please elaborate?"
    );
    userInput.value = "";
    return;
  }

  // Clear input
  userInput.value = "";
  userInput.style.height = "auto";
  userInput.focus();

  // Remove welcome message if it exists
  const welcomeMsg = chatbox.querySelector(".welcome-message");
  if (welcomeMsg) {
    welcomeMsg.style.animation = "fadeOut 0.3s ease-out";
    setTimeout(() => welcomeMsg.remove(), 300);
  }

  // Display user message
  displayMessage(message, "user");

  // Show thinking indicator
  showThinking();

  // Simulate bot response with realistic delay
  const responseDelay = Math.min(Math.max(message.length * 20, 800), 3000);

  setTimeout(() => {
    hideThinking();
    try {
      const botResponse = generateBotResponse(message);
      displayMessage(botResponse, "bot");
    } catch (error) {
      console.error("Error generating response:", error);
      displayMessage(
        "😅 Oops! Something went wrong on my end. Could you try asking that again?",
        "bot"
      );
    }
  }, responseDelay);
}

// Shake input animation for invalid input
function shakeInput() {
  userInput.classList.add("shake");
  setTimeout(() => {
    userInput.classList.remove("shake");
  }, 500);
}

// Display system message (warnings, errors)
function displaySystemMessage(text) {
  const messageDiv = document.createElement("div");
  messageDiv.className = "system-message";
  messageDiv.innerHTML = `
        <div class="system-content">
            <span>${text}</span>
        </div>
    `;

  chatbox.appendChild(messageDiv);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    messageDiv.style.animation = "fadeOut 0.3s ease-out";
    setTimeout(() => messageDiv.remove(), 300);
  }, 5000);

  // Scroll to bottom
  setTimeout(() => {
    chatbox.scrollTop = chatbox.scrollHeight;
  }, 50);
}
// Display message in chatbox
function displayMessage(text, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = sender === "user" ? "👤" : "🌙";

  const bubbleDiv = document.createElement("div");
  bubbleDiv.className = "message-bubble";

  const messageContent = document.createElement("div");
  messageContent.className = "message-content";
  messageContent.textContent = text;

  const timestamp = document.createElement("div");
  timestamp.className = "message-timestamp";
  timestamp.textContent = getCurrentTime();

  bubbleDiv.appendChild(messageContent);
  bubbleDiv.appendChild(timestamp);

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(bubbleDiv);

  chatbox.appendChild(messageDiv);

  // Aggressive scroll to bottom - guaranteed to work
  const scrollToBottom = () => {
    chatbox.scrollTop = chatbox.scrollHeight + 1000;
  };

  scrollToBottom();
  setTimeout(scrollToBottom, 10);
  setTimeout(scrollToBottom, 50);
  setTimeout(scrollToBottom, 100);
  setTimeout(scrollToBottom, 200);
}
// Show thinking indicator
function showThinking() {
  thinkingIndicator.classList.add("active");

  const scrollToBottom = () => {
    chatbox.scrollTop = chatbox.scrollHeight + 1000;
  };

  setTimeout(scrollToBottom, 10);
  setTimeout(scrollToBottom, 50);
  setTimeout(scrollToBottom, 100);
}

function hideThinking() {
  thinkingIndicator.classList.remove("active");

  // Scroll after hiding
  setTimeout(() => {
    chatbox.scrollTop = chatbox.scrollHeight + 1000;
  }, 10);
}

// Get current time
function getCurrentTime() {
  const now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? "0" + minutes : minutes;

  return `${hours}:${minutes} ${ampm}`;
}

// Generate bot response (placeholder - will be replaced with real AI)
function generateBotResponse(userMessage) {
  // Safety check
  if (!userMessage || typeof userMessage !== "string") {
    return "I didn't quite catch that. Could you say it again?";
  }

  const lowerMessage = userMessage.toLowerCase().trim();

  // Handle very short messages
  if (lowerMessage.length < 2) {
    return "🤔 That's quite brief! Could you tell me more?";
  }

  // Greeting responses
  if (
    lowerMessage.match(
      /^(hi|hello|hey|greetings|good morning|good evening|good afternoon)$/
    )
  ) {
    const greetings = [
      "Hello! 👋 I'm Synodic AI, your cosmic companion. How can I assist you today?",
      "Hey there! 🌙 Great to see you! What can I help you with?",
      "Hi! ✨ Welcome back! What's on your mind?",
      "Greetings! 🌟 How can I illuminate your day?",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // How are you responses
  if (
    lowerMessage.includes("how are you") ||
    lowerMessage.includes("how r u")
  ) {
    const statusResponses = [
      "I'm functioning perfectly, thank you for asking! 🌙 How can I help you today?",
      "I'm doing great! Ready to assist you with anything you need! ✨",
      "All systems operational! 🚀 What can I do for you?",
      "I'm excellent! Thanks for asking! How about you? 😊",
    ];
    return statusResponses[Math.floor(Math.random() * statusResponses.length)];
  }

  // Name/identity questions
  if (
    lowerMessage.includes("your name") ||
    lowerMessage.includes("who are you") ||
    lowerMessage.match(/what('?re| are) you/)
  ) {
    return "I'm Synodic AI, an intelligent chatbot designed to assist you with various tasks and conversations. I'm powered by advanced language models to provide you with helpful, accurate, and engaging responses! 🌙";
  }

  // Help requests
  if (
    lowerMessage.includes("help") ||
    lowerMessage.includes("what can you do") ||
    lowerMessage.includes("capabilities")
  ) {
    return "I'm here to help! You can ask me questions, have conversations, or request assistance with various tasks. I can help with:\n\n• Answering questions\n• Writing and editing\n• Problem-solving\n• Creative tasks\n• General knowledge\n• And much more!\n\nWhat would you like to know? 🌟";
  }

  // Thank you responses
  if (lowerMessage.match(/^(thanks|thank you|thx|ty)$/)) {
    const thankResponses = [
      "You're very welcome! 😊 Is there anything else I can help with?",
      "Happy to help! 🌙 Feel free to ask me anything else!",
      "My pleasure! ✨ Let me know if you need anything else!",
      "Anytime! 🌟 I'm here if you need more assistance!",
    ];
    return thankResponses[Math.floor(Math.random() * thankResponses.length)];
  }

  // Goodbye responses
  if (lowerMessage.match(/^(bye|goodbye|see you|see ya|gotta go)$/)) {
    const goodbyes = [
      "Goodbye! 👋 Come back anytime you need help!",
      "See you later! 🌙 Have a wonderful day!",
      "Take care! ✨ I'll be here whenever you need me!",
      "Farewell! 🌟 Until next time!",
    ];
    return goodbyes[Math.floor(Math.random() * goodbyes.length)];
  }

  // Insults or negative input
  if (lowerMessage.match(/stupid|dumb|useless|bad|terrible|suck/)) {
    return "I'm sorry if I didn't meet your expectations. I'm always learning and improving! Could you tell me what went wrong so I can assist you better? 💙";
  }

  // Question detection
  if (
    lowerMessage.includes("?") ||
    lowerMessage.startsWith("what") ||
    lowerMessage.startsWith("how") ||
    lowerMessage.startsWith("why") ||
    lowerMessage.startsWith("when") ||
    lowerMessage.startsWith("where") ||
    lowerMessage.startsWith("can you") ||
    lowerMessage.startsWith("do you")
  ) {
    return "That's a great question! While I don't have access to real-time information yet, I'd love to help. Could you provide more context or rephrase your question? 🤔";
  }

  // Unclear/gibberish detection (too many consonants or random characters)
  const consonantRatio =
    (lowerMessage.match(/[bcdfghjklmnpqrstvwxyz]/g) || []).length /
    lowerMessage.length;
  if (consonantRatio > 0.7 && lowerMessage.length > 5) {
    return "🤔 I'm having trouble understanding that. Could you rephrase or provide more details?";
  }

  // Repeated characters (like "aaaaaaa" or "hahahaha")
  if (/(.)\1{4,}/.test(lowerMessage)) {
    return "😄 I see what you did there! Was there something specific you wanted to ask me?";
  }

  // Generic fallback responses
  const fallbackResponses = [
    "That's interesting! I'm still learning about that topic. Could you tell me more so I can better assist you? 🌟",
    "I understand what you're saying, but I need a bit more information to provide a helpful response. Can you elaborate? 💭",
    "Great question! While I'm processing that, could you provide more context or details? 🔍",
    "I'm here to help, but I need a clearer understanding. Could you rephrase or add more details? 💡",
    "Hmm, I'm not quite sure about that yet. Could you break it down for me or ask in a different way? 🤔",
  ];

  return fallbackResponses[
    Math.floor(Math.random() * fallbackResponses.length)
  ];
}

// ========================================
// SIDEBAR FUNCTIONALITY
// ========================================

// Mobile menu toggle
mobileMenuBtn.addEventListener("click", () => {
  sidebar.classList.add("active");
  overlay.classList.add("active");
});

// Close sidebar on overlay click
overlay.addEventListener("click", () => {
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
});

// Sidebar toggle button
sidebarToggle.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
  // Will implement collapse animation later
});

// New chat button
newChatBtn.addEventListener("click", () => {
  if (
    confirm("Start a new chat? Current conversation will be saved in history.")
  ) {
    // Clear chatbox
    chatbox.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">🌙</div>
                <h2>Welcome to Synodic AI</h2>
                <p>Your cosmic companion for intelligent conversations</p>
            </div>
        `;

    // Close mobile sidebar if open
    sidebar.classList.remove("active");
    overlay.classList.remove("active");

    // Focus input
    userInput.focus();
  }
});

// ========================================
// ADDITIONAL FEATURES
// ========================================

// Theme toggle functionality (placeholder)
themeToggle.addEventListener("click", () => {
  console.log("Theme toggle clicked - feature coming soon!");
  // Will implement light/dark mode toggle later
  alert("Theme customization coming soon! 🌓");
});

// Voice button functionality (placeholder)
voiceBtn.addEventListener("click", () => {
  console.log("Voice input clicked - feature coming soon!");
  alert("Voice input coming soon! 🎤");
});

// Attach button functionality (placeholder)
attachBtn.addEventListener("click", () => {
  console.log("Attach clicked - feature coming soon!");
  alert("File attachment coming soon! 📎");
});

// Auto-resize input on typing
userInput.addEventListener("input", (e) => {
  e.target.style.height = "auto";
  e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
});

// Prevent form submission on Enter in input
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
  }
});

// Add fadeOut animation to CSS dynamically
const style = document.createElement("style");
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-20px);
        }
    }
`;
document.head.appendChild(style);

console.log("✨ Synodic AI is ready to chat!");
