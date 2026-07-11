// Chapter data for the scroll-driven Deep Dive cinematics — one journey per
// domain. All facts mirror the resume (VISHAL.pdf); keep them in sync with it.

export interface DiveChapter {
  kicker: string      // small label above the title (year, category, seq…)
  title: string
  body: string
  chips: string[]
  metric?: string     // highlighted stat shown next to the kicker
}

export interface DiveCompletion {
  headline: string
  sub: string
}

export interface DiveConfig {
  id: 'skills' | 'experience' | 'projects' | 'education'
  name: string        // top HUD pill
  accent: string
  path: 'helix' | 'road' | 'zigzag' | 'orbit'
  chapters: DiveChapter[]
  completion: DiveCompletion
}

// Tour order — each dive's completion screen offers the next one.
export const DIVE_ORDER: Array<DiveConfig['id']> = ['skills', 'experience', 'projects', 'education']

export const DEEP_DIVES: Record<string, DiveConfig> = {
  skills: {
    id: 'skills',
    name: 'NEURAL DIVE',
    accent: '#38bdf8',
    path: 'helix',
    chapters: [
      {
        kicker: 'STRAND 01 — AI / ML',
        title: 'Models that survive production',
        body: 'From transformer fine-tuning to evaluation design — models measured by real-world failure modes, not just benchmark scores.',
        chips: ['NLP', 'Computer Vision', 'DistilBERT', 'Scikit-learn', 'TF-IDF', 'SVM'],
      },
      {
        kicker: 'STRAND 02 — FRONTEND',
        title: 'Interfaces with physics',
        body: 'Interactive UI engineering across web and mobile — including the 3D site you are inside right now.',
        chips: ['React.js', 'Next.js', 'TypeScript', 'Flutter', 'Tailwind', 'Framer Motion'],
      },
      {
        kicker: 'STRAND 03 — BACKEND',
        title: 'APIs under real load',
        body: 'REST services built, shipped and debugged in production for live client systems.',
        chips: ['Node.js', 'Express.js', 'FastAPI', 'REST APIs', 'Firebase'],
      },
      {
        kicker: 'STRAND 04 — LANGUAGES',
        title: 'Polyglot core',
        body: 'Five languages across ML pipelines, systems and mobile — picked per problem, not per habit.',
        chips: ['Python', 'JavaScript', 'Java', 'C++', 'Dart', 'SQL'],
      },
      {
        kicker: 'STRAND 05 — CLOUD / DEVOPS',
        title: 'Ship it properly',
        body: 'Containerised, versioned, deployed — with log-driven debugging when production disagrees with the plan.',
        chips: ['AWS SageMaker', 'Docker', 'Git', 'MongoDB', 'Supabase'],
      },
    ],
    completion: {
      headline: 'Strand Stable',
      sub: '27 skill modules compiled · 0 conflicts detected',
    },
  },

  experience: {
    id: 'experience',
    name: 'TIMELINE RIDE',
    accent: '#a855f7',
    path: 'road',
    chapters: [
      {
        kicker: '2026 — DIGIT7 INDIA',
        title: 'AI/ML Intern — Computer Vision',
        metric: 'CV evaluation',
        body: 'Evaluated annotation quality and model outputs for a cashierless retail CV system; designed protocols that surfaced occlusion failure modes invisible to aggregate metrics.',
        chips: ['Computer Vision', 'Model Evaluation', 'Python'],
      },
      {
        kicker: '2025 — SST CLOUD · NATIONAL RUGBY LEAGUE (AU)',
        title: 'Full-Stack Dev Intern',
        metric: 'Production APIs',
        body: 'Built scalable REST APIs in Node.js and Express; integrated React frontends for a live production system and resolved Level-2 issues via log-driven root-cause analysis.',
        chips: ['Node.js', 'Express.js', 'React.js'],
      },
      {
        kicker: '2024 — NUS SCHOOL OF COMPUTING',
        title: 'ML Academic Intern',
        metric: '>60% variance',
        body: 'Built Ridge, Lasso and gradient-boosted models for profit-margin prediction across ~3,000 retail transactions — 3 engineered ratio features explained most of the variance.',
        chips: ['Python', 'Scikit-learn', 'Regression'],
      },
      {
        kicker: '2024 — GREENORANGE IT',
        title: 'Frontend Intern',
        metric: '87% accuracy',
        body: 'Built Flutter mobile UI integrated with FastAPI backends; shipped ML-backed features reaching 87% model accuracy in production.',
        chips: ['Flutter', 'Dart', 'FastAPI'],
      },
    ],
    completion: {
      headline: 'Evolution Logged',
      sub: '4 internships · 2024 → 2026 · all production-tested',
    },
  },

  projects: {
    id: 'projects',
    name: 'PROJECT FOUNDRY',
    accent: '#fbbf24',
    path: 'zigzag',
    chapters: [
      {
        kicker: 'BLUEPRINT 01',
        title: 'AI Ticket Classifier',
        metric: '96.5% acc · F1 0.96',
        body: 'End-to-end NLP pipeline benchmarking TF-IDF, SVM, DistilBERT & Sentence-BERT across 555 curated tickets — deployed with confidence-based human-in-the-loop routing.',
        chips: ['Python', 'FastAPI', 'DistilBERT', 'Sentence-BERT'],
      },
      {
        kicker: 'BLUEPRINT 02',
        title: 'RankGym',
        metric: 'E→S rank RPG',
        body: 'A full iOS fitness app that turns training into an RPG — daily quests, XP, streaks and rank progression, synced to Apple HealthKit with fully local data.',
        chips: ['Next.js 15', 'TypeScript', 'Capacitor', 'HealthKit'],
      },
      {
        kicker: 'BLUEPRINT 03',
        title: 'MaligaiKadai',
        metric: 'Live inventory',
        body: 'Retail management system with normalised schemas for products, suppliers and transactions — automated invoicing and real-time inventory reconciliation.',
        chips: ['React.js', 'FastAPI', 'MongoDB'],
      },
      {
        kicker: 'BLUEPRINT 04',
        title: 'Vehicle Tracking',
        metric: 'Real-time telemetry',
        body: 'Logistics dashboard wiring real-time backend APIs into interactive visualisations — modular pipeline design under latency constraints.',
        chips: ['React.js', 'Node.js', 'REST APIs'],
      },
    ],
    completion: {
      headline: 'Blueprints Verified',
      sub: '4 builds shipped · 96.5% peak accuracy · zero vaporware',
    },
  },

  education: {
    id: 'education',
    name: 'ACADEMIC CORE',
    accent: '#22c55e',
    path: 'orbit',
    chapters: [
      {
        kicker: '2022 → 2026 — VIT VELLORE',
        title: 'B.Tech Computer Science',
        metric: 'CGPA 7.57',
        body: 'Core computer science with a focus on intelligent systems — the theoretical spine behind every model and API in this genome.',
        chips: ['CSE', 'CGPA 7.57', '2022–2026'],
      },
      {
        kicker: 'CERTIFICATIONS',
        title: 'Beyond the curriculum',
        metric: 'NUS + AWS',
        body: 'Big Data Analytics using Deep Learning at NUS School of Computing (credit-transferred to VIT) and Deep Learning with Amazon SageMaker from AWS.',
        chips: ['NUS SoC', 'AWS SageMaker', 'Dec 2024'],
      },
      {
        kicker: 'FOUNDATIONS',
        title: 'Where it started',
        metric: 'IELTS 7.0',
        body: 'Class XII at 82% in Coimbatore, and C1-level English certified at IELTS 7.0 — communication is part of the stack.',
        chips: ['Class XII — 82%', 'IELTS 7.0 (C1)', 'Coimbatore'],
      },
    ],
    completion: {
      headline: 'Genome Fully Sequenced',
      sub: 'B.Tech CSE · CGPA 7.57 · NUS + AWS certified',
    },
  },
}
