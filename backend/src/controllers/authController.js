const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        console.log('Registration attempt:', { username, email }); // Debug log

        if (!username || !email || !password) {
            console.log('Missing fields:', { username: !!username, email: !!email, password: !!password });
            return res.status(400).json({ message: 'Please fill all fields' });
        }

        const userExists = await User.findOne({ 
            $or: [
                { email: email },
                { username: username }
            ]
        });
        
        if (userExists) {
            console.log('User exists:', { email: userExists.email, username: userExists.username });
            return res.status(400).json({ 
                message: userExists.email === email ? 
                    'Email already registered' : 
                    'Username already taken'
            });
        }

        const user = await User.create({
            username,
            email,
            password
        });

        if (user) {
            console.log('User created successfully:', user._id);
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id)
            });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            message: 'Registration failed', 
            error: error.message 
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { registerUser, loginUser };