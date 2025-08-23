#!/usr/bin/env python3
"""
IT-ERA Backup Manager
Sistema di backup automatico con supporto per multiple destinazioni
"""

import os
import sys
import tarfile
import gzip
import sqlite3
import json
import shutil
import ftplib
import smb
from datetime import datetime, timedelta
import boto3
from botocore.exceptions import ClientError
import schedule
import time
import subprocess
from cryptography.fernet import Fernet

# Aggiungi path per logging
sys.path.append('/Users/andreapanzeri/progetti/IT-ERA/config')
from logging_config import setup_component_logger

class BackupManager:
    """Gestore backup IT-ERA"""
    
    def __init__(self):
        self.logger = setup_component_logger("backup_manager")
        self.db_path = '/Users/andreapanzeri/progetti/IT-ERA/database/it_era.db'
        self.encryption_key = self._get_or_create_encryption_key()
    
    def _get_or_create_encryption_key(self):
        """Ottiene o crea chiave di crittografia"""
        key_file = '/Users/andreapanzeri/progetti/IT-ERA/config/.backup_key'
        
        try:
            if os.path.exists(key_file):
                with open(key_file, 'rb') as f:
                    return f.read()
            else:
                key = Fernet.generate_key()
                with open(key_file, 'wb') as f:
                    f.write(key)
                os.chmod(key_file, 0o600)  # Solo proprietario può leggere
                self.logger.info("Nuova chiave di crittografia generata")
                return key
        except Exception as e:
            self.logger.error(f"Errore gestione chiave crittografia: {str(e)}")
            return None
    
    def create_backup_job(self, nome_job, cliente_id, tipo_backup, sorgente_path, 
                         destinazione_path, tipo_destinazione, schedule_cron=None, 
                         retention_giorni=30, compressione=True, crittografia=True):
        """Crea un nuovo job di backup"""
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO backup_jobs (
                    nome_job, cliente_id, tipo_backup, sorgente_path, destinazione_path,
                    tipo_destinazione, schedule_cron, retention_giorni, 
                    compressione, crittografia, attivo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                nome_job, cliente_id, tipo_backup, sorgente_path, destinazione_path,
                tipo_destinazione, schedule_cron, retention_giorni, 
                compressione, crittografia, True
            ))
            
            job_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            self.logger.info(f"Job backup creato: {nome_job} (ID: {job_id})")
            return job_id
            
        except Exception as e:
            self.logger.error(f"Errore creazione job backup: {str(e)}")
            return None
    
    def execute_backup(self, job_id):
        """Esegue un backup specifico"""
        
        try:
            # Recupera configurazione job
            job_config = self._get_job_config(job_id)
            if not job_config:
                return False
            
            self.logger.info(f"Inizio backup: {job_config['nome_job']}")
            
            # Aggiorna stato nel database
            self._update_job_status(job_id, "running")
            
            # Crea backup
            backup_file = self._create_backup_archive(job_config)
            if not backup_file:
                self._update_job_status(job_id, "error", "Errore creazione archivio")
                return False
            
            # Trasferisci a destinazione
            success = self._transfer_backup(backup_file, job_config)
            
            if success:
                # Calcola dimensione
                backup_size = os.path.getsize(backup_file)
                
                # Pulizia backup vecchi
                self._cleanup_old_backups(job_config)
                
                # Aggiorna database
                self._update_job_status(job_id, "success", f"Backup completato - {backup_size} bytes")
                
                # Rimuovi file temporaneo se destinazione remota
                if job_config['tipo_destinazione'] != 'local':
                    os.remove(backup_file)
                
                self.logger.info(f"Backup completato: {job_config['nome_job']}")
                return True
            else:
                self._update_job_status(job_id, "error", "Errore trasferimento")
                return False
                
        except Exception as e:
            self.logger.error(f"Errore esecuzione backup {job_id}: {str(e)}")
            self._update_job_status(job_id, "error", str(e))
            return False
    
    def _get_job_config(self, job_id):
        """Recupera configurazione job dal database"""
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM backup_jobs WHERE id = ? AND attivo = 1
            """, (job_id,))
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                columns = [desc[0] for desc in cursor.description]
                return dict(zip(columns, result))
            return None
            
        except Exception as e:
            self.logger.error(f"Errore recupero configurazione job: {str(e)}")
            return None
    
    def _create_backup_archive(self, job_config):
        """Crea archivio di backup"""
        
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_filename = f"{job_config['nome_job']}_{timestamp}.tar"
            
            if job_config['compressione']:
                backup_filename += ".gz"
            
            backup_path = f"/tmp/{backup_filename}"
            
            # Crea archivio
            if job_config['compressione']:
                tar = tarfile.open(backup_path, "w:gz")
            else:
                tar = tarfile.open(backup_path, "w")
            
            # Aggiungi file/directory sorgente
            sorgente = job_config['sorgente_path']
            
            if job_config['tipo_backup'] == 'database':
                # Backup database specifico
                backup_path = self._backup_database(sorgente, backup_path)
            else:
                # Backup file/directory
                if os.path.isdir(sorgente):
                    tar.add(sorgente, arcname=os.path.basename(sorgente))
                elif os.path.isfile(sorgente):
                    tar.add(sorgente, arcname=os.path.basename(sorgente))
                else:
                    raise Exception(f"Sorgente non trovata: {sorgente}")
            
            tar.close()
            
            # Crittografia se richiesta
            if job_config['crittografia'] and self.encryption_key:
                encrypted_path = backup_path + ".enc"
                self._encrypt_file(backup_path, encrypted_path)
                os.remove(backup_path)
                backup_path = encrypted_path
            
            self.logger.info(f"Archivio creato: {backup_path}")
            return backup_path
            
        except Exception as e:
            self.logger.error(f"Errore creazione archivio: {str(e)}")
            return None
    
    def _backup_database(self, db_path, output_path):
        """Backup specifico per database"""
        
        if db_path.endswith('.db') or 'sqlite' in db_path.lower():
            # Backup SQLite
            return self._backup_sqlite(db_path, output_path)
        else:
            # Backup MySQL/MariaDB
            return self._backup_mysql(db_path, output_path)
    
    def _backup_sqlite(self, db_path, output_path):
        """Backup database SQLite"""
        
        try:
            conn = sqlite3.connect(db_path)
            
            # Esegui backup
            dump_path = output_path.replace('.tar', '.sql')
            with open(dump_path, 'w', encoding='utf-8') as f:
                for line in conn.iterdump():
                    f.write('%s\n' % line)
            
            conn.close()
            
            # Comprimi dump
            with tarfile.open(output_path, "w:gz") as tar:
                tar.add(dump_path, arcname=os.path.basename(dump_path))
            
            os.remove(dump_path)
            return output_path
            
        except Exception as e:
            self.logger.error(f"Errore backup SQLite: {str(e)}")
            return None
    
    def _backup_mysql(self, connection_string, output_path):
        """Backup database MySQL/MariaDB"""
        
        try:
            # Parsing connection string (formato: host:port:db:user:password)
            parts = connection_string.split(':')
            if len(parts) != 5:
                raise Exception("Formato connection string non valido")
            
            host, port, database, user, password = parts
            
            # Esegui mysqldump
            dump_path = output_path.replace('.tar', '.sql')
            cmd = [
                'mysqldump',
                f'--host={host}',
                f'--port={port}',
                f'--user={user}',
                f'--password={password}',
                '--single-transaction',
                '--routines',
                '--triggers',
                database
            ]
            
            with open(dump_path, 'w') as f:
                subprocess.run(cmd, stdout=f, check=True)
            
            # Comprimi dump
            with tarfile.open(output_path, "w:gz") as tar:
                tar.add(dump_path, arcname=os.path.basename(dump_path))
            
            os.remove(dump_path)
            return output_path
            
        except Exception as e:
            self.logger.error(f"Errore backup MySQL: {str(e)}")
            return None
    
    def _encrypt_file(self, input_path, output_path):
        """Crittografa file"""
        
        try:
            fernet = Fernet(self.encryption_key)
            
            with open(input_path, 'rb') as f:
                file_data = f.read()
            
            encrypted_data = fernet.encrypt(file_data)
            
            with open(output_path, 'wb') as f:
                f.write(encrypted_data)
            
            self.logger.info(f"File crittografato: {output_path}")
            
        except Exception as e:
            self.logger.error(f"Errore crittografia: {str(e)}")
            raise
    
    def _transfer_backup(self, backup_file, job_config):
        """Trasferisce backup alla destinazione"""
        
        tipo_dest = job_config['tipo_destinazione']
        
        try:
            if tipo_dest == 'local':
                return self._transfer_local(backup_file, job_config)
            elif tipo_dest == 'ftp':
                return self._transfer_ftp(backup_file, job_config)
            elif tipo_dest == 'smb':
                return self._transfer_smb(backup_file, job_config)
            elif tipo_dest == 'wasabi' or tipo_dest == 's3':
                return self._transfer_s3(backup_file, job_config)
            else:
                self.logger.error(f"Tipo destinazione non supportato: {tipo_dest}")
                return False
                
        except Exception as e:
            self.logger.error(f"Errore trasferimento {tipo_dest}: {str(e)}")
            return False
    
    def _transfer_local(self, backup_file, job_config):
        """Trasferimento locale"""
        
        dest_path = job_config['destinazione_path']
        os.makedirs(dest_path, exist_ok=True)
        
        dest_file = os.path.join(dest_path, os.path.basename(backup_file))
        shutil.move(backup_file, dest_file)
        
        self.logger.info(f"Backup trasferito localmente: {dest_file}")
        return True
    
    def _transfer_ftp(self, backup_file, job_config):
        """Trasferimento FTP"""
        
        # Parsing destinazione: ftp://user:pass@host:port/path
        dest = job_config['destinazione_path']
        # Implementazione FTP (richiede parsing URL e credenziali)
        
        self.logger.warning("Trasferimento FTP non ancora implementato")
        return False
    
    def _transfer_s3(self, backup_file, job_config):
        """Trasferimento S3/Wasabi"""
        
        try:
            # Configurazione S3 (da environment variables o config)
            s3_client = boto3.client(
                's3',
                endpoint_url=os.getenv('WASABI_ENDPOINT', 'https://s3.wasabisys.com'),
                aws_access_key_id=os.getenv('WASABI_ACCESS_KEY'),
                aws_secret_access_key=os.getenv('WASABI_SECRET_KEY')
            )
            
            bucket = os.getenv('WASABI_BUCKET')
            key = f"backups/{os.path.basename(backup_file)}"
            
            s3_client.upload_file(backup_file, bucket, key)
            
            self.logger.info(f"Backup caricato su Wasabi: {bucket}/{key}")
            return True
            
        except Exception as e:
            self.logger.error(f"Errore caricamento Wasabi: {str(e)}")
            return False
    
    def _cleanup_old_backups(self, job_config):
        """Rimuove backup vecchi secondo retention policy"""
        
        try:
            retention_days = job_config['retention_giorni']
            cutoff_date = datetime.now() - timedelta(days=retention_days)
            
            if job_config['tipo_destinazione'] == 'local':
                dest_dir = job_config['destinazione_path']
                for file in os.listdir(dest_dir):
                    file_path = os.path.join(dest_dir, file)
                    if os.path.isfile(file_path):
                        file_time = datetime.fromtimestamp(os.path.getmtime(file_path))
                        if file_time < cutoff_date:
                            os.remove(file_path)
                            self.logger.info(f"Rimosso backup vecchio: {file}")
            
            # TODO: Implementare cleanup per FTP, S3, SMB
            
        except Exception as e:
            self.logger.error(f"Errore pulizia backup vecchi: {str(e)}")
    
    def _update_job_status(self, job_id, status, log_message=None):
        """Aggiorna stato job nel database"""
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE backup_jobs 
                SET stato_ultimo_backup = ?, 
                    ultima_esecuzione = CURRENT_TIMESTAMP,
                    log_ultimo_backup = ?
                WHERE id = ?
            """, (status, log_message, job_id))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            self.logger.error(f"Errore aggiornamento stato job: {str(e)}")
    
    def run_scheduled_backups(self):
        """Esegue backup programmati"""
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Trova job attivi con schedule
            cursor.execute("""
                SELECT id, nome_job, schedule_cron 
                FROM backup_jobs 
                WHERE attivo = 1 AND schedule_cron IS NOT NULL
            """)
            
            jobs = cursor.fetchall()
            conn.close()
            
            for job_id, nome_job, cron_schedule in jobs:
                # Configura schedule per ogni job
                self._schedule_job(job_id, nome_job, cron_schedule)
            
            self.logger.info(f"Configurati {len(jobs)} backup programmati")
            
            # Mantieni attivo lo scheduler
            while True:
                schedule.run_pending()
                time.sleep(60)  # Controlla ogni minuto
                
        except Exception as e:
            self.logger.error(f"Errore scheduler backup: {str(e)}")
    
    def _schedule_job(self, job_id, nome_job, cron_schedule):
        """Configura scheduling per un job"""
        
        try:
            # Parsing cron semplificato (solo formati comuni)
            parts = cron_schedule.split()
            
            if len(parts) == 5:
                minute, hour, day, month, weekday = parts
                
                if hour != '*' and minute != '*':
                    # Schedule giornaliero
                    schedule.every().day.at(f"{hour}:{minute}").do(
                        self.execute_backup, job_id
                    )
                    self.logger.info(f"Job {nome_job} programmato alle {hour}:{minute}")
            
        except Exception as e:
            self.logger.error(f"Errore configurazione schedule per {nome_job}: {str(e)}")
    
    def list_jobs(self):
        """Lista tutti i job di backup"""
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT b.*, c.nome_cliente
                FROM backup_jobs b
                LEFT JOIN clienti c ON b.cliente_id = c.id
                ORDER BY b.data_creazione DESC
            """)
            
            jobs = cursor.fetchall()
            conn.close()
            
            return jobs
            
        except Exception as e:
            self.logger.error(f"Errore lista job: {str(e)}")
            return []

def main():
    """Funzione principale"""
    
    backup_manager = BackupManager()
    
    if len(sys.argv) > 1:
        if sys.argv[1] == 'run':
            # Esegue backup programmati
            backup_manager.run_scheduled_backups()
        elif sys.argv[1] == 'list':
            # Lista job
            jobs = backup_manager.list_jobs()
            print(f"Found {len(jobs)} backup jobs")
        elif sys.argv[1] == 'execute' and len(sys.argv) > 2:
            # Esegue job specifico
            job_id = int(sys.argv[2])
            success = backup_manager.execute_backup(job_id)
            print(f"Backup job {job_id}: {'SUCCESS' if success else 'FAILED'}")
    else:
        print("Uso: backup_manager.py [run|list|execute <job_id>]")

if __name__ == "__main__":
    main()
