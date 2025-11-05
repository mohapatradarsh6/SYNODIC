// ========================================
// SYNODIC AI CHATBOT - FRONTEND WITH AUTH
// ========================================

// Backend API URL
const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api"
    : `${window.location.origin}/api`;

// ========================================
// AUTHENTICATION STATE
// ========================================

let currentUser = null;

// Check if user is already logged in on page load
function checkAuthStatus() {
  const token = localStorage.getItem("synodic_token");
  const userData = localStorage.getItem("synodic_user");

  if (token && userData) {
    try {
      currentUser = JSON.parse(userData);
      showApp();
      updateUserProfile();
      return true;
    } catch (error) {
      console.error("Error parsing user data:", error);
      logout();
    }
  }
  return false;
}

// Show main app (hide auth screen)
function showApp() {
  document.getElementById("authWrapper").style.display = "none";
  document.getElementById("appWrapper").style.display = "flex";
}

// Show auth screen (hide main app)
function showAuth() {
  document.getElementById("authWrapper").style.display = "flex";
  document.getElementById("appWrapper").style.display = "none";
}

// Update user profile display
function updateUserProfile() {
  if (currentUser) {
    const userNameElement = document.getElementById("userName");
    if (userNameElement) {
      userNameElement.textContent = currentUser.name || currentUser.email;
    }
  }
}

// ========================================
// AUTH FORM HANDLING
// ========================================

// Switch between sign in and sign up forms
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is already logged in
  if (!checkAuthStatus()) {
    showAuth();
  }

  const switchToSignup = document.getElementById("switchToSignup");
  const switchToSignin = document.getElementById("switchToSignin");
  const signinForm = document.getElementById("signinForm");
  const signupForm = document.getElementById("signupForm");

  if (switchToSignup) {
    switchToSignup.addEventListener("click", (e) => {
      e.preventDefault();
      signinForm.classList.remove("active");
      signupForm.classList.add("active");
    });
  }

  if (switchToSignin) {
    switchToSignin.addEventListener("click", (e) => {
      e.preventDefault();
      signupForm.classList.remove("active");
      signinForm.classList.add("active");
    });
  }

  // Sign In Form Submission
  const signinFormElement = document.getElementById("signinFormElement");
  if (signinFormElement) {
    signinFormElement.addEventListener("submit", handleSignIn);
  }

  // Sign Up Form Submission
  const signupFormElement = document.getElementById("signupFormElement");
  if (signupFormElement) {
    signupFormElement.addEventListener("submit", handleSignUp);
  }

  // Google Sign In Buttons
  const googleSigninBtn = document.getElementById("googleSigninBtn");
  const googleSignupBtn = document.getElementById("googleSignupBtn");

  if (googleSigninBtn) {
    googleSigninBtn.addEventListener("click", handleGoogleAuth);
  }

  if (googleSignupBtn) {
    googleSignupBtn.addEventListener("click", handleGoogleAuth);
  }

  // ADD THIS: Forgot Password Link Handler
  const forgotLink = document.querySelector(".forgot-link");
  if (forgotLink) {
    forgotLink.addEventListener("click", (e) => {
      e.preventDefault();
      showForgotPasswordModal();
    });
  }

  // Logout Button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  // Initialize chat functionality
  initializeChatApp();
});

// Handle Sign In
async function handleSignIn(e) {
  e.preventDefault();

  const email = document.getElementById("signinEmail").value;
  const password = document.getElementById("signinPassword").value;
  const rememberMe = document.getElementById("rememberMe").checked;

  if (!email || !password) {
    showAuthError("Please fill in all fields");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, rememberMe }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Sign in failed");
    }

    // Store user data and token
    localStorage.setItem("synodic_token", data.token);
    localStorage.setItem("synodic_user", JSON.stringify(data.user));

    currentUser = data.user;

    // Show success message
    showAuthSuccess("Welcome back! Loading your workspace...");

    // Transition to app
    setTimeout(() => {
      showApp();
      updateUserProfile();
    }, 1000);
  } catch (error) {
    console.error("Sign in error:", error);
    showAuthError(error.message);
  }
}

// Handle Sign Up
async function handleSignUp(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn.disabled) return;
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const confirmPassword = document.getElementById(
    "signupConfirmPassword"
  ).value;
  const agreeTerms = document.getElementById("agreeTerms").checked;

  // Validation
  if (!name || !email || !password || !confirmPassword) {
    showAuthError("Please fill in all fields");
    return;
  }

  if (password !== confirmPassword) {
    showAuthError("Passwords do not match");
    return;
  }

  if (password.length < 6) {
    showAuthError("Password must be at least 6 characters long");
    return;
  }

  if (!agreeTerms) {
    showAuthError("Please agree to the Terms of Service");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Creating Account...";
  submitBtn.style.opacity = "0.7";

  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Sign up failed");
    }

    // Store user data and token
    localStorage.setItem("synodic_token", data.token);
    localStorage.setItem("synodic_user", JSON.stringify(data.user));

    currentUser = data.user;

    // Show success message
    showAuthSuccess("Account created! Welcome to Synodic AI...");

    // Transition to app
    setTimeout(() => {
      showApp();
      updateUserProfile();
    }, 1000);
  } catch (error) {
    console.error("Sign up error:", error);
    showAuthError(error.message);

    submitBtn.disabled = false;
    submitBtn.textContent = "Create Account";
    submitBtn.style.opacity = "1";
  }
}

// Handle Google Authentication
async function handleGoogleAuth() {
  showAuthError(
    "Google Sign-In will be available soon! For now, please use email/password."
  );

  // In a real implementation, you would:
  // 1. Initialize Google OAuth
  // 2. Get the Google token
  // 3. Send it to your backend
  // 4. Backend verifies with Google and creates/logs in user
}

// Show auth error message
function showAuthError(message) {
  // Remove existing error if any
  const existingError = document.querySelector(".auth-error");
  if (existingError) {
    existingError.remove();
  }

  const errorDiv = document.createElement("div");
  errorDiv.className = "auth-error";
  errorDiv.style.cssText = `
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #f87171;
    padding: 12px 16px;
    border-radius: 10px;
    margin-bottom: 16px;
    font-size: 14px;
    animation: shake 0.5s ease-in-out;
  `;
  errorDiv.textContent = message;

  const activeForm = document.querySelector(".auth-form.active");
  if (activeForm) {
    activeForm.insertBefore(errorDiv, activeForm.querySelector("form"));
  }

  setTimeout(() => {
    errorDiv.style.animation = "fadeOut 0.3s ease-out";
    setTimeout(() => errorDiv.remove(), 300);
  }, 5000);
}

// Show auth success message
function showAuthSuccess(message) {
  const existingError = document.querySelector(".auth-error");
  if (existingError) {
    existingError.remove();
  }

  const successDiv = document.createElement("div");
  successDiv.className = "auth-success";
  successDiv.style.cssText = `
    background: rgba(34, 197, 94, 0.15);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #4ade80;
    padding: 12px 16px;
    border-radius: 10px;
    margin-bottom: 16px;
    font-size: 14px;
    animation: fadeIn 0.3s ease-out;
  `;
  successDiv.textContent = message;

  const activeForm = document.querySelector(".auth-form.active");
  if (activeForm) {
    activeForm.insertBefore(successDiv, activeForm.querySelector("form"));
  }
}

// Forgot Password Modal
function showForgotPasswordModal() {
  const existingModal = document.getElementById("forgotPasswordModal");
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement("div");
  modal.id = "forgotPasswordModal";
  modal.className = "settings-modal active";
  modal.innerHTML = `
    <div class="settings-content" style="max-width: 450px;">
      <div class="settings-header">
        <h2>🔑 Reset Password</h2>
        <button class="close-btn" onclick="document.getElementById('forgotPasswordModal').remove()">×</button>
      </div>
      
      <div class="settings-body" id="forgotPasswordStep1">
        <p style="color: #94a3b8; margin-bottom: 20px;">Enter your email address and we'll send you a reset code.</p>
        <div class="form-group">
          <label>Email Address</label>
          <input type="email" id="forgotEmail" placeholder="your@email.com" class="settings-input" />
        </div>
        <button class="settings-btn primary" style="width: 100%;" onclick="requestPasswordReset()">Send Reset Code</button>
      </div>

      <div class="settings-body" id="forgotPasswordStep2" style="display: none;">
        <p style="color: #94a3b8; margin-bottom: 20px;">Enter the 6-digit code sent to your email and your new password.</p>
        <div class="form-group">
          <label>Reset Code</label>
          <input type="text" id="resetCode" placeholder="000000" maxlength="6" class="settings-input" />
        </div>
        <div class="form-group">
          <label>New Password</label>
          <input type="password" id="newPassword" placeholder="Enter new password" class="settings-input" />
        </div>
        <div class="form-group">
          <label>Confirm Password</label>
          <input type="password" id="confirmNewPassword" placeholder="Confirm new password" class="settings-input" />
        </div>
        <button class="settings-btn primary" style="width: 100%;" onclick="resetPassword()">Reset Password</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function requestPasswordReset() {
  const email = document.getElementById("forgotEmail").value.trim();

  if (!email) {
    alert("Please enter your email");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to send reset code");
    }

    // Show step 2
    document.getElementById("forgotPasswordStep1").style.display = "none";
    document.getElementById("forgotPasswordStep2").style.display = "block";

    // For development - show the code
    if (data.devCode) {
      alert(`DEV MODE: Your reset code is ${data.devCode}`);
    }

    alert("Reset code sent! Check your email (or console in dev mode).");
  } catch (error) {
    alert(error.message);
  }
}

async function resetPassword() {
  const email = document.getElementById("forgotEmail").value.trim();
  const code = document.getElementById("resetCode").value.trim();
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmNewPassword").value;

  if (!code || !newPassword || !confirmPassword) {
    alert("Please fill in all fields");
    return;
  }

  if (newPassword !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  if (newPassword.length < 6) {
    alert("Password must be at least 6 characters");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to reset password");
    }

    alert("Password reset successfully! You can now sign in.");
    document.getElementById("forgotPasswordModal").remove();
  } catch (error) {
    alert(error.message);
  }
}

// Logout function
function logout() {
  if (confirm("Are you sure you want to log out?")) {
    localStorage.removeItem("synodic_token");
    localStorage.removeItem("synodic_user");
    currentUser = null;
    conversationHistory = [];

    // Reset chat
    chatbox.innerHTML = `
      <div class="welcome-message">
        <div class="welcome-icon">🌙</div>
        <h2>Welcome to Synodic AI</h2>
        <p>Your cosmic companion for intelligent conversations</p>
      </div>
    `;

    showAuth();

    // Reset forms
    const signinFormElement = document.getElementById("signinFormElement");
    const signupFormElement = document.getElementById("signupFormElement");
    if (signinFormElement) signinFormElement.reset();
    if (signupFormElement) signupFormElement.reset();
  }
}

// ========================================
// MAIN CHAT APP INITIALIZATION
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
          <p class="settings-hint">Synodic AI v4.5 - Powered by advanced AI<br>Secure authentication enabled</p>
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

function initializeChatApp() {
  console.log("Synodic AI Chatbot initialized");

  if (userInput) {
    userInput.focus();
  }

  loadSettings();

  if (synthesis) {
    synthesis.onvoiceschanged = () => synthesis.getVoices();
  }

  // Event Listeners
  if (sendBtn) {
    sendBtn.addEventListener("click", sendMessage);
  }

  if (userInput) {
    userInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    userInput.addEventListener("input", (e) => {
      e.target.style.height = "auto";
      e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
    });
  }

  if (voiceBtn) {
    voiceBtn.addEventListener("click", handleVoiceInput);
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", () => {
      sidebar.classList.add("active");
      overlay.classList.add("active");
    });
  }

  if (overlay) {
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("active");
      overlay.classList.remove("active");
    });
  }

  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
    });
  }

  if (newChatBtn) {
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
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("light-mode");
      const isLight = document.body.classList.contains("light-mode");
      localStorage.setItem("synodic_darkmode", !isLight);
    });
  }

  if (attachBtn) {
    attachBtn.addEventListener("click", () => {
      alert("File attachment coming soon! 📎");
    });
  }

  if (settingsBtn) {
    settingsBtn.addEventListener("click", openSettings);
  }
  fixMobileViewport();
}

// Fix mobile viewport and keyboard issues
function fixMobileViewport() {
  if (window.innerWidth <= 900) {
    const chatContainer = document.getElementById("chatContainer");
    const chatbox = document.getElementById("chatbox");
    const inputContainer = document.querySelector(".input-container");

    // Prevent body scroll when input is focused
    userInput.addEventListener("focus", () => {
      document.body.style.position = "fixed";
      document.body.style.width = "100%";

      setTimeout(() => {
        if (chatbox) {
          chatbox.scrollTop = chatbox.scrollHeight;
        }
      }, 300);
    });

    userInput.addEventListener("blur", () => {
      document.body.style.position = "";
      document.body.style.width = "";
    });

    // Handle visual viewport changes (keyboard open/close)
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", () => {
        const viewportHeight = window.visualViewport.height;

        if (chatContainer) {
          chatContainer.style.height = `${viewportHeight}px`;
        }

        // Scroll to bottom when keyboard opens
        if (document.activeElement === userInput && chatbox) {
          setTimeout(() => {
            chatbox.scrollTop = chatbox.scrollHeight;
          }, 100);
        }
      });
    }

    // Prevent zoom on input focus
    const inputs = document.querySelectorAll("input, textarea");
    inputs.forEach((input) => {
      input.addEventListener("focus", () => {
        input.style.fontSize = "16px"; // Prevents zoom on iOS
      });
    });
  }
}

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
  conversationHistory.push({
    role: "user",
    content: message,
    timestamp: Date.now().toString(),
  });

  showThinking();

  try {
    const token = localStorage.getItem("synodic_token");

    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: message,
        history: conversationHistory.slice(-10),
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        displaySystemMessage("⚠️ Session expired. Please log in again.");
        setTimeout(() => logout(), 2000);
        return;
      }
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

function handleVoiceInput() {
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
  messageDiv.setAttribute("data-message-id", Date.now()); // Add unique ID

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

  // Action buttons container
  const actionsDiv = document.createElement("div");
  actionsDiv.className = "message-actions";

  // Copy button (for both user and bot)
  const copyBtn = document.createElement("button");
  copyBtn.className = "action-btn copy-btn";
  copyBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
    <span>Copy</span>
  `;
  copyBtn.onclick = () => copyMessage(text, copyBtn);
  actionsDiv.appendChild(copyBtn);

  // Edit button (only for user messages)
  if (sender === "user") {
    const editBtn = document.createElement("button");
    editBtn.className = "action-btn edit-btn";
    editBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
      <span>Edit</span>
    `;
    editBtn.onclick = () => editMessage(messageDiv, messageContent, text);
    actionsDiv.appendChild(editBtn);

    // Delete button (only for user messages)
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "action-btn delete-btn";
    deleteBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
      <span>Delete</span>
    `;
    deleteBtn.onclick = () => deleteMessage(messageDiv);
    actionsDiv.appendChild(deleteBtn);
  }

  // Speaker button (only for bot messages)
  if (sender === "bot" && voiceEnabled) {
    const speakerBtn = document.createElement("button");
    speakerBtn.className = "action-btn speaker-btn";
    speakerBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      </svg>
      <span>Speak</span>
    `;
    speakerBtn.onclick = () => speakText(text);
    actionsDiv.appendChild(speakerBtn);
  }

  bubbleDiv.appendChild(messageContent);
  bubbleDiv.appendChild(timestamp);
  bubbleDiv.appendChild(actionsDiv);

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(bubbleDiv);

  chatbox.appendChild(messageDiv);

  setTimeout(() => {
    messageDiv.scrollIntoView({ behavior: "smooth", block: "end" });
  }, 100);
}

// Copy message to clipboard
function copyMessage(text, button) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      const originalHTML = button.innerHTML;
      button.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>Copied!</span>
    `;
      button.classList.add("success");

      setTimeout(() => {
        button.innerHTML = originalHTML;
        button.classList.remove("success");
      }, 2000);
    })
    .catch((err) => {
      console.error("Failed to copy:", err);
      alert("Failed to copy message");
    });
}

// Edit message
function editMessage(messageDiv, messageContent, originalText) {
  // Check if already editing
  if (messageDiv.classList.contains("editing")) {
    return;
  }

  messageDiv.classList.add("editing");

  // Create textarea for editing
  const textarea = document.createElement("textarea");
  textarea.className = "edit-textarea";
  textarea.value = originalText;
  textarea.rows = 3;

  // Replace content with textarea
  const originalContent = messageContent.innerHTML;
  messageContent.innerHTML = "";
  messageContent.appendChild(textarea);

  // Create edit controls
  const editControls = document.createElement("div");
  editControls.className = "edit-controls";
  editControls.innerHTML = `
    <button class="edit-control-btn cancel-btn">Cancel</button>
    <button class="edit-control-btn save-btn">Save & Resend</button>
  `;

  messageContent.appendChild(editControls);

  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);

  // Auto-resize textarea
  textarea.style.height = "auto";
  textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
  textarea.addEventListener("input", () => {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
  });

  // Cancel button
  editControls.querySelector(".cancel-btn").onclick = () => {
    messageContent.innerHTML = originalContent;
    messageDiv.classList.remove("editing");
  };

  // Save button
  editControls.querySelector(".save-btn").onclick = () => {
    const newText = textarea.value.trim();

    if (!newText) {
      alert("Message cannot be empty");
      return;
    }

    if (newText === originalText) {
      // No changes made
      messageContent.innerHTML = originalContent;
      messageDiv.classList.remove("editing");
      return;
    }

    // Delete all messages after this one
    let nextMessage = messageDiv.nextElementSibling;
    while (nextMessage) {
      const toRemove = nextMessage;
      nextMessage = nextMessage.nextElementSibling;
      toRemove.remove();
    }

    // Update conversation history
    const messageId = messageDiv.getAttribute("data-message-id");
    const messageIndex = conversationHistory.findIndex(
      (msg) => msg.role === "user" && msg.timestamp === messageId
    );

    if (messageIndex !== -1) {
      // Remove this message and all after it from history
      conversationHistory = conversationHistory.slice(0, messageIndex);
    }

    // Update the message content
    messageContent.textContent = newText;
    messageDiv.classList.remove("editing");

    // Resend the edited message
    conversationHistory.push({
      role: "user",
      content: newText,
      timestamp: messageId,
    });

    showThinking();

    // Send to AI
    sendEditedMessage(newText);
  };
}

// Send edited message to AI
async function sendEditedMessage(message) {
  try {
    const token = localStorage.getItem("synodic_token");

    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: message,
        history: conversationHistory.slice(-10),
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        displaySystemMessage("⚠️ Session expired. Please log in again.");
        setTimeout(() => logout(), 2000);
        return;
      }
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

// Delete message
function deleteMessage(messageDiv) {
  if (
    !confirm("Delete this message? All messages after it will also be deleted.")
  ) {
    return;
  }

  // Delete all messages after this one
  let nextMessage = messageDiv.nextElementSibling;
  while (nextMessage) {
    const toRemove = nextMessage;
    nextMessage = nextMessage.nextElementSibling;
    toRemove.remove();
  }

  // Remove the message itself
  messageDiv.style.animation = "fadeOut 0.3s ease-out";
  setTimeout(() => {
    messageDiv.remove();

    // Update conversation history
    const messageId = messageDiv.getAttribute("data-message-id");
    const messageIndex = conversationHistory.findIndex(
      (msg) => msg.timestamp === messageId
    );

    if (messageIndex !== -1) {
      conversationHistory = conversationHistory.slice(0, messageIndex);
    }

    // Show welcome message if no messages left
    if (chatbox.children.length === 0) {
      chatbox.innerHTML = `
        <div class="welcome-message">
          <div class="welcome-icon">🌙</div>
          <h2>Welcome to Synodic AI</h2>
          <p>Your cosmic companion for intelligent conversations</p>
        </div>
      `;
    }
  }, 300);
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

console.log("✨ Synodic AI is ready to chat!");
