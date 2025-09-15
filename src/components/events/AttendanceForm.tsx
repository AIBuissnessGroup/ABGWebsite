'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Event } from '../../types/events';

interface AttendanceFormProps {
  event: Event;
  initialEmail?: string;
  onSuccess: (email: string) => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  umichEmail: string;
  major: string;
  gradeLevel: string;
  phone: string;
  password: string;
}

export default function AttendanceForm({ event, initialEmail = '', onSuccess, onCancel }: AttendanceFormProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    umichEmail: initialEmail,
    major: '',
    gradeLevel: '',
    phone: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Check if user needs to be logged in with UMich email
  const requiresUMichLogin = true; // Always require UMich login for event registration
  const isLoggedInWithUMich = session?.user?.email?.endsWith('@umich.edu');

  // Auto-populate form data from user profile when logged in
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (session?.user?.email && !profileLoaded) {
        try {
          const response = await fetch('/api/user/profile');
          if (response.ok) {
            const userData = await response.json();
            setFormData(prev => ({
              ...prev,
              name: userData.name || prev.name,
              umichEmail: userData.email || prev.umichEmail,
              major: userData.profile?.major || prev.major,
              gradeLevel: userData.profile?.graduationYear ? 
                (new Date().getFullYear() - parseInt(userData.profile.graduationYear) + 4).toString() : prev.gradeLevel,
              phone: userData.profile?.phone || prev.phone
            }));
            setProfileLoaded(true);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setProfileLoaded(true); // Still mark as loaded to avoid infinite retries
        }
      }
    };

    fetchUserProfile();
  }, [session, profileLoaded]);

  const requiredFields = event.attendanceConfirmation?.requiredFields || {
    name: false,
    umichEmail: true,
    major: false,
    gradeLevel: false,
    phone: false
  };
  const needsPassword = event.attendanceConfirmation?.requiresPassword;
  const allowUMichOnly = event.attendanceConfirmation?.allowUMichEmailOnly;
  const smsReminders = event.attendanceConfirmation?.smsReminders;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validate UMich email
    if (allowUMichOnly && !formData.umichEmail.endsWith('@umich.edu')) {
      setError('Please use your University of Michigan email address (@umich.edu)');
      setIsSubmitting(false);
      return;
    }

    // Validate required fields
    const errors: string[] = [];
    if (requiredFields.name && !formData.name.trim()) {
      errors.push('Name is required');
    }
    if (requiredFields.umichEmail && !formData.umichEmail.trim()) {
      errors.push('Email is required');
    }
    if (requiredFields.major && !formData.major.trim()) {
      errors.push('Major is required');
    }
    if (requiredFields.gradeLevel && !formData.gradeLevel.trim()) {
      errors.push('Grade level is required');
    }
    if (smsReminders && !formData.phone.trim()) {
      errors.push('Phone number is required for SMS reminders');
    }
    if (needsPassword && !formData.password.trim()) {
      errors.push('Password is required');
    }

    if (errors.length > 0) {
      setError(errors.join(', '));
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/events/${event.id}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: requiredFields.name ? formData.name : undefined,
          umichEmail: formData.umichEmail,
          major: requiredFields.major ? formData.major : undefined,
          gradeLevel: requiredFields.gradeLevel ? formData.gradeLevel : undefined,
          phone: smsReminders ? formData.phone : undefined,
          password: needsPassword ? formData.password : undefined
        })
      });

      const result = await response.json();

      if (response.ok) {
        onSuccess(formData.umichEmail);
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-light text-white">Register</h3>
        <button 
          onClick={onCancel}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p className="text-gray-300 mb-8 font-light">
        {event.title}
      </p>

      {requiresUMichLogin && !isLoggedInWithUMich && (
        <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-6 mb-6">
          <h4 className="text-yellow-400 font-medium mb-3">University of Michigan Login Required</h4>
          <p className="text-gray-300 text-sm mb-4">
            This event requires you to log in with your University of Michigan account to register.
          </p>
          <button
            type="button"
            onClick={() => {
              const currentUrl = window.location.href;
              window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(currentUrl)}`;
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Sign in with UMich
          </button>
        </div>
      )}

      {(!requiresUMichLogin || isLoggedInWithUMich) && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {requiredFields.name && (
          <div>
            <label className="block text-sm font-light text-gray-300 mb-2">
              Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-white transition-colors text-white placeholder-gray-400"
              placeholder="Your full name"
            />
          </div>
        )}

        {requiredFields.umichEmail && (
          <div>
            <label className="block text-sm font-light text-gray-300 mb-2">
              University of Michigan Email
            </label>
            <input
              type="email"
              required
              value={formData.umichEmail}
              onChange={(e) => setFormData({ ...formData, umichEmail: e.target.value })}
              readOnly={isLoggedInWithUMich}
              className={`w-full p-4 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-white transition-colors text-white placeholder-gray-400 ${
                isLoggedInWithUMich ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              placeholder="name@umich.edu"
            />
            <p className="text-sm text-gray-400 mt-2 font-light">
              {isLoggedInWithUMich 
                ? 'Using your authenticated UMich email' 
                : 'Must be a valid @umich.edu email address'
              }
            </p>
          </div>
        )}

        {requiredFields.major && (
          <div>
            <label className="block text-sm font-light text-gray-300 mb-2">
              Major
            </label>
            <input
              type="text"
              required
              value={formData.major}
              onChange={(e) => setFormData({ ...formData, major: e.target.value })}
              className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-white transition-colors text-white placeholder-gray-400"
              placeholder="Computer Science, Business, etc."
            />
          </div>
        )}

        {requiredFields.gradeLevel && (
          <div>
            <label className="block text-sm font-light text-gray-300 mb-2">
              Grade Level
            </label>
            <select
              required
              value={formData.gradeLevel}
              onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
              className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-white transition-colors text-white"
            >
              <option value="">Select grade level</option>
              <option value="Freshman">Freshman</option>
              <option value="Sophomore">Sophomore</option>
              <option value="Junior">Junior</option>
              <option value="Senior">Senior</option>
              <option value="Graduate">Graduate Student</option>
              <option value="PhD">PhD Student</option>
              <option value="Other">Other</option>
            </select>
          </div>
        )}

        {smsReminders && (
          <div>
            <label className="block text-sm font-light text-gray-300 mb-2">
              Phone Number (for SMS reminders)
            </label>
            <input
              type="tel"
              required={smsReminders}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-white transition-colors text-white placeholder-gray-400"
              placeholder="(123) 456-7890"
            />
            <p className="text-sm text-gray-400 mt-2">
              You'll receive SMS reminders about this event
            </p>
          </div>
        )}

        {needsPassword && (
          <div>
            <label className="block text-sm font-semibold text-[#00274c] mb-2">
              Event Password *
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] focus:border-[#00274c] transition-colors text-gray-900"
              placeholder="Enter the event password"
            />
            <p className="text-sm text-gray-600 mt-2">
              Contact the event organizer if you don't have the password
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-500 mr-3 text-xl">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

                <div className="flex gap-4 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors font-light"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>
        </div>

        {/* Capacity info */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="text-sm text-gray-400 text-center">
            {event.capacity ? (
              <>This event has limited capacity ({event.capacity} spots)</>
            ) : (
              <>This event has unlimited capacity</>
            )}
            {event.waitlist?.enabled && (
              <> • Waitlist available if event fills up</>
            )}
          </div>
        </div>
        </form>
      )}
    </div>
  );
}