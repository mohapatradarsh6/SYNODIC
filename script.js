// ========================================
// SYNODIC AI CHATBOT - FRONTEND (NO API KEY NEEDED)
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
const settingsBtn = document.getElementById("settingsBtn");

// Backend API URL - Change this to your deployed backend URL
const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api"
    : `${window.location.origin}/api`; // ← This part is automatic!
// Create sidebar overlay for mobile
const overlay = document.createElement("div");
overlay.className = "sidebar-overlay";
document.body.appendChild(overlay);

// ========================================
// VOICE INTERACTION SETUP
// ========================================

let recognition = null;
let synthesis = window.speechSynthesis;
let isListening = false;
let isSpeaking = false;
let voiceEnabled = localStorage.getItem("synodic_voice") === "true";
let autoSpeak = localStorage.getItem("synodic_autospeak") === "true";

// Initialize Speech Recognition
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    isListening = true;
    voiceBtn.classList.add("listening");
    updateVoiceButtonState();
  };

  recognition.onresult = (event) => {
    let finalTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      }
    }

    if (finalTranscript) {
      userInput.value = finalTranscript;
      userInput.style.height = "auto";
      userInput.style.height = Math.min(userInput.scrollHeight, 200) + "px";
    }
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    isListening = false;
    voiceBtn.classList.remove("listening");
    updateVoiceButtonState();

    if (event.error === "no-speech") {
      displaySystemMessage("🎤 No speech detected. Please try again.");
    } else if (event.error === "not-allowed") {
      displaySystemMessage(
        "⚠️ Microphone access denied. Please enable it in your browser settings."
      );
    }
  };

  recognition.onend = () => {
    isListening = false;
    voiceBtn.classList.remove("listening");
    updateVoiceButtonState();
  };
}

// Update voice button appearance
function updateVoiceButtonState() {
  if (isListening) {
    voiceBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="6" y="6" width="12" height="12" rx="2"></rect>
      </svg>
    `;
    voiceBtn.style.background = "rgba(239, 68, 68, 0.2)";
    voiceBtn.style.borderColor = "rgba(239, 68, 68, 0.4)";
  } else {
    voiceBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
      </svg>
    `;
    voiceBtn.style.background = voiceEnabled
      ? "rgba(138, 99, 255, 0.2)"
      : "transparent";
    voiceBtn.style.borderColor = voiceEnabled
      ? "rgba(138, 99, 255, 0.4)"
      : "rgba(138, 99, 255, 0.2)";
  }
}

// Text-to-Speech function
function speakText(text) {
  if (!voiceEnabled || !synthesis) return;

  synthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  utterance.lang = "en-US";

  const voices = synthesis.getVoices();
  const preferredVoice = voices.find(
    (voice) =>
      voice.lang.startsWith("en") &&
      (voice.name.includes("Google") || voice.name.includes("Microsoft"))
  );
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.onstart = () => {
    isSpeaking = true;
  };
  utterance.onend = () => {
    isSpeaking = false;
  };
  utterance.onerror = (event) => {
    console.error("Speech synthesis error:", event.error);
    isSpeaking = false;
  };

  synthesis.speak(utterance);
}

function stopSpeaking() {
  if (synthesis) {
    synthesis.cancel();
    isSpeaking = false;
  }
}

// ========================================
// SETTINGS MODAL
// ========================================

function createSettingsModal() {
  const modal = document.createElement("div");
  modal.className = "settings-modal";
  modal.id = "settingsModal";
  modal.innerHTML = `
    <div class="settings-content">
      <div class="settings-header">
        <h2>⚙️ Settings</h2>
        <button class="close-btn" onclick="closeSettings()">×</button>
      </div>
      
      <div class="settings-body">
        <div class="settings-section">
          <h3>🎤 Voice Features</h3>
          <label class="settings-toggle">
            <input type="checkbox" id="voiceToggle">
            <span class="toggle-slider"></span>
            <span class="toggle-label">Enable Voice Interaction</span>
          </label>
          
          <label class="settings-toggle">
            <input type="checkbox" id="autoSpeakToggle">
            <span class="toggle-slider"></span>
            <span class="toggle-label">Auto-speak AI Responses</span>
          </label>
          <p class="settings-hint">💡 Click the microphone to speak your messages. AI can read responses aloud.</p>
        </div>

        <div class="settings-section">
          <h3>🎨 Appearance</h3>
          <label class="settings-toggle">
            <input type="checkbox" id="darkModeToggle" checked>
            <span class="toggle-slider"></span>
            <span class="toggle-label">Dark Mode</span>
          </label>
        </div>

        <div class="settings-section">
          <h3>ℹ️ About</h3>
          <p class="settings-hint">Synodic AI v4.5 - Powered by advanced AI<br>No API key required - Just chat!</p>
        </div>
      </div>

      <div class="settings-footer">
        <button class="settings-btn secondary" onclick="closeSettings()">Cancel</button>
        <button class="settings-btn primary" onclick="saveSettings()">Save Settings</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  loadSettings();
}

function openSettings() {
  let modal = document.getElementById("settingsModal");
  if (!modal) {
    createSettingsModal();
    modal = document.getElementById("settingsModal");
  }
  modal.classList.add("active");
}

function closeSettings() {
  const modal = document.getElementById("settingsModal");
  if (modal) {
    modal.classList.remove("active");
  }
}

function saveSettings() {
  const voiceToggle = document.getElementById("voiceToggle").checked;
  const autoSpeakToggle = document.getElementById("autoSpeakToggle").checked;
  const darkMode = document.getElementById("darkModeToggle").checked;

  localStorage.setItem("synodic_voice", voiceToggle);
  localStorage.setItem("synodic_autospeak", autoSpeakToggle);
  localStorage.setItem("synodic_darkmode", darkMode);

  voiceEnabled = voiceToggle;
  autoSpeak = autoSpeakToggle;

  updateVoiceButtonState();

  displaySystemMessage("✅ Settings saved successfully!");
  closeSettings();
}

function loadSettings() {
  voiceEnabled = localStorage.getItem("synodic_voice") === "true";
  autoSpeak = localStorage.getItem("synodic_autospeak") === "true";

  const voiceCheckbox = document.getElementById("voiceToggle");
  const autoSpeakCheckbox = document.getElementById("autoSpeakToggle");
  const darkModeCheckbox = document.getElementById("darkModeToggle");

  if (voiceCheckbox) voiceCheckbox.checked = voiceEnabled;
  if (autoSpeakCheckbox) autoSpeakCheckbox.checked = autoSpeak;
  if (darkModeCheckbox)
    darkModeCheckbox.checked =
      localStorage.getItem("synodic_darkmode") !== "false";

  updateVoiceButtonState();
}

// ========================================
// MESSAGE HANDLING
// ========================================

let conversationHistory = [];

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  console.log("Synodic AI Chatbot initialized");
  userInput.focus();
  loadSettings();

  if (synthesis) {
    synthesis.onvoiceschanged = () => synthesis.getVoices();
  }
});

sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

async function sendMessage() {
  const message = userInput.value.trim();

  if (message === "") {
    shakeInput();
    return;
  }

  if (message.length > 5000) {
    displaySystemMessage(
      "⚠️ Message is too long. Please keep it under 5000 characters."
    );
    return;
  }

  const now = Date.now();
  if (window.lastMessageTime && now - window.lastMessageTime < 500) {
    shakeInput();
    return;
  }
  window.lastMessageTime = now;

  stopSpeaking();

  userInput.value = "";
  userInput.style.height = "auto";
  userInput.focus();

  const welcomeMsg = chatbox.querySelector(".welcome-message");
  if (welcomeMsg) {
    welcomeMsg.style.animation = "fadeOut 0.3s ease-out";
    setTimeout(() => welcomeMsg.remove(), 300);
  }

  displayMessage(message, "user");
  conversationHistory.push({ role: "user", content: message });

  showThinking();

  try {
    // Call backend API
    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        history: conversationHistory.slice(-10),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to get response from AI");
    }

    const data = await response.json();

    hideThinking();
    displayMessage(data.response, "bot");
    conversationHistory.push({ role: "assistant", content: data.response });

    if (autoSpeak && voiceEnabled) {
      setTimeout(() => speakText(data.response), 500);
    }

    setTimeout(() => {
      chatbox.scrollTop = chatbox.scrollHeight;
    }, 100);
  } catch (error) {
    hideThinking();
    console.error("AI Error:", error);

    let errorMessage = "😅 Oops! Something went wrong. ";

    if (error.message.includes("Failed to fetch")) {
      errorMessage += "Cannot connect to server. Please check your connection.";
    } else if (error.message.includes("busy")) {
      errorMessage += "Service is busy. Please try again in a moment.";
    } else {
      errorMessage += "Please try again.";
    }

    displayMessage(errorMessage, "bot");
  }
}

function shakeInput() {
  userInput.classList.add("shake");
  setTimeout(() => userInput.classList.remove("shake"), 500);
}

function displaySystemMessage(text) {
  const messageDiv = document.createElement("div");
  messageDiv.className = "system-message";
  messageDiv.innerHTML = `
    <div class="system-content">
      <span>${text}</span>
    </div>
  `;

  chatbox.appendChild(messageDiv);

  setTimeout(() => {
    messageDiv.style.animation = "fadeOut 0.3s ease-out";
    setTimeout(() => messageDiv.remove(), 300);
  }, 5000);

  chatbox.scrollTop = chatbox.scrollHeight;
}

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

  if (sender === "bot" && voiceEnabled) {
    const speakerBtn = document.createElement("button");
    speakerBtn.className = "speaker-btn";
    speakerBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      </svg>
    `;
    speakerBtn.onclick = () => speakText(text);
    bubbleDiv.appendChild(speakerBtn);
  }

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(bubbleDiv);

  chatbox.appendChild(messageDiv);

  setTimeout(() => {
    messageDiv.scrollIntoView({ behavior: "smooth", block: "end" });
  }, 100);
}

function showThinking() {
  thinkingIndicator.classList.add("active");
}

function hideThinking() {
  thinkingIndicator.classList.remove("active");
}

function getCurrentTime() {
  const now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  return `${hours}:${minutes} ${ampm}`;
}

// ========================================
// VOICE BUTTON
// ========================================

voiceBtn.addEventListener("click", () => {
  if (!recognition) {
    alert(
      "Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari."
    );
    return;
  }

  if (!voiceEnabled) {
    displaySystemMessage("🎤 Please enable voice features in settings first!");
    openSettings();
    return;
  }

  if (isListening) {
    recognition.stop();
  } else {
    try {
      recognition.start();
    } catch (error) {
      console.error("Speech recognition error:", error);
      displaySystemMessage("⚠️ Could not start voice input. Please try again.");
    }
  }
});

// ========================================
// SIDEBAR FUNCTIONALITY
// ========================================

mobileMenuBtn.addEventListener("click", () => {
  sidebar.classList.add("active");
  overlay.classList.add("active");
});

overlay.addEventListener("click", () => {
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
});

sidebarToggle.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
});

newChatBtn.addEventListener("click", () => {
  if (confirm("Start a new chat? Current conversation will be cleared.")) {
    conversationHistory = [];
    stopSpeaking();

    chatbox.innerHTML = `
      <div class="welcome-message">
        <div class="welcome-icon">🌙</div>
        <h2>Welcome to Synodic AI</h2>
        <p>Your cosmic companion for intelligent conversations</p>
      </div>
    `;

    sidebar.classList.remove("active");
    overlay.classList.remove("active");
    userInput.focus();
  }
});

// ========================================
// ADDITIONAL FEATURES
// ========================================

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  const isLight = document.body.classList.contains("light-mode");
  localStorage.setItem("synodic_darkmode", !isLight);
});

attachBtn.addEventListener("click", () => {
  alert("File attachment coming soon! 📎");
});

settingsBtn.addEventListener("click", openSettings);

userInput.addEventListener("input", (e) => {
  e.target.style.height = "auto";
  e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
});

const style = document.createElement("style");
style.textContent = `
  @keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-20px); }
  }
`;
document.head.appendChild(style);

console.log("✨ Synodic AI is ready to chat!");
