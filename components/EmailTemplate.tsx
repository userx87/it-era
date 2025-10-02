import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Row,
  Column,
} from '@react-email/components';

interface EmailTemplateProps {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service?: string;
  message: string;
  urgency?: 'low' | 'medium' | 'high' | 'emergency';
  timestamp: string;
}

export const EmailTemplate: React.FC<EmailTemplateProps> = ({
  name,
  email,
  phone,
  company,
  service,
  message,
  urgency = 'medium',
  timestamp,
}) => {
  const urgencyColors = {
    low: '#27ae60',
    medium: '#f39c12',
    high: '#e67e22',
    emergency: '#e74c3c'
  };

  const urgencyLabels = {
    low: 'Bassa priorità',
    medium: 'Priorità normale',
    high: 'Alta priorità',
    emergency: '🚨 EMERGENZA'
  };

  return (
    <Html>
      <Head />
      <Preview>Nuovo contatto da {name} - {company || 'Privato'}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src="https://it-era.it/images/logo.png"
              width="150"
              height="50"
              alt="IT-ERA"
              style={logo}
            />
            <Text style={headerText}>Nuovo Contatto dal Sito Web</Text>
          </Section>

          {/* Urgency Badge */}
          {urgency === 'emergency' && (
            <Section style={emergencyBanner}>
              <Text style={emergencyText}>
                🚨 RICHIESTA URGENTE - INTERVENTO RICHIESTO
              </Text>
            </Section>
          )}

          {/* Contact Details */}
          <Section style={content}>
            <Heading style={h2}>Dettagli Contatto</Heading>

            <Row style={infoRow}>
              <Column style={infoLabel}>Nome:</Column>
              <Column style={infoValue}>{name}</Column>
            </Row>

            <Row style={infoRow}>
              <Column style={infoLabel}>Email:</Column>
              <Column style={infoValue}>
                <Link href={`mailto:${email}`} style={link}>
                  {email}
                </Link>
              </Column>
            </Row>

            {phone && (
              <Row style={infoRow}>
                <Column style={infoLabel}>Telefono:</Column>
                <Column style={infoValue}>
                  <Link href={`tel:${phone}`} style={link}>
                    {phone}
                  </Link>
                </Column>
              </Row>
            )}

            {company && (
              <Row style={infoRow}>
                <Column style={infoLabel}>Azienda:</Column>
                <Column style={infoValue}>{company}</Column>
              </Row>
            )}

            {service && (
              <Row style={infoRow}>
                <Column style={infoLabel}>Servizio:</Column>
                <Column style={infoValue}>{service}</Column>
              </Row>
            )}

            <Row style={infoRow}>
              <Column style={infoLabel}>Priorità:</Column>
              <Column style={infoValue}>
                <span style={{
                  ...badge,
                  backgroundColor: urgencyColors[urgency]
                }}>
                  {urgencyLabels[urgency]}
                </span>
              </Column>
            </Row>
          </Section>

          {/* Message */}
          <Section style={messageSection}>
            <Heading style={h3}>Messaggio</Heading>
            <Text style={messageText}>{message}</Text>
          </Section>

          {/* Action Buttons */}
          <Section style={buttonSection}>
            <Row>
              <Column align="center">
                <Button
                  style={primaryButton}
                  href={`mailto:${email}?subject=Re: Richiesta assistenza IT-ERA`}
                >
                  Rispondi via Email
                </Button>
              </Column>
              {phone && (
                <Column align="center">
                  <Button
                    style={secondaryButton}
                    href={`tel:${phone}`}
                  >
                    Chiama {phone}
                  </Button>
                </Column>
              )}
            </Row>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Ricevuto il: {new Date(timestamp).toLocaleString('it-IT')}
            </Text>
            <Text style={footerText}>
              {urgency === 'emergency' && (
                <>
                  ⚡ Tempo di risposta garantito: 15 minuti<br />
                </>
              )}
              Sistema di gestione contatti IT-ERA
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const header = {
  padding: '24px',
  backgroundColor: '#2c3e50',
  borderTopLeftRadius: '8px',
  borderTopRightRadius: '8px',
};

const logo = {
  margin: '0 auto',
  marginBottom: '16px',
};

const headerText = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '600',
  textAlign: 'center' as const,
  margin: '0',
};

const emergencyBanner = {
  backgroundColor: '#e74c3c',
  padding: '12px',
  margin: '0',
};

const emergencyText = {
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '0',
};

const content = {
  padding: '24px',
};

const h2 = {
  color: '#2c3e50',
  fontSize: '20px',
  fontWeight: '600',
  marginBottom: '16px',
};

const h3 = {
  color: '#2c3e50',
  fontSize: '18px',
  fontWeight: '600',
  marginBottom: '12px',
};

const infoRow = {
  marginBottom: '12px',
  width: '100%',
};

const infoLabel = {
  color: '#7f8c8d',
  fontSize: '14px',
  fontWeight: '600',
  width: '120px',
  verticalAlign: 'top' as const,
};

const infoValue = {
  color: '#2c3e50',
  fontSize: '14px',
  verticalAlign: 'top' as const,
};

const link = {
  color: '#3498db',
  textDecoration: 'none',
};

const badge = {
  display: 'inline-block',
  padding: '4px 12px',
  borderRadius: '16px',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
};

const messageSection = {
  padding: '0 24px 24px',
  borderTop: '1px solid #ecf0f1',
  marginTop: '24px',
  paddingTop: '24px',
};

const messageText = {
  color: '#34495e',
  fontSize: '14px',
  lineHeight: '24px',
  whiteSpace: 'pre-wrap' as const,
};

const buttonSection = {
  padding: '0 24px 24px',
};

const primaryButton = {
  backgroundColor: '#27ae60',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 24px',
  display: 'inline-block',
  width: '200px',
};

const secondaryButton = {
  backgroundColor: '#3498db',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 24px',
  display: 'inline-block',
  width: '200px',
};

const footer = {
  padding: '24px',
  backgroundColor: '#ecf0f1',
  borderBottomLeftRadius: '8px',
  borderBottomRightRadius: '8px',
};

const footerText = {
  color: '#7f8c8d',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '0',
};

export default EmailTemplate;