const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'interview-service' });
});

app.get('/api/interviews', (req, res) => {
  res.json({ message: 'Interview service endpoint - get interviews' });
});

app.post('/api/interviews', (req, res) => {
  res.json({ message: 'Create new interview session' });
});

app.get('/api/sessions/:id', (req, res) => {
  res.json({ message: `Interview session ${req.params.id}` });
});

app.listen(PORT, () => {
  console.log(`Interview service running on port ${PORT}`);
});