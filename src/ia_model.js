// Import the necessary classes
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');
require('dotenv').config();


const API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);
const fileManager = new GoogleAIFileManager(API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

module.exports = {model, fileManager};
