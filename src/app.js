import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import experimentsRouter from './routes/experiments.js';
import trackRouter from './routes/track.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Custom middleware to render with layout
app.use((req, res, next) => {
  const originalRender = res.render;
  res.render = function (view, options = {}) {
    const self = this;
    // Render the view to get the body
    app.render(view, options, (err, html) => {
      if (err) return next(err);
      // Render with layout
      const layoutOptions = {
        ...options,
        body: html,
        title: options.title || 'Signal Dash',
      };
      originalRender.call(self, 'layout', layoutOptions);
    });
  };
  next();
});

// Routes
app.use('/experiments', experimentsRouter);
app.use('/api/track', trackRouter);

// Root route redirects to experiments list
app.get('/', (req, res) => {
  res.redirect('/experiments');
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).send('Internal Server Error');
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 Signal Dash running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${config.databaseUrl.split('@')[1] || 'configured'}`);
  console.log(`🤖 LLM Provider: ${config.llmProvider}`);
});

export default app;
