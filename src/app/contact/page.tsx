'use client';

import React from 'react';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock } from 'react-icons/fa';

const ContactPage = () => {
  const contactInfo = [
    {
      icon: FaPhone,
      title: 'Phone',
      details: ['+254 (0) 11 2246 573'],
      description: 'Available Monday to Friday, 9:00 AM to 5:00 PM EAT',
    },
    {
      icon: FaEnvelope,
      title: 'Email',
      details: ['support@forecast254.com'],
      description: 'We aim to respond within 24 hours',
    },
    {
      icon: FaMapMarkerAlt,
      title: 'Office',
      details: [
        'Smatica Technologies',
        'Nairobi, Kenya',
      ],
      description: 'Visit us during business hours',
    },
    {
      icon: FaClock,
      title: 'Business Hours',
      details: [
        'Monday - Friday: 9:00 AM - 5:00 PM EAT',
        'Saturday - Sunday: Closed',
      ],
      description: 'East Africa Time (UTC+3)',
    },
  ];

  const [formState, setFormState] = React.useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formState),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setStatus('success');
      setFormState({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send message');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Have questions about Forecast254? We&apos;re here to help! Choose your preferred
            method of contact below.
          </p>
        </div>

        {/* Contact Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {contactInfo.map((info, index) => (
            <div
              key={index}
              className="p-6 bg-card border border-border rounded-lg hover:border-primary transition-colors"
            >
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <info.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{info.title}</h3>
                  {info.details.map((detail, detailIndex) => (
                    <p
                      key={detailIndex}
                      className="text-foreground"
                    >
                      {detail}
                    </p>
                  ))}
                  <p className="text-sm text-muted-foreground mt-2">
                    {info.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="bg-card border border-border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formState.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                  disabled={status === 'loading'}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formState.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                  disabled={status === 'loading'}
                />
              </div>
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium mb-2">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formState.subject}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
                disabled={status === 'loading'}
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formState.message}
                onChange={handleChange}
                rows={6}
                className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
                disabled={status === 'loading'}
              ></textarea>
            </div>
            
            {status === 'error' && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
                {errorMessage}
              </div>
            )}
            
            {status === 'success' && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-500">
                Message sent successfully! We&apos;ll get back to you soon.
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full md:w-auto px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
        </div>

        {/* Additional Support Info */}
        <div className="mt-12 p-6 bg-primary/5 border border-primary/20 rounded-lg text-center">
          <h3 className="text-lg font-semibold mb-2">Need Immediate Support?</h3>
          <p className="text-muted-foreground">
            Check our{' '}
            <a href="/docs/faqs" className="text-primary hover:text-primary/80">
              FAQs
            </a>
            {' '}for quick answers or visit our{' '}
            <a href="/docs/support" className="text-primary hover:text-primary/80">
              Support Center
            </a>
            {' '}for comprehensive guidance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
