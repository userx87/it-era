#!/usr/bin/env python3
"""
IT-ERA API Integrations
Integrazioni con API esterne per HubSpot, Dynamics 365, Bitdefender, ecc.
"""

import requests
import json
import time
import sqlite3
import sys
from datetime import datetime, timedelta
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Aggiungi path per logging
sys.path.append('/Users/andreapanzeri/progetti/IT-ERA/config')
from logging_config import setup_component_logger

class APIManager:
    """Gestore integrazioni API"""
    
    def __init__(self):
        self.logger = setup_component_logger("api_manager")
        self.db_path = '/Users/andreapanzeri/progetti/IT-ERA/database/it_era.db'
        self.session = self._create_session()
    
    def _create_session(self):
        """Crea sessione HTTP con retry strategy"""
        
        session = requests.Session()
        
        # Configurazione retry
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        return session
    
    def get_api_config(self, nome_api):
        """Recupera configurazione API dal database"""
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM configurazioni_api 
                WHERE nome_api = ? AND attiva = 1
            """, (nome_api,))
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                columns = [desc[0] for desc in cursor.description]
                return dict(zip(columns, result))
            return None
            
        except Exception as e:
            self.logger.error(f"Errore recupero configurazione API {nome_api}: {str(e)}")
            return None
    
    def update_api_status(self, nome_api, stato, ultimo_utilizzo=None):
        """Aggiorna stato connessione API"""
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE configurazioni_api 
                SET stato_connessione = ?, 
                    ultima_connessione = COALESCE(?, CURRENT_TIMESTAMP)
                WHERE nome_api = ?
            """, (stato, ultimo_utilizzo, nome_api))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            self.logger.error(f"Errore aggiornamento stato API: {str(e)}")

class HubSpotAPI(APIManager):
    """Integrazione HubSpot"""
    
    def __init__(self, api_token=None):
        super().__init__()
        self.config = self.get_api_config("HubSpot")
        self.api_token = api_token or self._get_token()
        self.base_url = "https://api.hubapi.com"
    
    def _get_token(self):
        """Recupera token API da environment o config"""
        
        token = os.getenv('HUBSPOT_API_TOKEN')
        if not token and self.config:
            # Decrittazione token dal database (placeholder)
            token = self.config.get('api_key_encrypted', '').replace('ENCRYPTED_KEY_PLACEHOLDER', '')
        
        return token
    
    def get_contacts(self, limit=100, properties=None):
        """Recupera contatti da HubSpot"""
        
        try:
            url = f"{self.base_url}/crm/v3/objects/contacts"
            
            params = {
                'limit': limit,
                'hapikey': self.api_token
            }
            
            if properties:
                params['properties'] = ','.join(properties)
            
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()
            
            self.update_api_status("HubSpot", "ok")
            self.logger.info(f"Recuperati {len(response.json().get('results', []))} contatti da HubSpot")
            
            return response.json()
            
        except Exception as e:
            self.logger.error(f"Errore recupero contatti HubSpot: {str(e)}")
            self.update_api_status("HubSpot", "error")
            return None
    
    def create_contact(self, contact_data):
        """Crea nuovo contatto in HubSpot"""
        
        try:
            url = f"{self.base_url}/crm/v3/objects/contacts"
            
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.api_token}'
            }
            
            payload = {
                'properties': contact_data
            }
            
            response = self.session.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            
            contact_id = response.json().get('id')
            self.logger.info(f"Contatto creato in HubSpot: {contact_id}")
            
            return contact_id
            
        except Exception as e:
            self.logger.error(f"Errore creazione contatto HubSpot: {str(e)}")
            return None
    
    def sync_contacts_to_db(self):
        """Sincronizza contatti HubSpot nel database locale"""
        
        try:
            contacts = self.get_contacts(properties=['email', 'firstname', 'lastname', 'company', 'phone'])
            
            if not contacts:
                return False
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            synced_count = 0
            
            for contact in contacts.get('results', []):
                props = contact.get('properties', {})
                
                # Inserisci o aggiorna cliente
                cursor.execute("""
                    INSERT OR REPLACE INTO clienti (
                        nome_cliente, email, telefono, note
                    ) VALUES (?, ?, ?, ?)
                """, (
                    f"{props.get('firstname', '')} {props.get('lastname', '')}".strip(),
                    props.get('email'),
                    props.get('phone'),
                    f"Sincronizzato da HubSpot - ID: {contact['id']}"
                ))
                
                synced_count += 1
            
            conn.commit()
            conn.close()
            
            self.logger.info(f"Sincronizzati {synced_count} contatti da HubSpot")
            return True
            
        except Exception as e:
            self.logger.error(f"Errore sincronizzazione contatti: {str(e)}")
            return False

class BitdefenderAPI(APIManager):
    """Integrazione Bitdefender GravityZone"""
    
    def __init__(self, api_key=None):
        super().__init__()
        self.config = self.get_api_config("Bitdefender")
        self.api_key = api_key or self._get_api_key()
        self.base_url = "https://cloud.bitdefender.com/api/v1.0"
    
    def _get_api_key(self):
        """Recupera API key"""
        
        key = os.getenv('BITDEFENDER_API_KEY')
        if not key and self.config:
            key = self.config.get('api_key_encrypted', '').replace('ENCRYPTED_KEY_PLACEHOLDER', '')
        
        return key
    
    def get_endpoints(self):
        """Recupera lista endpoint protetti"""
        
        try:
            url = f"{self.base_url}/jsonrpc/network"
            
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Basic {self.api_key}'
            }
            
            payload = {
                "method": "getNetworkInventoryItems",
                "params": {
                    "parentId": "5f5f0e7b4b5d1234567890ab",  # Placeholder
                    "page": 1,
                    "perPage": 100
                },
                "id": 1,
                "jsonrpc": "2.0"
            }
            
            response = self.session.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            
            self.update_api_status("Bitdefender", "ok")
            return response.json()
            
        except Exception as e:
            self.logger.error(f"Errore recupero endpoint Bitdefender: {str(e)}")
            self.update_api_status("Bitdefender", "error")
            return None
    
    def get_security_alerts(self, days_back=7):
        """Recupera alert di sicurezza"""
        
        try:
            url = f"{self.base_url}/jsonrpc/incidents"
            
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Basic {self.api_key}'
            }
            
            # Data inizio ricerca
            start_date = (datetime.now() - timedelta(days=days_back)).isoformat()
            
            payload = {
                "method": "getIncidentsList",
                "params": {
                    "page": 1,
                    "perPage": 100,
                    "filters": {
                        "createdAt": {
                            "startDate": start_date
                        }
                    }
                },
                "id": 1,
                "jsonrpc": "2.0"
            }
            
            response = self.session.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            
            alerts = response.json().get('result', {}).get('items', [])
            self.logger.info(f"Recuperati {len(alerts)} alert di sicurezza")
            
            return alerts
            
        except Exception as e:
            self.logger.error(f"Errore recupero alert Bitdefender: {str(e)}")
            return []

class DynamicsAPI(APIManager):
    """Integrazione Microsoft Dynamics 365"""
    
    def __init__(self, tenant_id=None, client_id=None, client_secret=None):
        super().__init__()
        self.config = self.get_api_config("Dynamics")
        self.tenant_id = tenant_id or os.getenv('DYNAMICS_TENANT_ID')
        self.client_id = client_id or os.getenv('DYNAMICS_CLIENT_ID')
        self.client_secret = client_secret or os.getenv('DYNAMICS_CLIENT_SECRET')
        self.access_token = None
        self.token_expires = None
    
    def _get_access_token(self):
        """Ottiene access token OAuth2"""
        
        if self.access_token and self.token_expires and datetime.now() < self.token_expires:
            return self.access_token
        
        try:
            url = f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/token"
            
            data = {
                'grant_type': 'client_credentials',
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'scope': 'https://graph.microsoft.com/.default'
            }
            
            response = self.session.post(url, data=data, timeout=30)
            response.raise_for_status()
            
            token_data = response.json()
            self.access_token = token_data['access_token']
            self.token_expires = datetime.now() + timedelta(seconds=token_data['expires_in'] - 60)
            
            self.update_api_status("Dynamics", "ok")
            return self.access_token
            
        except Exception as e:
            self.logger.error(f"Errore ottenimento token Dynamics: {str(e)}")
            self.update_api_status("Dynamics", "error")
            return None
    
    def get_accounts(self, top=100):
        """Recupera account da Dynamics 365"""
        
        token = self._get_access_token()
        if not token:
            return None
        
        try:
            url = f"https://graph.microsoft.com/v1.0/applications"  # Placeholder URL
            
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            
            params = {
                '$top': top,
                '$select': 'name,emailaddress1,telephone1'
            }
            
            response = self.session.get(url, headers=headers, params=params, timeout=30)
            response.raise_for_status()
            
            accounts = response.json().get('value', [])
            self.logger.info(f"Recuperati {len(accounts)} account da Dynamics")
            
            return accounts
            
        except Exception as e:
            self.logger.error(f"Errore recupero account Dynamics: {str(e)}")
            return None

class IntegrationOrchestrator:
    """Orchestratore per sincronizzazioni multiple"""
    
    def __init__(self):
        self.logger = setup_component_logger("integration_orchestrator")
        self.db_path = '/Users/andreapanzeri/progetti/IT-ERA/database/it_era.db'
    
    def sync_all_crm_data(self):
        """Sincronizza dati da tutti i CRM configurati"""
        
        try:
            # Sincronizzazione HubSpot
            hubspot = HubSpotAPI()
            hubspot.sync_contacts_to_db()
            
            # Sincronizzazione Dynamics (se configurato)
            dynamics = DynamicsAPI()
            if dynamics.tenant_id:
                accounts = dynamics.get_accounts()
                if accounts:
                    self._sync_dynamics_to_db(accounts)
            
            self.logger.info("Sincronizzazione CRM completata")
            return True
            
        except Exception as e:
            self.logger.error(f"Errore sincronizzazione CRM: {str(e)}")
            return False
    
    def _sync_dynamics_to_db(self, accounts):
        """Sincronizza account Dynamics nel database"""
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            for account in accounts:
                cursor.execute("""
                    INSERT OR REPLACE INTO clienti (
                        nome_cliente, email, telefono, note
                    ) VALUES (?, ?, ?, ?)
                """, (
                    account.get('name'),
                    account.get('emailaddress1'),
                    account.get('telephone1'),
                    "Sincronizzato da Dynamics 365"
                ))
            
            conn.commit()
            conn.close()
            
            self.logger.info(f"Sincronizzati {len(accounts)} account da Dynamics")
            
        except Exception as e:
            self.logger.error(f"Errore sincronizzazione Dynamics: {str(e)}")
    
    def monitor_security_alerts(self):
        """Monitora alert di sicurezza da tutte le fonti"""
        
        try:
            all_alerts = []
            
            # Alert Bitdefender
            bitdefender = BitdefenderAPI()
            bd_alerts = bitdefender.get_security_alerts()
            
            if bd_alerts:
                for alert in bd_alerts:
                    all_alerts.append({
                        'source': 'Bitdefender',
                        'timestamp': alert.get('createdAt'),
                        'severity': alert.get('severity'),
                        'description': alert.get('description'),
                        'affected_endpoint': alert.get('endpoint')
                    })
            
            # Salva alert nel database
            if all_alerts:
                self._save_security_alerts(all_alerts)
            
            self.logger.info(f"Elaborati {len(all_alerts)} alert di sicurezza")
            return all_alerts
            
        except Exception as e:
            self.logger.error(f"Errore monitoraggio alert: {str(e)}")
            return []
    
    def _save_security_alerts(self, alerts):
        """Salva alert di sicurezza nel database"""
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            for alert in alerts:
                # Log come evento di sicurezza
                cursor.execute("""
                    INSERT INTO log_sistema (
                        livello, componente, messaggio, dettagli
                    ) VALUES (?, ?, ?, ?)
                """, (
                    "WARNING" if alert['severity'] in ['medium', 'high'] else "INFO",
                    "security_alert",
                    f"Alert {alert['source']}: {alert['description']}",
                    json.dumps(alert)
                ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            self.logger.error(f"Errore salvataggio alert: {str(e)}")
    
    def generate_weekly_report(self):
        """Genera report settimanale delle attività"""
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Report ticket aperti/chiusi
            cursor.execute("""
                SELECT 
                    stato, 
                    COUNT(*) as count,
                    AVG(ore_lavorate) as ore_medie
                FROM ticket 
                WHERE data_creazione >= datetime('now', '-7 days')
                GROUP BY stato
            """)
            
            ticket_stats = cursor.fetchall()
            
            # Report ore lavorate per tecnico
            cursor.execute("""
                SELECT 
                    tecnico,
                    SUM(ore) as ore_totali,
                    COUNT(*) as interventi,
                    SUM(importo_calcolato) as fatturato
                FROM ore_lavorate 
                WHERE data_lavoro >= date('now', '-7 days')
                GROUP BY tecnico
            """)
            
            tecnico_stats = cursor.fetchall()
            
            # Report alert sicurezza
            cursor.execute("""
                SELECT 
                    componente,
                    livello,
                    COUNT(*) as count
                FROM log_sistema 
                WHERE timestamp >= datetime('now', '-7 days')
                    AND componente = 'security_alert'
                GROUP BY componente, livello
            """)
            
            security_stats = cursor.fetchall()
            
            conn.close()
            
            # Compila report
            report = {
                'periodo': f"{(datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')} - {datetime.now().strftime('%Y-%m-%d')}",
                'ticket': dict(ticket_stats) if ticket_stats else {},
                'tecnici': dict([(t[0], {'ore': t[1], 'interventi': t[2], 'fatturato': t[3]}) for t in tecnico_stats]),
                'sicurezza': dict([(f"{s[0]}_{s[1]}", s[2]) for s in security_stats])
            }
            
            # Salva report
            report_file = f"/Users/andreapanzeri/progetti/IT-ERA/logs/weekly_report_{datetime.now().strftime('%Y%m%d')}.json"
            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False, default=str)
            
            self.logger.info(f"Report settimanale generato: {report_file}")
            return report
            
        except Exception as e:
            self.logger.error(f"Errore generazione report: {str(e)}")
            return None

def main():
    """Funzione principale per test integrazioni"""
    
    if len(sys.argv) > 1:
        if sys.argv[1] == 'sync-hubspot':
            hubspot = HubSpotAPI()
            hubspot.sync_contacts_to_db()
        elif sys.argv[1] == 'monitor-security':
            orchestrator = IntegrationOrchestrator()
            alerts = orchestrator.monitor_security_alerts()
            print(f"Trovati {len(alerts)} alert di sicurezza")
        elif sys.argv[1] == 'weekly-report':
            orchestrator = IntegrationOrchestrator()
            report = orchestrator.generate_weekly_report()
            if report:
                print("Report settimanale generato con successo")
        elif sys.argv[1] == 'sync-all':
            orchestrator = IntegrationOrchestrator()
            orchestrator.sync_all_crm_data()
    else:
        print("Uso: integrations.py [sync-hubspot|monitor-security|weekly-report|sync-all]")

if __name__ == "__main__":
    main()
