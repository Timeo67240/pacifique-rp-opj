require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({ origin: [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:4173'], credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/civilians', require('./routes/civilians'));
app.use('/api/fines', require('./routes/fines'));
app.use('/api/custody', require('./routes/custody'));
app.use('/api/pv', require('./routes/pv'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'Pacifique RP - OPJ API' }));

app.listen(PORT, () => console.log(`[Server] Pacifique RP OPJ API running on port ${PORT}`));
