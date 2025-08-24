# Backup e Disaster Recovery - FAQ Section

## FAQ Strategiche

### Sicurezza e Affidabilità

**Q: Come posso essere sicuro che i miei dati siano veramente protetti?**
A: Applichiamo la regola 3-2-1-1: 3 copie dei dati, 2 supporti diversi, 1 copia geograficamente distante + 1 copia immutabile air-gapped. Ogni backup è criptato AES-256 e testato automaticamente ogni settimana. Abbiamo una polizza assicurativa Lloyd's of London che copre ogni eventuale perdita di dati.

**Q: Cosa succede se anche il vostro datacenter ha problemi?**
A: I dati sono replicati in tempo reale su 3 datacenter geograficamente distanti: Milano, Roma e Francoforte. Se uno si ferma, il failover è automatico in 60 secondi. È fisicamente impossibile perdere dati perché servirebbero 3 catastrofi simultanee in 3 paesi diversi.

**Q: Come fate a garantire il ripristino in 4 ore?**
A: Il 90% dei ripristini avviene in realtà entro 1 ora grazie al sistema Instant Recovery: i server virtuali si avviano direttamente dal backup mentre in parallelo trasferiscono i dati. Solo per dati superiori a 10TB servono le 4 ore complete.

### Costi e Contratti

**Q: Ci sono costi nascosti oltre al canone mensile?**
A: Zero costi nascosti. Il prezzo include: backup illimitato, bandwidth illimitata, storage illimitato, test mensili, support H24, ripristini illimitati. Paghi solo se superi i 50GB per utente/mese (soglia molto alta per uso normale).

**Q: Devo firmare un contratto pluriennale?**
A: No. Il servizio è mensile e cancellabile con 30 giorni di preavviso. Non chiediamo vincoli perché siamo sicuri della qualità. Il 98% dei clienti rinnova spontaneamente.

**Q: Quanto costa un ripristino d'emergenza?**
A: I primi 3 ripristini all'anno sono inclusi. Dal 4° in poi costa €150 per intervento, ma viene rimborsato se il problema è causato da nostro malfunzionamento (cosa mai successa in 5 anni).

### Compliance e Normative

**Q: Il servizio è conforme al GDPR?**
A: Sì, siamo certificati GDPR by design. I dati rimangono sempre in UE, hai diritto di portabilità completa, cancelliamo tutto in 24h se richiesto. Forniamo automaticamente tutti i report per audit e ispezioni.

**Q: Avete certificazioni per settori critici come sanità e finanza?**
A: Sì. Siamo certificati ISO 27001, SOC 2 Type II e qualificati AGID per la PA. Gestiamo dati di 47 studi medici, 12 banche locali e 156 studi commercialisti senza mai un problema di compliance.

### Tecnico e Implementazione

**Q: Quanto tempo serve per attivare il servizio?**
A: Setup standard: 24-48 ore. Per urgenze: 4 ore con supplemento €200. L'installazione è completamente remota, non servono tecnici in sede.

**Q: Il backup rallenta i computer?**
A: No. Il backup incrementale continuo trasferisce solo le modifiche, usando massimo il 5% della banda disponibile. Spesso non ci si accorge nemmeno che è attivo.

**Q: Funziona con i server virtualizzati e il cloud?**
A: Sì, supportiamo: server fisici, VMware, Hyper-V, AWS, Azure, Google Cloud. Abbiamo connector nativi per oltre 200 applicazioni diverse.

### Disaster Recovery Scenarios

**Q: Cosa succede in caso di ransomware?**
A: Hai 3 linee di difesa: 1) Backup immutabile che il ransomware non può toccare, 2) Snapshot ogni 15 minuti degli ultimi 30 giorni, 3) Recovery point più vecchi fino a 7 anni. Tempo medio di ripristino post-ransomware: 2.5 ore.

**Q: E se il problema è un errore umano?**
A: Versioning illimitato per 90 giorni + snapshot orarie per 30 giorni. Possiamo ripristinare qualsiasi file a qualsiasi momento delle ultime 12 settimane. Recovery di singoli file in 5 minuti.

**Q: Gestite anche applicazioni complesse come ERP?**
A: Sì. Abbiamo expertise specifica su SAP, Oracle, Microsoft Dynamics, Zucchetti, TeamSystem. Il backup è application-aware e garantisce consistenza transazionale.

### Supporto e Assistenza

**Q: Il supporto è davvero H24?**
A: Sì, 365 giorni l'anno. Livello 1 sempre disponibile, Level 2 (tecnici senior) disponibile H24 per emergenze. Tempo medio risposta: 8 minuti per emergenze, 2 ore per richieste normali.

**Q: Parlate italiano o devo arrangiarmi in inglese?**
A: Supporto 100% in italiano con tecnici laureati presso le nostre sedi di Milano e Bergamo. Mai outsourcing in paesi esteri. Conosci il tuo tecnico di riferimento per nome.

## FAQ Avanzate

### Business Continuity

**Q: Possiamo testare il disaster recovery senza rischi?**
A: Sì. Test DR mensili automatici + test personalizzati trimestrali gratuiti. Creiamo un ambiente isolato identico al produzione per simulazioni realistiche senza impatti.

**Q: Il servizio include anche la business continuity planning?**
A: Sì. Consulenza gratuita per definire RTO/RPO, analisi rischi, documentation dei processi critici. Include template legali per comunicazioni clienti/fornitori in caso emergenza.

### Scalabilità e Performance

**Q: Come gestite la crescita dei dati nel tempo?**
A: Storage illimitato con pricing trasparente: primi 50GB/utente inclusi, eccedenze a €2/GB/mese. Deduplicazione media 70% = spazi occupati molto minori dei dati reali.

**Q: Quali sono le performance di ripristino per grandi volumi?**
A: Instant Recovery per VM fino a 2TB in <1 ora. Volumi maggiori: 10TB/ora sustained. Per emergency: shipment fisico drive con dati in 24h ovunque in Italia.