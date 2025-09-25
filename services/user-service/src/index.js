const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'user-service' });
});

app.get('/api/users', (req, res) => {
  res.json({ message: 'User service endpoint - get all users' });
});

app.post('/api/auth/login', (req, res) => {
  res.json({ message: 'User authentication endpoint' });
});

app.post('/api/auth/register', (req, res) => {
  res.json({ message: 'User registration endpoint' });
});

app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
});