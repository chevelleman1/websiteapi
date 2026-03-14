import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';

// Contact form interface
interface ContactForm {
  name: string;
  email: string;
  message: string;
}

const app = express();
const PORT = process.env.PORT || 3000;
const node_env = process.env.NODE_ENV || 'production';
const API_KEY = process.env.API_KEY || 'your-secure-api-key-here';

// Security middleware
app.use(helmet()); // Sets security HTTP headers
app.use(cors()); // Enable CORS for all origins
app.use(morgan('tiny')); // HTTP request logging
app.use(express.json({ limit: '10kb' })); // Limit JSON body size to 10KB

// Rate limiting - 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// API Key authentication middleware
const authenticateApiKey = (req: Request, res: Response, next: NextFunction) => {
  console.log(req.headers);
  const providedKey = req.headers['x-internal-key'] as string;
  const hiddenWeapon = req.headers['x-gecko-f'] as string;
  const referer = req.headers.referer || req.headers.origin;
  const ALLOWED_DOMAINS = ["https://bobvel.sytes.net/", "http://localhost:8081/"]


  //if dev, don't check for secret header, otherwise, check for the header
  if (node_env === 'dev') {
    next();
  }
  else {
    if (hiddenWeapon === null || hiddenWeapon === undefined) {
      return res.status(401).json({ error: `Nice try.  You don't know the secret ingredient.` });
    }
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
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the API' });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api', (req: Request, res: Response) => {
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
app.post(
  '/api/contact',
  authenticateApiKey,
  [
    // Input validation
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be between 1 and 100 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('message')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message must be between 1 and 1000 characters')
  ],
  (req: Request, res: Response) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    const { name, email, message } = req.body as ContactForm;

    // In a real application, you would save to a database or send an email
    console.log('Contact form submission:', { name, email, message });

    res.status(201).json({
      message: 'Thank you for your message! We will get back to you soon.',
      data: { name, email, message }
    });
  }
);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
