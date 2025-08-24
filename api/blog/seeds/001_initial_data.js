const bcrypt = require('bcryptjs');
const database = require('../config/database');
const config = require('../config/config');

const seedInitialData = async () => {
  console.log('🌱 Seeding initial data...');

  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123!', config.SECURITY.bcryptRounds);
    
    const adminResult = await database.run(`
      INSERT INTO users (username, email, password_hash, full_name, role, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'admin',
      'admin@it-era.it',
      adminPassword,
      'IT-ERA Administrator',
      'admin',
      1
    ]);

    console.log('✅ Created admin user (username: admin, password: admin123!)');

    // Create editor user
    const editorPassword = await bcrypt.hash('editor123!', config.SECURITY.bcryptRounds);
    
    const editorResult = await database.run(`
      INSERT INTO users (username, email, password_hash, full_name, role, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'editor',
      'editor@it-era.it', 
      editorPassword,
      'IT-ERA Editor',
      'editor',
      1
    ]);

    console.log('✅ Created editor user (username: editor, password: editor123!)');

    // Create default categories for IT-ERA services
    const categories = [
      {
        name: 'Assistenza IT',
        slug: 'assistenza-it',
        description: 'Articoli su assistenza tecnica e supporto informatico',
        color: '#0056cc'
      },
      {
        name: 'Sicurezza Informatica',
        slug: 'sicurezza-informatica',
        description: 'Guide e consigli sulla cybersecurity e protezione dati',
        color: '#dc3545'
      },
      {
        name: 'Cloud Storage',
        slug: 'cloud-storage',
        description: 'Soluzioni di archiviazione cloud e backup',
        color: '#17a2b8'
      },
      {
        name: 'News & Aggiornamenti',
        slug: 'news-aggiornamenti',
        description: 'Notizie e aggiornamenti dal mondo IT',
        color: '#28a745'
      },
      {
        name: 'Tutorial',
        slug: 'tutorial',
        description: 'Guide passo-passo e tutorial tecnici',
        color: '#ffc107'
      },
      {
        name: 'Case Study',
        slug: 'case-study',
        description: 'Studi di caso e progetti realizzati',
        color: '#6f42c1'
      }
    ];

    const categoryIds = [];
    for (const category of categories) {
      const result = await database.run(`
        INSERT INTO categories (name, slug, description, color, is_active)
        VALUES (?, ?, ?, ?, ?)
      `, [category.name, category.slug, category.description, category.color, 1]);
      
      categoryIds.push(result.id);
    }

    console.log('✅ Created', categories.length, 'default categories');

    // Create default tags
    const tags = [
      'Windows', 'MacOS', 'Linux', 'Microsoft Office', 'Backup',
      'Antivirus', 'Firewall', 'VPN', 'Cloud Computing', 'Server',
      'Network', 'Hardware', 'Software', 'Cybersecurity', 'GDPR',
      'Remote Work', 'Teamwork', 'Productivity', 'Business', 'SME',
      'IT Support', 'Help Desk', 'Troubleshooting', 'Migration',
      'Data Recovery', 'System Optimization', 'Updates', 'Security',
      'Encryption', 'Email Security', 'Web Security', 'Mobile Security'
    ];

    const tagIds = [];
    for (const tagName of tags) {
      const slug = tagName.toLowerCase().replace(/\s+/g, '-');
      const result = await database.run(`
        INSERT INTO tags (name, slug)
        VALUES (?, ?)
      `, [tagName, slug]);
      
      tagIds.push(result.id);
    }

    console.log('✅ Created', tags.length, 'default tags');

    // Create sample blog posts
    const samplePosts = [
      {
        title: 'Guida Completa alla Sicurezza Informatica per le PMI',
        slug: 'guida-sicurezza-informatica-pmi',
        excerpt: 'Scopri le migliori pratiche per proteggere la tua azienda dalle minacce informatiche. Una guida pratica con consigli specifici per le piccole e medie imprese.',
        content: `
          <h2>Introduzione alla Sicurezza Informatica</h2>
          <p>La sicurezza informatica è diventata una priorità assoluta per tutte le aziende, specialmente per le PMI che spesso non hanno risorse dedicate alla cybersecurity.</p>
          
          <h3>Le Principali Minacce</h3>
          <ul>
            <li><strong>Malware e Ransomware</strong>: Software dannosi che possono bloccare i tuoi sistemi</li>
            <li><strong>Phishing</strong>: Email fraudolente che cercano di rubare credenziali</li>
            <li><strong>Attacchi DDoS</strong>: Tentativi di sovraccaricare i tuoi server</li>
            <li><strong>Data Breach</strong>: Violazioni che compromettono i dati sensibili</li>
          </ul>

          <h3>Best Practices per la Protezione</h3>
          <p>Implementa queste strategie per proteggere la tua azienda:</p>
          <ol>
            <li>Mantieni sempre aggiornati sistemi operativi e software</li>
            <li>Utilizza password complesse e autenticazione a due fattori</li>
            <li>Effettua backup regolari e testali periodicamente</li>
            <li>Forma i dipendenti sui rischi informatici</li>
            <li>Implementa un firewall aziendale robusto</li>
          </ol>

          <h3>Soluzioni IT-ERA</h3>
          <p>IT-ERA offre servizi completi di sicurezza informatica per PMI in Lombardia:</p>
          <ul>
            <li>Audit di sicurezza completi</li>
            <li>Implementazione di sistemi antivirus enterprise</li>
            <li>Configurazione firewall e VPN</li>
            <li>Formazione del personale</li>
            <li>Monitoraggio 24/7 dei sistemi</li>
          </ul>
        `,
        author_id: adminResult.id,
        author_name: 'IT-ERA Administrator',
        status: 'published',
        service_category: 'sicurezza-informatica',
        categories: [1, 3], // Sicurezza Informatica, Tutorial
        tags: [15, 16, 29, 31], // GDPR, Cybersecurity, Security, Web Security
        target_cities: ['Milano', 'Monza', 'Bergamo', 'Como'],
        meta_title: 'Sicurezza Informatica PMI: Guida Completa 2024 | IT-ERA',
        meta_description: 'Guida completa alla sicurezza informatica per PMI: scopri le migliori pratiche, minacce comuni e soluzioni professionali. Consulenza IT-ERA Lombardia.',
        is_featured: true
      },
      {
        title: 'Cloud Storage per Aziende: Vantaggi e Migliori Soluzioni',
        slug: 'cloud-storage-aziende-vantaggi-soluzioni',
        excerpt: 'Trasforma la gestione dei dati aziendali con le soluzioni cloud storage. Confronto delle migliori piattaforme e consigli per la migrazione.',
        content: `
          <h2>Perché Scegliere il Cloud Storage</h2>
          <p>Il cloud storage rappresenta una rivoluzione nella gestione dei dati aziendali, offrendo flessibilità, sicurezza e risparmio economico.</p>

          <h3>Vantaggi Principali</h3>
          <ul>
            <li><strong>Accessibilità</strong>: Accesso ai dati da qualsiasi dispositivo e location</li>
            <li><strong>Scalabilità</strong>: Espandi lo spazio di archiviazione secondo le necessità</li>
            <li><strong>Sicurezza</strong>: Backup automatici e crittografia avanzata</li>
            <li><strong>Risparmio</strong>: Riduzione dei costi hardware e manutenzione</li>
          </ul>

          <h3>Migliori Soluzioni Cloud</h3>
          <p>Confronto delle principali piattaforme:</p>
          <table>
            <tr><th>Soluzione</th><th>Spazio</th><th>Prezzo/mese</th><th>Caratteristiche</th></tr>
            <tr><td>Microsoft 365</td><td>1TB-Illimitato</td><td>€6-22</td><td>Integrazione Office, Teams</td></tr>
            <tr><td>Google Workspace</td><td>30GB-5TB</td><td>€5-18</td><td>Collaborazione real-time</td></tr>
            <tr><td>Dropbox Business</td><td>5TB-Illimitato</td><td>€12-20</td><td>Sync veloce, versioning</td></tr>
          </table>

          <h3>Processo di Migrazione</h3>
          <p>IT-ERA ti accompagna nella transizione al cloud con un processo strutturato:</p>
          <ol>
            <li>Analisi dei dati esistenti e requirements</li>
            <li>Scelta della piattaforma più adatta</li>
            <li>Pianificazione della migrazione</li>
            <li>Trasferimento sicuro dei dati</li>
            <li>Formazione del personale</li>
            <li>Supporto post-migrazione</li>
          </ol>
        `,
        author_id: editorResult.id,
        author_name: 'IT-ERA Editor',
        status: 'published',
        service_category: 'cloud-storage',
        categories: [2, 4], // Cloud Storage, News & Aggiornamenti
        tags: [9, 19, 22], // Cloud Computing, Business, IT Support
        target_cities: ['Vimercate', 'Agrate Brianza', 'Concorezzo'],
        meta_title: 'Cloud Storage Aziende: Migliori Soluzioni 2024 | IT-ERA',
        meta_description: 'Scopri i vantaggi del cloud storage per aziende: confronto soluzioni, prezzi e servizi di migrazione professionale IT-ERA in Lombardia.',
        is_featured: true
      },
      {
        title: 'Assistenza IT Remota: Come Funziona e Quando Sceglierla',
        slug: 'assistenza-it-remota-come-funziona',
        excerpt: 'L\'assistenza IT remota permette di risolvere problemi informatici rapidamente e in sicurezza. Scopri vantaggi, tecnologie e quando è la soluzione ideale.',
        content: `
          <h2>Cos'è l'Assistenza IT Remota</h2>
          <p>L'assistenza IT remota permette ai nostri tecnici di accedere al tuo computer o sistema aziendale da remoto per diagnosticare e risolvere problemi informatici.</p>

          <h3>Come Funziona</h3>
          <p>Il processo è semplice e sicuro:</p>
          <ol>
            <li>Contatti il nostro help desk</li>
            <li>Il tecnico ti invia un link sicuro per la connessione</li>
            <li>Accetti la connessione temporanea</li>
            <li>Il tecnico lavora sul problema mentre tu puoi osservare</li>
            <li>Al termine, la connessione viene automaticamente chiusa</li>
          </ol>

          <h3>Vantaggi dell'Assistenza Remota</h3>
          <ul>
            <li><strong>Rapidità</strong>: Risoluzione immediata senza attese</li>
            <li><strong>Convenienza</strong>: Costi ridotti rispetto all'intervento on-site</li>
            <li><strong>Sicurezza</strong>: Connessioni crittografate e temporanee</li>
            <li><strong>Flessibilità</strong>: Disponibile anche fuori orario lavorativo</li>
          </ul>

          <h3>Quando Scegliere l'Assistenza Remota</h3>
          <p>L'assistenza remota è ideale per:</p>
          <ul>
            <li>Problemi software e configurazioni</li>
            <li>Aggiornamenti di sistema</li>
            <li>Installazione e configurazione programmi</li>
            <li>Formazione sull'uso di applicazioni</li>
            <li>Diagnosi preliminare di problemi complessi</li>
          </ul>

          <h3>Tecnologie Utilizzate</h3>
          <p>IT-ERA utilizza le migliori piattaforme per l'assistenza remota:</p>
          <ul>
            <li>TeamViewer Business</li>
            <li>Microsoft Remote Desktop</li>
            <li>Chrome Remote Desktop</li>
            <li>Soluzioni proprietarie sicure</li>
          </ul>
        `,
        author_id: adminResult.id,
        author_name: 'IT-ERA Administrator',
        status: 'published',
        service_category: 'assistenza-it',
        categories: [0, 4], // Assistenza IT, Tutorial
        tags: [16, 21, 23], // Remote Work, IT Support, Help Desk
        target_cities: ['Milano', 'Bergamo', 'Lecco'],
        meta_title: 'Assistenza IT Remota: Vantaggi e Tecnologie | IT-ERA',
        meta_description: 'Assistenza IT remota professionale: risoluzione rapida problemi informatici, supporto sicuro e conveniente. Servizi IT-ERA in Lombardia.',
        is_featured: false
      },
      {
        title: 'Backup Aziendale: Strategie e Best Practices 2024',
        slug: 'backup-aziendale-strategie-best-practices',
        excerpt: 'Una strategia di backup efficace è fondamentale per la continuità aziendale. Scopri le migliori pratiche e soluzioni per proteggere i tuoi dati.',
        content: `
          <h2>L'Importanza del Backup Aziendale</h2>
          <p>Il backup dei dati aziendali non è solo una precauzione: è un requisito fondamentale per la sopravvivenza dell'azienda in caso di disastri informatici.</p>

          <h3>Regola del 3-2-1</h3>
          <p>La strategia di backup più affidabile segue la regola 3-2-1:</p>
          <ul>
            <li><strong>3 copie</strong> dei dati importanti</li>
            <li><strong>2 supporti diversi</strong> (es. locale + cloud)</li>
            <li><strong>1 copia offsite</strong> (geograficamente separata)</li>
          </ul>

          <h3>Tipi di Backup</h3>
          <table>
            <tr><th>Tipo</th><th>Descrizione</th><th>Vantaggi</th><th>Svantaggi</th></tr>
            <tr><td>Completo</td><td>Tutti i dati</td><td>Ripristino veloce</td><td>Tempo e spazio elevati</td></tr>
            <tr><td>Incrementale</td><td>Solo modifiche</td><td>Veloce ed efficiente</td><td>Ripristino complesso</td></tr>
            <tr><td>Differenziale</td><td>Modifiche dall'ultimo completo</td><td>Buon compromesso</td><td>Cresce nel tempo</td></tr>
          </table>

          <h3>Soluzioni di Backup Professionale</h3>
          <p>IT-ERA offre diverse soluzioni:</p>
          <ul>
            <li><strong>Backup Cloud</strong>: Archiviazione sicura su server geograficamente distribuiti</li>
            <li><strong>NAS Aziendale</strong>: Storage locale con ridondanza</li>
            <li><strong>Backup Ibrido</strong>: Combinazione locale + cloud</li>
            <li><strong>Disaster Recovery</strong>: Piano completo di ripristino</li>
          </ul>

          <h3>Frequenza di Backup</h3>
          <p>Raccomandazioni per diversi tipi di dati:</p>
          <ul>
            <li><strong>Dati critici</strong>: Backup continuo o ogni ora</li>
            <li><strong>Dati operativi</strong>: Backup giornaliero</li>
            <li><strong>Archivi</strong>: Backup settimanale o mensile</li>
          </ul>
        `,
        author_id: editorResult.id,
        author_name: 'IT-ERA Editor',
        status: 'scheduled',
        scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        service_category: 'assistenza-it',
        categories: [0, 2, 4], // Assistenza IT, Cloud Storage, Tutorial
        tags: [5, 9, 25], // Backup, Cloud Computing, Data Recovery
        target_cities: ['Como', 'Varese', 'Monza'],
        meta_title: 'Backup Aziendale: Strategie e Soluzioni Professionali | IT-ERA',
        meta_description: 'Strategie di backup aziendali efficaci: regola 3-2-1, tipologie di backup e soluzioni professionali. Consulenza IT-ERA per PMI lombarde.',
        is_featured: false
      }
    ];

    // Insert sample posts
    for (let i = 0; i < samplePosts.length; i++) {
      const post = samplePosts[i];
      
      const postResult = await database.run(`
        INSERT INTO posts (
          title, slug, excerpt, content, author_id, author_name, status,
          published_at, scheduled_for, service_category, target_cities,
          meta_title, meta_description, is_featured
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        post.title,
        post.slug,
        post.excerpt,
        post.content,
        post.author_id,
        post.author_name,
        post.status,
        post.status === 'published' ? new Date().toISOString() : null,
        post.scheduled_for || null,
        post.service_category,
        JSON.stringify(post.target_cities),
        post.meta_title,
        post.meta_description,
        post.is_featured ? 1 : 0
      ]);

      // Associate categories
      for (const categoryIndex of post.categories) {
        await database.run(
          'INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)',
          [postResult.id, categoryIds[categoryIndex]]
        );
      }

      // Associate tags
      for (const tagIndex of post.tags) {
        await database.run(
          'INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)',
          [postResult.id, tagIds[tagIndex - 1]] // Adjust for 0-based indexing
        );
      }

      // Add some view counts for published posts
      if (post.status === 'published') {
        const views = Math.floor(Math.random() * 150) + 25; // 25-175 views
        await database.run(
          'UPDATE posts SET view_count = ? WHERE id = ?',
          [views, postResult.id]
        );
      }
    }

    console.log('✅ Created', samplePosts.length, 'sample blog posts');

    // Create some sample analytics data
    const analyticsEvents = [
      { metric: 'page_view', values: Array.from({length: 30}, () => Math.floor(Math.random() * 50) + 20) },
      { metric: 'post_view', values: Array.from({length: 30}, () => Math.floor(Math.random() * 30) + 10) },
      { metric: 'post_like', values: Array.from({length: 30}, () => Math.floor(Math.random() * 5) + 1) },
      { metric: 'search', values: Array.from({length: 30}, () => Math.floor(Math.random() * 8) + 2) }
    ];

    for (let day = 29; day >= 0; day--) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      const dateStr = date.toISOString().split('T')[0];

      for (const event of analyticsEvents) {
        await database.run(`
          INSERT INTO analytics (metric_name, metric_value, date_recorded, additional_data)
          VALUES (?, ?, ?, ?)
        `, [
          event.metric,
          event.values[29 - day],
          dateStr,
          JSON.stringify({
            generated_by: 'seed_data',
            simulated: true
          })
        ]);
      }
    }

    console.log('✅ Created sample analytics data for 30 days');

    // Create some site settings
    const settings = [
      {
        key: 'site_title',
        value: 'IT-ERA Blog',
        type: 'text',
        description: 'Titolo principale del blog'
      },
      {
        key: 'site_description',
        value: 'Il blog di IT-ERA: guide, tutorial e novità dal mondo informatico per aziende lombarde.',
        type: 'text',
        description: 'Descrizione del sito per SEO'
      },
      {
        key: 'posts_per_page',
        value: '10',
        type: 'number',
        description: 'Numero di post per pagina'
      },
      {
        key: 'enable_comments',
        value: 'true',
        type: 'boolean',
        description: 'Abilita commenti sui post'
      },
      {
        key: 'contact_email',
        value: 'info@it-era.it',
        type: 'text',
        description: 'Email di contatto principale'
      }
    ];

    for (const setting of settings) {
      await database.run(`
        INSERT INTO settings (setting_key, setting_value, setting_type, description, updated_by)
        VALUES (?, ?, ?, ?, ?)
      `, [setting.key, setting.value, setting.type, setting.description, adminResult.id]);
    }

    console.log('✅ Created', settings.length, 'site settings');

    console.log('🎉 Initial data seeding completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('- Admin user: admin@it-era.it (password: admin123!)');
    console.log('- Editor user: editor@it-era.it (password: editor123!)');
    console.log('-', categories.length, 'categories created');
    console.log('-', tags.length, 'tags created');
    console.log('-', samplePosts.length, 'sample posts created');
    console.log('- 30 days of analytics data generated');
    console.log('-', settings.length, 'site settings configured');

  } catch (error) {
    console.error('❌ Error seeding initial data:', error);
    throw error;
  }
};

module.exports = seedInitialData;