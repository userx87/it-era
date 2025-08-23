# IT-ERA Docker Container
# Ambiente containerizzato per il sistema IT-ERA

FROM python:3.11-slim

# Metadata
LABEL maintainer="Bulltech Informatica"
LABEL description="IT-ERA Automation and IT Assistance System"
LABEL version="1.0"

# Variabili d'ambiente
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV IT_ERA_HOME=/app/it-era
ENV DEBIAN_FRONTEND=noninteractive

# Installa dipendenze sistema
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    cron \
    sqlite3 \
    mysql-client \
    openssh-client \
    rsync \
    zip \
    unzip \
    tar \
    gzip \
    vim \
    nano \
    htop \
    net-tools \
    iputils-ping \
    telnet \
    && rm -rf /var/lib/apt/lists/*

# Crea utente non-root per sicurezza
RUN useradd -m -s /bin/bash itera && \
    mkdir -p $IT_ERA_HOME && \
    chown -R itera:itera $IT_ERA_HOME

# Cambia utente
USER itera
WORKDIR $IT_ERA_HOME

# Copia requirements e installa dipendenze Python
COPY --chown=itera:itera requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia codice applicazione
COPY --chown=itera:itera . .

# Crea directory necessarie
RUN mkdir -p logs database config automations api web scripts && \
    chmod +x automations/sync/sync_manager.py && \
    chmod +x automations/backup/backup_manager.py && \
    chmod +x api/integrations.py && \
    chmod +x database/init_db.py

# Inizializza database
RUN python3 database/init_db.py

# Script di entrypoint
COPY --chown=itera:itera docker/entrypoint.sh .
RUN chmod +x entrypoint.sh

# Esponi porte
EXPOSE 5000 8080

# Volumi per persistenza dati
VOLUME ["$IT_ERA_HOME/database", "$IT_ERA_HOME/logs", "$IT_ERA_HOME/config"]

# Health check
HEALTHCHECK --interval=5m --timeout=30s --start-period=1m --retries=3 \
    CMD python3 -c "import sqlite3; sqlite3.connect('database/it_era.db').execute('SELECT 1')" || exit 1

# Entrypoint
ENTRYPOINT ["./entrypoint.sh"]
CMD ["web"]
