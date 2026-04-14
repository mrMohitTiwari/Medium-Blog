import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './ArticleDetail.css';

const ArticleDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    fetchArticle();
    fetchComments();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`http://localhost:3003/api/articles/${id}`, { headers });
      setArticle(response.data);
      setLiked(response.data.is_liked || false);
      setBookmarked(response.data.is_bookmarked || false);
      setLikesCount(response.data.likes_count || 0);
    } catch (err) {
      setError('Failed to load article');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`http://localhost:3003/api/articles/${id}/comments`);
      setComments(response.data);
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:3003/api/articles/${id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLiked(response.data.liked);
      setLikesCount(prev => response.data.liked ? prev + 1 : prev - 1);
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:3003/api/articles/${id}/bookmark`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBookmarked(response.data.bookmarked);
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:3003/api/articles/${id}/comments`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments([response.data, ...comments]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:3003/api/articles/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        navigate('/');
      } catch (err) {
        console.error('Failed to delete article:', err);
        alert('Failed to delete article');
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading article...</div>;
  }

  if (error || !article) {
    return <div className="error-message">{error || 'Article not found'}</div>;
  }

  const isAuthor = user && user.id === article.author_id;

  return (
    <div className="article-detail">
      <div className="container">
        {article.cover_image && (
          <div className="article-cover-full">
            <img src={article.cover_image} alt={article.title} />
          </div>
        )}
        
        <article className="article-content-wrapper">
          <h1 className="article-detail-title">{article.title}</h1>
          
          {article.subtitle && (
            <h2 className="article-detail-subtitle">{article.subtitle}</h2>
          )}
          
          <div className="article-author-section">
            <div className="author-info">
              <div className="author-avatar-large">
                {article.author_avatar ? (
                  <img src={article.author_avatar} alt={article.author_full_name} />
                ) : (
                  <div className="avatar-placeholder-large">
                    {article.author_full_name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <div className="author-details">
                <div className="author-name-large">{article.author_full_name}</div>
                <div className="article-meta-info">
                  <span>{formatDate(article.created_at)}</span>
                  <span>·</span>
                  <span>{article.read_time} min read</span>
                </div>
              </div>
            </div>
            
            <div className="article-actions">
              <button 
                onClick={handleLike} 
                className={`action-btn ${liked ? 'active' : ''}`}
              >
                ❤️ {likesCount}
              </button>
              <button 
                onClick={handleBookmark} 
                className={`action-btn ${bookmarked ? 'active' : ''}`}
              >
                🔖 {bookmarked ? 'Saved' : 'Save'}
              </button>
              {isAuthor && (
                <>
                  <Link to={`/article/${id}/edit`} className="action-btn">
                    ✏️ Edit
                  </Link>
                  <button onClick={handleDelete} className="action-btn delete">
                    🗑️ Delete
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="article-body" dangerouslySetInnerHTML={{ __html: article.content }} />
          
          {article.tags && article.tags.length > 0 && (
            <div className="article-tags-section">
              {article.tags.map((tag, index) => (
                <span key={index} className="tag-large">{tag}</span>
              ))}
            </div>
          )}
        </article>
        
        <section className="comments-section">
          <h3 className="comments-title">Comments ({comments.length})</h3>
          
          {user && (
            <form onSubmit={handleCommentSubmit} className="comment-form">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="comment-input"
                rows="3"
              />
              <button type="submit" className="btn btn-primary">
                Post Comment
              </button>
            </form>
          )}
          
          <div className="comments-list">
            {comments.length === 0 ? (
              <p className="no-comments">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="comment">
                  <div className="comment-header">
                    <div className="comment-author">
                      <div className="comment-avatar">
                        {comment.avatar_url ? (
                          <img src={comment.avatar_url} alt={comment.full_name} />
                        ) : (
                          <div className="avatar-placeholder-small">
                            {comment.full_name?.charAt(0) || 'U'}
                          </div>
                        )}
                      </div>
                      <span className="comment-author-name">{comment.full_name}</span>
                    </div>
                    <span className="comment-date">{formatDate(comment.created_at)}</span>
                  </div>
                  <p className="comment-content">{comment.content}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ArticleDetail;