const express = require('express');
const path = require('path');

const app = express();

// Middleware
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './views');

// Route semplice per test
app.get('/', (req, res) => {
    res.send(`
        <h1>IT-ERA Test Server</h1>
        <p>Server funzionante!</p>
        <ul>
            <li><a href="/health">Health Check</a></li>
            <li><a href="/test-ejs">Test EJS</a></li>
        </ul>
    `);
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'IT-ERA server running'
    });
});

app.get('/test-ejs', (req, res) => {
    res.render('index', {
        title: 'Test IT-ERA',
        description: 'Test page',
        keywords: 'test',
        canonicalUrl: 'http://localhost:3000',
        currentPath: '/',
        env: 'development'
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Test server: http://localhost:${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
});
