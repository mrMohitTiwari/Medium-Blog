import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './UserProfile.css';

const UserProfile = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(`http://localhost:3003/api/auth/profile/${userId}`, { headers });
      setProfile(response.data);
      setIsFollowing(response.data.is_following);
      setFollowersCount(response.data.followers_count);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (isFollowing) {
        await axios.delete(`http://localhost:3003/api/auth/follow/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
      } else {
        await axios.post(`http://localhost:3003/api/auth/follow/${userId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Follow error:', error);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="error">User not found</div>;
  }

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="user-profile">
      <div className="container">
        <div className="profile-header">
          <div className="profile-info">
            <div className="profile-avatar-large">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} />
              ) : (
                <div className="avatar-placeholder-xlarge">
                  {profile.full_name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div className="profile-details">
              <h1 className="profile-name">{profile.full_name}</h1>
              <p className="profile-username">@{profile.username}</p>
              {profile.bio && <p className="profile-bio">{profile.bio}</p>}
              
              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-value">{profile.articles_count || 0}</span>
                  <span className="stat-label">Articles</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{followersCount}</span>
                  <span className="stat-label">Followers</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{profile.following_count || 0}</span>
                  <span className="stat-label">Following</span>
                </div>
              </div>
              
              <p className="profile-joined">Joined {formatDate(profile.created_at)}</p>
              
              {!isOwnProfile && currentUser && (
                <button 
                  onClick={handleFollow} 
                  className={`follow-btn ${isFollowing ? 'following' : ''}`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
              
              {isOwnProfile && (
                <Link to="/profile" className="edit-profile-btn">
                  Edit Profile
                </Link>
              )}
            </div>
          </div>
        </div>
        
        <div className="profile-articles">
          <h2 className="section-title">Stories by {profile.full_name}</h2>
          
          {profile.articles?.length === 0 ? (
            <div className="empty-state">
              <p>No articles published yet.</p>
            </div>
          ) : (
            <div className="articles-grid">
              {profile.articles?.map(article => (
                <Link to={`/article/${article.id}`} key={article.id} className="article-link">
                  <article className="article-card">
                    <div className="article-main">
                      <h3 className="article-title">{article.title}</h3>
                      {article.subtitle && (
                        <p className="article-subtitle">{article.subtitle}</p>
                      )}
                      <div className="article-meta">
                        <span>{formatDate(article.created_at)}</span>
                        <span>·</span>
                        <span>{article.read_time} min read</span>
                        <span>·</span>
                        <span>❤️ {article.likes_count || 0}</span>
                      </div>
                    </div>
                    {article.cover_image && (
                      <div className="article-cover-small">
                        <img src={article.cover_image} alt={article.title} />
                      </div>
                    )}
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;