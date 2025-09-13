/**
 * IT-ERA Contact Form Handler
 * Endpoint per gestire i form di contatto tramite Vercel Functions
 */

export default async function handler(req, res) {
    // Abilita CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Solo POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed' 
        });
    }

    try {
        const {
            full_name,
            email,
            phone,
            company,
            message,
            service_type,
            urgency,
            project_description,
            budget_range,
            preferred_contact,
            test
        } = req.body;

        // Validazione base
        if (!email || !full_name) {
            return res.status(400).json({
                success: false,
                error: 'Nome e email sono obbligatori'
            });
        }

        // Se è un test, restituisci successo
        if (test) {
            return res.status(200).json({
                success: true,
                message: 'Test completato con successo',
                data: {
                    timestamp: new Date().toISOString(),
                    form_type: service_type || 'contact',
                    test_mode: true
                }
            });
        }

        // Log dei dati ricevuti (in produzione usare un logger appropriato)
        console.log('📧 Nuovo contatto ricevuto:', {
            name: full_name,
            email: email,
            service: service_type,
            timestamp: new Date().toISOString()
        });

        // Qui dovrebbe esserci l'integrazione con Resend.com
        // Per ora simuliamo l'invio email
        const emailData = {
            to: 'info@it-era.it',
            from: 'noreply@it-era.it',
            subject: `Nuovo contatto da ${full_name} - ${service_type || 'Contatto generico'}`,
            html: `
                <h2>Nuovo contatto dal sito IT-ERA</h2>
                <p><strong>Nome:</strong> ${full_name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Telefono:</strong> ${phone || 'Non fornito'}</p>
                <p><strong>Azienda:</strong> ${company || 'Non fornita'}</p>
                <p><strong>Tipo servizio:</strong> ${service_type || 'Non specificato'}</p>
                <p><strong>Urgenza:</strong> ${urgency || 'Normale'}</p>
                <p><strong>Budget:</strong> ${budget_range || 'Non specificato'}</p>
                <p><strong>Contatto preferito:</strong> ${preferred_contact || 'Email'}</p>
                <p><strong>Messaggio:</strong></p>
                <p>${message || project_description || 'Nessun messaggio'}</p>
                <hr>
                <p><small>Inviato il: ${new Date().toLocaleString('it-IT')}</small></p>
            `
        };

        // TODO: Implementare invio reale con Resend.com
        // const resendResponse = await resend.emails.send(emailData);

        // Per ora restituiamo successo simulato
        return res.status(200).json({
            success: true,
            message: 'Messaggio inviato con successo! Ti contatteremo presto.',
            data: {
                timestamp: new Date().toISOString(),
                form_type: service_type || 'contact',
                contact_id: `ITERA-${Date.now()}`
            }
        });

    } catch (error) {
        console.error('❌ Errore nel form di contatto:', error);
        
        return res.status(500).json({
            success: false,
            error: 'Errore interno del server. Riprova più tardi.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
