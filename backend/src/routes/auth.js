const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const path = require('path');
// Register route
router.post('/register', [
  body('username').isLength({ min: 3 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('full_name').notEmpty().trim()
], authController.register);

// Login route
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], authController.login);

// Get current user profile
router.get('/profile', authenticateToken, authController.getProfile);

// Get user profile by ID
router.get('/profile/:userId', authenticateToken, authController.getUserProfile);

// Follow user
router.post('/follow/:userId', authenticateToken, authController.followUser);

// Unfollow user
router.delete('/follow/:userId', authenticateToken, authController.unfollowUser);

// Get all users
router.get('/users', async (req, res) => {
  const pool = require('../config/database');
  try {
    const result = await pool.query(
      `SELECT id, username, full_name, bio, avatar_url, created_at,
        (SELECT COUNT(*) FROM articles WHERE author_id = users.id) as articles_count
       FROM users 
       ORDER BY created_at DESC 
       LIMIT 20`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
const { upload, optimizeImage } = require('../middleware/upload');

// Add profile update route with avatar upload
router.put('/profile', 
  authenticateToken, 
  upload.single('avatar'), 
  optimizeImage,
  authController.updateProfile
);

// Serve static files from uploads directory
router.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

module.exports = router;