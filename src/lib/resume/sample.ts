import type { ResumeData } from '@/types/resume';
import type { SampleKind } from '@/templates/meta';
import { DEFAULT_SECTION_ORDER } from './sections';

const base = { hiddenSections: [], sectionTitles: {} } as Pick<ResumeData, 'hiddenSections' | 'sectionTitles'>;

export const SAMPLE_PROFESSIONAL: ResumeData = {
  ...base,
  personal: {
    fullName: 'Olivia Bennett',
    jobTitle: 'Senior Product Manager',
    email: 'olivia.bennett@email.com',
    phone: '+1 (415) 555-0142',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/oliviabennett',
    website: 'oliviabennett.com',
    photo: '',
  },
  summary:
    'Product leader with 9+ years of experience shipping B2B and consumer software used by millions. Known for turning ambiguous problems into clear roadmaps, aligning engineering, design and go-to-market teams, and growing revenue through data-informed product decisions.',
  experience: [
    {
      id: 'e1', jobTitle: 'Senior Product Manager', company: 'Northwind Labs', location: 'San Francisco, CA', startDate: '2021-03', endDate: '', current: true,
      responsibilities: 'Own the roadmap for the analytics platform serving 4,000+ enterprise customers\nLead a cross-functional team of 14 engineers, 3 designers and 2 data scientists\nPartner with sales and marketing on pricing, packaging and launch strategy',
      achievements: 'Grew annual recurring revenue from $18M to $31M in two years\nLaunched self-serve onboarding that cut time-to-value by 42%',
    },
    {
      id: 'e2', jobTitle: 'Product Manager', company: 'Brightline Health', location: 'Austin, TX', startDate: '2018-01', endDate: '2021-02', current: false,
      responsibilities: 'Managed the patient scheduling and telehealth product lines\nRan discovery interviews with 120+ clinicians to shape product strategy\nDefined success metrics and built the team’s experimentation practice',
      achievements: 'Increased appointment completion rate by 23% across 300 clinics',
    },
    {
      id: 'e3', jobTitle: 'Associate Product Manager', company: 'Fieldstone Software', location: 'Seattle, WA', startDate: '2015-06', endDate: '2017-12', current: false,
      responsibilities: 'Shipped mobile features for a field-service app with 250k monthly users\nWrote specifications and acceptance criteria for an agile team of eight',
      achievements: '',
    },
  ],
  education: [
    { id: 'ed1', degree: 'MBA, Technology Management', institution: 'University of Washington', location: 'Seattle, WA', startYear: '2013', endYear: '2015', grade: '', description: '' },
    { id: 'ed2', degree: 'B.Sc. Computer Science', institution: 'University of Texas at Austin', location: 'Austin, TX', startYear: '2009', endYear: '2013', grade: 'GPA 3.8 / 4.0', description: '' },
  ],
  skills: [
    { id: 's1', name: 'Product Strategy', level: 5 },
    { id: 's2', name: 'Roadmapping', level: 5 },
    { id: 's3', name: 'User Research', level: 4 },
    { id: 's4', name: 'A/B Testing', level: 4 },
    { id: 's5', name: 'SQL & Analytics', level: 4 },
    { id: 's6', name: 'Stakeholder Management', level: 5 },
    { id: 's7', name: 'Agile / Scrum', level: 4 },
    { id: 's8', name: 'Figma', level: 3 },
  ],
  projects: [],
  certifications: [
    { id: 'c1', name: 'Certified Scrum Product Owner (CSPO)', issuer: 'Scrum Alliance', date: '2019-05', url: '' },
    { id: 'c2', name: 'Product Analytics Certification', issuer: 'Amplitude', date: '2022-02', url: '' },
  ],
  languages: [
    { id: 'l1', language: 'English', proficiency: 'Native' },
    { id: 'l2', language: 'Spanish', proficiency: 'Professional working' },
    { id: 'l3', language: 'French', proficiency: 'Basic' },
  ],
  additional: [],
  sectionOrder: [...DEFAULT_SECTION_ORDER],
};

export const SAMPLE_GRADUATE: ResumeData = {
  ...base,
  personal: {
    fullName: 'Arjun Mehta',
    jobTitle: 'Computer Science Graduate',
    email: 'arjun.mehta@email.com',
    phone: '+91 98765 43210',
    location: 'Bengaluru, India',
    linkedin: 'linkedin.com/in/arjunmehta',
    website: 'github.com/arjunmehta',
    photo: '',
  },
  summary:
    'Recent Computer Science graduate with hands-on experience building full-stack web applications and machine learning projects. Quick learner who enjoys solving real problems and collaborating in agile teams.',
  experience: [
    {
      id: 'e1', jobTitle: 'Software Engineering Intern', company: 'Infosys', location: 'Bengaluru', startDate: '2024-05', endDate: '2024-07', current: false,
      responsibilities: 'Built internal dashboard features with React and Node.js\nWrote unit tests that raised coverage of the reporting module to 85%',
      achievements: '',
    },
  ],
  education: [
    { id: 'ed1', degree: 'B.Tech, Computer Science & Engineering', institution: 'RV College of Engineering', location: 'Bengaluru', startYear: '2021', endYear: '2025', grade: 'CGPA 8.9 / 10', description: 'Relevant coursework: Data Structures, Algorithms, DBMS, Operating Systems, Machine Learning' },
    { id: 'ed2', degree: 'Higher Secondary (Class XII)', institution: 'Delhi Public School', location: 'Bengaluru', startYear: '2019', endYear: '2021', grade: '94.6%', description: '' },
  ],
  skills: ['Java', 'Python', 'JavaScript', 'React', 'Node.js', 'SQL', 'Git', 'Machine Learning', 'Problem Solving', 'Teamwork'].map((n, i) => ({ id: `s${i}`, name: n, level: 0 })),
  projects: [
    { id: 'p1', name: 'Campus Connect', description: 'A student community platform with events, clubs and real-time chat used by 1,200+ students.', technologies: 'React, Node.js, MongoDB, Socket.io', url: 'github.com/arjunmehta/campus-connect' },
    { id: 'p2', name: 'Crop Disease Detection', description: 'CNN-based image classifier that identifies 15 crop diseases with 93% accuracy; deployed as an Android app.', technologies: 'Python, TensorFlow, Flask', url: '' },
    { id: 'p3', name: 'Expense Splitter', description: 'Mobile-friendly web app to split group expenses and settle balances with UPI payment links.', technologies: 'TypeScript, Next.js, PostgreSQL', url: '' },
  ],
  certifications: [
    { id: 'c1', name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', date: '2024-09', url: '' },
  ],
  languages: [
    { id: 'l1', language: 'English', proficiency: 'Fluent' },
    { id: 'l2', language: 'Hindi', proficiency: 'Native' },
    { id: 'l3', language: 'Kannada', proficiency: 'Conversational' },
  ],
  additional: [
    {
      id: 'a1', type: 'achievements', title: 'Achievements', items: [
        { id: 'a1i1', title: 'Winner, Smart India Hackathon', subtitle: 'Ministry of Education', date: '2023', description: '', url: '' },
        { id: 'a1i2', title: 'Top 5%, Google Kickstart', subtitle: '', date: '2022', description: '', url: '' },
      ],
    },
  ],
  sectionOrder: ['summary', 'education', 'projects', 'skills', 'experience', 'certifications', 'languages', 'extra:a1'],
};

export const SAMPLE_TECH: ResumeData = {
  ...base,
  personal: {
    fullName: 'Daniel Okafor',
    jobTitle: 'Senior Software Engineer',
    email: 'daniel.okafor@email.com',
    phone: '+44 7700 900123',
    location: 'London, UK',
    linkedin: 'linkedin.com/in/danielokafor',
    website: 'github.com/dokafor',
    photo: '',
  },
  summary:
    'Backend-focused software engineer with 8 years of experience designing distributed systems, APIs and data pipelines. Passionate about reliability, developer experience and mentoring engineers.',
  experience: [
    {
      id: 'e1', jobTitle: 'Senior Software Engineer', company: 'Monzo', location: 'London', startDate: '2021-01', endDate: '', current: true,
      responsibilities: 'Design and operate Go microservices processing 30M+ transactions per day\nLead the payments reliability working group across six teams\nMentor four engineers and run the backend interview loop',
      achievements: 'Reduced p99 latency of the ledger service from 420ms to 95ms\nCut infrastructure cost by £380k/year by right-sizing Kubernetes workloads',
    },
    {
      id: 'e2', jobTitle: 'Software Engineer', company: 'Deliveroo', location: 'London', startDate: '2018-03', endDate: '2020-12', current: false,
      responsibilities: 'Built order routing services in Python and Kotlin\nIntroduced contract testing which reduced integration incidents by 60%',
      achievements: '',
    },
    {
      id: 'e3', jobTitle: 'Junior Developer', company: 'Sage', location: 'Newcastle', startDate: '2016-07', endDate: '2018-02', current: false,
      responsibilities: 'Developed REST APIs for accounting products using C# and .NET',
      achievements: '',
    },
  ],
  education: [
    { id: 'ed1', degree: 'B.Eng. Software Engineering', institution: 'University of Manchester', location: 'Manchester', startYear: '2012', endYear: '2016', grade: 'First Class Honours', description: '' },
  ],
  skills: [
    { id: 's1', name: 'Go', level: 5 },
    { id: 's2', name: 'Python', level: 5 },
    { id: 's3', name: 'Kotlin', level: 4 },
    { id: 's4', name: 'PostgreSQL', level: 4 },
    { id: 's5', name: 'Kubernetes', level: 4 },
    { id: 's6', name: 'AWS', level: 4 },
    { id: 's7', name: 'Kafka', level: 3 },
    { id: 's8', name: 'Terraform', level: 3 },
  ],
  projects: [
    { id: 'p1', name: 'pgwatch-lite', description: 'Open-source PostgreSQL monitoring agent with 2.1k GitHub stars.', technologies: 'Go, Prometheus, Grafana', url: 'github.com/dokafor/pgwatch-lite' },
    { id: 'p2', name: 'Rate Limiter Library', description: 'Distributed token-bucket rate limiter backed by Redis, used in production by three companies.', technologies: 'Go, Redis', url: '' },
  ],
  certifications: [
    { id: 'c1', name: 'Certified Kubernetes Administrator', issuer: 'CNCF', date: '2022-06', url: '' },
    { id: 'c2', name: 'AWS Solutions Architect – Associate', issuer: 'Amazon Web Services', date: '2020-11', url: '' },
  ],
  languages: [
    { id: 'l1', language: 'English', proficiency: 'Native' },
    { id: 'l2', language: 'Yoruba', proficiency: 'Fluent' },
  ],
  additional: [],
  sectionOrder: ['summary', 'skills', 'experience', 'projects', 'education', 'certifications', 'languages'],
};

export const SAMPLE_ACADEMIC: ResumeData = {
  ...base,
  personal: {
    fullName: 'Dr. Sophie Laurent',
    jobTitle: 'Postdoctoral Researcher, Computational Biology',
    email: 's.laurent@university.edu',
    phone: '+33 6 12 34 56 78',
    location: 'Paris, France',
    linkedin: '',
    website: 'sophielaurent.science',
    photo: '',
  },
  summary:
    'Computational biologist working at the intersection of machine learning and genomics. Research focuses on interpretable models for gene regulation, with publications in leading journals and experience supervising graduate students.',
  experience: [
    {
      id: 'e1', jobTitle: 'Postdoctoral Researcher', company: 'Institut Pasteur', location: 'Paris', startDate: '2022-09', endDate: '', current: true,
      responsibilities: 'Develop deep learning models to predict enhancer activity from sequence\nCo-supervise two PhD students and three Master’s interns',
      achievements: 'Secured €180,000 Marie Skłodowska-Curie fellowship',
    },
    {
      id: 'e2', jobTitle: 'Teaching Assistant, Bioinformatics', company: 'University of Cambridge', location: 'Cambridge, UK', startDate: '2018-10', endDate: '2022-06', current: false,
      responsibilities: 'Taught practical sessions in statistics and sequence analysis to 80 students per year',
      achievements: '',
    },
  ],
  education: [
    { id: 'ed1', degree: 'Ph.D. Computational Biology', institution: 'University of Cambridge', location: 'Cambridge, UK', startYear: '2018', endYear: '2022', grade: '', description: 'Thesis: Interpretable neural networks for transcriptional regulation' },
    { id: 'ed2', degree: 'M.Sc. Bioinformatics', institution: 'Sorbonne Université', location: 'Paris', startYear: '2016', endYear: '2018', grade: 'Mention Très Bien', description: '' },
  ],
  skills: ['Python', 'PyTorch', 'R', 'Statistical Genetics', 'Single-cell RNA-seq', 'High-performance Computing'].map((n, i) => ({ id: `s${i}`, name: n, level: 0 })),
  projects: [],
  certifications: [],
  languages: [
    { id: 'l1', language: 'French', proficiency: 'Native' },
    { id: 'l2', language: 'English', proficiency: 'C2 – Proficient' },
    { id: 'l3', language: 'German', proficiency: 'B1 – Intermediate' },
  ],
  additional: [
    {
      id: 'pub', type: 'publications', title: 'Selected Publications', items: [
        { id: 'pub1', title: 'Decoding enhancer grammar with attention-based models', subtitle: 'Nature Genetics, 55(4), 612–624', date: '2024', description: 'Laurent S., Chen M., Hughes R.', url: '' },
        { id: 'pub2', title: 'Benchmarking interpretability methods for genomic deep learning', subtitle: 'Genome Biology, 23, 118', date: '2022', description: 'Laurent S., Patel A., Durbin R.', url: '' },
      ],
    },
    {
      id: 'aw', type: 'awards', title: 'Awards & Grants', items: [
        { id: 'aw1', title: 'Marie Skłodowska-Curie Postdoctoral Fellowship', subtitle: 'European Commission', date: '2023', description: '', url: '' },
        { id: 'aw2', title: 'Best Thesis Prize', subtitle: 'Department of Genetics, Cambridge', date: '2022', description: '', url: '' },
      ],
    },
  ],
  sectionOrder: ['summary', 'education', 'experience', 'extra:pub', 'extra:aw', 'skills', 'languages', 'projects', 'certifications'],
};

export const SAMPLES: Record<SampleKind, ResumeData> = {
  professional: SAMPLE_PROFESSIONAL,
  graduate: SAMPLE_GRADUATE,
  tech: SAMPLE_TECH,
  academic: SAMPLE_ACADEMIC,
};

export function cloneSample(kind: SampleKind): ResumeData {
  return JSON.parse(JSON.stringify(SAMPLES[kind]));
}
