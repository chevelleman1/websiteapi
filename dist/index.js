"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_validator_1 = require("express-validator");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || 'your-secure-api-key-here';
// Security middleware
app.use((0, helmet_1.default)()); // Sets security HTTP headers
app.use((0, cors_1.default)()); // Enable CORS for all origins
app.use((0, morgan_1.default)('tiny')); // HTTP request logging
app.use(express_1.default.json({ limit: '10kb' })); // Limit JSON body size to 10KB
// Rate limiting - 100 requests per 15 minutes
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);
// API Key authentication middleware
const authenticateApiKey = (req, res, next) => {
    const providedKey = req.headers['x-api-key'];
    if (!providedKey) {
        return res.status(401).json({ error: 'API key is required' });
    }
    if (providedKey !== API_KEY) {
        return res.status(403).json({ error: 'Invalid API key' });
    }
    next();
};
// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the API' });
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API routes
app.get('/api', (req, res) => {
    res.json({
        message: 'API is running',
        endpoints: {
            health: '/health',
            api: '/api',
            contact: 'POST /api/contact (requires X-API-Key header)'
        }
    });
});
// Contact form endpoint with API key authentication and input validation
app.post('/api/contact', authenticateApiKey, [
    // Input validation
    (0, express_validator_1.body)('name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Name must be between 1 and 100 characters'),
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('message')
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage('Message must be between 1 and 1000 characters')
], (req, res) => {
    // Check validation errors
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }
    const { name, email, message } = req.body;
    // In a real application, you would save to a database or send an email
    console.log('Contact form submission:', { name, email, message });
    res.status(201).json({
        message: 'Thank you for your message! We will get back to you soon.',
        data: { name, email, message }
    });
});
// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map