/**
 * IT-ERA Email Templates for Followup Sequences
 * Template completi per massimizzare conversioni
 */

const ITERAEmailTemplates = {
    // EMERGENCY REPAIR SEQUENCE
    emergency_immediate: {
        subject: '🚨 EMERGENZA RICEVUTA - Ti chiamiamo in 15 minuti',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🚨 EMERGENZA RICEVUTA</h1>
                <p style="margin: 15px 0 0 0; font-size: 20px;">Ti chiamiamo entro 15 minuti!</p>
                <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 8px; margin-top: 20px;">
                    <p style="margin: 0; font-size: 16px;">Ricevuto alle {{CURRENT_TIME}} - {{CURRENT_DATE}}</p>
                </div>
            </div>
            
            <div style="padding: 30px; background: white;">
                <p style="font-size: 18px; margin-bottom: 20px;">Ciao <strong>{{NAME}}</strong>,</p>
                
                <div style="background: #fef2f2; border-left: 5px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 5px;">
                    <h3 style="margin: 0 0 10px 0; color: #dc2626;">⚡ INTERVENTO URGENTE PROGRAMMATO</h3>
                    <p style="margin: 0; font-size: 16px;">Il nostro tecnico specializzato ti contatterà entro <strong>15 minuti</strong> al numero <strong>{{PHONE}}</strong></p>
                </div>
                
                <h3 style="color: #374151; margin: 25px 0 15px 0;">Cosa succede ora:</h3>
                <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                        <div style="background: #dc2626; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold;">1</div>
                        <div>
                            <strong>Chiamata immediata (15 min)</strong><br>
                            <span style="color: #6b7280;">Conferma dettagli e valutazione preliminare</span>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                        <div style="background: #dc2626; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold;">2</div>
                        <div>
                            <strong>Invio tecnico (30-120 min)</strong><br>
                            <span style="color: #6b7280;">Arrivo con strumenti e ricambi necessari</span>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center;">
                        <div style="background: #dc2626; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold;">3</div>
                        <div>
                            <strong>Risoluzione problema</strong><br>
                            <span style="color: #6b7280;">Diagnosi, riparazione e test completo</span>
                        </div>
                    </div>
                </div>
                
                <div style="background: #fee2e2; border: 2px solid #fca5a5; padding: 20px; margin: 25px 0; border-radius: 8px; text-align: center;">
                    <h3 style="margin: 0 0 10px 0; color: #dc2626;">📞 LINEA EMERGENZA DIRETTA</h3>
                    <p style="margin: 0; font-size: 24px; font-weight: bold; color: #dc2626;">039 888 2041</p>
                    <p style="margin: 10px 0 0 0; color: #7f1d1d;">Disponibile 24/7 per emergenze critiche</p>
                </div>
                
                <div style="margin: 30px 0;">
                    <h3 style="color: #374151; margin-bottom: 15px;">🛡️ Garanzie IT-ERA:</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li style="margin-bottom: 10px;">✅ <strong>Risposta garantita in 15 minuti</strong></li>
                        <li style="margin-bottom: 10px;">✅ <strong>Tecnici certificati e specializzati</strong></li>
                        <li style="margin-bottom: 10px;">✅ <strong>Ricambi originali sempre disponibili</strong></li>
                        <li style="margin-bottom: 10px;">✅ <strong>Garanzia 6 mesi su tutti gli interventi</strong></li>
                    </ul>
                </div>
                
                <p style="margin-top: 30px; color: #6b7280;">Grazie per aver scelto IT-ERA per la tua emergenza informatica.</p>
                <p style="margin: 5px 0 0 0; font-weight: bold; color: #374151;">Il Team Emergenze IT-ERA</p>
            </div>
            
            <div style="background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
                <p style="margin: 0;">IT-ERA - Assistenza Informatica Professionale</p>
                <p style="margin: 5px 0 0 0;">📧 info@bulltech.it | 📞 039 888 2041 | 🌐 it-era.it</p>
            </div>
        </div>`,
        text: `🚨 EMERGENZA RICEVUTA - Ti chiamiamo in 15 minuti!\n\nCiao {{NAME}},\n\nLa tua richiesta di emergenza è stata ricevuta alle {{CURRENT_TIME}}.\n\nIl nostro tecnico specializzato ti contatterà entro 15 minuti al numero {{PHONE}} per:\n- Confermare i dettagli del problema\n- Programmare l'intervento immediato\n- Fornirti il tempo esatto di arrivo\n\nPer emergenze immediate: 039 888 2041\n\nGrazie per aver scelto IT-ERA.\nIl Team Emergenze IT-ERA`
    },

    emergency_technician_dispatch: {
        subject: '⚡ Tecnico in arrivo - Dettagli intervento {{LOCATION}}',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #059669, #047857); color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px;">⚡ TECNICO IN ARRIVO</h1>
                <p style="margin: 15px 0 0 0; font-size: 18px;">Intervento programmato per {{LOCATION}}</p>
            </div>
            
            <div style="padding: 30px;">
                <p style="font-size: 18px;">Ciao <strong>{{NAME}}</strong>,</p>
                
                <div style="background: #ecfdf5; border-left: 5px solid #059669; padding: 20px; margin: 20px 0; border-radius: 5px;">
                    <h3 style="margin: 0 0 10px 0; color: #059669;">🚗 TECNICO SPECIALIZZATO IN VIAGGIO</h3>
                    <p style="margin: 0;">Il nostro esperto sta arrivando con tutti gli strumenti necessari per risolvere il tuo problema.</p>
                </div>
                
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin: 0 0 15px 0; color: #374151;">📋 Dettagli Intervento:</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Tecnico:</td>
                            <td style="padding: 8px 0;">Marco Rossi - Certificato Microsoft & CompTIA</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Specializzazione:</td>
                            <td style="padding: 8px 0;">Riparazione Hardware & Recupero Dati</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Tempo stimato:</td>
                            <td style="padding: 8px 0;">1-3 ore (dipende dalla complessità)</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Contatto diretto:</td>
                            <td style="padding: 8px 0;"><strong>039 888 2041</strong></td>
                        </tr>
                    </table>
                </div>
                
                <h3 style="color: #374151; margin: 25px 0 15px 0;">🔧 Cosa portiamo:</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
                    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 24px; margin-bottom: 5px;">🛠️</div>
                        <strong>Strumenti Diagnostici</strong><br>
                        <span style="font-size: 14px; color: #92400e;">Hardware & Software</span>
                    </div>
                    <div style="background: #dbeafe; padding: 15px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 24px; margin-bottom: 5px;">💾</div>
                        <strong>Ricambi Originali</strong><br>
                        <span style="font-size: 14px; color: #1e40af;">RAM, HDD, SSD, PSU</span>
                    </div>
                </div>
                
                <div style="background: #fffbeb; border: 2px solid #fbbf24; padding: 20px; margin: 25px 0; border-radius: 8px;">
                    <h3 style="margin: 0 0 10px 0; color: #d97706;">💡 Preparazione Consigliata:</h3>
                    <ul style="margin: 10px 0; padding-left: 20px; color: #92400e;">
                        <li>Backup dei dati importanti (se possibile)</li>
                        <li>Lista dei programmi essenziali installati</li>
                        <li>Password di accesso al sistema</li>
                        <li>Spazio libero per lavorare sul computer</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="tel:+390398882041" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">📞 CHIAMA PER AGGIORNAMENTI</a>
                </div>
                
                <p style="color: #6b7280; margin-top: 30px;">Ti terremo aggiornato durante tutto l'intervento.</p>
                <p style="margin: 5px 0 0 0; font-weight: bold; color: #374151;">Il Team IT-ERA</p>
            </div>
        </div>`,
        text: `⚡ TECNICO IN ARRIVO\n\nCiao {{NAME}},\n\nIl nostro tecnico specializzato sta arrivando per risolvere il tuo problema.\n\nDettagli:\n- Tecnico: Marco Rossi (Certificato Microsoft & CompTIA)\n- Tempo stimato: 1-3 ore\n- Contatto: 039 888 2041\n\nPortiamo strumenti diagnostici e ricambi originali.\n\nIl Team IT-ERA`
    },

    business_immediate: {
        subject: '💼 Richiesta ricevuta - Preventivo entro 24h per {{COMPANY}}',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #1e40af, #1d4ed8); color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px;">💼 RICHIESTA RICEVUTA</h1>
                <p style="margin: 15px 0 0 0; font-size: 18px;">Preventivo professionale entro 24 ore</p>
            </div>
            
            <div style="padding: 30px;">
                <p style="font-size: 18px;">Gentile <strong>{{NAME}}</strong>,</p>
                
                <p style="font-size: 16px; line-height: 1.6;">Grazie per aver richiesto una consulenza IT professionale per <strong>{{COMPANY}}</strong>. La vostra fiducia in IT-ERA è molto importante per noi.</p>
                
                <div style="background: #eff6ff; border-left: 5px solid #1e40af; padding: 20px; margin: 25px 0; border-radius: 5px;">
                    <h3 style="margin: 0 0 10px 0; color: #1e40af;">🎯 PROCESSO CONSULENZA PERSONALIZZATA</h3>
                    <p style="margin: 0;">Il nostro team di consulenti senior analizzerà le vostre esigenze specifiche per proporvi la soluzione IT più efficace ed economica.</p>
                </div>
                
                <h3 style="color: #374151; margin: 30px 0 20px 0;">📋 Roadmap Consulenza:</h3>
                
                <div style="position: relative;">
                    <div style="display: flex; align-items: flex-start; margin-bottom: 20px;">
                        <div style="background: #1e40af; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 20px; font-weight: bold; flex-shrink: 0;">1</div>
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 8px 0; color: #1e40af;">Analisi Preliminare (entro 2 ore)</h4>
                            <p style="margin: 0; color: #6b7280; line-height: 1.5;">Revisione della vostra richiesta e preparazione domande specifiche per approfondire le esigenze tecniche e di budget.</p>
                        </div>
                    </div>
                    
                    <div style="display: flex; align-items: flex-start; margin-bottom: 20px;">
                        <div style="background: #1e40af; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 20px; font-weight: bold; flex-shrink: 0;">2</div>
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 8px 0; color: #1e40af;">Preventivo Dettagliato (entro 24 ore)</h4>
                            <p style="margin: 0; color: #6b7280; line-height: 1.5;">Documento completo con analisi tecnica, timeline di implementazione, costi dettagliati e ROI previsto.</p>
                        </div>
                    </div>
                    
                    <div style="display: flex; align-items: flex-start; margin-bottom: 20px;">
                        <div style="background: #1e40af; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 20px; font-weight: bold; flex-shrink: 0;">3</div>
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 8px 0; color: #1e40af;">Presentazione Personalizzata</h4>
                            <p style="margin: 0; color: #6b7280; line-height: 1.5;">Chiamata o incontro per presentare la soluzione, rispondere alle domande e definire i dettagli operativi.</p>
                        </div>
                    </div>
                </div>
                
                <div style="background: #f0f9ff; border: 2px solid #0ea5e9; padding: 25px; margin: 30px 0; border-radius: 10px;">
                    <h3 style="margin: 0 0 15px 0; color: #0c4a6e; text-align: center;">🏆 PERCHÉ SCEGLIERE IT-ERA</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div style="text-align: center;">
                            <div style="font-size: 24px; margin-bottom: 8px;">🎓</div>
                            <strong style="color: #0c4a6e;">Certificazioni Enterprise</strong><br>
                            <span style="font-size: 14px; color: #075985;">Microsoft Partner, Cisco Certified</span>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; margin-bottom: 8px;">🏢</div>
                            <strong style="color: #0c4a6e;">200+ Aziende Clienti</strong><br>
                            <span style="font-size: 14px; color: #075985;">PMI e Enterprise in Lombardia</span>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; margin-bottom: 8px;">⚡</div>
                            <strong style="color: #0c4a6e;">99.9% Uptime</strong><br>
                            <span style="font-size: 14px; color: #075985;">SLA garantiti e monitoraggio 24/7</span>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; margin-bottom: 8px;">🛡️</div>
                            <strong style="color: #0c4a6e;">Supporto Continuativo</strong><br>
                            <span style="font-size: 14px; color: #075985;">Assistenza post-implementazione</span>
                        </div>
                    </div>
                </div>
                
                <div style="background: #fef3c7; border-left: 5px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 5px;">
                    <h3 style="margin: 0 0 10px 0; color: #d97706;">⏰ TEMPISTICHE GARANTITE</h3>
                    <p style="margin: 0; color: #92400e;"><strong>Preventivo dettagliato entro 24 ore</strong> - Se avete urgenze particolari, chiamateci direttamente al <strong>039 888 2041</strong></p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="tel:+390398882041" style="background: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-right: 10px;">📞 CHIAMACI ORA</a>
                    <a href="mailto:info@bulltech.it" style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">📧 SCRIVI EMAIL</a>
                </div>
                
                <p style="color: #6b7280; margin-top: 30px;">Siamo entusiasti di lavorare con {{COMPANY}} per ottimizzare la vostra infrastruttura IT.</p>
                <p style="margin: 5px 0 0 0; font-weight: bold; color: #374151;">Il Team Consulenza IT-ERA</p>
            </div>
            
            <div style="background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
                <p style="margin: 0;">IT-ERA - Consulenza IT Professionale per Aziende</p>
                <p style="margin: 5px 0 0 0;">📧 info@bulltech.it | 📞 039 888 2041 | 🌐 it-era.it</p>
            </div>
        </div>`,
        text: `💼 RICHIESTA RICEVUTA - Preventivo entro 24h\n\nGentile {{NAME}},\n\nGrazie per aver richiesto una consulenza IT per {{COMPANY}}.\n\nProcesso:\n1. Analisi preliminare (entro 2 ore)\n2. Preventivo dettagliato (entro 24 ore)\n3. Presentazione personalizzata\n\nPerché IT-ERA:\n- Certificazioni Microsoft Partner, Cisco\n- 200+ aziende clienti\n- 99.9% uptime garantito\n- Supporto continuativo\n\nPer informazioni immediate: 039 888 2041\n\nIl Team Consulenza IT-ERA`
    },

    business_quote: {
        subject: '📊 Preventivo personalizzato per {{COMPANY}} - Soluzione IT completa',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #059669, #047857); color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px;">📊 PREVENTIVO PRONTO</h1>
                <p style="margin: 15px 0 0 0; font-size: 18px;">Soluzione IT personalizzata per {{COMPANY}}</p>
            </div>
            
            <div style="padding: 30px;">
                <p style="font-size: 18px;">Gentile <strong>{{NAME}}</strong>,</p>
                
                <p style="font-size: 16px; line-height: 1.6;">Come promesso, abbiamo preparato un preventivo dettagliato per le esigenze IT di <strong>{{COMPANY}}</strong>.</p>
                
                <div style="background: #ecfdf5; border-left: 5px solid #059669; padding: 20px; margin: 25px 0; border-radius: 5px;">
                    <h3 style="margin: 0 0 10px 0; color: #059669;">✅ ANALISI COMPLETATA</h3>
                    <p style="margin: 0;">Il nostro team ha analizzato le vostre esigenze e preparato una soluzione su misura che ottimizzerà la vostra infrastruttura IT.</p>
                </div>
                
                <div style="background: #f8fafc; border: 2px solid #e2e8f0; padding: 25px; margin: 25px 0; border-radius: 10px;">
                    <h3 style="margin: 0 0 20px 0; color: #374151; text-align: center;">📋 CONTENUTO PREVENTIVO</h3>
                    
                    <div style="margin-bottom: 20px;">
                        <h4 style="margin: 0 0 10px 0; color: #1e40af;">🎯 Analisi Situazione Attuale</h4>
                        <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
                            <li>Audit infrastruttura esistente</li>
                            <li>Identificazione criticità e opportunità</li>
                            <li>Valutazione sicurezza e performance</li>
                        </ul>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <h4 style="margin: 0 0 10px 0; color: #1e40af;">🚀 Soluzione Proposta</h4>
                        <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
                            <li>Architettura IT ottimizzata</li>
                            <li>Hardware e software raccomandati</li>
                            <li>Piano di migrazione dettagliato</li>
                            <li>Formazione del personale</li>
                        </ul>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <h4 style="margin: 0 0 10px 0; color: #1e40af;">💰 Investimento e ROI</h4>
                        <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
                            <li>Costi dettagliati per fase</li>
                            <li>Opzioni di finanziamento</li>
                            <li>ROI previsto e tempi di recupero</li>
                            <li>Confronto con alternative</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 style="margin: 0 0 10px 0; color: #1e40af;">📅 Timeline Implementazione</h4>
                        <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
                            <li>Fasi di implementazione</li>
                            <li>Milestone e deliverable</li>
                            <li>Tempi di realizzazione</li>
                            <li>Piano di testing e go-live</li>
                        </ul>
                    </div>
                </div>
                
                <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 8px; text-align: center;">
                    <h3 style="margin: 0 0 15px 0; color: #d97706;">🎁 OFFERTA SPECIALE LIMITATA</h3>
                    <p style="margin: 0; font-size: 18px; color: #92400e;"><strong>Sconto 15% se confermate entro 7 giorni</strong></p>
                    <p style="margin: 10px 0 0 0; font-size: 14px; color: #92400e;">Valida fino al {{OFFER_EXPIRY_DATE}}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="tel:+390398882041" style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 5px;">📞 DISCUTIAMO IL PREVENTIVO</a>
                    <br>
                    <a href="mailto:info@bulltech.it?subject=Preventivo {{COMPANY}} - Domande" style="background: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 5px;">❓ FAI DOMANDE VIA EMAIL</a>
                </div>
                
                <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
                    <h3 style="margin: 0 0 15px 0; color: #0c4a6e;">🤝 PROSSIMI PASSI</h3>
                    <ol style="margin: 0; padding-left: 20px; color: #075985;">
                        <li style="margin-bottom: 8px;">Revisionate il preventivo allegato</li>
                        <li style="margin-bottom: 8px;">Chiamateci per chiarimenti o modifiche</li>
                        <li style="margin-bottom: 8px;">Programmiamo una presentazione dettagliata</li>
                        <li>Definiamo insieme i dettagli operativi</li>
                    </ol>
                </div>
                
                <p style="color: #6b7280; margin-top: 30px;">Siamo a vostra disposizione per qualsiasi chiarimento. Il nostro obiettivo è fornirvi la soluzione IT più efficace per far crescere {{COMPANY}}.</p>
                <p style="margin: 15px 0 0 0; font-weight: bold; color: #374151;">Il Team Consulenza IT-ERA</p>
                <p style="margin: 5px 0 0 0; color: #6b7280; font-style: italic;">P.S. Il preventivo è valido 30 giorni, ma lo sconto del 15% scade tra 7 giorni!</p>
            </div>
        </div>`,
        text: `📊 PREVENTIVO PRONTO per {{COMPANY}}\n\nGentile {{NAME}},\n\nIl preventivo personalizzato per {{COMPANY}} è pronto!\n\nContenuto:\n- Analisi situazione attuale\n- Soluzione IT ottimizzata\n- Investimento e ROI dettagliato\n- Timeline implementazione\n\n🎁 OFFERTA SPECIALE: 15% di sconto se confermate entro 7 giorni!\n\nChiamateci per discutere: 039 888 2041\n\nIl Team Consulenza IT-ERA`
    }
};

// Export templates
if (typeof window !== 'undefined') {
    window.ITERAEmailTemplates = ITERAEmailTemplates;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ITERAEmailTemplates;
}
