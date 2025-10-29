// ========================================
// SYNODIC AI - BACKEND SERVER
// ========================================
// This server handles AI API calls so users don't need their own keys

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
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
// AI API CONFIGURATION
// Store your API key in .env file
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
  // All current Gemini models use v1beta
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
// MAIN API ENDPOINT
// ========================================

app.post("/api/chat", async (req, res) => {
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

    res.json({ response, provider: AI_CONFIG.provider });
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

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    provider: AI_CONFIG.provider,
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌙 Synodic AI Server running on port ${PORT}`);
  console.log(`📡 AI Provider: ${AI_CONFIG.provider}`);
  console.log(`🔑 API Key configured: ${AI_CONFIG.apiKey ? "Yes" : "No"}`);
});
