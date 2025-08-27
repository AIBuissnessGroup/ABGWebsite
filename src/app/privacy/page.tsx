export const metadata = {
  title: 'Privacy Policy | AI Business Group - University of Michigan',
  description: 'Privacy Policy for AI Business Group (ABG) at the University of Michigan.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a2c45] via-[#00274c] to-[#0d1d35] py-16 sm:py-20 px-4 sm:px-6 lg:px-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="heading-primary text-4xl sm:text-5xl mb-3" style={{ color: 'white' }}>
            Privacy Policy
          </h1>
          <p className="text-sm text-muted">Last updated: August 2025</p>
        </header>

        <section className="glass-card p-6 sm:p-8 mb-6">
          <h2 className="heading-secondary text-xl sm:text-2xl mb-3" style={{ color: 'white' }}>
            Overview
          </h2>
          <p className="body-text" style={{ color: '#BBBBBB' }}>
            AI Business Group at the University of Michigan ("ABG", "we", "our") is committed to
            protecting your privacy. This policy describes the types of information we collect, how we
            use it, and your rights and choices.
          </p>
        </section>

        <section className="glass-card p-6 sm:p-8 mb-6">
          <h2 className="heading-secondary text-xl sm:text-2xl mb-3" style={{ color: 'white' }}>
            Information We Collect
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li className="body-text" style={{ color: '#BBBBBB' }}>
              Contact details you provide (such as name and email) when you subscribe to our
              newsletter, complete forms, or communicate with us.
            </li>
            <li className="body-text" style={{ color: '#BBBBBB' }}>
              Usage data, analytics, and aggregated information about how you interact with our
              website and services.
            </li>
            <li className="body-text" style={{ color: '#BBBBBB' }}>
              Event registrations and participation details when applicable.
            </li>
          </ul>
        </section>

        <section className="glass-card p-6 sm:p-8 mb-6">
          <h2 className="heading-secondary text-xl sm:text-2xl mb-3" style={{ color: 'white' }}>
            How We Use Your Information
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li className="body-text" style={{ color: '#BBBBBB' }}>
              To provide updates about ABG events, projects, and opportunities.
            </li>
            <li className="body-text" style={{ color: '#BBBBBB' }}>
              To manage event registrations, communications, and community engagement.
            </li>
            <li className="body-text" style={{ color: '#BBBBBB' }}>
              To analyze and improve our website, content, and outreach.
            </li>
          </ul>
        </section>

        <section className="glass-card p-6 sm:p-8 mb-6">
          <h2 className="heading-secondary text-xl sm:text-2xl mb-3" style={{ color: 'white' }}>
            Sharing of Information
          </h2>
          <p className="body-text" style={{ color: '#BBBBBB' }}>
            We do not sell your personal information. We may share information with trusted service
            providers who assist us in operating our website, communications, and events, subject to
            appropriate confidentiality safeguards. We may also share information if required by law or
            to protect our rights and community.
          </p>
        </section>

        <section className="glass-card p-6 sm:p-8 mb-6">
          <h2 className="heading-secondary text-xl sm:text-2xl mb-3" style={{ color: 'white' }}>
            Data Retention & Security
          </h2>
          <p className="body-text" style={{ color: '#BBBBBB' }}>
            We retain personal information only as long as necessary for the purposes described in this
            policy, or as required by applicable laws. We implement reasonable technical and
            organizational measures to protect your data.
          </p>
        </section>

        <section className="glass-card p-6 sm:p-8 mb-6">
          <h2 className="heading-secondary text-xl sm:text-2xl mb-3" style={{ color: 'white' }}>
            Your Choices
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li className="body-text" style={{ color: '#BBBBBB' }}>
              You can unsubscribe from our emails at any time using the link in our messages.
            </li>
            <li className="body-text" style={{ color: '#BBBBBB' }}>
              You may request access, correction, or deletion of your personal information where
              applicable.
            </li>
          </ul>
        </section>

        <section className="glass-card p-6 sm:p-8">
          <h2 className="heading-secondary text-xl sm:text-2xl mb-3" style={{ color: 'white' }}>
            Contact Us
          </h2>
          <p className="body-text" style={{ color: '#BBBBBB' }}>
            If you have questions about this policy or our data practices, contact us at
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


