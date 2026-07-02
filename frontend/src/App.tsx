import { useEffect, useMemo, useState } from 'react';

import { authClient, isAuthConfigured } from './auth';

type Candidate = {
  id: string;
  name: string;
  headline: string;
  photo: string;
  workPhoto: string;
  location: string;
  experience: string;
  availability: string;
  expectedPay: string;
  lastActive: string;
  verified: boolean;
  roles: string[];
  skills: string[];
  languages: string[];
  workTypes: string[];
  bio: string;
  history: Array<{
    role: string;
    place: string;
    period: string;
  }>;
  phone: string;
  email: string;
  saved: boolean;
  unlocked: boolean;
};

const initialCandidates: Candidate[] = [
  {
    id: '1',
    name: 'Mary Wanjiku',
    headline: 'Waitress and Front Office Assistant',
    photo:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
    workPhoto:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=960&q=80',
    location: 'Westlands, Nairobi',
    experience: '3 years',
    availability: 'Available immediately',
    expectedPay: 'KES 22,000 - 28,000',
    lastActive: 'Today',
    verified: true,
    roles: ['Waitress', 'Front Office'],
    skills: ['Customer service', 'POS systems', 'Guest relations'],
    languages: ['English', 'Swahili'],
    workTypes: ['Full-time', 'Shifts'],
    bio: 'Calm, friendly hospitality worker with front desk and restaurant floor experience. Comfortable with guest check-ins, table service, and busy weekend shifts.',
    history: [
      { role: 'Waitress', place: 'Garden Bistro', period: '2023 - 2026' },
      { role: 'Reception Intern', place: 'City Stay Hotel', period: '2022 - 2023' },
    ],
    phone: '+254 712 000 148',
    email: 'mary.w@example.com',
    saved: true,
    unlocked: false,
  },
  {
    id: '2',
    name: 'Daniel Otieno',
    headline: 'Housekeeper and Laundry Attendant',
    photo:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
    workPhoto:
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=960&q=80',
    location: 'Kilimani, Nairobi',
    experience: '5 years',
    availability: 'Available in 1 week',
    expectedPay: 'KES 25,000 - 32,000',
    lastActive: 'Yesterday',
    verified: true,
    roles: ['Housekeeper', 'Laundry'],
    skills: ['Room cleaning', 'Laundry', 'Deep cleaning'],
    languages: ['English', 'Swahili'],
    workTypes: ['Full-time', 'Live-in'],
    bio: 'Experienced in hotel housekeeping standards, linen control, room turnarounds, and quiet guest-facing service.',
    history: [
      { role: 'Housekeeper', place: 'Palm Suites', period: '2021 - 2026' },
      { role: 'Laundry Attendant', place: 'Blue Harbor Hotel', period: '2019 - 2021' },
    ],
    phone: '+254 733 000 882',
    email: 'daniel.o@example.com',
    saved: false,
    unlocked: false,
  },
  {
    id: '3',
    name: 'Grace Achieng',
    headline: 'Secretary and Office Administrator',
    photo:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=240&q=80',
    workPhoto:
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=960&q=80',
    location: 'CBD, Nairobi',
    experience: '4 years',
    availability: 'Available immediately',
    expectedPay: 'KES 30,000 - 42,000',
    lastActive: 'Today',
    verified: false,
    roles: ['Secretary', 'Receptionist'],
    skills: ['Calendar management', 'Phone etiquette', 'Basic computer skills'],
    languages: ['English', 'Swahili'],
    workTypes: ['Full-time', 'Part-time'],
    bio: 'Organized secretary with experience supporting small offices, appointment scheduling, visitor handling, and document preparation.',
    history: [
      { role: 'Office Secretary', place: 'Amani Clinics', period: '2022 - 2026' },
      { role: 'Receptionist', place: 'Metro Legal', period: '2020 - 2022' },
    ],
    phone: '+254 701 000 225',
    email: 'grace.a@example.com',
    saved: false,
    unlocked: true,
  },
  {
    id: '4',
    name: 'Peter Mwangi',
    headline: 'Cook and Kitchen Assistant',
    photo:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=240&q=80',
    workPhoto:
      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=960&q=80',
    location: 'Mombasa Road, Nairobi',
    experience: '2 years',
    availability: 'Available immediately',
    expectedPay: 'KES 18,000 - 25,000',
    lastActive: '2 days ago',
    verified: true,
    roles: ['Cook', 'Kitchen Assistant'],
    skills: ['Kitchen prep', 'Food handling', 'Inventory support'],
    languages: ['Swahili', 'English'],
    workTypes: ['Full-time', 'Casual'],
    bio: 'Reliable kitchen support worker with prep, cleaning, stock handling, and breakfast service experience.',
    history: [{ role: 'Kitchen Assistant', place: 'Sunrise Cafe', period: '2024 - 2026' }],
    phone: '+254 745 000 691',
    email: 'peter.m@example.com',
    saved: false,
    unlocked: false,
  },
];

const roleOptions = ['All roles', 'Waitress', 'Housekeeper', 'Secretary', 'Cook', 'Receptionist'];
const availabilityOptions = ['Any availability', 'Available immediately', 'Available in 1 week'];
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

function App() {
  const [serverStatus, setServerStatus] = useState<'idle' | 'starting' | 'slow' | 'ready' | 'unavailable'>(
    apiBaseUrl ? 'starting' : 'idle',
  );
  const [candidates, setCandidates] = useState(initialCandidates);
  const [selectedId, setSelectedId] = useState(initialCandidates[0].id);
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [role, setRole] = useState(roleOptions[0]);
  const [availability, setAvailability] = useState(availabilityOptions[0]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search');

  useEffect(() => {
    if (!apiBaseUrl) {
      return;
    }

    const controller = new AbortController();
    const slowStartId = window.setTimeout(() => {
      setServerStatus('slow');
    }, 8000);

    const checkServer = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/health`, {
          cache: 'no-store',
          signal: controller.signal,
        });

        setServerStatus(response.ok ? 'ready' : 'unavailable');
      } catch {
        if (!controller.signal.aborted) {
          setServerStatus('unavailable');
        }
      } finally {
        window.clearTimeout(slowStartId);
      }
    };

    void checkServer();

    return () => {
      window.clearTimeout(slowStartId);
      controller.abort();
    };
  }, []);

  const filteredCandidates = useMemo(() => {
    const searchText = `${keyword} ${location}`.trim().toLowerCase();

    return candidates.filter((candidate) => {
      const haystack = [
        candidate.name,
        candidate.headline,
        candidate.location,
        candidate.roles.join(' '),
        candidate.skills.join(' '),
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = !searchText || haystack.includes(searchText);
      const matchesRole = role === 'All roles' || candidate.roles.includes(role);
      const matchesAvailability =
        availability === 'Any availability' || candidate.availability === availability;
      const matchesVerified = !verifiedOnly || candidate.verified;

      return matchesSearch && matchesRole && matchesAvailability && matchesVerified;
    });
  }, [availability, candidates, keyword, location, role, verifiedOnly]);

  const visibleCandidates =
    activeTab === 'saved' ? filteredCandidates.filter((candidate) => candidate.saved) : filteredCandidates;

  const selectedCandidate =
    candidates.find((candidate) => candidate.id === selectedId) ?? visibleCandidates[0] ?? candidates[0];

  const updateCandidate = (id: string, updates: Partial<Candidate>) => {
    setCandidates((current) =>
      current.map((candidate) => (candidate.id === id ? { ...candidate, ...updates } : candidate)),
    );
  };

  return (
    <main className="app-shell">
      <ServerStartupBanner status={serverStatus} />
      <header className="topbar">
        <a className="brand" href="/">
          StaffMarket
        </a>
        <nav className="main-nav" aria-label="Primary navigation">
          <button
            className={activeTab === 'search' ? 'nav-button active' : 'nav-button'}
            onClick={() => setActiveTab('search')}
          >
            Candidates
          </button>
          <button
            className={activeTab === 'saved' ? 'nav-button active' : 'nav-button'}
            onClick={() => setActiveTab('saved')}
          >
            Saved
          </button>
        </nav>
        <div className="topbar-actions">
          <AuthActions />
          <a className="admin-phone" href="tel:0704813341">
            0704813341
          </a>
          <button className="profile-button" aria-label="Hiring profile">
            HM
          </button>
        </div>
      </header>

      <section className="search-band" aria-label="Candidate search">
        <div className="mvp-notice">
          <strong>Employer contact is handled by admin for now.</strong>
          <span>Buy tokens with Paystack, then call 0704813341 when you want an introduction.</span>
        </div>
        <div className="search-fields">
          <label>
            <span>Role, skill, or keyword</span>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Waiter, housekeeper, secretary"
            />
          </label>
          <label>
            <span>Location</span>
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Nairobi, Mombasa, Westlands"
            />
          </label>
          <button className="primary-button">Find candidates</button>
        </div>
      </section>

      <section className="workspace">
        <aside className="filters" aria-label="Search filters">
          <div className="filter-header">
            <h2>Filters</h2>
            <button
              className="text-button"
              onClick={() => {
                setKeyword('');
                setLocation('');
                setRole(roleOptions[0]);
                setAvailability(availabilityOptions[0]);
                setVerifiedOnly(false);
              }}
            >
              Clear
            </button>
          </div>

          <label>
            <span>Role</span>
            <select value={role} onChange={(event) => setRole(event.target.value)}>
              {roleOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Availability</span>
            <select value={availability} onChange={(event) => setAvailability(event.target.value)}>
              {availabilityOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(event) => setVerifiedOnly(event.target.checked)}
            />
            <span>Verified only</span>
          </label>

          <div className="wallet-card">
            <span>Tokens</span>
            <strong>Paystack top-up</strong>
            <small>Employers buy tokens online. Admin coordinates candidate introductions after payment.</small>
            <a className="secondary-button" href="tel:0704813341">
              Call admin
            </a>
          </div>
        </aside>

        <section className="results" aria-label="Candidate results">
          <div className="results-header">
            <div>
              <h1>{activeTab === 'saved' ? 'Saved candidates' : 'Candidates'}</h1>
              <p>{visibleCandidates.length} matching profiles</p>
            </div>
            <span className="sort-control">Last active</span>
          </div>

          <div className="candidate-list">
            {visibleCandidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                selected={candidate.id === selectedCandidate.id}
                onSelect={() => setSelectedId(candidate.id)}
                onSave={() => updateCandidate(candidate.id, { saved: !candidate.saved })}
              />
            ))}
          </div>
        </section>

        <CandidatePanel
          candidate={selectedCandidate}
          onSave={() => updateCandidate(selectedCandidate.id, { saved: !selectedCandidate.saved })}
        />
      </section>
    </main>
  );
}

function ServerStartupBanner({
  status,
}: {
  status: 'idle' | 'starting' | 'slow' | 'ready' | 'unavailable';
}) {
  if (status === 'idle' || status === 'ready') {
    return null;
  }

  const isStarting = status === 'starting' || status === 'slow';

  return (
    <div className={isStarting ? 'server-banner' : 'server-banner warning'} role="status" aria-live="polite">
      {isStarting && <span className="loading-dot" aria-hidden="true" />}
      <span>
        {status === 'starting' && 'Server is starting. Free hosting can take a moment on the first request.'}
        {status === 'slow' && 'Server is still waking up. You can keep browsing while it finishes starting.'}
        {status === 'unavailable' && 'Server could not be reached. You can keep browsing and try again shortly.'}
      </span>
    </div>
  );
}

function AuthActions() {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authClient) {
      return;
    }

    const client = authClient;

    const loadSession = async () => {
      const session = await client.getSession();
      setUserEmail(session?.data?.user?.email ?? null);
    };

    void loadSession();
  }, []);

  if (!isAuthConfigured || !authClient) {
    return <span className="auth-status">Set VITE_NEON_AUTH_URL</span>;
  }

  const client = authClient;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    try {
      if (mode === 'signUp') {
        await client.signUp.email({
          email,
          password,
          name: name || email,
        });
        setMessage('Account created. Check email if confirmation is required, then sign in.');
        setMode('signIn');
      } else {
        await client.signIn.email({ email, password });
        const session = await client.getSession();
        setUserEmail(session?.data?.user?.email ?? email);
        setMessage('');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setBusy(true);
    await client.signOut();
    setUserEmail(null);
    setBusy(false);
  };

  if (userEmail) {
    return (
      <div className="auth-signed-in">
        <span>{userEmail}</span>
        <button className="text-link-button" onClick={signOut} disabled={busy}>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <form className="auth-form" aria-label="Account actions" onSubmit={submit}>
      <div className="auth-mode">
        <button type="button" className={mode === 'signIn' ? 'active' : ''} onClick={() => setMode('signIn')}>
          Sign in
        </button>
        <button type="button" className={mode === 'signUp' ? 'active' : ''} onClick={() => setMode('signUp')}>
          Sign up
        </button>
      </div>
      {mode === 'signUp' && (
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" />
      )}
      <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" />
      <input
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
        type="password"
        minLength={8}
      />
      <button className="primary-link-button" type="submit" disabled={busy || !email || !password}>
        {busy ? 'Wait' : mode === 'signIn' ? 'Sign in' : 'Create'}
      </button>
      {message && <small>{message}</small>}
    </form>
  );
}

function CandidateCard({
  candidate,
  selected,
  onSelect,
  onSave,
}: {
  candidate: Candidate;
  selected: boolean;
  onSelect: () => void;
  onSave: () => void;
}) {
  return (
    <article className={selected ? 'candidate-card selected' : 'candidate-card'} onClick={onSelect}>
      <img src={candidate.photo} alt="" />
      <div className="candidate-card-body">
        <div className="candidate-card-top">
          <div>
            <h2>{candidate.headline}</h2>
            <p>{candidate.location}</p>
          </div>
          <button
            className={candidate.saved ? 'save-button saved' : 'save-button'}
            onClick={(event) => {
              event.stopPropagation();
              onSave();
            }}
            aria-label={candidate.saved ? 'Remove saved candidate' : 'Save candidate'}
          >
            {candidate.saved ? 'Saved' : 'Save'}
          </button>
        </div>
        <div className="candidate-meta">
          <span>{candidate.experience}</span>
          <span>{candidate.availability}</span>
          {candidate.verified && <span className="verified">Verified</span>}
        </div>
        <p className="candidate-pay">{candidate.expectedPay}</p>
        <div className="tag-row">
          {candidate.roles.slice(0, 2).map((role) => (
            <span key={role}>{role}</span>
          ))}
          {candidate.skills.slice(0, 2).map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>
      </div>
    </article>
  );
}

function CandidatePanel({
  candidate,
  onSave,
}: {
  candidate: Candidate;
  onSave: () => void;
}) {
  return (
    <aside className="profile-panel" aria-label="Candidate profile">
      <div className="profile-cover">
        <img src={candidate.photo} alt="" />
        <button className={candidate.saved ? 'save-button saved' : 'save-button'} onClick={onSave}>
          {candidate.saved ? 'Saved' : 'Save'}
        </button>
      </div>
      <div className="profile-body">
        <div className="profile-title">
          <h2>{candidate.name}</h2>
          {candidate.verified && <span className="verified">Verified</span>}
        </div>
        <h3>{candidate.headline}</h3>
        <p className="muted">{candidate.location}</p>

        <div className="profile-stats">
          <span>{candidate.experience}</span>
          <span>{candidate.availability}</span>
          <span>{candidate.expectedPay}</span>
        </div>

        <section>
          <h4>Summary</h4>
          <p>{candidate.bio}</p>
        </section>

        <section>
          <h4>Recent work photo</h4>
          <img className="work-photo" src={candidate.workPhoto} alt="" />
        </section>

        <section>
          <h4>Skills</h4>
          <div className="tag-row">
            {candidate.skills.map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>
        </section>

        <section>
          <h4>Experience</h4>
          <div className="timeline">
            {candidate.history.map((item) => (
              <div key={`${item.role}-${item.place}`}>
                <strong>{item.role}</strong>
                <span>{item.place}</span>
                <small>{item.period}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="contact-box">
          <div>
            <h4>Contact</h4>
            <p>Pay with tokens, then admin coordinates the candidate introduction.</p>
          </div>
          <div className="contact-details">
            <a href="tel:0704813341">Call admin: 0704813341</a>
            <small className="warning">Admin will coordinate the next step with the candidate.</small>
          </div>
        </section>
      </div>
    </aside>
  );
}

export default App;
