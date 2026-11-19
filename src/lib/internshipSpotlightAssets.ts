// Local, cleaned-up assets for the Internship Spotlight page.
//
// Company logos: official artwork with transparent backgrounds, so they sit
// cleanly on the glass cards. A match here wins over the placement's
// `companyLogoUrl`, because most uploaded logos are square images with their
// own background.
//
// Headshots: used only when a placement has no `memberImageUrl`. Uploading a
// photo for that member in the admin panel replaces these automatically.

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const COMPANY_LOGOS: Array<[match: string, path: string]> = [
  ['bain', '/images/company-logos/bain-stacked.png'],
  ['strategy', '/images/company-logos/strategyand.png'],
  ['morganstanley', '/images/company-logos/ms2024.svg'],
  ['jpmorgan', '/images/company-logos/jpm.svg'],
  ['tesla', '/images/company-logos/tesla.svg'],
  ['exxon', '/images/company-logos/exxon.svg'],
  ['pwc', '/images/company-logos/pwc.svg'],
  ['zurn', '/images/company-logos/zurn.svg'],
  ['bny', '/images/company-logos/bny.svg'],
  ['hitachi', '/images/company-logos/hitachi.svg'],
  ['barstool', '/images/company-logos/barstool.png'],
  ['mckinstry', '/images/company-logos/mckinstry.svg'],
  ['familyinsight', '/images/company-logos/familyinsight.png'],
  ['diive', '/images/company-logos/diive.png'],
  ['decypher', '/images/company-logos/decypher-dark.svg'],
  ['generaldynamics', '/images/company-logos/gd.svg'],
];

// Logos whose artwork is close to square read better a little taller.
const TALL_LOGOS = new Set(['bain', 'strategy', 'tesla', 'pwc', 'barstool', 'familyinsight', 'diive']);

const HEADSHOTS: Record<string, string> = {
  evelynchao: '/images/internships/evelyn-chao.jpg',
  mollybluestein: '/images/internships/molly-bluestein.jpg',
  sloanspiewak: '/images/internships/sloan-spiewak.jpg',
  manuelgarcia: '/images/internships/manuel-garcia.jpg',
  ethanwatson: '/images/internships/ethan-watson.jpg',
  williamhuddleston: '/images/internships/william-huddleston.jpg',
};

export function companyLogo(company: string | undefined, fallbackUrl?: string) {
  const key = normalize(company || '');
  const hit = COMPANY_LOGOS.find(([match]) => key.includes(match));
  if (hit) return { src: hit[1], tall: TALL_LOGOS.has(hit[0]) };
  return fallbackUrl ? { src: fallbackUrl, tall: true } : null;
}

export function memberHeadshot(name: string | undefined, uploadedUrl?: string) {
  if (uploadedUrl) return uploadedUrl;
  return HEADSHOTS[normalize(name || '')] || '';
}
