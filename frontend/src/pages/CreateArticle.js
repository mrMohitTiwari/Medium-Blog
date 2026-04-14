import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ImageUpload from '../components/ImageUpload';
import 'react-quill/dist/quill.snow.css';
import './CreateArticle.css';

// Dynamic import for ReactQuill
let ReactQuill;
try {
  ReactQuill = require('react-quill');
} catch (e) {
  console.error('ReactQuill failed to load', e);
}

const CreateArticle = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    content: '',
    cover_image: '',
    tags: '',
    read_time: 5
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleContentChange = (value) => {
    setFormData({
      ...formData,
      content: value
    });
  };

  const handleCoverUpload = (url) => {
    setFormData({
      ...formData,
      cover_image: url
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.title || !formData.content) {
      setError('Title and content are required');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const articleData = {
        ...formData,
        tags: tagsArray,
        read_time: parseInt(formData.read_time)
      };

      const response = await axios.post('http://localhost:3003/api/articles', articleData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      navigate(`/article/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create article');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
  };

  return (
    <div className="create-article">
      <div className="container">
        <h1 className="page-title">Write a Story</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="article-form">
          <div className="form-group">
            <label>Cover Image</label>
            <div className="cover-upload">
              <ImageUpload 
                onUpload={handleCoverUpload}
                type="cover"
                currentImage={formData.cover_image}
              />
            </div>
          </div>

          <div className="form-group">
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Title"
              className="form-control title-input"
              required
            />
          </div>
          
          <div className="form-group">
            <input
              type="text"
              name="subtitle"
              value={formData.subtitle}
              onChange={handleChange}
              placeholder="Subtitle (optional)"
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label>Content</label>
            {ReactQuill ? (
              <ReactQuill
                theme="snow"
                value={formData.content}
                onChange={handleContentChange}
                modules={modules}
                placeholder="Write your story..."
                className="editor-container"
              />
            ) : (
              <textarea
                value={formData.content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Write your story..."
                className="form-control"
                rows="15"
                required
              />
            )}
          </div>
          
          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="tags">Tags (comma-separated)</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="technology, programming, life"
                className="form-control"
              />
            </div>
            
            <div className="form-group half">
              <label htmlFor="read_time">Read Time (minutes)</label>
              <input
                type="number"
                id="read_time"
                name="read_time"
                value={formData.read_time}
                onChange={handleChange}
                min="1"
                max="60"
                className="form-control"
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigate('/')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Publishing...' : 'Publish Story'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateArticle;