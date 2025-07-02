'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { analytics } from '@/lib/analytics';

interface NewsletterSignupProps {
  source?: string; // To track where the signup came from
  className?: string;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  buttonText?: string;
}

export default function NewsletterSignup({
  source = 'website',
  className = '',
  title = 'Stay Updated',
  subtitle = 'Get the latest updates on AI Business Group events and projects',
  placeholder = 'Enter your email',
  buttonText = 'Subscribe'
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Please enter your email address');
      return;
    }

    setLoading(true);
    setMessage('');

    // Track newsletter subscription attempt
    analytics.newsletter.subscribe(source);

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, source })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setIsSuccess(true);
        setEmail('');
        setName('');
        
        // Track successful subscription
        analytics.newsletter.subscribeSuccess(source);
      } else {
        setMessage(data.error || 'Something went wrong');
        setIsSuccess(false);
        
        // Track subscription error
        analytics.newsletter.subscribeError(source, data.error || 'unknown_error');
      }
    } catch (error) {
      console.error('Newsletter signup error:', error);
      setMessage('Failed to subscribe. Please try again.');
      setIsSuccess(false);
      
      // Track subscription error
      analytics.newsletter.subscribeError(source, 'network_error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 ${className}`}>
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <EnvelopeIcon className="w-5 h-5 text-white" />
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <p className="text-[#BBBBBB] text-sm">{subtitle}</p>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded mb-4 text-center text-sm ${
            isSuccess
              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
              : 'bg-red-500/20 text-red-300 border border-red-500/30'
          }`}
        >
          {message}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-[#BBBBBB] focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
        
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            required
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-[#BBBBBB] focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-white text-[#00274c] px-4 py-2 rounded font-medium hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {loading ? 'Subscribing...' : buttonText}
        </motion.button>
      </form>

      <p className="text-xs text-[#BBBBBB] mt-3 text-center">
        We respect your privacy. Unsubscribe at any time.
      </p>
    </div>
  );
} 