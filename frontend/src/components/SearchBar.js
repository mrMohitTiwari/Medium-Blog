import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SearchBar.css';

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [articles, setArticles] = useState([]);
  const [users, setUsers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        performSearch();
      } else {
        setArticles([]);
        setUsers([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      console.log('Searching for:', searchTerm);
      
      // Search articles
      const articlesRes = await axios.get(
        `http://localhost:3003/api/articles/search?q=${encodeURIComponent(searchTerm)}`,
        { headers }
      );
      
      console.log('Articles response:', articlesRes.data);
      
      // Search users
      const usersRes = await axios.get(
        `http://localhost:3003/api/auth/users/search?q=${encodeURIComponent(searchTerm)}`
      );
      
      console.log('Users response:', usersRes.data);
      
      setArticles(articlesRes.data.articles || []);
      setUsers(usersRes.data || []);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      
      // Fallback: Try to get users from the users endpoint
      try {
        const usersRes = await axios.get('http://localhost:3003/api/auth/users');
        const filteredUsers = usersRes.data.filter(user => 
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setUsers(filteredUsers);
        setShowResults(true);
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (type, id) => {
    console.log('Clicked:', type, id);
    setShowResults(false);
    setSearchTerm('');
    if (type === 'article') {
      navigate(`/article/${id}`);
    } else if (type === 'user') {
      navigate(`/profile/${id}`);
    }
  };

  const hasResults = articles.length > 0 || users.length > 0;

  return (
    <div className="search-bar-container" ref={searchRef}>
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search for articles or users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.trim().length >= 2 && setShowResults(true)}
          className="search-input"
        />
        {loading && <span className="search-loading">...</span>}
      </div>

      {showResults && (
        <div className="search-results">
          {loading ? (
            <div className="search-section">
              <div className="no-results">Searching...</div>
            </div>
          ) : hasResults ? (
            <>
              {articles.length > 0 && (
                <div className="search-section">
                  <h4 className="search-section-title">Stories</h4>
                  {articles.map(article => (
                    <div
                      key={`article-${article.id}`}
                      className="search-result-item"
                      onClick={() => handleResultClick('article', article.id)}
                    >
                      <div className="result-icon">📄</div>
                      <div className="result-content">
                        <div className="result-title">{article.title}</div>
                        <div className="result-meta">
                          by {article.author_full_name} · {article.read_time} min read
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {users.length > 0 && (
                <div className="search-section">
                  <h4 className="search-section-title">People</h4>
                  {users.map(user => (
                    <div
                      key={`user-${user.id}`}
                      className="search-result-item"
                      onClick={() => handleResultClick('user', user.id)}
                    >
                      <div className="result-avatar">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.full_name || user.username} />
                        ) : (
                          <div className="avatar-placeholder-small">
                            {(user.full_name || user.username).charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="result-content">
                        <div className="result-title">{user.full_name || user.username}</div>
                        <div className="result-meta">@{user.username}</div>
                        {user.bio && <div className="result-bio">{user.bio}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="search-section">
              <div className="no-results">No results found for "{searchTerm}"</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;