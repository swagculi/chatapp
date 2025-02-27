import express from 'express';
import { 
    getMessages, 
    sendMessage, 
    getUsers, 
    markMessagesAsSeen,
    getUnreadCounts
} from '../controllers/messageController.js';
import { protectRoute } from '../middleware/protectRoute.js';

const router = express.Router();

// Apply protectRoute middleware to all routes
router.use(protectRoute);

// Get all users with chat history - place this BEFORE any /:userId routes
router.get('/users', getUsers);

// Get unread message counts - place this BEFORE the /:userId route
router.get('/unread-counts', getUnreadCounts);

// Send message to a user
router.post('/send/:userId', sendMessage);

// Mark messages as seen
router.put('/seen/:userId', markMessagesAsSeen);

// Get messages between two users - place this LAST
router.get('/:userId', getMessages);

export default router; 