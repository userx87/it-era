#!/usr/bin/env python3
"""
IT-ERA Sync Manager
Gestore sincronizzazioni automatiche per cronjob
"""

import sys
import os
import sqlite3
import json
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Aggiungi path per logging e API
sys.path.append('/Users/andreapanzeri/progetti/IT-ERA/config')
sys.path.append('/Users/andreapanzeri/progetti/IT-ERA/api')
sys.path.append('/Users/andreapanzeri/progetti/IT-ERA/automations/backup')

from logging_config import setup_component_logger
from integrations import IntegrationOrchestrator, HubSpotAPI, BitdefenderAPI
from backup_manager import BackupManager

class SyncManager:
    """Gestore sincronizzazioni automatiche"""
    
    def __init__(self):
        self.logger = setup_component_logger("sync_manager")
        self.db_path = '/Users/andreapanzeri/progetti/IT-ERA/database/it_era.db'
        self.notification_email = "admin@bulltech.it"
    
    def run_daily_sync(self):
        """Esegue sincronizzazione giornaliera completa"""
        
        self.logger.info("=== INIZIO SINCRONIZZAZIONE GIORNALIERA ===")
        
        results = {
            'timestamp': datetime.now().isoformat(),
            'tasks': {}
        }
        
        try:
            # 1. Sincronizzazione CRM
            self.logger.info("Sincronizzazione dati CRM...")
            orchestrator = IntegrationOrchestrator()
            results['tasks']['crm_sync'] = orchestrator.sync_all_crm_data()
            
            # 2. Monitoraggio sicurezza
            self.logger.info("Controllo alert di sicurezza...")
            security_alerts = orchestrator.monitor_security_alerts()
            results['tasks']['security_check'] = len(security_alerts) == 0  # True se nessun alert
            results['security_alerts_count'] = len(security_alerts)
            
            # 3. Backup automatici
            self.logger.info("Esecuzione backup programmati...")
            backup_manager = BackupManager()
            backup_jobs = self._get_scheduled_backups()
            backup_results = []
            
            for job_id in backup_jobs:
                success = backup_manager.execute_backup(job_id)
                backup_results.append(success)
            
            results['tasks']['backups'] = all(backup_results) if backup_results else True
            results['backup_jobs_executed'] = len(backup_results)
            
            # 4. Pulizia log vecchi
            self.logger.info("Pulizia log e file temporanei...")
            cleanup_success = self._cleanup_system()
            results['tasks']['cleanup'] = cleanup_success
            
            # 5. Verifica spazio disco
            self.logger.info("Controllo spazio disco...")
            disk_check = self._check_disk_space()
            results['tasks']['disk_check'] = disk_check['status'] == 'ok'
            results['disk_usage'] = disk_check
            
            # 6. Aggiornamento statistiche
            self.logger.info("Aggiornamento statistiche sistema...")
            stats_update = self._update_system_stats()
            results['tasks']['stats_update'] = stats_update
            
            # Calcola risultato generale
            all_success = all(results['tasks'].values())
            results['overall_success'] = all_success
            
            # Salva risultati
            self._save_sync_results(results)
            
            # Notifica se errori
            if not all_success or len(security_alerts) > 0:
                self._send_notification(results, security_alerts)
            
            self.logger.info(f"=== SINCRONIZZAZIONE COMPLETATA - Status: {'SUCCESS' if all_success else 'PARTIAL'} ===")
            
            return results
            
        except Exception as e:
            self.logger.error(f"Errore durante sincronizzazione giornaliera: {str(e)}")
            results['overall_success'] = False
            results['error'] = str(e)
            
            # Notifica errore critico
            self._send_error_notification(str(e))
            
            return results
    
    def _get_scheduled_backups(self):
        """Recupera backup programmati per oggi"""
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Backup giornalieri (cron con schedule per oggi)
            cursor.execute("""
                SELECT id FROM backup_jobs 
                WHERE attivo = 1 
                AND schedule_cron IS NOT NULL
                AND (
                    schedule_cron LIKE '%daily%' 
                    OR schedule_cron LIKE '0 2 * * *'
                    OR schedule_cron LIKE '0 3 * * *'
                )
            """)
            
            job_ids = [row[0] for row in cursor.fetchall()]
            conn.close()
            
            return job_ids
            
        except Exception as e:
            self.logger.error(f"Errore recupero backup programmati: {str(e)}")
            return []
    
    def _cleanup_system(self):
        """Pulizia sistema - log vecchi, file temporanei"""
        
        try:
            # Importa funzione cleanup
            from logging_config import cleanup_old_logs
            
            # Pulizia log (30 giorni)
            cleanup_old_logs(30)
            
            # Pulizia file temporanei
            temp_dirs = ['/tmp', '/Users/andreapanzeri/progetti/IT-ERA/logs']
            
            for temp_dir in temp_dirs:
                if os.path.exists(temp_dir):
                    for file in os.listdir(temp_dir):
                        file_path = os.path.join(temp_dir, file)
                        if os.path.isfile(file_path):
                            # Rimuovi file più vecchi di 7 giorni
                            file_age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(file_path))
                            if file_age > timedelta(days=7) and file.startswith('temp_'):
                                os.remove(file_path)
                                self.logger.info(f"Rimosso file temporaneo: {file}")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Errore pulizia sistema: {str(e)}")
            return False
    
    def _check_disk_space(self):
        """Controlla spazio disco disponibile"""
        
        try:
            # Controlla spazio su partizione principale
            statvfs = os.statvfs('/Users/andreapanzeri')
            
            # Calcola spazio in GB
            total_space = (statvfs.f_frsize * statvfs.f_blocks) / (1024**3)
            free_space = (statvfs.f_frsize * statvfs.f_available) / (1024**3)
            used_space = total_space - free_space
            usage_percent = (used_space / total_space) * 100
            
            disk_info = {
                'total_gb': round(total_space, 2),
                'free_gb': round(free_space, 2),
                'used_gb': round(used_space, 2),
                'usage_percent': round(usage_percent, 2),
                'status': 'ok' if usage_percent < 85 else 'warning' if usage_percent < 95 else 'critical'
            }
            
            if disk_info['status'] != 'ok':
                self.logger.warning(f"Spazio disco insufficiente: {usage_percent:.1f}% utilizzato")
            
            return disk_info
            
        except Exception as e:
            self.logger.error(f"Errore controllo spazio disco: {str(e)}")
            return {'status': 'error', 'error': str(e)}
    
    def _update_system_stats(self):
        """Aggiorna statistiche di sistema"""
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Statistiche ticket
            cursor.execute("""
                SELECT 
                    COUNT(*) as totale,
                    SUM(CASE WHEN stato = 'aperto' THEN 1 ELSE 0 END) as aperti,
                    SUM(CASE WHEN stato = 'risolto' THEN 1 ELSE 0 END) as risolti,
                    AVG(ore_lavorate) as ore_medie
                FROM ticket
                WHERE data_creazione >= datetime('now', '-30 days')
            """)
            
            ticket_stats = cursor.fetchone()
            
            # Statistiche clienti attivi
            cursor.execute("""
                SELECT COUNT(*) FROM clienti WHERE contratto_attivo = 1
            """)
            
            clienti_attivi = cursor.fetchone()[0]
            
            # Salva statistiche nel log
            stats = {
                'ticket_ultimo_mese': {
                    'totale': ticket_stats[0],
                    'aperti': ticket_stats[1],
                    'risolti': ticket_stats[2],
                    'ore_medie': round(ticket_stats[3] or 0, 2)
                },
                'clienti_attivi': clienti_attivi,
                'aggiornamento': datetime.now().isoformat()
            }
            
            cursor.execute("""
                INSERT INTO log_sistema (
                    livello, componente, messaggio, dettagli
                ) VALUES (?, ?, ?, ?)
            """, (
                "INFO",
                "system_stats",
                "Aggiornamento statistiche giornaliere",
                json.dumps(stats)
            ))
            
            conn.commit()
            conn.close()
            
            self.logger.info("Statistiche sistema aggiornate")
            return True
            
        except Exception as e:
            self.logger.error(f"Errore aggiornamento statistiche: {str(e)}")
            return False
    
    def _save_sync_results(self, results):
        """Salva risultati sincronizzazione nel database"""
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO log_sistema (
                    livello, componente, messaggio, dettagli
                ) VALUES (?, ?, ?, ?)
            """, (
                "INFO" if results['overall_success'] else "ERROR",
                "daily_sync",
                f"Sincronizzazione giornaliera - {'SUCCESS' if results['overall_success'] else 'FAILED'}",
                json.dumps(results, default=str)
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            self.logger.error(f"Errore salvataggio risultati sync: {str(e)}")
    
    def _send_notification(self, results, security_alerts):
        """Invia notifica email per problemi o alert"""
        
        try:
            # Configurazione SMTP (da environment variables)
            smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
            smtp_port = int(os.getenv('SMTP_PORT', '587'))
            smtp_user = os.getenv('SMTP_USER')
            smtp_password = os.getenv('SMTP_PASSWORD')
            
            if not all([smtp_user, smtp_password]):
                self.logger.warning("Configurazione SMTP mancante - notifica non inviata")
                return
            
            # Componi messaggio
            msg = MIMEMultipart()
            msg['From'] = smtp_user
            msg['To'] = self.notification_email
            msg['Subject'] = f"IT-ERA Report Giornaliero - {datetime.now().strftime('%Y-%m-%d')}"
            
            # Corpo email
            body = self._format_notification_body(results, security_alerts)
            msg.attach(MIMEText(body, 'html'))
            
            # Invia email
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
            server.quit()
            
            self.logger.info("Notifica email inviata")
            
        except Exception as e:
            self.logger.error(f"Errore invio notifica: {str(e)}")
    
    def _format_notification_body(self, results, security_alerts):
        """Formatta corpo della notifica"""
        
        status_icon = "✅" if results['overall_success'] else "❌"
        
        html = f"""
        <html>
        <body>
            <h2>{status_icon} Report IT-ERA - {datetime.now().strftime('%Y-%m-%d')}</h2>
            
            <h3>Riepilogo Attività</h3>
            <table border="1" style="border-collapse: collapse;">
                <tr><th>Task</th><th>Status</th></tr>
        """
        
        for task, success in results['tasks'].items():
            icon = "✅" if success else "❌"
            html += f"<tr><td>{task.replace('_', ' ').title()}</td><td>{icon}</td></tr>"
        
        html += "</table>"
        
        # Alert sicurezza
        if security_alerts:
            html += f"""
            <h3>⚠️ Alert di Sicurezza ({len(security_alerts)})</h3>
            <ul>
            """
            for alert in security_alerts[:5]:  # Primi 5 alert
                html += f"<li><strong>{alert['source']}</strong>: {alert['description']}</li>"
            html += "</ul>"
        
        # Spazio disco
        if 'disk_usage' in results:
            disk = results['disk_usage']
            disk_icon = "🟢" if disk['usage_percent'] < 85 else "🟡" if disk['usage_percent'] < 95 else "🔴"
            html += f"""
            <h3>💾 Spazio Disco</h3>
            <p>{disk_icon} Utilizzo: {disk['usage_percent']}% ({disk['used_gb']} GB / {disk['total_gb']} GB)</p>
            """
        
        html += """
            <hr>
            <p><small>Generato automaticamente da IT-ERA Sync Manager</small></p>
        </body>
        </html>
        """
        
        return html
    
    def _send_error_notification(self, error_message):
        """Invia notifica per errori critici"""
        
        try:
            # Log errore critico
            self.logger.critical(f"Errore critico sincronizzazione: {error_message}")
            
            # Qui si potrebbe implementare notifica urgente (SMS, Slack, etc.)
            # Per ora solo log
            
        except Exception as e:
            self.logger.error(f"Errore invio notifica critica: {str(e)}")
    
    def run_hourly_check(self):
        """Controlli orari leggeri"""
        
        self.logger.info("=== CONTROLLO ORARIO ===")
        
        try:
            # Controlla servizi critici
            services_status = self._check_critical_services()
            
            # Controlla nuovi ticket urgenti
            urgent_tickets = self._check_urgent_tickets()
            
            # Log risultati
            if urgent_tickets:
                self.logger.warning(f"Trovati {len(urgent_tickets)} ticket urgenti")
                # Possibile notifica immediata per ticket critici
            
            if not services_status['all_ok']:
                self.logger.error("Alcuni servizi critici non rispondono")
            
            return {
                'services': services_status,
                'urgent_tickets': len(urgent_tickets)
            }
            
        except Exception as e:
            self.logger.error(f"Errore controllo orario: {str(e)}")
            return None
    
    def _check_critical_services(self):
        """Controlla stato servizi critici"""
        
        services = {
            'database': self._test_database_connection(),
            'api_hubspot': self._test_api_connection('HubSpot'),
            'api_bitdefender': self._test_api_connection('Bitdefender')
        }
        
        all_ok = all(services.values())
        
        return {
            'all_ok': all_ok,
            'services': services,
            'timestamp': datetime.now().isoformat()
        }
    
    def _test_database_connection(self):
        """Test connessione database"""
        
        try:
            conn = sqlite3.connect(self.db_path, timeout=5)
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            conn.close()
            return True
        except Exception:
            return False
    
    def _test_api_connection(self, api_name):
        """Test connessione API"""
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT stato_connessione, ultima_connessione 
                FROM configurazioni_api 
                WHERE nome_api = ? AND attiva = 1
            """, (api_name,))
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                status, last_connection = result
                
                # Se ultima connessione è recente (< 1 ora) e status ok
                if last_connection:
                    last_time = datetime.fromisoformat(last_connection.replace('Z', '+00:00'))
                    if (datetime.now() - last_time).total_seconds() < 3600 and status == 'ok':
                        return True
            
            return False
            
        except Exception:
            return False
    
    def _check_urgent_tickets(self):
        """Controlla ticket urgenti non assegnati"""
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id, titolo, cliente_id, data_creazione
                FROM ticket 
                WHERE stato = 'aperto' 
                AND priorita IN ('alta', 'critica')
                AND (tecnico_assegnato IS NULL OR tecnico_assegnato = '')
                AND data_creazione >= datetime('now', '-24 hours')
                ORDER BY priorita DESC, data_creazione ASC
            """)
            
            urgent_tickets = cursor.fetchall()
            conn.close()
            
            return urgent_tickets
            
        except Exception as e:
            self.logger.error(f"Errore controllo ticket urgenti: {str(e)}")
            return []
    
    def create_weekly_summary(self):
        """Crea riassunto settimanale delle attività"""
        
        try:
            orchestrator = IntegrationOrchestrator()
            report = orchestrator.generate_weekly_report()
            
            if report:
                # Invia report via email (se configurato)
                self._send_weekly_report(report)
                return True
            
            return False
            
        except Exception as e:
            self.logger.error(f"Errore creazione summary settimanale: {str(e)}")
            return False
    
    def _send_weekly_report(self, report):
        """Invia report settimanale via email"""
        
        # Implementazione invio email report settimanale
        self.logger.info("Report settimanale generato")
        # TODO: Formattazione HTML e invio email

def main():
    """Funzione principale per esecuzione da cronjob"""
    
    sync_manager = SyncManager()
    
    if len(sys.argv) > 1:
        if sys.argv[1] == 'daily':
            # Sincronizzazione giornaliera completa
            results = sync_manager.run_daily_sync()
            exit_code = 0 if results['overall_success'] else 1
            sys.exit(exit_code)
            
        elif sys.argv[1] == 'hourly':
            # Controllo orario
            results = sync_manager.run_hourly_check()
            exit_code = 0 if results and results['services']['all_ok'] else 1
            sys.exit(exit_code)
            
        elif sys.argv[1] == 'weekly':
            # Report settimanale
            success = sync_manager.create_weekly_summary()
            sys.exit(0 if success else 1)
            
    else:
        print("Uso: sync_manager.py [daily|hourly|weekly]")
        print("Esempio cronjob:")
        print("# Controllo orario")
        print("0 * * * * /usr/bin/python3 /Users/andreapanzeri/progetti/IT-ERA/automations/sync/sync_manager.py hourly")
        print("# Sincronizzazione giornaliera alle 6:00")
        print("0 6 * * * /usr/bin/python3 /Users/andreapanzeri/progetti/IT-ERA/automations/sync/sync_manager.py daily")
        print("# Report settimanale ogni lunedì alle 8:00")
        print("0 8 * * 1 /usr/bin/python3 /Users/andreapanzeri/progetti/IT-ERA/automations/sync/sync_manager.py weekly")

if __name__ == "__main__":
    main()
