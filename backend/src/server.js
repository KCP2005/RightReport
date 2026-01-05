import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/database.js';

// Import routes
import adminRoutes from './routes/admin.js';
import schoolRoutes from './routes/schools.js';
import formRoutes from './routes/forms.js';
import responseRoutes from './routes/responses.js';
import editRequestRoutes from './routes/editRequests.js';
import reportRoutes from './routes/reports.js';
import analyticsRoutes from './routes/analytics.js';
import fileRoutes from './routes/files.js';

// Initialize Express app
const app = express();

// Trust proxy (Render requirement)
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://YOUR_PROJECT_NAME.vercel.app"
    ],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api', schoolRoutes);
app.use('/api', formRoutes);
app.use('/api', responseRoutes);
app.use('/api', editRequestRoutes);
app.use('/api', reportRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/admin', analyticsRoutes);

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;


// import 'dotenv/config';
// import express from 'express';
// import cors from 'cors';
// import connectDB from './config/database.js';

// // Import routes
// import adminRoutes from './routes/admin.js';
// import schoolRoutes from './routes/schools.js';
// import formRoutes from './routes/forms.js';
// import responseRoutes from './routes/responses.js';
// import editRequestRoutes from './routes/editRequests.js';
// import reportRoutes from './routes/reports.js';
// import analyticsRoutes from './routes/analytics.js';
// import fileRoutes from './routes/files.js';

// // Initialize Express app
// const app = express();

// // Connect to MongoDB
// connectDB();

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Request logging middleware
// app.use((req, res, next) => {
//     console.log(`${req.method} ${req.path}`);
//     next();
// });

// // Routes
// app.use('/api/admin', adminRoutes);
// app.use('/api', schoolRoutes);
// app.use('/api', formRoutes);
// app.use('/api', responseRoutes);
// app.use('/api', editRequestRoutes);
// app.use('/api', reportRoutes);
// app.use('/api/files', fileRoutes);
// app.use('/api/admin', analyticsRoutes);

// // Health check route
// app.get('/health', (req, res) => {
//     res.json({ status: 'OK', message: 'Server is running' });
// });

// // 404 handler
// app.use((req, res) => {
//     res.status(404).json({ message: 'Route not found' });
// });

// // Error handler
// app.use((err, req, res, next) => {
//     console.error('Error:', err);
//     res.status(500).json({ message: 'Internal server error' });
// });

// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
//     console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
// });

// export default app;
