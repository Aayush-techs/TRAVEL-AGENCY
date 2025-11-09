const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/travelagency';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'travel_agency_secret_key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: MONGODB_URI
    }),
    cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
}));

// MongoDB connection
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);

// Booking Schema
const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    packageName: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    travelDate: {
        type: Date,
        required: true
    },
    numberOfTravelers: {
        type: Number,
        required: true
    },
    specialRequests: {
        type: String
    },
    status: {
        type: String,
        default: 'confirmed'
    },
    bookingDate: {
        type: Date,
        default: Date.now
    }
});

const Booking = mongoose.model('Booking', bookingSchema);

// Contact Message Schema
const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String
    },
    message: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const ContactMessage = mongoose.model('ContactMessage', contactSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'travel_agency_jwt_secret';

// Routes

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/auth.html', (req, res) => {
    res.sendFile(__dirname + '/auth.html');
});

// User Registration
app.post('/api/register', async(req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            phone
        });

        await user.save();

        // Create JWT token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// User Login
app.post('/api/login', async(req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create JWT token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Get User Profile
app.get('/api/profile', async(req, res) => {
    try {
        const token = req.headers.authorization ? .split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create Booking
app.post('/api/bookings', async(req, res) => {
    try {
        const token = req.headers.authorization ? .split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const { packageName, price, travelDate, numberOfTravelers, specialRequests } = req.body;

        const booking = new Booking({
            userId: decoded.userId,
            packageName,
            price,
            travelDate,
            numberOfTravelers,
            specialRequests
        });

        await booking.save();

        res.status(201).json({
            message: 'Booking created successfully',
            booking
        });
    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({ message: 'Server error during booking' });
    }
});

// Get User Bookings
app.get('/api/bookings', async(req, res) => {
    try {
        const token = req.headers.authorization ? .split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const bookings = await Booking.find({ userId: decoded.userId }).sort({ bookingDate: -1 });

        res.json({ bookings });
    } catch (error) {
        console.error('Bookings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Contact Form Submission
app.post('/api/contact', async(req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        const contactMessage = new ContactMessage({
            name,
            email,
            phone,
            message
        });

        await contactMessage.save();

        res.status(201).json({
            message: 'Message sent successfully. We will contact you soon!'
        });
    } catch (error) {
        console.error('Contact error:', error);
        res.status(500).json({ message: 'Server error during message submission' });
    }
});

// Newsletter Subscription
app.post('/api/subscribe', async(req, res) => {
    try {
        const { email } = req.body;

        // In a real application, you would save this to a newsletter collection
        // For now, we'll just log it and send a success message
        console.log(`Newsletter subscription: ${email}`);

        res.json({
            message: `Thank you for subscribing with ${email}! You'll receive our next newsletter soon.`
        });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ message: 'Server error during subscription' });
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});