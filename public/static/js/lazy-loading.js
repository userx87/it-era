/**
 * IT-ERA Lazy Loading System
 * Advanced image lazy loading with WebP support and Core Web Vitals optimization
 * Part of the Hive Mind Performance Optimization Strategy
 */

class LazyLoader {
  constructor(options = {}) {
    this.config = {
      // Intersection Observer options
      rootMargin: options.rootMargin || '50px 0px',
      threshold: options.threshold || 0.01,
      
      // Loading behavior
      enableWebP: options.enableWebP !== false,
      enablePlaceholder: options.enablePlaceholder !== false,
      fadeInDuration: options.fadeInDuration || 300,
      
      // Selectors
      imageSelector: options.imageSelector || 'img[data-src]',
      backgroundSelector: options.backgroundSelector || '[data-bg]',
      
      // Performance
      enablePrefetch: options.enablePrefetch !== false,
      prefetchDistance: options.prefetchDistance || '200px 0px',
      
      // Error handling
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 1000,
      
      ...options
    };
    
    this.observer = null;
    this.prefetchObserver = null;
    this.loadedImages = new Set();
    this.failedImages = new Map();
    this.stats = {
      totalImages: 0,
      loadedImages: 0,
      failedImages: 0,
      webpSupported: false,
      averageLoadTime: 0
    };
    
    this.init();
  }

  /**
   * Initialize lazy loading system
   */
  init() {
    // Check WebP support
    this.checkWebPSupport().then(supported => {
      this.stats.webpSupported = supported;
      console.log('🖼️ WebP support:', supported ? 'Yes' : 'No');
    });
    
    // Setup Intersection Observer
    this.setupObserver();
    
    // Setup prefetch observer if enabled
    if (this.config.enablePrefetch) {
      this.setupPrefetchObserver();
    }
    
    // Start observing existing images
    this.observeImages();
    
    // Listen for new images added dynamically
    this.setupMutationObserver();
    
    console.log('🚀 IT-ERA Lazy Loader initialized');
  }

  /**
   * Check WebP support
   */
  async checkWebPSupport() {
    if (!this.config.enableWebP) return false;
    
    return new Promise(resolve => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  /**
   * Setup main Intersection Observer
   */
  setupObserver() {
    if (!('IntersectionObserver' in window)) {
      console.warn('⚠️ IntersectionObserver not supported, falling back to immediate loading');
      this.loadAllImages();
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
          this.observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: this.config.rootMargin,
      threshold: this.config.threshold
    });
  }

  /**
   * Setup prefetch observer for images further down
   */
  setupPrefetchObserver() {
    this.prefetchObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.prefetchImage(entry.target);
          this.prefetchObserver.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: this.config.prefetchDistance,
      threshold: 0
    });
  }

  /**
   * Setup mutation observer for dynamically added images
   */
  setupMutationObserver() {
    if (!('MutationObserver' in window)) return;

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            this.observeNewImages(node);
          }
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Observe images in the document
   */
  observeImages() {
    const images = document.querySelectorAll(this.config.imageSelector);
    const backgrounds = document.querySelectorAll(this.config.backgroundSelector);
    
    this.stats.totalImages = images.length + backgrounds.length;
    
    images.forEach(img => this.observeImage(img));
    backgrounds.forEach(el => this.observeImage(el));
    
    console.log(`👀 Observing ${this.stats.totalImages} lazy-loadable elements`);
  }

  /**
   * Observe new images added to a container
   */
  observeNewImages(container) {
    const images = container.querySelectorAll ? 
      container.querySelectorAll(this.config.imageSelector) : 
      (container.matches && container.matches(this.config.imageSelector) ? [container] : []);
    
    const backgrounds = container.querySelectorAll ? 
      container.querySelectorAll(this.config.backgroundSelector) : 
      (container.matches && container.matches(this.config.backgroundSelector) ? [container] : []);
    
    [...images, ...backgrounds].forEach(el => this.observeImage(el));
  }

  /**
   * Start observing a single image
   */
  observeImage(element) {
    if (this.observer) {
      this.observer.observe(element);
    }
    
    if (this.prefetchObserver) {
      this.prefetchObserver.observe(element);
    }
    
    // Add placeholder if enabled
    if (this.config.enablePlaceholder && element.tagName === 'IMG') {
      this.addPlaceholder(element);
    }
  }

  /**
   * Add loading placeholder
   */
  addPlaceholder(img) {
    if (img.dataset.placeholder !== 'false') {
      img.style.backgroundColor = '#f0f0f0';
      img.style.backgroundImage = 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)';
      img.style.backgroundSize = '200% 100%';
      img.style.animation = 'loading-shimmer 1.5s infinite';
    }
  }

  /**
   * Remove loading placeholder
   */
  removePlaceholder(img) {
    img.style.backgroundColor = '';
    img.style.backgroundImage = '';
    img.style.backgroundSize = '';
    img.style.animation = '';
  }

  /**
   * Prefetch image for faster loading
   */
  prefetchImage(element) {
    const src = this.getImageSrc(element);
    if (src && !this.loadedImages.has(src)) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = src;
      document.head.appendChild(link);
    }
  }

  /**
   * Get the appropriate image source
   */
  getImageSrc(element) {
    if (element.tagName === 'IMG') {
      // Check for WebP version if supported
      if (this.stats.webpSupported && element.dataset.webp) {
        return element.dataset.webp;
      }
      return element.dataset.src;
    } else {
      // Background image
      return element.dataset.bg;
    }
  }

  /**
   * Load image with error handling and retry logic
   */
  async loadImage(element, attempt = 1) {
    const startTime = performance.now();
    const src = this.getImageSrc(element);
    
    if (!src || this.loadedImages.has(src)) return;

    try {
      if (element.tagName === 'IMG') {
        await this.loadImageElement(element, src);
      } else {
        await this.loadBackgroundImage(element, src);
      }
      
      this.loadedImages.add(src);
      this.stats.loadedImages++;
      
      // Calculate load time
      const loadTime = performance.now() - startTime;
      this.updateAverageLoadTime(loadTime);
      
      // Apply fade-in effect
      this.applyFadeIn(element);
      
    } catch (error) {
      console.warn(`⚠️ Failed to load image (attempt ${attempt}):`, src, error);
      
      if (attempt < this.config.retryAttempts) {
        setTimeout(() => {
          this.loadImage(element, attempt + 1);
        }, this.config.retryDelay * attempt);
      } else {
        this.handleImageError(element, src);
      }
    }
  }

  /**
   * Load IMG element
   */
  loadImageElement(img, src) {
    return new Promise((resolve, reject) => {
      const tempImg = new Image();
      
      tempImg.onload = () => {
        img.src = src;
        img.removeAttribute('data-src');
        img.removeAttribute('data-webp');
        this.removePlaceholder(img);
        resolve();
      };
      
      tempImg.onerror = reject;
      tempImg.src = src;
    });
  }

  /**
   * Load background image
   */
  loadBackgroundImage(element, src) {
    return new Promise((resolve, reject) => {
      const tempImg = new Image();
      
      tempImg.onload = () => {
        element.style.backgroundImage = `url(${src})`;
        element.removeAttribute('data-bg');
        resolve();
      };
      
      tempImg.onerror = reject;
      tempImg.src = src;
    });
  }

  /**
   * Apply fade-in animation
   */
  applyFadeIn(element) {
    if (this.config.fadeInDuration > 0) {
      element.style.opacity = '0';
      element.style.transition = `opacity ${this.config.fadeInDuration}ms ease-in-out`;
      
      // Trigger fade-in
      requestAnimationFrame(() => {
        element.style.opacity = '1';
      });
    }
  }

  /**
   * Handle image loading error
   */
  handleImageError(element, src) {
    this.stats.failedImages++;
    this.failedImages.set(src, (this.failedImages.get(src) || 0) + 1);
    
    // Add error class for styling
    element.classList.add('lazy-load-error');
    
    // Remove placeholder
    if (element.tagName === 'IMG') {
      this.removePlaceholder(element);
    }
  }

  /**
   * Update average load time
   */
  updateAverageLoadTime(loadTime) {
    const currentAvg = this.stats.averageLoadTime;
    const loadedCount = this.stats.loadedImages;
    this.stats.averageLoadTime = (currentAvg * (loadedCount - 1) + loadTime) / loadedCount;
  }

  /**
   * Load all images immediately (fallback)
   */
  loadAllImages() {
    const images = document.querySelectorAll(this.config.imageSelector);
    const backgrounds = document.querySelectorAll(this.config.backgroundSelector);
    
    [...images, ...backgrounds].forEach(element => {
      this.loadImage(element);
    });
  }

  /**
   * Get loading statistics
   */
  getStats() {
    return {
      ...this.stats,
      loadingProgress: this.stats.totalImages > 0 ? 
        (this.stats.loadedImages / this.stats.totalImages * 100).toFixed(1) + '%' : '0%'
    };
  }

  /**
   * Destroy lazy loader
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.prefetchObserver) {
      this.prefetchObserver.disconnect();
    }
  }
}

// CSS for loading animation
const style = document.createElement('style');
style.textContent = `
  @keyframes loading-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  .lazy-load-error {
    background-color: #f8f9fa;
    border: 1px dashed #dee2e6;
  }
`;
document.head.appendChild(style);

// Auto-initialize if not in module context
if (typeof window !== 'undefined' && !window.lazyLoader) {
  document.addEventListener('DOMContentLoaded', () => {
    window.lazyLoader = new LazyLoader();
  });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LazyLoader;
} else if (typeof window !== 'undefined') {
  window.LazyLoader = LazyLoader;
}
