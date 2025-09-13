#!/usr/bin/env node

/**
 * Script per aggiornare le pagine keyword con gli script Resend
 * Aggiunge resend-config.js alle pagine esistenti
 */

const fs = require('fs');
const path = require('path');

// Funzione per aggiornare una singola pagina
function updatePageWithResendScript(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Controlla se resend-config.js è già presente
        if (content.includes('resend-config.js')) {
            console.log(`✅ ${filePath} - già aggiornato`);
            return false;
        }
        
        // Cerca il pattern per inserire resend-config.js
        const pattern = /(<script src="\/js\/components-loader\.js"><\/script>)/;
        
        if (pattern.test(content)) {
            // Inserisce resend-config.js prima di components-loader.js
            content = content.replace(
                pattern,
                '    <script src="/js/resend-config.js"></script>\n    $1'
            );
            
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ ${filePath} - aggiornato con resend-config.js`);
            return true;
        } else {
            console.log(`⚠️ ${filePath} - pattern non trovato`);
            return false;
        }
        
    } catch (error) {
        console.error(`❌ Errore aggiornando ${filePath}:`, error.message);
        return false;
    }
}

// Funzione principale
async function updateAllPages() {
    console.log('🔧 Aggiornamento pagine keyword con script Resend...\n');
    
    const keywordDir = './servizi-keyword';
    
    if (!fs.existsSync(keywordDir)) {
        console.error('❌ Directory servizi-keyword non trovata');
        return;
    }
    
    const files = fs.readdirSync(keywordDir)
        .filter(file => file.endsWith('.html'))
        .slice(0, 10); // Aggiorna solo le prime 10 per test
    
    console.log(`📄 Trovate ${files.length} pagine da aggiornare (test)...\n`);
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const file of files) {
        const filePath = path.join(keywordDir, file);
        const result = updatePageWithResendScript(filePath);
        
        if (result === true) {
            updated++;
        } else if (result === false) {
            skipped++;
        } else {
            errors++;
        }
    }
    
    console.log('\n📊 Risultati:');
    console.log(`✅ Aggiornate: ${updated}`);
    console.log(`⏭️ Saltate: ${skipped}`);
    console.log(`❌ Errori: ${errors}`);
    
    if (updated > 0) {
        console.log('\n🎯 Pagine aggiornate con successo!');
        console.log('💡 Per aggiornare tutte le pagine, rimuovi .slice(0, 10) dallo script');
    }
}

// Esegui lo script
if (require.main === module) {
    updateAllPages().catch(console.error);
}

module.exports = { updatePageWithResendScript };
