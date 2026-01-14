/**
 * Application Track Configuration
 * 
 * Centralized track definitions for the recruitment portal.
 * Add new tracks here and they will automatically appear throughout the app.
 */

import type { ApplicationTrack } from '@/types/recruitment';

export interface TrackConfig {
  value: ApplicationTrack;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
  color: string;        // Tailwind bg/text color class for selection
  accentColor: string;  // Tailwind border hover color
}

/**
 * All available application tracks
 * To add a new track:
 * 1. Add it to the ApplicationTrack type in src/types/recruitment.ts
 * 2. Add it to this TRACKS array
 * 3. Create questions for the track in the admin panel
 */
export const TRACKS: TrackConfig[] = [
  {
    value: 'business',
    label: 'Business Track',
    shortLabel: 'Business',
    description: 'For those interested in consulting, strategy, product, and business development roles',
    icon: '💼',
    color: 'bg-blue-100',
    accentColor: 'hover:border-blue-500',
  },
  {
    value: 'engineering',
    label: 'Engineering Track',
    shortLabel: 'Engineering',
    description: 'For those interested in software engineering, data science, and technical roles',
    icon: '💻',
    color: 'bg-purple-100',
    accentColor: 'hover:border-purple-500',
  },
  {
    value: 'ai_investment_fund',
    label: 'AI Investment Fund',
    shortLabel: 'AI Investment',
    description: 'For those interested in AI-focused investment analysis, portfolio management, and financial strategy',
    icon: '📈',
    color: 'bg-emerald-100',
    accentColor: 'hover:border-emerald-500',
  },
  {
    value: 'ai_energy_efficiency',
    label: 'AI Energy Efficiency',
    shortLabel: 'AI Energy',
    description: 'For those interested in applying AI to sustainability, energy optimization, and environmental impact',
    icon: '⚡',
    color: 'bg-amber-100',
    accentColor: 'hover:border-amber-500',
  },
];

/**
 * Get track config by value
 */
export function getTrackConfig(track: ApplicationTrack): TrackConfig | undefined {
  return TRACKS.find(t => t.value === track);
}

/**
 * Get track label by value
 */
export function getTrackLabel(track: ApplicationTrack): string {
  return getTrackConfig(track)?.label || track;
}

/**
 * Get track short label by value (for compact displays)
 */
export function getTrackShortLabel(track: ApplicationTrack): string {
  return getTrackConfig(track)?.shortLabel || track;
}

/**
 * Track options for select dropdowns (excludes 'both')
 */
export const TRACK_OPTIONS = TRACKS.map(t => ({
  value: t.value,
  label: t.label,
}));

/**
 * Track options with 'All Tracks' for filters
 */
export const TRACK_FILTER_OPTIONS: { value: ApplicationTrack | ''; label: string }[] = [
  { value: '', label: 'All Tracks' },
  ...TRACK_OPTIONS,
];

/**
 * Track options including 'both' for question assignment
 */
export const TRACK_QUESTION_OPTIONS: { value: ApplicationTrack; label: string }[] = [
  ...TRACK_OPTIONS,
  { value: 'both', label: 'Both/All Tracks' },
];
