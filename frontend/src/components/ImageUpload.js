import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import './ImageUpload.css';

const ImageUpload = ({ onUpload, type = 'cover', currentImage = null }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage);
  const [error, setError] = useState('');

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }

    setError('');
    setUploading(true);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    const formData = new FormData();
    formData.append(type === 'avatar' ? 'avatar' : 'cover', file);

    try {
      const token = localStorage.getItem('token');
      const endpoint = type === 'avatar' 
        ? 'http://localhost:3003/api/auth/profile'
        : 'http://localhost:3003/api/articles/upload-cover';
      
      const method = type === 'avatar' ? 'put' : 'post';
      
      const response = await axios({
        method,
        url: endpoint,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      if (type === 'avatar') {
        onUpload(response.data.avatar_url);
      } else {
        onUpload(response.data.url);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Upload failed');
      setPreview(currentImage);
    } finally {
      setUploading(false);
    }
  }, [type, onUpload, currentImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    disabled: uploading
  });

  return (
    <div className="image-upload">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
      >
        <input {...getInputProps()} />
        
        {preview ? (
          <div className="image-preview">
            <img src={preview} alt="Preview" />
            {!uploading && (
              <div className="image-overlay">
                <span>Click or drag to change</span>
              </div>
            )}
          </div>
        ) : (
          <div className="upload-placeholder">
            <span className="upload-icon">📸</span>
            <p>{isDragActive ? 'Drop the image here' : 'Click or drag image to upload'}</p>
            <p className="upload-hint">JPEG, PNG, GIF, WEBP (Max 5MB)</p>
          </div>
        )}
        
        {uploading && (
          <div className="upload-loading">
            <div className="spinner"></div>
            <p>Uploading...</p>
          </div>
        )}
      </div>
      
      {error && <div className="upload-error">{error}</div>}
    </div>
  );
};

export default ImageUpload;