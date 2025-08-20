const Chat = require('../models/chatModel');
const { LLMService } = require('../services/llmService');

const llmService = new LLMService();

// Get all chats for a user
const getChats = async (req, res) => {
    try {
        const chats = await Chat.find({ userId: req.user._id })
            .sort({ createdAt: -1 });
        res.json(chats);
    } catch (error) {
        console.error('Get chats error:', error);
        res.status(500).json({ error: 'Failed to fetch chats' });
    }
};

// Get a specific chat
const getChat = async (req, res) => {
    try {
        const chat = await Chat.findOne({
            _id: req.params.id,
            userId: req.user._id
        });
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        res.json(chat);
    } catch (error) {
        console.error('Get chat error:', error);
        res.status(500).json({ error: 'Failed to fetch chat' });
    }
};

// Create a new chat
const createNewChat = async (req, res) => {
    try {
        const chat = new Chat({
            userId: req.user._id,
            title: 'New Chat',
            messages: []
        });
        
        await chat.save();
        console.log('New chat created:', chat._id);
        res.json(chat);
    } catch (error) {
        console.error('Create chat error:', error);
        res.status(500).json({ error: 'Failed to create chat' });
    }
};

const generateChatTitle = async (message, llmService) => {
    try {
        // Create a specific prompt for title generation
        const titlePrompt = `Create a very brief, specific title (3-5 words) for a chat that starts with this message. Make it descriptive and unique: "${message}". Just return the title without quotes or explanations.`;
        
        const response = await llmService.generateResponse(titlePrompt);
        
        // Clean up the response
        let title = response
            .replace(/["']/g, '') // Remove quotes
            .replace(/\n/g, ' ') // Remove newlines
            .trim();

        // Limit title length if it's too long
        if (title.length > 40) {
            title = title.substring(0, 37) + '...';
        }

        return title;
    } catch (error) {
        console.error('Title generation error:', error);
        // Fallback to message-based title
        return message.length > 30 
            ? message.substring(0, 27) + '...'
            : message;
    }
};

// Handle messages in a chat
const handleMessage = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        let chat;
        if (req.params.id === 'new') {
            chat = new Chat({
                userId: req.user._id,
                title: 'New Chat',
                messages: []
            });
        } else {
            chat = await Chat.findOne({
                _id: req.params.id,
                userId: req.user._id
            });
        }

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        // Add user message
        chat.messages.push({ role: 'user', content: message });

        // Generate title for new chats after first message
        if (chat.messages.length === 1 || chat.title === 'New Chat') {
            console.log('Generating title for chat...');
            chat.title = await generateChatTitle(message, llmService);
            console.log('Generated title:', chat.title);
        }

        // Get LLM response
        console.log('Getting LLM response for message...');
        const llmResponse = await llmService.generateResponse(message);
        chat.messages.push({ role: 'assistant', content: llmResponse });

        await chat.save();
        console.log('Chat saved with title:', chat.title);
        res.json(chat);
    } catch (error) {
        console.error('Message handling error:', error);
        res.status(500).json({ 
            error: 'Failed to process message', 
            details: error.message 
        });
    }
};

// Delete a chat
const deleteChat = async (req, res) => {
    try {
        const chat = await Chat.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        res.json({ message: 'Chat deleted successfully' });
    } catch (error) {
        console.error('Delete chat error:', error);
        res.status(500).json({ error: 'Failed to delete chat' });
    }
};

module.exports = {
    getChats,
    getChat,
    createNewChat,
    handleMessage,
    deleteChat
};