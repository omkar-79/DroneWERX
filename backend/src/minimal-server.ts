import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 4000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'DroneWERX Backend is running!'
  });
});

// Test API endpoint
app.get('/api/v1/test', (req, res) => {
  res.json({
    message: 'DroneWERX API is working!',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 DroneWERX Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Test API: http://localhost:${PORT}/api/v1/test`);
});

export default app; 