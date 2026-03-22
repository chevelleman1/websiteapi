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
const pg_1 = require("pg");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const node_env = process.env.NODE_ENV || 'production';
const API_KEY = process.env.API_KEY || 'your-secure-api-key-here';
// Database configuration
const pool = new pg_1.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'main_db',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'password',
});
// Initialize database connection
const initDatabase = async () => {
    try {
        // Test the connection - table is expected to exist
        await pool.query('SELECT 1');
        console.log('Database connection established');
    }
    catch (error) {
        console.error('Error connecting to database:', error);
    }
};
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
    const providedKey = req.headers['x-internal-key'];
    const referer = req.headers.referer || req.headers.origin;
    const ALLOWED_DOMAINS = ["https://velcommsoftware.ddns.net/", "http://localhost:8081/"];
    //if dev, don't check for secret header, otherwise, check for the header
    if (node_env === 'dev') {
        return next();
    }
    else {
        if (referer === null || referer === undefined) {
            return res.status(401).json({ error: `Your domain could not be determined; you are not authorized to use this API.` });
        }
        if (!ALLOWED_DOMAINS.includes(referer)) {
            return res.status(401).json({ error: `Your domain is not authorized to use this API.` });
        }
        if (!providedKey) {
            return res.status(401).json({ error: `API key is required to access this resource.` });
        }
        if (providedKey !== API_KEY) {
            return res.status(403).json({ error: `API key is invalid.` });
        }
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
// Simple validation function
const validateContactForm = (data) => {
    const errors = [];
    if (!data.name || data.name.trim().length === 0 || data.name.trim().length > 100) {
        errors.push('Name must be between 1 and 100 characters');
    }
    if (!data.email || !data.email.includes('@')) {
        errors.push('Please provide a valid email');
    }
    if (!data.message || data.message.trim().length === 0 || data.message.trim().length > 1000) {
        errors.push('Message must be between 1 and 1000 characters');
    }
    return errors;
};
// Contact form endpoint with API key authentication
app.post('/api/contact', authenticateApiKey, (req, res) => {
    // Manual validation
    const errors = validateContactForm(req.body);
    if (errors.length > 0) {
        res.status(400).json({ errors });
        return;
    }
    const { name, email, message } = req.body;
    // Save to PostgreSQL database using callback style
    pool.query('INSERT INTO customer_emails (name, email, message) VALUES ($1, $2, $3) RETURNING id', [name.trim(), email.trim(), message.trim()], (err, result) => {
        if (err) {
            console.error('Error saving contact to database:', err);
            return res.status(500).json({ error: 'Failed to save contact form. Please try again later.' });
        }
        console.log('Contact form saved to database:', { id: result.rows[0].id, name, email });
        return res.status(201).json({
            message: 'Thank you for your message! We will get back to you soon.',
            data: { name, email, message }
        });
    });
});
// Start server
app.listen(PORT, async () => {
    await initDatabase();
    console.log(`Server is running on http://localhost:${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map