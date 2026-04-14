import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SearchBar from './SearchBar';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          Medium Clone
        </Link>
        
        <SearchBar />
        
        <div className="navbar-menu">
          {user ? (
            <>
              <Link to="/create" className="nav-link">
                <span className="nav-icon">✏️</span> Write
              </Link>
              <Link to="/explore" className="nav-link">
                <span className="nav-icon">🌐</span> Explore
              </Link>
              <Link to="/profile" className="nav-link">
                <span className="nav-icon">👤</span> {user.full_name || user.username}
              </Link>
              <button onClick={handleLogout} className="nav-button">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/explore" className="nav-link">
                Explore
              </Link>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="nav-link">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;