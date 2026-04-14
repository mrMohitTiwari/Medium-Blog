import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

const Home = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchArticles();
  }, [page]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3003/api/articles?page=${page}&limit=10`);
      setArticles(response.data.articles);
      setPagination(response.data.pagination);
    } catch (err) {
      setError('Failed to load articles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading && articles.length === 0) {
    return <div className="loading">Loading articles...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="home">
      <div className="container">
        <h1 className="page-title">Latest Stories</h1>
        
        <div className="articles-grid">
          {articles.map(article => (
            <Link to={`/article/${article.id}`} key={article.id} className="article-link">
              <article className="article-card">
                <div className="article-main">
                  <div className="article-author-info">
                    <div className="author-avatar">
                      {article.author_avatar ? (
                        <img src={article.author_avatar} alt={article.author_full_name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {article.author_full_name?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                    <span className="author-name">{article.author_full_name || article.author_username}</span>
                  </div>
                  
                  <h2 className="article-title">{article.title}</h2>
                  {article.subtitle && (
                    <p className="article-subtitle">{article.subtitle}</p>
                  )}
                  
                  <div className="article-meta">
                    <span className="article-date">{formatDate(article.created_at)}</span>
                    <span className="article-read-time">{article.read_time} min read</span>
                    <span className="article-stats">
                      <span className="stat">❤️ {article.likes_count || 0}</span>
                      <span className="stat">💬 {article.comments_count || 0}</span>
                    </span>
                  </div>
                  
                  {article.tags && article.tags.length > 0 && (
                    <div className="article-tags">
                      {article.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                
                {article.cover_image && (
                  <div className="article-cover-wrapper">
                    <img 
                      src={article.cover_image} 
                      alt={article.title}
                      className="article-cover"
                    />
                  </div>
                )}
              </article>
            </Link>
          ))}
        </div>
        
        {pagination.pages > 1 && (
          <div className="pagination">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="pagination-btn"
            >
              Previous
            </button>
            <span className="page-info">Page {page} of {pagination.pages}</span>
            <button 
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;