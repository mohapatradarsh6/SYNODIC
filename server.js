// ========================================
// SYNODIC AI - BACKEND SERVER WITH AUTH
// ========================================

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(".")); // Serve frontend files

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: { error: "Too many requests, please try again later." },
});

app.use("/api/", limiter);

// ========================================
// JWT SECRET KEY (Store in .env file)
// ========================================
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

// ========================================
// PERSISTENT USER DATABASE (Using JSON file)
// ========================================
const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "users.json");

// Initialize database file if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// Load users from file
function loadUsers() {
  try {
    const data = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading users:", error);
    return [];
  }
}

// Save users to file
function saveUsers(users) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Error saving users:", error);
  }
}

let users = loadUsers();

// ========================================
// AUTHENTICATION MIDDLEWARE
// ========================================
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
}

// ========================================
// AUTHENTICATION ENDPOINTS
// ========================================

// Sign Up
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    // Check if user already exists
    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    };

    users.push(user);
    saveUsers(users);

    // Create JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "30d",
    });

    // Return user data (without password) and token
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Sign up error:", error);
    res.status(500).json({ error: "Failed to create account" });
  }
});

//
app.post("/api/auth/signin", async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // ============================================
    // DEV MODE: Allow any email/password for development
    // Uncomment the code below to skip authentication during testing
    // ============================================
    /*
    // DEV MODE: Create a temporary user for any login
    const user = {
      id: Date.now().toString(),
      name: email.split("@")[0],
      email: email,
      createdAt: new Date(),
    };
    
    // Create JWT token
    const expiresIn = rememberMe ? "30d" : "7d";
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn,
    });

    // Return user data and token
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
    */

    // ============================================
    // PRODUCTION MODE: Verify user credentials
    // ============================================

    // Find user
    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Create JWT token
    const expiresIn = rememberMe ? "30d" : "7d";
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn,
    });

    // Return user data (without password) and token
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Sign in error:", error);
    res.status(500).json({ error: "Failed to sign in" });
  }
});

// Verify Token
app.get("/api/auth/verify", authenticateToken, (req, res) => {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
});

// Password Reset Request
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const users = loadUsers();
    const user = users.find((u) => u.email === email);

    if (!user) {
      // Don't reveal if email exists
      return res.json({
        message: "If the email exists, a reset code has been sent",
      });
    }

    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes

    user.resetCode = resetCode;
    user.resetExpiry = resetExpiry;
    saveUsers(users);

    // In production, send this via email
    console.log(`Password reset code for ${email}: ${resetCode}`);

    res.json({
      message: "If the email exists, a reset code has been sent",
      // Remove this in production - only for testing
      devCode: resetCode,
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
});

// Verify Reset Code and Change Password
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const users = loadUsers();
    const userIndex = users.findIndex((u) => u.email === email);

    if (userIndex === -1) {
      return res.status(400).json({ error: "Invalid reset code" });
    }

    const user = users[userIndex];

    if (!user.resetCode || !user.resetExpiry) {
      return res.status(400).json({ error: "No reset code requested" });
    }

    if (Date.now() > user.resetExpiry) {
      return res.status(400).json({ error: "Reset code expired" });
    }

    if (user.resetCode !== code) {
      return res.status(400).json({ error: "Invalid reset code" });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    users[userIndex].password = hashedPassword;
    users[userIndex].resetCode = null;
    users[userIndex].resetExpiry = null;

    saveUsers(users);

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// ========================================
// AI API CONFIGURATION
// ========================================

const AI_CONFIG = {
  provider: process.env.AI_PROVIDER || "openai", // openai, claude, gemini, or huggingface
  apiKey: process.env.AI_API_KEY,
  models: {
    openai: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
    claude: process.env.CLAUDE_MODEL || "claude-3-haiku-20240307",
    gemini: process.env.GEMINI_MODEL || "gemini-pro",
    huggingface: process.env.HF_MODEL || "mistralai/Mixtral-8x7B-Instruct-v0.1",
  },
};

// ========================================
// HUGGING FACE (FREE OPTION)
// ========================================

async function callHuggingFace(message, history) {
  const HF_API_URL = `https://api-inference.huggingface.co/models/${AI_CONFIG.models.huggingface}`;

  // Format conversation for the model
  let prompt =
    "You are Synodic AI, a helpful and friendly AI assistant. Be conversational, engaging, and concise.\n\n";

  // Add conversation history
  for (const msg of history) {
    if (msg.role === "user") {
      prompt += `User: ${msg.content}\n`;
    } else {
      prompt += `Assistant: ${msg.content}\n`;
    }
  }

  prompt += `User: ${message}\nAssistant:`;

  const response = await fetch(HF_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AI_CONFIG.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7,
        top_p: 0.95,
        return_full_text: false,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Hugging Face API error");
  }

  const data = await response.json();
  return data[0].generated_text.trim();
}

// ========================================
// OPENAI API
// ========================================

async function callOpenAI(message, history) {
  const messages = [
    {
      role: "system",
      content:
        "You are Synodic AI, a helpful and friendly AI assistant. Be conversational, engaging, and concise.",
    },
    ...history,
    { role: "user", content: message },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: AI_CONFIG.models.openai,
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "OpenAI API error");
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ========================================
// ANTHROPIC CLAUDE API
// ========================================

async function callClaude(message, history) {
  const messages = history.concat([{ role: "user", content: message }]);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": AI_CONFIG.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: AI_CONFIG.models.claude,
      max_tokens: 1000,
      system:
        "You are Synodic AI, a helpful and friendly AI assistant. Be conversational, engaging, and concise.",
      messages: messages,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Claude API error");
  }

  const data = await response.json();
  return data.content[0].text;
}

// ========================================
// GOOGLE GEMINI API
// ========================================

async function callGemini(message, history) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIG.models.gemini}:generateContent?key=${AI_CONFIG.apiKey}`;

  const contents = history.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  contents.push({
    role: "user",
    parts: [{ text: message }],
  });

  const requestBody = {
    contents: contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
      topP: 0.95,
    },
    systemInstruction: {
      parts: [
        {
          text: "You are Synodic AI, a helpful and friendly AI assistant. Be conversational, engaging, and concise. Keep responses brief and to the point.",
        },
      ],
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Gemini API error");
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// ========================================
// MAIN CHAT ENDPOINT (PROTECTED)
// ========================================

app.post("/api/chat", authenticateToken, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    // Validation
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Invalid message" });
    }

    if (message.length > 5000) {
      return res
        .status(400)
        .json({ error: "Message too long (max 5000 characters)" });
    }

    if (!AI_CONFIG.apiKey) {
      return res.status(500).json({
        error: "Server configuration error. Please contact administrator.",
      });
    }

    // Keep only last 10 messages for context
    const recentHistory = history.slice(-10);

    let response;

    // Route to appropriate AI provider
    switch (AI_CONFIG.provider) {
      case "openai":
        response = await callOpenAI(message, recentHistory);
        break;
      case "claude":
        response = await callClaude(message, recentHistory);
        break;
      case "gemini":
        response = await callGemini(message, recentHistory);
        break;
      case "huggingface":
        response = await callHuggingFace(message, recentHistory);
        break;
      default:
        throw new Error("Invalid AI provider configured");
    }

    res.json({
      response,
      provider: AI_CONFIG.provider,
      userId: req.user.id,
    });
  } catch (error) {
    console.error("AI API Error:", error);

    // Send user-friendly error message
    let errorMessage = "Sorry, I encountered an error. Please try again.";

    if (
      error.message.includes("rate limit") ||
      error.message.includes("quota")
    ) {
      errorMessage = "Service is currently busy. Please try again in a moment.";
    } else if (error.message.includes("timeout")) {
      errorMessage = "Request timed out. Please try again.";
    }

    res.status(500).json({ error: errorMessage });
  }
});

// ========================================
// HEALTH CHECK ENDPOINTS
// ========================================

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    provider: AI_CONFIG.provider,
    timestamp: new Date().toISOString(),
    usersCount: users.length,
  });
});

// Public health check (no auth required)
app.get("/api/ping", (req, res) => {
  res.json({ status: "ok" });
});

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {
  console.log(`🌙 Synodic AI Server running on port ${PORT}`);
  console.log(`📡 AI Provider: ${AI_CONFIG.provider}`);
  console.log(`🔑 API Key configured: ${AI_CONFIG.apiKey ? "Yes" : "No"}`);
  console.log(`🔓 Authentication: DEV MODE (accepts any credentials)`);
});
