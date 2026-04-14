const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const articleController = require('../controllers/articleController');

// Search route (must be before /:id routes)
router.get('/search', articleController.search);

// Public routes
router.get('/', articleController.getAllArticles);
router.get('/:id', articleController.getArticleById);
router.get('/:id/comments', articleController.getComments);

// Protected routes
router.post('/', authenticateToken, articleController.createArticle);
router.put('/:id', authenticateToken, articleController.updateArticle);
router.delete('/:id', authenticateToken, articleController.deleteArticle);
router.post('/:id/like', authenticateToken, articleController.toggleLike);
router.post('/:id/bookmark', authenticateToken, articleController.toggleBookmark);
router.post('/:id/comments', authenticateToken, articleController.createComment);
const { upload, optimizeImage } = require('../middleware/upload');

// Add cover image upload route
router.post('/upload-cover', 
  authenticateToken, 
  upload.single('cover'), 
  optimizeImage,
  articleController.uploadCoverImage
);
module.exports = router;