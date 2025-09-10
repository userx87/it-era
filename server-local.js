#!/usr/bin/env node

// Server locale per sviluppo IT-ERA
require('dotenv').config({ path: '.env.local' });

const express = require('express');
const path = require('path');

// Import dell'app principale
const app = require('./api/index.js');

const PORT = process.env.PORT || 3000;

// Avvia server
app.listen(PORT, () => {
    console.log(`🚀 IT-ERA Server locale avviato su http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔧 Analytics: ${process.env.ENABLE_ANALYTICS || 'false'}`);
});
