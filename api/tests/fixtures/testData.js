// Test data fixtures for IT-ERA admin panel testing

module.exports = {
  // Valid test credentials
  validCredentials: {
    email: 'admin@it-era.it',
    password: 'admin123!'
  },

  // Invalid test credentials
  invalidCredentials: [
    { email: 'wrong@email.com', password: 'wrongpass' },
    { email: 'admin@it-era.it', password: 'wrongpass' },
    { email: 'wrong@email.com', password: 'admin123!' },
    { email: '', password: '' },
    { email: 'invalid-email', password: 'admin123!' }
  ],

  // Test posts data
  validPosts: [
    {
      title: 'Test Post 1: Assistenza IT Milano',
      content: 'Contenuto completo per test post di assistenza IT a Milano con servizi professionali.',
      excerpt: 'Test excerpt per assistenza IT Milano',
      category: 'assistenza-it',
      tags: ['milano', 'assistenza', 'it'],
      status: 'published',
      featured: true
    },
    {
      title: 'Test Post 2: Sicurezza Informatica',
      content: 'Articolo di test sulla sicurezza informatica per aziende lombarde.',
      excerpt: 'Test excerpt sicurezza informatica',
      category: 'sicurezza',
      tags: ['sicurezza', 'cyber', 'protezione'],
      status: 'draft',
      featured: false
    }
  ],

  // Invalid posts data for validation testing
  invalidPosts: [
    { title: '', content: 'Content without title' },
    { title: 'Title without content', content: '' },
    { title: 'A', content: 'Too short title and content' },
    { title: 'x'.repeat(201), content: 'Title too long' },
    { category: 'non-existent-category' }
  ],

  // Test categories
  validCategories: [
    {
      name: 'Test Assistenza IT',
      slug: 'test-assistenza-it',
      description: 'Categoria di test per assistenza IT',
      color: '#0056cc'
    },
    {
      name: 'Test Sicurezza',
      slug: 'test-sicurezza',
      description: 'Categoria di test per sicurezza informatica',
      color: '#dc3545'
    }
  ],

  // Test tags
  validTags: [
    { name: 'test-milano', color: '#0056cc' },
    { name: 'test-monza', color: '#17a2b8' },
    { name: 'test-bergamo', color: '#28a745' }
  ],

  // XSS and SQL injection payloads for security testing
  maliciousPayloads: [
    '<script>alert("XSS")</script>',
    '"><script>alert("XSS")</script>',
    "'; DROP TABLE posts; --",
    "' OR '1'='1",
    '<img src=x onerror=alert("XSS")>',
    'javascript:alert("XSS")',
    '${alert("XSS")}',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>',
    '{{7*7}}', // Template injection
    '../../../etc/passwd', // Path traversal
    'admin"; DELETE FROM users WHERE "1"="1'
  ],

  // Large payloads for stress testing
  largePayloads: {
    title: 'A'.repeat(1000),
    content: 'Lorem ipsum '.repeat(1000),
    tags: Array(100).fill().map((_, i) => `tag${i}`)
  },

  // Performance test data
  performanceData: {
    bulkPosts: Array(50).fill().map((_, i) => ({
      title: `Performance Test Post ${i}`,
      content: `Content for performance test post ${i} with sufficient length to test real-world scenarios.`,
      category: 'test-category',
      tags: [`perf-tag-${i}`, 'performance', 'test'],
      status: 'published'
    }))
  },

  // Form validation test cases
  formValidationCases: {
    email: [
      { value: '', expected: false, message: 'Email required' },
      { value: 'invalid-email', expected: false, message: 'Invalid email format' },
      { value: 'test@', expected: false, message: 'Incomplete email' },
      { value: 'test@domain', expected: false, message: 'Invalid domain' },
      { value: 'valid@email.com', expected: true, message: 'Valid email' }
    ],
    password: [
      { value: '', expected: false, message: 'Password required' },
      { value: '123', expected: false, message: 'Password too short' },
      { value: 'password', expected: false, message: 'Password too weak' },
      { value: 'StrongPass123!', expected: true, message: 'Strong password' }
    ],
    title: [
      { value: '', expected: false, message: 'Title required' },
      { value: 'A', expected: false, message: 'Title too short' },
      { value: 'Valid Title', expected: true, message: 'Valid title' },
      { value: 'A'.repeat(201), expected: false, message: 'Title too long' }
    ]
  }
};