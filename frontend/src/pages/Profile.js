import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Profile.css';
import ImageUpload from '../components/ImageUpload';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [myArticles, setMyArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('articles');
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    bio: '',
    email: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch profile
      const profileRes = await axios.get('http://localhost:3003/api/auth/profile', { headers });
      setProfile(profileRes.data);
      setEditForm({
        full_name: profileRes.data.full_name || '',
        bio: profileRes.data.bio || '',
        email: profileRes.data.email || ''
      });
      
      // Fetch user's articles
      const articlesRes = await axios.get(`http://localhost:3003/api/articles?author=${user.username}`, { headers });
      setMyArticles(articlesRes.data.articles || []);
      
      setError(null);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = (url) => {
    setProfile({ ...profile, avatar_url: url });
  };

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.put('http://localhost:3003/api/auth/profile', editForm, { headers });
      
      setProfile({ ...profile, ...editForm });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="profile-error">
        <p>{error || 'Failed to load profile'}</p>
        <button onClick={fetchProfileData} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="profile">
      <div className="container">
        <div className="profile-header">
          <div className="profile-info">
            <div className="profile-avatar-wrapper">
              {isEditing ? (
                <ImageUpload 
                  onUpload={handleAvatarUpload}
                  type="avatar"
                  currentImage={profile.avatar_url}
                />
              ) : (
                <div className="profile-avatar-large">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.full_name} />
                  ) : (
                    <div className="avatar-placeholder-xlarge">
                      {profile.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="profile-details">
              {isEditing ? (
                <div className="edit-form">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="full_name"
                      value={editForm.full_name}
                      onChange={handleEditChange}
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Bio</label>
                    <textarea
                      name="bio"
                      value={editForm.bio}
                      onChange={handleEditChange}
                      className="form-control"
                      rows="3"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={editForm.email}
                      onChange={handleEditChange}
                      className="form-control"
                    />
                  </div>
                  <div className="edit-actions">
                    <button onClick={handleSaveProfile} className="btn btn-primary">
                      Save Changes
                    </button>
                    <button onClick={() => setIsEditing(false)} className="btn btn-secondary">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="profile-name">{profile.full_name}</h1>
                  <p className="profile-username">@{profile.username}</p>
                  {profile.bio && <p className="profile-bio">{profile.bio}</p>}
                  <p className="profile-email">{profile.email}</p>
                  <div className="profile-stats">
                    <div className="stat-item">
                      <span className="stat-value">{profile.articles_count || myArticles.length}</span>
                      <span className="stat-label">Articles</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{profile.followers_count || 0}</span>
                      <span className="stat-label">Followers</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{profile.following_count || 0}</span>
                      <span className="stat-label">Following</span>
                    </div>
                  </div>
                  <p className="profile-joined">Joined {formatDate(profile.created_at)}</p>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="profile-tabs">
          <button 
            className={`tab-btn ${activeTab === 'articles' ? 'active' : ''}`}
            onClick={() => setActiveTab('articles')}
          >
            My Articles
          </button>
          <button 
            className={`tab-btn ${activeTab === 'bookmarks' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookmarks')}
          >
            Bookmarks
          </button>
          <button 
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('settings');
              setIsEditing(true);
            }}
          >
            Settings
          </button>
        </div>
        
        <div className="profile-content">
          {activeTab === 'articles' && (
            <div className="articles-section">
              {myArticles.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <h3>No articles yet</h3>
                  <p>You haven't written any articles yet. Start sharing your stories!</p>
                  <Link to="/create" className="btn btn-primary">Write Your First Story</Link>
                </div>
              ) : (
                <div className="my-articles-list">
                  {myArticles.map(article => (
                    <Link to={`/article/${article.id}`} key={article.id} className="article-link">
                      <div className="my-article-card">
                        <div className="article-info">
                          <h3 className="article-title-small">{article.title}</h3>
                          {article.subtitle && (
                            <p className="article-subtitle-small">{article.subtitle}</p>
                          )}
                          <div className="article-meta-small">
                            <span>{formatDate(article.created_at)}</span>
                            <span>·</span>
                            <span>{article.read_time} min read</span>
                            <span>·</span>
                            <span className="stat-badge">❤️ {article.likes_count || 0}</span>
                            <span className="stat-badge">💬 {article.comments_count || 0}</span>
                            <span className="stat-badge">👁️ {article.views || 0} views</span>
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
                          <div className="article-cover-small">
                            <img src={article.cover_image} alt={article.title} />
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'bookmarks' && (
            <div className="bookmarks-section">
              <div className="empty-state">
                <div className="empty-icon">🔖</div>
                <h3>No bookmarks yet</h3>
                <p>Save stories you love to read them later.</p>
                <Link to="/" className="btn btn-primary">Browse Articles</Link>
              </div>
            </div>
          )}

          {activeTab === 'settings' && !isEditing && (
            <div className="settings-section">
              <div className="settings-card">
                <h3>Profile Settings</h3>
                <div className="settings-info">
                  <p><strong>Username:</strong> {profile.username}</p>
                  <p><strong>Email:</strong> {profile.email}</p>
                  <p><strong>Full Name:</strong> {profile.full_name}</p>
                  <p><strong>Bio:</strong> {profile.bio || 'No bio yet'}</p>
                </div>
                <button onClick={() => setIsEditing(true)} className="btn btn-primary">
                  Edit Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;