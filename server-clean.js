#!/usr/bin/env node

// Server IT-ERA pulito per sviluppo locale
require('dotenv').config({ path: '.env.local' });

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware base
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './views');

// Carica dati città
let citiesData = {};
try {
    const data = JSON.parse(fs.readFileSync('./data/cities-data.json', 'utf8'));
    if (data.lombardy_cities?.major_cities) {
        data.lombardy_cities.major_cities.forEach(city => {
            citiesData[city.slug] = city;
        });
    }
    console.log(`✅ Caricate ${Object.keys(citiesData).length} città`);
} catch (e) {
    console.log('⚠️ Dati città non trovati');
}

// Routes essenziali
app.get('/', (req, res) => {
    res.render('index', {
        title: 'IT-ERA - Assistenza IT Lombardia',
        description: 'Assistenza informatica professionale in Lombardia'
    });
});

app.get('/servizi', (req, res) => {
    res.render('servizi', {
        title: 'Servizi IT - IT-ERA'
    });
});

app.get('/contatti', (req, res) => {
    res.render('contatti', {
        title: 'Contatti - IT-ERA'
    });
});

// Pagine città dinamiche
app.get('/assistenza-it-:city', (req, res) => {
    const city = citiesData[req.params.city];
    if (!city) return res.status(404).send('Città non trovata');
    
    res.render('assistenza-it-city', {
        title: `Assistenza IT ${city.name} - IT-ERA`,
        city: city
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 IT-ERA locale: http://localhost:${PORT}`);
});
