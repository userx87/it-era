// Mock Authentication for Testing
// This bypasses the broken backend auth endpoint

window.mockAuth = {
  // Force login with mock token
  forceLogin: function() {
    // Create mock JWT token
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5AaXQtZXJhLml0IiwiaWF0IjoxNzU2MTE0MDAwLCJleHAiOjk5OTk5OTk5OTl9.mock-signature';
    
    // Save to localStorage
    localStorage.setItem('auth_token', mockToken);
    localStorage.setItem('user', JSON.stringify({
      id: 1,
      email: 'admin@it-era.it',
      name: 'Admin',
      role: 'admin'
    }));
    
    console.log('✅ Mock login successful');
    console.log('Token saved:', mockToken);
    
    // Reload page to apply auth
    window.location.reload();
  },
  
  // Check if mock auth is active
  isAuthenticated: function() {
    return localStorage.getItem('auth_token') !== null;
  },
  
  // Clear mock auth
  logout: function() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.reload();
  }
};

// Auto-inject into login form
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Check for admin credentials
    if (email === 'admin@it-era.it' && password === 'admin123!') {
      console.log('🔓 Using mock authentication...');
      window.mockAuth.forceLogin();
    } else {
      alert('Invalid credentials. Use admin@it-era.it / admin123!');
    }
    
    return false;
  }, true); // Use capture to override existing handler
}

console.log('🔧 Mock Auth Loaded - Use mockAuth.forceLogin() to bypass backend');