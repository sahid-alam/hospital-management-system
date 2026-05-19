require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const patientsRouter     = require('./routes/patients');
const doctorsRouter      = require('./routes/doctors');
const appointmentsRouter = require('./routes/appointments');
const wardsRouter        = require('./routes/wards');
const billingRouter      = require('./routes/billing');
const dashboardRouter    = require('./routes/dashboard');
const schemaRouter       = require('./routes/schema');
const errorHandler       = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/patients',     patientsRouter);
app.use('/api/doctors',      doctorsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/wards',        wardsRouter);
app.use('/api/billing',      billingRouter);
app.use('/api/dashboard',    dashboardRouter);
app.use('/api/schema',       schemaRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

app.use(errorHandler);

app.listen(PORT, () => console.log(`Hospital API running on port ${PORT}`));
