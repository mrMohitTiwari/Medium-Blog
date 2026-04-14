const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, full_name } = req.body;

  try {
    // Check if user exists
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, full_name) VALUES ($1, $2, $3, $4) RETURNING id, username, email, full_name, created_at',
      [username, email, password_hash, full_name]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Get user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    delete user.password_hash;
    res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.full_name, u.bio, u.avatar_url, u.created_at,
        (SELECT COUNT(*) FROM followers WHERE following_id = u.id) as followers_count,
        (SELECT COUNT(*) FROM followers WHERE follower_id = u.id) as following_count,
        (SELECT COUNT(*) FROM articles WHERE author_id = u.id) as articles_count
       FROM users u WHERE u.id = $1`,
      [req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const followUser = async (req, res) => {
  const { userId } = req.params;
  const followerId = req.user.id;
  
  if (parseInt(userId) === followerId) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }
  
  try {
    await pool.query(
      'INSERT INTO followers (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [followerId, userId]
    );
    res.json({ following: true });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const unfollowUser = async (req, res) => {
  const { userId } = req.params;
  const followerId = req.user.id;
  
  try {
    await pool.query(
      'DELETE FROM followers WHERE follower_id = $1 AND following_id = $2',
      [followerId, userId]
    );
    res.json({ following: false });
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getUserProfile = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user?.id;
  
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.bio, u.avatar_url, u.created_at,
        (SELECT COUNT(*) FROM followers WHERE following_id = u.id) as followers_count,
        (SELECT COUNT(*) FROM followers WHERE follower_id = u.id) as following_count,
        (SELECT COUNT(*) FROM articles WHERE author_id = u.id) as articles_count,
        (SELECT EXISTS(SELECT 1 FROM followers WHERE follower_id = $2 AND following_id = u.id)) as is_following
       FROM users u WHERE u.id = $1`,
      [userId, currentUserId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user's articles
    const articlesResult = await pool.query(
      `SELECT a.*, 
              (SELECT COUNT(*) FROM likes WHERE article_id = a.id) as likes_count,
              (SELECT COUNT(*) FROM comments WHERE article_id = a.id) as comments_count
       FROM articles a
       WHERE a.author_id = $1 AND a.status = 'published'
       ORDER BY a.created_at DESC`,
      [userId]
    );
    
    const userData = result.rows[0];
    userData.articles = articlesResult.rows;
    
    res.json(userData);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update user profile with avatar
const updateProfile = async (req, res) => {
  const { full_name, bio, email } = req.body;
  const userId = req.user.id;

  try {
    // Check if email is already taken by another user
    if (email) {
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    let avatar_url = null;
    
    // If file was uploaded, create URL
    if (req.file) {
      avatar_url = `http://localhost:3003/uploads/avatars/${req.file.filename}`;
    }

    // Build update query dynamically
    let updateQuery = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
    const params = [];
    let paramIndex = 1;

    if (full_name) {
      updateQuery += `, full_name = $${paramIndex}`;
      params.push(full_name);
      paramIndex++;
    }

    if (bio !== undefined) {
      updateQuery += `, bio = $${paramIndex}`;
      params.push(bio);
      paramIndex++;
    }

    if (email) {
      updateQuery += `, email = $${paramIndex}`;
      params.push(email);
      paramIndex++;
    }

    if (avatar_url) {
      updateQuery += `, avatar_url = $${paramIndex}`;
      params.push(avatar_url);
      paramIndex++;
    }

    updateQuery += ` WHERE id = $${paramIndex} RETURNING id, username, email, full_name, bio, avatar_url, created_at`;
    params.push(userId);

    const result = await pool.query(updateQuery, params);
    
    // Get updated counts
    const statsResult = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM followers WHERE following_id = u.id) as followers_count,
        (SELECT COUNT(*) FROM followers WHERE follower_id = u.id) as following_count,
        (SELECT COUNT(*) FROM articles WHERE author_id = u.id) as articles_count
       FROM users u WHERE u.id = $1`,
      [userId]
    );
    
    const updatedUser = {
      ...result.rows[0],
      ...statsResult.rows[0]
    };
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  followUser,
  unfollowUser,
  getUserProfile,
  updateProfile  // ✅ Added updateProfile to exports
};