// backend/Routes/routes_insight.js
const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

// Initialize Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post('/', async (req, res) => {
  const { context } = req.body;
  console.log('▶️  Received context:', context);

  if (!context) {
    return res.status(400).json({ error: 'Missing context in request body' });
  }

  try {
    // Call Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',       // or gemini-2.5-pro if available
      contents: context,
      // optional config:
      // config: { temperature: 0.7, maxOutputTokens: 150 }
    });

    console.log('🔹 Gemini response object:', response);
    console.log('🔹 Generated text:', response.text);

    return res.json({ insight: response.text });
  } catch (err) {
    // Log full error for debugging
    console.error('❌ Gemini API error:', err);
    // If the SDK gives structured errors, you can inspect err.meta or err.code
    return res.status(500).json({ error: 'Failed to generate insight', details: err.message });
  }
});

module.exports = router;
