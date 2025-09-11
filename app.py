#!/usr/bin/env python3
"""
IT-ERA Web Application
Dashboard web per gestione ticket, ore e monitoraggio sistema
"""

import sys
import os
import sqlite3
import json
from datetime import datetime, timedelta
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, session

# Aggiungi path per moduli IT-ERA
sys.path.append('/Users/andreapanzeri/progetti/IT-ERA/config')
sys.path.append('/Users/andreapanzeri/progetti/IT-ERA/api')

from logging_config import setup_component_logger
from integrations import IntegrationOrchestrator

# Inizializza Flask app
app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'it-era-secret-key-change-in-production')

# Configurazione
app.config.update(
    DEBUG=os.environ.get('FLASK_ENV') == 'development',
    DATABASE_PATH='/Users/andreapanzeri/progetti/IT-ERA/database/it_era.db'
)

# Logger
logger = setup_component_logger("web_app")

def get_db_connection():
    """Connessione database"""
    conn = sqlite3.connect(app.config['DATABASE_PATH'])
    conn.row_factory = sqlite3.Row  # Accesso per nome colonna
    return conn

@app.route('/')
def dashboard():
    """Dashboard principale"""
    
    try:
        conn = get_db_connection()
        
        # Statistiche generali
        stats = {
            'clienti_attivi': conn.execute('SELECT COUNT(*) FROM clienti WHERE contratto_attivo = 1').fetchone()[0],
            'ticket_aperti': conn.execute('SELECT COUNT(*) FROM ticket WHERE stato = "aperto"').fetchone()[0],
            'ticket_in_lavorazione': conn.execute('SELECT COUNT(*) FROM ticket WHERE stato = "in_lavorazione"').fetchone()[0],
            'ore_mese_corrente': conn.execute("""
                SELECT COALESCE(SUM(ore), 0) FROM ore_lavorate 
                WHERE strftime('%Y-%m', data_lavoro) = strftime('%Y-%m', 'now')
            """).fetchone()[0]
        }
        
        # Ticket recenti
        ticket_recenti = conn.execute("""
            SELECT t.*, c.nome_cliente 
            FROM ticket t
            LEFT JOIN clienti c ON t.cliente_id = c.id
            ORDER BY t.data_creazione DESC
            LIMIT 10
        """).fetchall()
        
        # Alert sicurezza recenti
        security_alerts = conn.execute("""
            SELECT * FROM log_sistema 
            WHERE componente = 'security_alert' 
            AND timestamp >= datetime('now', '-7 days')
            ORDER BY timestamp DESC
            LIMIT 5
        """).fetchall()
        
        conn.close()
        
        return render_template('dashboard.html', 
                             stats=stats, 
                             ticket_recenti=ticket_recenti,
                             security_alerts=security_alerts)
    
    except Exception as e:
        logger.error(f"Errore dashboard: {str(e)}")
        flash(f"Errore caricamento dashboard: {str(e)}", 'error')
        return render_template('error.html'), 500

@app.route('/ticket')
def ticket_list():
    """Lista ticket"""
    
    try:
        conn = get_db_connection()
        
        # Filtri dalla query string
        stato_filter = request.args.get('stato', '')
        cliente_filter = request.args.get('cliente', '')
        
        query = """
            SELECT t.*, c.nome_cliente 
            FROM ticket t
            LEFT JOIN clienti c ON t.cliente_id = c.id
            WHERE 1=1
        """
        params = []
        
        if stato_filter:
            query += " AND t.stato = ?"
            params.append(stato_filter)
        
        if cliente_filter:
            query += " AND c.nome_cliente LIKE ?"
            params.append(f"%{cliente_filter}%")
        
        query += " ORDER BY t.data_creazione DESC"
        
        tickets = conn.execute(query, params).fetchall()
        
        # Lista clienti per filtro
        clienti = conn.execute('SELECT DISTINCT nome_cliente FROM clienti ORDER BY nome_cliente').fetchall()
        
        conn.close()
        
        return render_template('ticket_list.html', 
                             tickets=tickets, 
                             clienti=clienti,
                             stato_filter=stato_filter,
                             cliente_filter=cliente_filter)
    
    except Exception as e:
        logger.error(f"Errore lista ticket: {str(e)}")
        flash(f"Errore caricamento ticket: {str(e)}", 'error')
        return redirect(url_for('dashboard'))

@app.route('/ticket/new', methods=['GET', 'POST'])
def nuovo_ticket():
    """Crea nuovo ticket"""
    
    if request.method == 'POST':
        try:
            conn = get_db_connection()
            
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO ticket (
                    cliente_id, titolo, descrizione, priorita, categoria, ore_stimate
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                request.form['cliente_id'],
                request.form['titolo'],
                request.form['descrizione'],
                request.form['priorita'],
                request.form['categoria'],
                float(request.form['ore_stimate']) if request.form['ore_stimate'] else None
            ))
            
            ticket_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            logger.info(f"Nuovo ticket creato: {ticket_id}", utente=session.get('user'))
            flash('Ticket creato con successo!', 'success')
            return redirect(url_for('ticket_detail', ticket_id=ticket_id))
        
        except Exception as e:
            logger.error(f"Errore creazione ticket: {str(e)}")
            flash(f"Errore creazione ticket: {str(e)}", 'error')
    
    # GET: mostra form
    try:
        conn = get_db_connection()
        clienti = conn.execute('SELECT id, nome_cliente FROM clienti WHERE contratto_attivo = 1').fetchall()
        conn.close()
        
        return render_template('nuovo_ticket.html', clienti=clienti)
    
    except Exception as e:
        logger.error(f"Errore form nuovo ticket: {str(e)}")
        return redirect(url_for('dashboard'))

@app.route('/ticket/<int:ticket_id>')
def ticket_detail(ticket_id):
    """Dettaglio ticket"""
    
    try:
        conn = get_db_connection()
        
        # Dati ticket
        ticket = conn.execute("""
            SELECT t.*, c.nome_cliente 
            FROM ticket t
            LEFT JOIN clienti c ON t.cliente_id = c.id
            WHERE t.id = ?
        """, (ticket_id,)).fetchone()
        
        if not ticket:
            flash('Ticket non trovato', 'error')
            return redirect(url_for('ticket_list'))
        
        # Ore lavorate per questo ticket
        ore_lavorate = conn.execute("""
            SELECT * FROM ore_lavorate 
            WHERE ticket_id = ?
            ORDER BY data_lavoro DESC
        """, (ticket_id,)).fetchall()
        
        conn.close()
        
        return render_template('ticket_detail.html', 
                             ticket=ticket, 
                             ore_lavorate=ore_lavorate)
    
    except Exception as e:
        logger.error(f"Errore dettaglio ticket {ticket_id}: {str(e)}")
        flash(f"Errore caricamento ticket: {str(e)}", 'error')
        return redirect(url_for('ticket_list'))

@app.route('/ore/add', methods=['POST'])
def aggiungi_ore():
    """Aggiunge ore lavorate a un ticket"""
    
    try:
        conn = get_db_connection()
        
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO ore_lavorate (
                ticket_id, cliente_id, tecnico, ore, data_lavoro, 
                descrizione_attivita, fatturabile, tariffa_oraria
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            request.form['ticket_id'],
            request.form['cliente_id'],
            request.form['tecnico'],
            float(request.form['ore']),
            request.form['data_lavoro'],
            request.form['descrizione_attivita'],
            request.form.get('fatturabile') == 'on',
            float(request.form['tariffa_oraria']) if request.form['tariffa_oraria'] else None
        ))
        
        # Aggiorna ore totali nel ticket
        cursor.execute("""
            UPDATE ticket 
            SET ore_lavorate = (
                SELECT SUM(ore) FROM ore_lavorate WHERE ticket_id = ?
            )
            WHERE id = ?
        """, (request.form['ticket_id'], request.form['ticket_id']))
        
        conn.commit()
        conn.close()
        
        logger.info(f"Ore aggiunte al ticket {request.form['ticket_id']}", utente=session.get('user'))
        flash('Ore registrate con successo!', 'success')
        
        return redirect(url_for('ticket_detail', ticket_id=request.form['ticket_id']))
    
    except Exception as e:
        logger.error(f"Errore registrazione ore: {str(e)}")
        flash(f"Errore registrazione ore: {str(e)}", 'error')
        return redirect(url_for('dashboard'))

@app.route('/clienti')
def clienti_list():
    """Lista clienti"""
    
    try:
        conn = get_db_connection()
        
        clienti = conn.execute("""
            SELECT c.*, 
                   COUNT(t.id) as totale_ticket,
                   SUM(CASE WHEN t.stato = 'aperto' THEN 1 ELSE 0 END) as ticket_aperti,
                   COALESCE(SUM(o.ore), 0) as ore_totali
            FROM clienti c
            LEFT JOIN ticket t ON c.id = t.cliente_id
            LEFT JOIN ore_lavorate o ON c.id = o.cliente_id
            GROUP BY c.id
            ORDER BY c.nome_cliente
        """).fetchall()
        
        conn.close()
        
        return render_template('clienti_list.html', clienti=clienti)
    
    except Exception as e:
        logger.error(f"Errore lista clienti: {str(e)}")
        flash(f"Errore caricamento clienti: {str(e)}", 'error')
        return redirect(url_for('dashboard'))

@app.route('/api/stats')
def api_stats():
    """API per statistiche dashboard (JSON)"""
    
    try:
        conn = get_db_connection()
        
        # Statistiche ultime 24 ore
        stats = {
            'ticket_oggi': conn.execute("""
                SELECT COUNT(*) FROM ticket 
                WHERE date(data_creazione) = date('now')
            """).fetchone()[0],
            
            'ore_oggi': conn.execute("""
                SELECT COALESCE(SUM(ore), 0) FROM ore_lavorate 
                WHERE data_lavoro = date('now')
            """).fetchone()[0],
            
            'alert_oggi': conn.execute("""
                SELECT COUNT(*) FROM log_sistema 
                WHERE componente = 'security_alert' 
                AND date(timestamp) = date('now')
            """).fetchone()[0],
            
            'backup_status': conn.execute("""
                SELECT COUNT(*) FROM backup_jobs 
                WHERE stato_ultimo_backup = 'success'
                AND date(ultima_esecuzione) = date('now')
            """).fetchone()[0]
        }
        
        conn.close()
        
        return jsonify(stats)
    
    except Exception as e:
        logger.error(f"Errore API stats: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/sync/trigger', methods=['POST'])
def trigger_sync():
    """Trigger manuale sincronizzazione"""
    
    try:
        sync_type = request.json.get('type', 'all')
        
        orchestrator = IntegrationOrchestrator()
        
        if sync_type == 'crm':
            success = orchestrator.sync_all_crm_data()
        elif sync_type == 'security':
            alerts = orchestrator.monitor_security_alerts()
            success = True
        else:
            success = orchestrator.sync_all_crm_data()
        
        logger.info(f"Sincronizzazione manuale {sync_type} avviata", utente=session.get('user'))
        
        return jsonify({
            'success': success,
            'message': f'Sincronizzazione {sync_type} completata'
        })
    
    except Exception as e:
        logger.error(f"Errore trigger sync: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/health')
def health_check():
    """Health check per monitoring"""
    
    try:
        # Test database
        conn = get_db_connection()
        conn.execute('SELECT 1')
        conn.close()
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'version': '1.0'
        })
    
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.errorhandler(404)
def not_found(error):
    return render_template('error.html', 
                         error_code=404, 
                         error_message="Pagina non trovata"), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('error.html', 
                         error_code=500, 
                         error_message="Errore interno del server"), 500

# Template di base (se non esistono file template)
@app.before_first_request
def create_basic_templates():
    """Crea template HTML di base se non esistono"""
    
    templates_dir = os.path.join(os.path.dirname(__file__), 'templates')
    os.makedirs(templates_dir, exist_ok=True)
    
    # Template base
    base_template = '''<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}IT-ERA{% endblock %}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="{{ url_for('dashboard') }}">IT-ERA</a>
            <div class="navbar-nav">
                <a class="nav-link" href="{{ url_for('dashboard') }}">Dashboard</a>
                <a class="nav-link" href="{{ url_for('ticket_list') }}">Ticket</a>
                <a class="nav-link" href="{{ url_for('clienti_list') }}">Clienti</a>
            </div>
        </div>
    </nav>
    
    <div class="container mt-4">
        {% with messages = get_flashed_messages(with_categories=true) %}
            {% if messages %}
                {% for category, message in messages %}
                    <div class="alert alert-{{ 'danger' if category=='error' else category }} alert-dismissible fade show">
                        {{ message }}
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                {% endfor %}
            {% endif %}
        {% endwith %}
        
        {% block content %}{% endblock %}
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    {% block scripts %}{% endblock %}
</body>
</html>'''
    
    with open(os.path.join(templates_dir, 'base.html'), 'w', encoding='utf-8') as f:
        f.write(base_template)

if __name__ == '__main__':
    logger.info("Avvio applicazione web IT-ERA")
    
    # Modalità debug solo in development
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    
    app.run(
        host='0.0.0.0',
        port=int(os.environ.get('PORT', 5000)),
        debug=debug_mode
    )
