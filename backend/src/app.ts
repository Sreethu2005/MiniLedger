import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';

import authRoutes from './routes/auth.routes';
import loanRoutes from './routes/loan.routes';

// Create Express application instance
const app: Application = express();

// Middleware: Enable Cross-Origin Resource Sharing for mobile client
app.use(cors());

// Middleware: Parse incoming JSON request bodies
app.use(express.json());

// Middleware: Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Middleware: Serve static files for uploaded receipts
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check Route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'MiniLedger API is running',
    timestamp: new Date().toISOString(),
  });
});

// Authentication Routes
app.use('/auth', authRoutes);

// Loans Routes (Protected by JWT)
app.use('/loans', loanRoutes);

// Global 404 Handler for undefined routes
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Application Error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: message });
});

export default app;
