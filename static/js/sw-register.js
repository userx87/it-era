/**
 * IT-ERA Service Worker Registration
 * Handles Service Worker registration and lifecycle management
 * Part of the Hive Mind Performance Optimization Strategy
 */

class ServiceWorkerManager {
  constructor(options = {}) {
    this.config = {
      swPath: options.swPath || '/sw.js',
      scope: options.scope || '/',
      updateCheckInterval: options.updateCheckInterval || 60000, // 1 minute
      enableNotifications: options.enableNotifications !== false,
      enableAnalytics: options.enableAnalytics !== false,
      ...options
    };
    
    this.registration = null;
    this.updateAvailable = false;
    this.isOnline = navigator.onLine;
    
    this.init();
  }

  /**
   * Initialize Service Worker management
   */
  async init() {
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Worker not supported');
      return;
    }

    try {
      await this.register();
      this.setupEventListeners();
      this.setupUpdateChecker();
      this.setupNetworkMonitoring();
      
      console.log('🚀 Service Worker Manager initialized');
    } catch (error) {
      console.error('❌ Service Worker Manager initialization failed:', error);
    }
  }

  /**
   * Register Service Worker
   */
  async register() {
    try {
      this.registration = await navigator.serviceWorker.register(this.config.swPath, {
        scope: this.config.scope
      });
      
      console.log('✅ Service Worker registered:', this.registration.scope);
      
      // Handle different registration states
      if (this.registration.installing) {
        console.log('🔧 Service Worker installing...');
        this.trackInstallation(this.registration.installing);
      } else if (this.registration.waiting) {
        console.log('⏳ Service Worker waiting...');
        this.updateAvailable = true;
        this.showUpdateNotification();
      } else if (this.registration.active) {
        console.log('✅ Service Worker active');
      }
      
      return this.registration;
      
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      throw error;
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for Service Worker updates
    this.registration.addEventListener('updatefound', () => {
      console.log('🔄 Service Worker update found');
      this.trackInstallation(this.registration.installing);
    });

    // Listen for messages from Service Worker
    navigator.serviceWorker.addEventListener('message', event => {
      this.handleServiceWorkerMessage(event);
    });

    // Listen for controller changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 Service Worker controller changed');
      if (this.config.enableNotifications) {
        this.showNotification('App updated! New features available.', 'success');
      }
    });
  }

  /**
   * Track Service Worker installation
   */
  trackInstallation(worker) {
    worker.addEventListener('statechange', () => {
      console.log('🔄 Service Worker state changed:', worker.state);
      
      switch (worker.state) {
        case 'installed':
          if (navigator.serviceWorker.controller) {
            // New Service Worker installed, update available
            this.updateAvailable = true;
            this.showUpdateNotification();
          } else {
            // First installation
            console.log('🎉 Service Worker installed for the first time');
            if (this.config.enableNotifications) {
              this.showNotification('App is ready for offline use!', 'info');
            }
          }
          break;
          
        case 'activated':
          console.log('✅ Service Worker activated');
          break;
          
        case 'redundant':
          console.log('🗑️ Service Worker became redundant');
          break;
      }
    });
  }

  /**
   * Setup automatic update checker
   */
  setupUpdateChecker() {
    setInterval(async () => {
      try {
        await this.registration.update();
      } catch (error) {
        console.error('❌ Service Worker update check failed:', error);
      }
    }, this.config.updateCheckInterval);
  }

  /**
   * Setup network monitoring
   */
  setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Back online');
      if (this.config.enableNotifications) {
        this.showNotification('Connection restored!', 'success');
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📴 Gone offline');
      if (this.config.enableNotifications) {
        this.showNotification('You are offline. Some features may be limited.', 'warning');
      }
    });
  }

  /**
   * Handle messages from Service Worker
   */
  handleServiceWorkerMessage(event) {
    const { type, payload } = event.data;
    
    switch (type) {
      case 'CACHE_UPDATED':
        console.log('📦 Cache updated:', payload);
        break;
        
      case 'OFFLINE_FALLBACK':
        console.log('📴 Offline fallback served:', payload);
        break;
        
      case 'ERROR':
        console.error('❌ Service Worker error:', payload);
        break;
    }
  }

  /**
   * Show update notification
   */
  showUpdateNotification() {
    if (!this.config.enableNotifications) return;
    
    const notification = this.createNotification(
      'App Update Available',
      'A new version is ready. Click to update.',
      'info',
      () => this.applyUpdate()
    );
    
    this.showNotificationElement(notification);
  }

  /**
   * Apply Service Worker update
   */
  async applyUpdate() {
    if (!this.registration.waiting) return;
    
    try {
      // Tell the waiting Service Worker to skip waiting
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload the page to activate the new Service Worker
      window.location.reload();
      
    } catch (error) {
      console.error('❌ Failed to apply update:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    if (!this.registration.active) return null;
    
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };
      
      this.registration.active.postMessage(
        { type: 'GET_CACHE_STATS' },
        [messageChannel.port2]
      );
    });
  }

  /**
   * Clear all caches
   */
  async clearCaches() {
    if (!this.registration.active) return;
    
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };
      
      this.registration.active.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
    });
  }

  /**
   * Create notification element
   */
  createNotification(title, message, type = 'info', action = null) {
    const notification = document.createElement('div');
    notification.className = `sw-notification sw-notification-${type}`;
    notification.innerHTML = `
      <div class="sw-notification-content">
        <div class="sw-notification-title">${title}</div>
        <div class="sw-notification-message">${message}</div>
        ${action ? '<button class="sw-notification-action">Update Now</button>' : ''}
        <button class="sw-notification-close">&times;</button>
      </div>
    `;
    
    // Add event listeners
    if (action) {
      notification.querySelector('.sw-notification-action').addEventListener('click', action);
    }
    
    notification.querySelector('.sw-notification-close').addEventListener('click', () => {
      notification.remove();
    });
    
    return notification;
  }

  /**
   * Show notification element
   */
  showNotificationElement(notification) {
    // Create container if it doesn't exist
    let container = document.getElementById('sw-notifications');
    if (!container) {
      container = document.createElement('div');
      container.id = 'sw-notifications';
      document.body.appendChild(container);
    }
    
    container.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 10000);
  }

  /**
   * Show simple notification
   */
  showNotification(message, type = 'info') {
    const notification = this.createNotification('IT-ERA', message, type);
    this.showNotificationElement(notification);
  }

  /**
   * Unregister Service Worker
   */
  async unregister() {
    if (this.registration) {
      const result = await this.registration.unregister();
      console.log('🗑️ Service Worker unregistered:', result);
      return result;
    }
    return false;
  }
}

// CSS for notifications
const style = document.createElement('style');
style.textContent = `
  #sw-notifications {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    max-width: 400px;
  }
  
  .sw-notification {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    margin-bottom: 10px;
    overflow: hidden;
    animation: slideIn 0.3s ease-out;
  }
  
  .sw-notification-info { border-left: 4px solid #0056cc; }
  .sw-notification-success { border-left: 4px solid #00b336; }
  .sw-notification-warning { border-left: 4px solid #ffc107; }
  .sw-notification-error { border-left: 4px solid #dc3545; }
  
  .sw-notification-content {
    padding: 16px;
    position: relative;
  }
  
  .sw-notification-title {
    font-weight: 600;
    margin-bottom: 4px;
    color: #333;
  }
  
  .sw-notification-message {
    color: #666;
    font-size: 14px;
    line-height: 1.4;
  }
  
  .sw-notification-action {
    background: #0056cc;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    margin-top: 12px;
  }
  
  .sw-notification-action:hover {
    background: #0041a3;
  }
  
  .sw-notification-close {
    position: absolute;
    top: 8px;
    right: 8px;
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #999;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .sw-notification-close:hover {
    color: #333;
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

// Auto-initialize
let swManager;
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    swManager = new ServiceWorkerManager();
    window.swManager = swManager;
  });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ServiceWorkerManager;
} else if (typeof window !== 'undefined') {
  window.ServiceWorkerManager = ServiceWorkerManager;
}
