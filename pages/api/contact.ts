import type { NextApiRequest, NextApiResponse } from 'next';
import { EmailTemplate } from '../../components/EmailTemplate';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

type ContactData = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service?: string;
  message: string;
  urgency?: 'low' | 'medium' | 'high' | 'emergency';
};

type ResponseData = {
  success?: boolean;
  message?: string;
  error?: string;
  id?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const contactData: ContactData = req.body;

    // Validate required fields
    if (!contactData.name || !contactData.email || !contactData.message) {
      return res.status(400).json({
        error: 'Missing required fields: name, email, and message are required'
      });
    }

    // Determine recipient based on urgency
    // Send TO: info@bulltech.it (destination)
    // Send FROM: it-era.it (verified domain on Resend)
    const recipients = process.env.NODE_ENV === 'development'
      ? ['codeagent087@gmail.com'] // Verified test email
      : contactData.urgency === 'emergency'
        ? ['info@bulltech.it', 'emergenze@bulltech.it']
        : ['info@bulltech.it'];

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: process.env.NODE_ENV === 'development'
        ? 'IT-ERA <onboarding@resend.dev>' // Test domain for development
        : 'IT-ERA <info@it-era.it>', // Production domain (VERIFIED ✅)
      to: recipients,
      reply_to: contactData.email,
      subject: `${contactData.urgency === 'emergency' ? '🚨 URGENTE' : 'Nuovo contatto'}: ${contactData.name} - ${contactData.service || 'Richiesta informazioni'}`,
      react: EmailTemplate({
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone,
        company: contactData.company,
        service: contactData.service,
        message: contactData.message,
        urgency: contactData.urgency,
        timestamp: new Date().toISOString()
      }),
      text: `
        Nuovo contatto dal sito IT-ERA

        Nome: ${contactData.name}
        Email: ${contactData.email}
        Telefono: ${contactData.phone || 'Non fornito'}
        Azienda: ${contactData.company || 'Non specificata'}
        Servizio: ${contactData.service || 'Non specificato'}
        Urgenza: ${contactData.urgency || 'normale'}

        Messaggio:
        ${contactData.message}

        ---
        Inviato il: ${new Date().toLocaleString('it-IT')}
      `
    });

    if (error) {
      console.error('Resend error:', error);

      // Fallback: save to database or send notification
      // await saveToDatabase(contactData);

      return res.status(400).json({
        error: 'Failed to send email. We have saved your request and will contact you soon.',
        message: error.message
      });
    }

    // Success response
    res.status(200).json({
      success: true,
      message: 'Messaggio inviato con successo! Ti contatteremo presto.',
      id: data?.id
    });

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({
      error: 'Internal server error. Please try again later.'
    });
  }
}