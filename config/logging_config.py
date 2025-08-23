#!/usr/bin/env python3
"""
IT-ERA Centralized Logging System
Sistema di logging unificato per tutti i componenti IT-ERA
"""

import logging
import logging.handlers
import os
import sqlite3
import json
from datetime import datetime
from pathlib import Path

class ITERALogger:
    """Logger centralizzato per IT-ERA"""
    
    def __init__(self, component_name, log_to_db=True):
        self.component_name = component_name
        self.log_to_db = log_to_db
        self.logs_dir = '/Users/andreapanzeri/progetti/IT-ERA/logs'
        self.db_path = '/Users/andreapanzeri/progetti/IT-ERA/database/it_era.db'
        
        # Crea directory logs se non esiste
        os.makedirs(self.logs_dir, exist_ok=True)
        
        # Configura logger
        self.logger = self._setup_logger()
    
    def _setup_logger(self):
        """Configura il logger con handlers multipli"""
        
        logger = logging.getLogger(f"IT-ERA.{self.component_name}")
        logger.setLevel(logging.DEBUG)
        
        # Evita duplicazione handler se già configurato
        if logger.handlers:
            return logger
        
        # Formatter per i log
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        # Handler per file con rotazione
        file_handler = logging.handlers.RotatingFileHandler(
            f"{self.logs_dir}/{self.component_name}.log",
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(formatter)
        
        # Handler per console
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_handler.setFormatter(formatter)
        
        # Handler per errori (file separato)
        error_handler = logging.handlers.RotatingFileHandler(
            f"{self.logs_dir}/errors.log",
            maxBytes=5*1024*1024,  # 5MB
            backupCount=3,
            encoding='utf-8'
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(formatter)
        
        # Aggiungi handlers
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
        logger.addHandler(error_handler)
        
        # Handler personalizzato per database
        if self.log_to_db:
            db_handler = DatabaseLogHandler(self.db_path, self.component_name)
            db_handler.setLevel(logging.INFO)
            logger.addHandler(db_handler)
        
        return logger
    
    def debug(self, message, dettagli=None, utente=None, ip=None):
        """Log debug"""
        self._log_with_context(logging.DEBUG, message, dettagli, utente, ip)
    
    def info(self, message, dettagli=None, utente=None, ip=None):
        """Log info"""
        self._log_with_context(logging.INFO, message, dettagli, utente, ip)
    
    def warning(self, message, dettagli=None, utente=None, ip=None):
        """Log warning"""
        self._log_with_context(logging.WARNING, message, dettagli, utente, ip)
    
    def error(self, message, dettagli=None, utente=None, ip=None):
        """Log error"""
        self._log_with_context(logging.ERROR, message, dettagli, utente, ip)
    
    def critical(self, message, dettagli=None, utente=None, ip=None):
        """Log critical"""
        self._log_with_context(logging.CRITICAL, message, dettagli, utente, ip)
    
    def _log_with_context(self, level, message, dettagli=None, utente=None, ip=None):
        """Log con contesto aggiuntivo"""
        
        # Prepara messaggio base
        log_message = message
        
        # Aggiungi contesto se presente
        if any([dettagli, utente, ip]):
            context = {}
            if dettagli:
                context['dettagli'] = dettagli
            if utente:
                context['utente'] = utente
            if ip:
                context['ip'] = ip
            
            # Salva contesto per il database handler
            self.logger.context = context
        
        # Esegui log
        self.logger.log(level, log_message)
        
        # Pulisci contesto
        if hasattr(self.logger, 'context'):
            delattr(self.logger, 'context')

class DatabaseLogHandler(logging.Handler):
    """Handler personalizzato per salvare log nel database"""
    
    def __init__(self, db_path, component_name):
        super().__init__()
        self.db_path = db_path
        self.component_name = component_name
    
    def emit(self, record):
        """Salva log nel database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Estrai contesto se presente
            context = getattr(record, 'context', {}) if hasattr(record, 'context') else {}
            logger_context = getattr(logging.getLogger(record.name), 'context', {})
            context.update(logger_context)
            
            cursor.execute("""
                INSERT INTO log_sistema (
                    livello, componente, messaggio, dettagli, utente, ip_address
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                record.levelname,
                self.component_name,
                record.getMessage(),
                json.dumps(context.get('dettagli', {})) if context.get('dettagli') else None,
                context.get('utente'),
                context.get('ip')
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            # Non vogliamo che errori di logging bloccino l'applicazione
            print(f"Errore salvataggio log in database: {e}")

def setup_component_logger(component_name, log_to_db=True):
    """Funzione helper per creare logger per un componente"""
    return ITERALogger(component_name, log_to_db)

def cleanup_old_logs(days_to_keep=30):
    """Pulizia log vecchi"""
    
    logger = setup_component_logger("log_cleanup", log_to_db=False)
    logs_dir = Path('/Users/andreapanzeri/progetti/IT-ERA/logs')
    
    try:
        # Pulizia file log
        for log_file in logs_dir.glob("*.log*"):
            if log_file.stat().st_mtime < (datetime.now().timestamp() - days_to_keep * 86400):
                log_file.unlink()
                logger.info(f"Rimosso file log vecchio: {log_file}")
        
        # Pulizia database log
        conn = sqlite3.connect('/Users/andreapanzeri/progetti/IT-ERA/database/it_era.db')
        cursor = conn.cursor()
        
        cursor.execute("""
            DELETE FROM log_sistema 
            WHERE timestamp < datetime('now', '-{} days')
        """.format(days_to_keep))
        
        deleted_rows = cursor.rowcount
        conn.commit()
        conn.close()
        
        logger.info(f"Rimossi {deleted_rows} record di log dal database")
        
    except Exception as e:
        logger.error(f"Errore durante pulizia log: {str(e)}")

if __name__ == "__main__":
    # Test del sistema di logging
    test_logger = setup_component_logger("test")
    
    test_logger.info("Test sistema di logging IT-ERA")
    test_logger.warning("Test warning con dettagli", 
                       dettagli={"test_param": "valore_test"}, 
                       utente="admin")
    test_logger.error("Test error log")
    
    print("Test logging completato. Controlla i file in /Users/andreapanzeri/progetti/IT-ERA/logs/")
