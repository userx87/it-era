import React, { useState } from 'react';

type FormData = {
  name: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  message: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
};

export const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: '',
    message: '',
    urgency: 'medium'
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: 'success',
          message: data.message || 'Messaggio inviato con successo!'
        });
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          service: '',
          message: '',
          urgency: 'medium'
        });
      } else {
        setStatus({
          type: 'error',
          message: data.error || 'Si è verificato un errore. Riprova.'
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Errore di connessione. Riprova più tardi.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="contact-form max-w-2xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Nome *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Il tuo nome"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="tua@email.com"
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Telefono
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="039 888 2041"
          />
        </div>

        {/* Company */}
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
            Azienda
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Nome azienda"
          />
        </div>

        {/* Service */}
        <div>
          <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-2">
            Servizio richiesto
          </label>
          <select
            id="service"
            name="service"
            value={formData.service}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Seleziona un servizio</option>
            <option value="assistenza-it">Assistenza IT</option>
            <option value="cybersecurity">Cybersecurity</option>
            <option value="cloud">Cloud & Backup</option>
            <option value="voip">VoIP & Centralino</option>
            <option value="software">Software Gestionali</option>
            <option value="consulenza">Consulenza IT</option>
            <option value="altro">Altro</option>
          </select>
        </div>

        {/* Urgency */}
        <div>
          <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-2">
            Priorità
          </label>
          <select
            id="urgency"
            name="urgency"
            value={formData.urgency}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="low">Bassa - Informazioni</option>
            <option value="medium">Media - Preventivo</option>
            <option value="high">Alta - Problema da risolvere</option>
            <option value="emergency">🚨 Emergenza - Intervento immediato</option>
          </select>
        </div>
      </div>

      {/* Message */}
      <div className="mt-6">
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
          Messaggio *
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={5}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Descrivi il tuo problema o richiesta..."
        />
      </div>

      {/* Status Messages */}
      {status.type && (
        <div className={`mt-4 p-4 rounded-lg ${
          status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {status.message}
        </div>
      )}

      {/* Submit Button */}
      <div className="mt-6 flex items-center justify-between">
        <button
          type="submit"
          disabled={loading}
          className={`px-8 py-3 rounded-lg font-semibold text-white transition-all ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 active:scale-95'
          }`}
        >
          {loading ? 'Invio in corso...' : 'Invia Messaggio'}
        </button>

        {formData.urgency === 'emergency' && (
          <a
            href="tel:0398882041"
            className="inline-flex items-center text-red-600 font-semibold hover:underline"
          >
            📞 Chiama subito: 039 888 2041
          </a>
        )}
      </div>

      {/* Privacy Notice */}
      <p className="mt-4 text-xs text-gray-500">
        Inviando questo form accetti la nostra{' '}
        <a href="/privacy" className="text-green-600 hover:underline">
          privacy policy
        </a>.
        I tuoi dati saranno trattati nel rispetto del GDPR.
      </p>
    </form>
  );
};

export default ContactForm;