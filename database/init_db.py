#!/usr/bin/env python3
"""
IT-ERA Database Initialization Script
Crea e inizializza il database SQLite per il progetto IT-ERA
"""

import sqlite3
import os
import logging
from datetime import datetime
import json

# Configurazione logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/Users/andreapanzeri/progetti/IT-ERA/logs/db_init.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def init_database():
    """Inizializza il database IT-ERA"""
    
    db_path = '/Users/andreapanzeri/progetti/IT-ERA/database/it_era.db'
    schema_path = '/Users/andreapanzeri/progetti/IT-ERA/database/schema.sql'
    
    try:
        # Crea directory se non esiste
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        os.makedirs('/Users/andreapanzeri/progetti/IT-ERA/logs', exist_ok=True)
        
        # Connessione al database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        logger.info(f"Connesso al database: {db_path}")
        
        # Leggi e esegui schema
        with open(schema_path, 'r', encoding='utf-8') as f:
            schema_sql = f.read()
        
        # Esegui schema (può contenere multiple statements)
        cursor.executescript(schema_sql)
        
        logger.info("Schema database creato con successo")
        
        # Inserisci dati di esempio per test
        insert_sample_data(cursor)
        
        # Commit modifiche
        conn.commit()
        logger.info("Database inizializzato con successo")
        
        # Verifica tabelle create
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        logger.info(f"Tabelle create: {[table[0] for table in tables]}")
        
        return True
        
    except Exception as e:
        logger.error(f"Errore durante inizializzazione database: {str(e)}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

def insert_sample_data(cursor):
    """Inserisce dati di esempio per test"""
    
    # Cliente di esempio
    cursor.execute("""
        INSERT OR IGNORE INTO clienti (
            nome_cliente, ragione_sociale, email, telefono, 
            tipo_contratto, ore_residue, note
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        "Cliente Test SRL",
        "Cliente Test S.R.L.",
        "test@clientetest.it",
        "+39 02 1234567",
        "mensile",
        40,
        "Cliente di test per validazione sistema IT-ERA"
    ))
    
    # Configurazione API di esempio
    api_configs = [
        ("HubSpot", "hubspot", "https://api.hubapi.com", "ENCRYPTED_KEY_PLACEHOLDER"),
        ("Bitdefender", "bitdefender", "https://cloud.bitdefender.com/api", "ENCRYPTED_KEY_PLACEHOLDER"),
        ("Wasabi", "wasabi", "https://s3.wasabisys.com", "ENCRYPTED_KEY_PLACEHOLDER")
    ]
    
    for nome, tipo, endpoint, key in api_configs:
        cursor.execute("""
            INSERT OR IGNORE INTO configurazioni_api (
                nome_api, tipo, endpoint_base, api_key_encrypted, attiva
            ) VALUES (?, ?, ?, ?, ?)
        """, (nome, tipo, endpoint, key, True))
    
    # Automazione di esempio
    cursor.execute("""
        INSERT OR IGNORE INTO automazioni (
            nome, tipo, descrizione, cron_schedule, attiva, email_notifica
        ) VALUES (?, ?, ?, ?, ?, ?)
    """, (
        "Backup Quotidiano Clienti",
        "backup",
        "Backup automatico giornaliero dei dati clienti",
        "0 2 * * *",  # Alle 2:00 ogni giorno
        True,
        "admin@bulltech.it"
    ))
    
    logger.info("Dati di esempio inseriti")

def check_database_health():
    """Verifica lo stato del database"""
    
    db_path = '/Users/andreapanzeri/progetti/IT-ERA/database/it_era.db'
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Controlla integrità
        cursor.execute("PRAGMA integrity_check")
        integrity = cursor.fetchone()[0]
        
        if integrity == "ok":
            logger.info("Database integro")
            
            # Conta record nelle tabelle principali
            tables_to_check = ['clienti', 'ticket', 'ore_lavorate', 'automazioni']
            for table in tables_to_check:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                logger.info(f"Tabella {table}: {count} record")
            
            return True
        else:
            logger.error(f"Problema integrità database: {integrity}")
            return False
            
    except Exception as e:
        logger.error(f"Errore controllo database: {str(e)}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    logger.info("=== Inizializzazione Database IT-ERA ===")
    
    if init_database():
        logger.info("Inizializzazione completata con successo")
        
        # Verifica salute database
        if check_database_health():
            logger.info("Database pronto per l'uso")
        else:
            logger.error("Problemi rilevati nel database")
    else:
        logger.error("Inizializzazione fallita")
