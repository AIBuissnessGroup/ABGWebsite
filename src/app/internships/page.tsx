'use client';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { BriefcaseIcon } from '@heroicons/react/24/outline';
import FloatingShapes from '@/components/FloatingShapes';
import { companyLogo, memberHeadshot } from '@/lib/internshipSpotlightAssets';
import styles from './spotlight.module.css';

type Placement = {
  _id?: string;
  name?: string;
  company?: string;
  role?: string;
  term?: string;
  linkedin?: string;
  memberImageUrl?: string;
  companyLogoUrl?: string;
};

type Spotlight = {
  key: string;
  name: string;
  roles: string[];
  companies: { name: string; logo: { src: string; tall: boolean } | null }[];
  photo: string;
  linkedin?: string;
};

type Group = { year: string; label: string; people: Spotlight[] };

// One card per member per year; a member with two internships that year
// (e.g. a winter and a summer role) gets both company logos on one card.
function groupPlacements(placements: Placement[]): Group[] {
  const byYear = new Map<string, Map<string, Spotlight>>();
  for (const p of placements) {
    if (!p.name) continue;
    const year = p.term?.match(/\d{4}/)?.[0] ?? 'Other';
    if (!byYear.has(year)) byYear.set(year, new Map());
    const people = byYear.get(year)!;
    const key = (p.linkedin || p.name).toLowerCase().replace(/\/+$/, '');
    const existing = people.get(key);
    const company = { name: p.company || '', logo: companyLogo(p.company, p.companyLogoUrl) };
    if (existing) {
      if (p.role && !existing.roles.includes(p.role)) existing.roles.push(p.role);
      if (!existing.companies.some(c => c.name === company.name)) existing.companies.push(company);
      if (!existing.photo) existing.photo = memberHeadshot(p.name, p.memberImageUrl);
    } else {
      people.set(key, {
        key: `${year}-${key}`,
        name: p.name,
        roles: p.role ? [p.role] : [],
        companies: [company],
        photo: memberHeadshot(p.name, p.memberImageUrl),
        linkedin: p.linkedin,
      });
    }
  }
  return [...byYear.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([year, people]) => ({
      year,
      label: year === 'Other' ? 'More Placements' : `Summer ${year}`,
      people: [...people.values()],
    }));
}

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
  </svg>
);

// Fades each card up once as it scrolls into view.
function Reveal({ delay, children }: { delay: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { setShown(true); io.disconnect(); }
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`${styles.item} ${shown ? styles.in : ''}`} style={{ '--d': `${delay}s` } as CSSProperties}>
      {children}
    </div>
  );
}

function SpotlightCard({ person }: { person: Spotlight }) {
  const logos = person.companies.filter(c => c.logo);
  return (
    <article className={styles.card}>
      <div className={`${styles.logoArea} ${logos.length > 1 ? styles.two : ''}`}>
        {logos.map(c => (
          <img key={c.name} className={c.logo!.tall ? styles.tall : ''} src={c.logo!.src} alt={c.name} />
        ))}
      </div>
      <div className={styles.photo}>
        {person.photo ? (
          <img src={person.photo} alt={person.name} loading="lazy" />
        ) : (
          <span className={styles.initial}>{person.name.charAt(0)}</span>
        )}
      </div>
      <div className={styles.body}>
        <div className={styles.name}>{person.name}</div>
        <div className={styles.role}>{person.roles.join(' · ')}</div>
        <div className={styles.foot}>
          <div className={styles.company}>{person.companies.map(c => c.name).join(' · ')}</div>
          {person.linkedin && (
            <a className={styles.li} href={person.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${person.name} on LinkedIn`}>
              <LinkedInIcon />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export default function InternshipsPage() {
  const [pageContent, setPageContent] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const [contentRes, projectsRes, companiesRes, placementsRes] = await Promise.all([
          fetch('/api/public/internships/content'),
          fetch('/api/public/internships/projects'),
          fetch('/api/public/internships/companies'),
          fetch('/api/public/internships/placements'),
        ]);
        const [contentData, projectsData, companiesData, placementsData] = await Promise.all([
          contentRes.json(), projectsRes.json(), companiesRes.json(), placementsRes.json(),
        ]);
        if (contentData && !contentData.error) setPageContent(contentData);
        if (Array.isArray(projectsData)) setProjects(projectsData.filter((p: any) => p.active));
        if (Array.isArray(companiesData)) setCompanies(companiesData);
        if (Array.isArray(placementsData)) setPlacements(placementsData);
      } catch (error) {
        console.error('Error loading content:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const content = pageContent || {
    opportunitiesTitle: 'Current Opportunities',
    opportunitiesSubtitle: 'Explore available internship positions with our partner companies',
    ctaTitle: 'Ready to Join the Program?',
    ctaSubtitle: 'Get involved with AI Business Group projects to qualify for our internship program.',
  };

  const groups = useMemo(() => groupPlacements(placements), [placements]);
  const visibleGroups = filter === 'all' ? groups : groups.filter(g => g.year === filter);

  // Every company once, for the scrolling logo strip.
  const stripLogos = useMemo(() => {
    const seen = new Set<string>();
    const out: { name: string; src: string }[] = [];
    groups.forEach(g => g.people.forEach(p => p.companies.forEach(c => {
      if (c.logo && !seen.has(c.logo.src)) { seen.add(c.logo.src); out.push({ name: c.name, src: c.logo.src }); }
    })));
    return out;
  }, [groups]);

  return (
    <div className={`main-page ${styles.page}`}>
      <FloatingShapes variant="dense" opacity={0.07} />

      <div className={styles.inner}>
        <header className={styles.hero}>
          <div className={`${styles.eyebrow} ${styles.reveal}`} style={{ '--t': '0.05s' } as CSSProperties}>
            AI Business Group · University of Michigan
          </div>
          <h1 className={`${styles.title} ${styles.reveal}`} style={{ '--t': '0.15s' } as CSSProperties}>
            Internship Spotlight
          </h1>
          <div className={`${styles.rule} ${styles.reveal}`} style={{ '--t': '0.3s' } as CSSProperties} />
          <p className={`${styles.lead} ${styles.reveal}`} style={{ '--t': '0.4s' } as CSSProperties}>
            ABG members have gone on to intern at some of the world&apos;s most innovative companies.
          </p>
        </header>

        {stripLogos.length > 0 && (
          <div className={`${styles.strip} ${styles.reveal}`} style={{ '--t': '0.55s' } as CSSProperties}>
            <div className={styles.stripLabel}>Where our members have interned</div>
            <div className={styles.marquee}>
              <div className={styles.track}>
                {[...stripLogos, ...stripLogos].map((logo, i) => (
                  <img key={`${logo.src}-${i}`} src={logo.src} alt={i < stripLogos.length ? logo.name : ''} aria-hidden={i >= stripLogos.length} />
                ))}
              </div>
            </div>
          </div>
        )}

        {groups.length > 1 && (
          <div className={`${styles.toolbar} ${styles.reveal}`} style={{ '--t': '0.65s' } as CSSProperties}>
            <div className={styles.seg}>
              {[{ year: 'all', label: 'All' }, ...groups].map(g => (
                <button
                  key={g.year}
                  type="button"
                  className={filter === g.year ? styles.on : ''}
                  onClick={() => setFilter(g.year)}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {!loading && groups.length === 0 && (
          <p className={styles.empty}>Member placements are coming soon.</p>
        )}

        {visibleGroups.map(group => (
          <section key={group.year} className={styles.section}>
            <div className={styles.sectionHead}>
              <h2>{group.label}</h2>
              <span>{group.people.length} {group.people.length === 1 ? 'member' : 'members'}</span>
            </div>
            <div className={styles.grid}>
              {group.people.map((person, i) => (
                <Reveal key={person.key} delay={(i % 4) * 0.08}>
                  <SpotlightCard person={person} />
                </Reveal>
              ))}
            </div>
          </section>
        ))}

        {/* Open positions */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>{content.opportunitiesTitle}</h2>
          </div>
          {projects.length === 0 ? (
            <div className={`${styles.panel} text-center`}>
              <BriefcaseIcon className="w-10 h-10 mx-auto mb-3" style={{ color: '#8fa9c6' }} />
              <p className="font-semibold" style={{ color: 'white' }}>No open opportunities right now</p>
              <p className="text-sm mt-1" style={{ color: '#b9cce2' }}>{content.opportunitiesSubtitle}. Check back soon.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {projects.map((project: any) => {
                const company = companies.find(c => c.id === project.companyId);
                const skills: string[] = project.skills ? JSON.parse(project.skills) : [];
                return (
                  <div key={project.id} className={styles.panel}>
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div>
                        <h3 className="font-bold text-lg" style={{ color: 'white' }}>{project.title}</h3>
                        <p className="text-sm" style={{ color: '#b9cce2' }}>{company?.name || 'Partner Company'}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/20" style={{ color: 'white' }}>
                        {project.status}
                      </span>
                    </div>
                    <p className="text-sm mb-4" style={{ color: '#b9cce2' }}>{project.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="font-medium" style={{ color: 'white' }}>Duration</span>
                        <p style={{ color: '#b9cce2' }}>{project.duration || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium" style={{ color: 'white' }}>Location</span>
                        <p style={{ color: '#b9cce2' }}>{project.location || 'N/A'}</p>
                      </div>
                    </div>
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {skills.slice(0, 4).map(skill => (
                          <span key={skill} className="px-2 py-1 text-xs rounded-full bg-white/10" style={{ color: 'white' }}>{skill}</span>
                        ))}
                      </div>
                    )}
                    {project.status === 'OPEN' && project.linkedForm ? (
                      <a href={`/forms/${project.linkedForm}`} className={`${styles.btn} ${styles.primary} w-full`}>Apply Now</a>
                    ) : (
                      <span className={`${styles.btn} ${styles.ghost} w-full opacity-60`}>
                        {project.status === 'FILLED' ? 'Position Filled' : project.status === 'CLOSED' ? 'Applications Closed' : 'Application Coming Soon'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <Reveal delay={0}>
          <section className={`${styles.panel} ${styles.cta}`}>
            <h3>{content.ctaTitle}</h3>
            <p>{content.ctaSubtitle}</p>
            <div className={styles.btns}>
              <a className={`${styles.btn} ${styles.primary}`} href="/#join">Join ABG</a>
              <a className={`${styles.btn} ${styles.ghost}`} href="mailto:ABGContact@umich.edu">Contact Us</a>
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
