export const metadata = {
  title: 'Terms of Use | AI Business Group - University of Michigan',
  description: 'Terms of Use for AI Business Group (ABG) at the University of Michigan.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a2c45] via-[#00274c] to-[#0d1d35] py-16 sm:py-20 px-4 sm:px-6 lg:px-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="heading-primary text-4xl sm:text-5xl mb-3" style={{ color: 'white' }}>
            Terms of Use
          </h1>
          <p className="text-sm text-muted">Last updated: August 2025</p>
        </header>

        <section className="glass-card p-6 sm:p-8 mb-6">
          <h2 className="heading-secondary text-xl sm:text-2xl mb-3" style={{ color: 'white' }}>
            Acceptance of Terms
          </h2>
          <p className="body-text" style={{ color: '#BBBBBB' }}>
            By accessing or using the AI Business Group ("ABG") website, you agree to be bound by
            these Terms of Use and our Privacy Policy. If you do not agree, please do not use the site.
          </p>
        </section>

        <section className="glass-card p-6 sm:p-8 mb-6">
          <h2 className="heading-secondary text-xl sm:text-2xl mb-3" style={{ color: 'white' }}>
            Use of Content
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li className="body-text" style={{ color: '#BBBBBB' }}>
              Content is provided for informational and educational purposes related to ABG activities.
            </li>
            <li className="body-text" style={{ color: '#BBBBBB' }}>
              You may not copy, distribute, or modify content without permission, except as permitted
              by applicable law.
            </li>
          </ul>
        </section>

        <section className="glass-card p-6 sm:p-8 mb-6">
          <h2 className="heading-secondary text-xl sm:text-2xl mb-3" style={{ color: 'white' }}>
            User Conduct
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li className="body-text" style={{ color: '#BBBBBB' }}>
              You agree not to engage in unlawful, harmful, or disruptive behavior when using the site.
            </li>
            <li className="body-text" style={{ color: '#BBBBBB' }}>
              You must not attempt to gain unauthorized access to any systems or data.
            </li>
          </ul>
        </section>

        <section className="glass-card p-6 sm:p-8 mb-6">
          <h2 className="heading-secondary text-xl sm:text-2xl mb-3" style={{ color: 'white' }}>
            Disclaimers & Limitation of Liability
          </h2>
          <p className="body-text" style={{ color: '#BBBBBB' }}>
            The site is provided on an "as is" and "as available" basis without warranties of any kind.
            To the fullest extent permitted by law, ABG disclaims all warranties and will not be liable
            for any damages arising from your use of the site.
          </p>
        </section>

        <section className="glass-card p-6 sm:p-8 mb-6">
          <h2 className="heading-secondary text-xl sm:text-2xl mb-3" style={{ color: 'white' }}>
            Conference Ticketing, Payments & Refund Policy
          </h2>
          <div className="space-y-3 body-text" style={{ color: '#BBBBBB' }}>
            <p>
              <strong className="text-white">Pricing & Payment:</strong> Conference passes for the Michigan AI Business Conference 2026 are processed in USD ($13.00 Early Bird / $17.00 General Admission) securely via Stripe.
            </p>
            <p>
              <strong className="text-white">Instant Digital Delivery:</strong> All conference passes are delivered electronically immediately upon successful checkout. An email containing your receipt, digital badge, and unique check-in QR code is dispatched automatically.
            </p>
            <p>
              <strong className="text-white">Refund & Transfer Policy:</strong> All conference ticket sales are final and non-refundable. Registrations may be transferred to another individual up to 48 hours prior to the conference by contacting <a href="mailto:contact@umichaibusiness.com" className="underline text-white">contact@umichaibusiness.com</a>.
            </p>
            <p>
              <strong className="text-white">Merchant & Venue Details:</strong> Organized by the AI Business Group, University of Michigan. Venue: Stephen M. Ross School of Business, 701 Tappan Ave, Ann Arbor, MI 48109. Support contact: <a href="mailto:contact@umichaibusiness.com" className="underline text-white">contact@umichaibusiness.com</a>.
            </p>
          </div>
        </section>

        <section className="glass-card p-6 sm:p-8 mb-6">
          <h2 className="heading-secondary text-xl sm:text-2xl mb-3" style={{ color: 'white' }}>
            Changes to These Terms
          </h2>
          <p className="body-text" style={{ color: '#BBBBBB' }}>
            We may update these Terms from time to time. Continued use of the site after changes are
            posted constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section className="glass-card p-6 sm:p-8">
          <h2 className="heading-secondary text-xl sm:text-2xl mb-3" style={{ color: 'white' }}>
            Contact Us
          </h2>
          <p className="body-text" style={{ color: '#BBBBBB' }}>
            For questions about these Terms, contact us at
            <span> </span>
            <a href="mailto:ABGContact@umich.edu" className="underline" style={{ color: 'white' }}>
              ABGContact@umich.edu
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}


