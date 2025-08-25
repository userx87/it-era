# IT-ERA Admin API - Frontend Integration Guide

## Overview

This guide provides comprehensive instructions for integrating the IT-ERA Admin API with your frontend application, including authentication flows, API calls, and error handling.

## Quick Start

### 1. Base Configuration

```javascript
// config/api.js
const API_CONFIG = {
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://it-era.pages.dev/admin/api'
    : 'http://localhost:8787/admin/api',
  timeout: 10000,
  retries: 3
};

export default API_CONFIG;
```

### 2. HTTP Client Setup

```javascript
// services/apiClient.js
import axios from 'axios';
import API_CONFIG from '../config/api';

class APIClient {
  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => this.handleError(error)
    );
  }

  getStoredToken() {
    return localStorage.getItem('it_era_admin_token');
  }

  setToken(token) {
    localStorage.setItem('it_era_admin_token', token);
  }

  clearToken() {
    localStorage.removeItem('it_era_admin_token');
  }

  handleError(error) {
    if (error.response?.status === 401) {
      // Token expired or invalid
      this.clearToken();
      window.location.href = '/login';
      return Promise.reject(new Error('Authentication failed'));
    }

    if (error.response?.status === 403) {
      return Promise.reject(new Error('Access denied'));
    }

    if (error.response?.status === 429) {
      return Promise.reject(new Error('Too many requests. Please try again later.'));
    }

    const message = error.response?.data?.error || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }

  async request(config) {
    try {
      return await this.client(config);
    } catch (error) {
      throw error;
    }
  }
}

export default new APIClient();
```

## Authentication Implementation

### 1. Login Service

```javascript
// services/authService.js
import apiClient from './apiClient';

class AuthService {
  async login(email, password) {
    try {
      const response = await apiClient.request({
        method: 'POST',
        url: '/auth/login',
        data: { email, password }
      });

      if (response.success && response.data.token) {
        apiClient.setToken(response.data.token);
        return response.data;
      }

      throw new Error('Invalid login response');
    } catch (error) {
      throw error;
    }
  }

  async verifyToken() {
    try {
      const response = await apiClient.request({
        method: 'GET',
        url: '/auth/verify'
      });

      return response.success ? response.data : null;
    } catch (error) {
      apiClient.clearToken();
      return null;
    }
  }

  async logout() {
    apiClient.clearToken();
    window.location.href = '/login';
  }

  isAuthenticated() {
    return !!apiClient.getStoredToken();
  }

  async checkHealth() {
    try {
      const response = await apiClient.request({
        method: 'GET',
        url: '/auth/health'
      });
      return response.success;
    } catch (error) {
      return false;
    }
  }
}

export default new AuthService();
```

### 2. Auth Context (React Example)

```javascript
// contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      if (authService.isAuthenticated()) {
        const userData = await authService.verifyToken();
        if (userData) {
          setUser(userData.user);
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.login(email, password);
      setUser(response.user);
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 3. Protected Route Component

```javascript
// components/ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
```

## API Service Layer

### 1. Dashboard Service

```javascript
// services/dashboardService.js
import apiClient from './apiClient';

class DashboardService {
  async getDashboardData() {
    try {
      const response = await apiClient.request({
        method: 'GET',
        url: '/dashboard'
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getAnalytics(period = '7d', metric = 'all') {
    try {
      const response = await apiClient.request({
        method: 'GET',
        url: `/analytics?period=${period}&metric=${metric}`
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new DashboardService();
```

### 2. Posts Service

```javascript
// services/postsService.js
import apiClient from './apiClient';

class PostsService {
  async getPosts({ page = 1, limit = 10, status, search } = {}) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (status) params.append('status', status);
      if (search) params.append('search', search);

      const response = await apiClient.request({
        method: 'GET',
        url: `/posts?${params.toString()}`
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async createPost(postData) {
    try {
      const response = await apiClient.request({
        method: 'POST',
        url: '/posts',
        data: postData
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updatePost(id, postData) {
    try {
      const response = await apiClient.request({
        method: 'PUT',
        url: `/posts/${id}`,
        data: postData
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async deletePost(id) {
    try {
      const response = await apiClient.request({
        method: 'DELETE',
        url: `/posts/${id}`
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new PostsService();
```

### 3. Media Service

```javascript
// services/mediaService.js
import apiClient from './apiClient';

class MediaService {
  async getMedia({ page = 1, limit = 20, type } = {}) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (type) params.append('type', type);

      const response = await apiClient.request({
        method: 'GET',
        url: `/media?${params.toString()}`
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async uploadFile(file, alt = '') {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (alt) formData.append('alt', alt);

      const response = await apiClient.request({
        method: 'POST',
        url: '/media',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new MediaService();
```

### 4. Users Service (Admin Only)

```javascript
// services/usersService.js
import apiClient from './apiClient';

class UsersService {
  async getUsers() {
    try {
      const response = await apiClient.request({
        method: 'GET',
        url: '/users'
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async createUser(userData) {
    try {
      const response = await apiClient.request({
        method: 'POST',
        url: '/users',
        data: userData
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new UsersService();
```

### 5. Settings Service (Admin Only)

```javascript
// services/settingsService.js
import apiClient from './apiClient';

class SettingsService {
  async getSettings() {
    try {
      const response = await apiClient.request({
        method: 'GET',
        url: '/settings'
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateSettings(settings) {
    try {
      const response = await apiClient.request({
        method: 'PUT',
        url: '/settings',
        data: settings
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new SettingsService();
```

## React Components Examples

### 1. Login Component

```javascript
// components/Login.js
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, isAuthenticated } = useAuth();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      // Navigation handled by AuthContext
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h1>IT-ERA Admin Login</h1>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="login-button"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;
```

### 2. Dashboard Component

```javascript
// components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import dashboardService from '../services/dashboardService';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getDashboardData();
      setDashboardData(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error loading dashboard</h2>
        <p>{error}</p>
        <button onClick={loadDashboardData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Welcome, {user?.name}</h1>
        <p>IT-ERA Admin Dashboard</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Posts</h3>
          <div className="stat-number">{dashboardData.stats.posts.total}</div>
          <div className="stat-details">
            <span>Published: {dashboardData.stats.posts.published}</span>
            <span>Draft: {dashboardData.stats.posts.draft}</span>
          </div>
        </div>

        <div className="stat-card">
          <h3>Media Files</h3>
          <div className="stat-number">{dashboardData.stats.media.total}</div>
          <div className="stat-details">
            <span>Size: {(dashboardData.stats.media.total_size / 1024 / 1024).toFixed(1)} MB</span>
          </div>
        </div>

        <div className="stat-card">
          <h3>Total Views</h3>
          <div className="stat-number">{dashboardData.stats.analytics.total_views}</div>
          <div className="stat-details">
            <span>Avg: {dashboardData.stats.analytics.avg_views}</span>
          </div>
        </div>

        {user?.role === 'admin' && (
          <div className="stat-card">
            <h3>Users</h3>
            <div className="stat-number">{dashboardData.stats.users.total}</div>
            <div className="stat-details">
              <span>Active: {dashboardData.stats.users.active}</span>
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-content">
        <section className="recent-activity">
          <h2>Recent Activity</h2>
          <ul>
            {dashboardData.recent_activity.map((activity, index) => (
              <li key={index} className="activity-item">
                <span className="activity-message">{activity.message}</span>
                <span className="activity-time">
                  {new Date(activity.timestamp).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            {dashboardData.quick_actions.map((action, index) => (
              <a 
                key={index} 
                href={action.url} 
                className="action-button"
              >
                <span className={`icon icon-${action.icon}`}></span>
                {action.name}
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
```

## Error Handling Best Practices

### 1. Global Error Handler

```javascript
// utils/errorHandler.js
class ErrorHandler {
  static handle(error, context = '') {
    console.error(`Error in ${context}:`, error);

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.logToService(error, context);
    }

    // Return user-friendly message
    return this.getUserMessage(error);
  }

  static getUserMessage(error) {
    if (error.message.includes('Authentication failed')) {
      return 'Please log in again.';
    }

    if (error.message.includes('Access denied')) {
      return 'You don\'t have permission to perform this action.';
    }

    if (error.message.includes('Too many requests')) {
      return 'Too many requests. Please try again later.';
    }

    if (error.message.includes('Network Error')) {
      return 'Network error. Please check your connection.';
    }

    return error.message || 'An unexpected error occurred.';
  }

  static logToService(error, context) {
    // Implementation for external logging service
    // e.g., Sentry, LogRocket, etc.
  }
}

export default ErrorHandler;
```

### 2. API Error Component

```javascript
// components/ApiError.js
import React from 'react';

const ApiError = ({ error, onRetry, context }) => {
  return (
    <div className="api-error">
      <div className="error-icon">⚠️</div>
      <h3>Something went wrong</h3>
      <p>{error}</p>
      {context && (
        <p className="error-context">Context: {context}</p>
      )}
      {onRetry && (
        <button onClick={onRetry} className="retry-button">
          Try Again
        </button>
      )}
    </div>
  );
};

export default ApiError;
```

## Testing Integration

### 1. API Client Tests

```javascript
// tests/apiClient.test.js
import apiClient from '../services/apiClient';
import MockAdapter from 'axios-mock-adapter';

describe('API Client', () => {
  let mock;

  beforeEach(() => {
    mock = new MockAdapter(apiClient.client);
    localStorage.clear();
  });

  afterEach(() => {
    mock.restore();
  });

  it('should include auth token in requests', async () => {
    const token = 'test-token';
    apiClient.setToken(token);
    
    mock.onGet('/test').reply((config) => {
      expect(config.headers.Authorization).toBe(`Bearer ${token}`);
      return [200, { success: true }];
    });

    await apiClient.request({ method: 'GET', url: '/test' });
  });

  it('should handle 401 errors by clearing token', async () => {
    apiClient.setToken('invalid-token');
    mock.onGet('/test').reply(401);

    try {
      await apiClient.request({ method: 'GET', url: '/test' });
    } catch (error) {
      expect(apiClient.getStoredToken()).toBeNull();
    }
  });
});
```

### 2. Component Tests

```javascript
// tests/Dashboard.test.js
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';
import Dashboard from '../components/Dashboard';
import dashboardService from '../services/dashboardService';

jest.mock('../services/dashboardService');

const MockedDashboardService = dashboardService as jest.Mocked<typeof dashboardService>;

const renderWithAuth = (component) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('Dashboard', () => {
  it('should display dashboard data', async () => {
    const mockData = {
      stats: {
        posts: { total: 10, published: 8, draft: 2 },
        media: { total: 20, total_size: 1024000 },
        analytics: { total_views: 1000, avg_views: 100 }
      },
      recent_activity: [],
      quick_actions: []
    };

    MockedDashboardService.getDashboardData.mockResolvedValue(mockData);

    renderWithAuth(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument(); // Posts total
      expect(screen.getByText('20')).toBeInTheDocument(); // Media total
      expect(screen.getByText('1000')).toBeInTheDocument(); // Total views
    });
  });
});
```

## Performance Optimization

### 1. Request Caching

```javascript
// utils/cache.js
class Cache {
  constructor(ttl = 300000) { // 5 minutes default
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    const expiry = Date.now() + this.ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }
}

export default new Cache();
```

### 2. Debounced Search

```javascript
// hooks/useDebounce.js
import { useState, useEffect } from 'react';

export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
```

## Production Deployment

### 1. Environment Configuration

```javascript
// config/environment.js
const config = {
  development: {
    apiBaseURL: 'http://localhost:8787/admin/api',
    debug: true
  },
  production: {
    apiBaseURL: 'https://it-era.pages.dev/admin/api',
    debug: false
  }
};

export default config[process.env.NODE_ENV || 'development'];
```

### 2. Build Configuration

```json
// package.json
{
  "scripts": {
    "build": "react-scripts build",
    "build:prod": "REACT_APP_ENV=production npm run build",
    "deploy": "npm run build:prod && npm run upload-to-pages"
  }
}
```

---

This integration guide provides all the necessary components to successfully integrate your frontend application with the IT-ERA Admin API. Remember to handle errors gracefully, implement proper authentication flows, and test thoroughly before deploying to production.