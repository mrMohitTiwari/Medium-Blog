const pool = require('../config/database');

const createArticle = async (req, res) => {
  const { title, subtitle, content, cover_image, tags, read_time } = req.body;
  const author_id = req.user.id;

  try {
    const result = await pool.query(
      `INSERT INTO articles 
       (title, subtitle, content, cover_image, tags, read_time, author_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [title, subtitle, content, cover_image, tags, read_time || 5, author_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getAllArticles = async (req, res) => {
  const { page = 1, limit = 10, tag, author } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT a.*, 
             u.username as author_username, 
             u.full_name as author_full_name,
             u.avatar_url as author_avatar,
             (SELECT COUNT(*) FROM likes WHERE article_id = a.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE article_id = a.id) as comments_count
      FROM articles a
      JOIN users u ON a.author_id = u.id
      WHERE a.status = 'published'
    `;

    const params = [];
    let paramIndex = 1;

    if (tag) {
      query += ` AND $${paramIndex} = ANY(a.tags)`;
      params.push(tag);
      paramIndex++;
    }

    if (author) {
      query += ` AND u.username = $${paramIndex}`;
      params.push(author);
      paramIndex++;
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) FROM articles a
      JOIN users u ON a.author_id = u.id
      WHERE a.status = 'published'
    `;
    const countParams = [];
    let countParamIndex = 1;

    if (tag) {
      countQuery += ` AND $${countParamIndex} = ANY(a.tags)`;
      countParams.push(tag);
      countParamIndex++;
    }

    if (author) {
      countQuery += ` AND u.username = $${countParamIndex}`;
      countParams.push(author);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      articles: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getArticleById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    // Increment view count
    await pool.query('UPDATE articles SET views = views + 1 WHERE id = $1', [id]);

    const result = await pool.query(
      `SELECT a.*, 
              u.username as author_username, 
              u.full_name as author_full_name,
              u.bio as author_bio,
              u.avatar_url as author_avatar,
              u.id as author_id,
              (SELECT COUNT(*) FROM likes WHERE article_id = a.id) as likes_count,
              (SELECT COUNT(*) FROM comments WHERE article_id = a.id) as comments_count,
              (SELECT EXISTS(SELECT 1 FROM likes WHERE article_id = a.id AND user_id = $2)) as is_liked,
              (SELECT EXISTS(SELECT 1 FROM bookmarks WHERE article_id = a.id AND user_id = $2)) as is_bookmarked
       FROM articles a
       JOIN users u ON a.author_id = u.id
       WHERE a.id = $1`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateArticle = async (req, res) => {
  const { id } = req.params;
  const { title, subtitle, content, cover_image, tags, read_time, status } = req.body;
  const author_id = req.user.id;

  try {
    // Check if user owns the article
    const articleCheck = await pool.query(
      'SELECT author_id FROM articles WHERE id = $1',
      [id]
    );

    if (articleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (articleCheck.rows[0].author_id !== author_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `UPDATE articles 
       SET title = $1, subtitle = $2, content = $3, cover_image = $4, 
           tags = $5, read_time = $6, status = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 
       RETURNING *`,
      [title, subtitle, content, cover_image, tags, read_time, status || 'published', id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteArticle = async (req, res) => {
  const { id } = req.params;
  const author_id = req.user.id;

  try {
    const articleCheck = await pool.query(
      'SELECT author_id FROM articles WHERE id = $1',
      [id]
    );

    if (articleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (articleCheck.rows[0].author_id !== author_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await pool.query('DELETE FROM articles WHERE id = $1', [id]);
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const toggleLike = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const existingLike = await pool.query(
      'SELECT * FROM likes WHERE article_id = $1 AND user_id = $2',
      [id, user_id]
    );

    if (existingLike.rows.length > 0) {
      await pool.query(
        'DELETE FROM likes WHERE article_id = $1 AND user_id = $2',
        [id, user_id]
      );
      res.json({ liked: false });
    } else {
      await pool.query(
        'INSERT INTO likes (article_id, user_id) VALUES ($1, $2)',
        [id, user_id]
      );
      res.json({ liked: true });
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const toggleBookmark = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const existingBookmark = await pool.query(
      'SELECT * FROM bookmarks WHERE article_id = $1 AND user_id = $2',
      [id, user_id]
    );

    if (existingBookmark.rows.length > 0) {
      await pool.query(
        'DELETE FROM bookmarks WHERE article_id = $1 AND user_id = $2',
        [id, user_id]
      );
      res.json({ bookmarked: false });
    } else {
      await pool.query(
        'INSERT INTO bookmarks (article_id, user_id) VALUES ($1, $2)',
        [id, user_id]
      );
      res.json({ bookmarked: true });
    }
  } catch (error) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getComments = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT c.*, u.username, u.full_name, u.avatar_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.article_id = $1 AND c.parent_comment_id IS NULL
       ORDER BY c.created_at DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const createComment = async (req, res) => {
  const { id } = req.params;
  const { content, parent_comment_id } = req.body;
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      `INSERT INTO comments (content, article_id, user_id, parent_comment_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [content, id, user_id, parent_comment_id]
    );

    // Get user info for the response
    const commentWithUser = await pool.query(
      `SELECT c.*, u.username, u.full_name, u.avatar_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json(commentWithUser.rows[0]);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const search = async (req, res) => {
  const { q } = req.query;
  
  if (!q || q.trim() === '') {
    return res.json({ articles: [], users: [] });
  }

  try {
    // Search articles
    const articlesQuery = `
      SELECT a.id, a.title, a.subtitle, a.read_time, 
             u.username as author_username, u.full_name as author_full_name
      FROM articles a
      JOIN users u ON a.author_id = u.id
      WHERE a.status = 'published' 
        AND (a.title ILIKE $1 OR a.subtitle ILIKE $1 OR a.content ILIKE $1 OR $1 = ANY(a.tags))
      ORDER BY a.created_at DESC
      LIMIT 5
    `;
    
    const articlesResult = await pool.query(articlesQuery, [`%${q}%`]);
    
    // Search users
    const usersQuery = `
      SELECT id, username, full_name, bio, avatar_url
      FROM users
      WHERE username ILIKE $1 OR full_name ILIKE $1
      ORDER BY 
        CASE 
          WHEN username ILIKE $2 THEN 1
          WHEN full_name ILIKE $2 THEN 2
          ELSE 3
        END
      LIMIT 5
    `;
    
    const usersResult = await pool.query(usersQuery, [`%${q}%`, `${q}%`]);
    
    res.json({
      articles: articlesResult.rows,
      users: usersResult.rows
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
// Upload article cover image
const uploadCoverImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const cover_url = `http://localhost:3003/uploads/covers/${req.file.filename}`;
    res.json({ url: cover_url });
  } catch (error) {
    console.error('Cover upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createArticle,
  getAllArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  toggleLike,
  toggleBookmark,
  getComments,
  createComment,
  search,
  uploadCoverImage // Add this
};