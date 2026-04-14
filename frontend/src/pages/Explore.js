import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Explore.css';

const Explore = () => {
  const [articles, setArticles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trending');

  useEffect(() => {
    fetchExploreData();
  }, []);

  const fetchExploreData = async () => {
    try {
      // Fetch trending articles
      const articlesRes = await axios.get('http://localhost:3003/api/articles?limit=20');
      setArticles(articlesRes.data.articles);
      
      // Fetch suggested users (you can create this endpoint)
      const usersRes = await axios.get('http://localhost:3003/api/auth/users');
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Failed to fetch explore data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="explore">
      <div className="container">
        <h1 className="page-title">Explore</h1>
        
        <div className="explore-tabs">
          <button 
            className={`tab-btn ${activeTab === 'trending' ? 'active' : ''}`}
            onClick={() => setActiveTab('trending')}
          >
            Trending Stories
          </button>
          <button 
            className={`tab-btn ${activeTab === 'suggested' ? 'active' : ''}`}
            onClick={() => setActiveTab('suggested')}
          >
            Suggested Writers
          </button>
        </div>
        
        {activeTab === 'trending' && (
          <div className="trending-stories">
            {articles.map((article, index) => (
              <Link to={`/article/${article.id}`} key={article.id} className="trending-item">
                <span className="trending-rank">{String(index + 1).padStart(2, '0')}</span>
                <div className="trending-content">
                  <div className="trending-author">
                    <span>{article.author_full_name}</span>
                  </div>
                  <h3 className="trending-title">{article.title}</h3>
                  <div className="trending-meta">
                    <span>{article.read_time} min read</span>
                    <span>·</span>
                    <span>❤️ {article.likes_count}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {activeTab === 'suggested' && (
          <div className="suggested-writers">
            {users.map(user => (
              <Link to={`/profile/${user.id}`} key={user.id} className="writer-card">
                <div className="writer-avatar">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {user.full_name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="writer-info">
                  <h4 className="writer-name">{user.full_name}</h4>
                  <p className="writer-username">@{user.username}</p>
                  {user.bio && <p className="writer-bio">{user.bio}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;