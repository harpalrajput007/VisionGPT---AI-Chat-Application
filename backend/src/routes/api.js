const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getChats, getChat, handleMessage, deleteChat, createNewChat } = require('../controllers/chatController');

const router = express.Router();

// Chat routes
router.get('/chats', protect, getChats);
router.post('/chats/new', protect, createNewChat);
router.get('/chats/:id', protect, getChat);
router.post('/chats/:id/messages', protect, handleMessage);
router.delete('/chats/:id', protect, deleteChat);

module.exports = router;