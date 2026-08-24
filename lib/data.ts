import type { ApplicationStage, Experience, Job } from "@/lib/types";

export const jobs: Job[] = [
  {
    id: "northstar-ld-manager", title: "Learning & Development Manager", company: "Northstar Health",
    location: "New York, NY", arrangement: "Hybrid", salary: "$105k–$125k", employmentType: "Full-time",
    roleFamily: "Learning & Development", industry: "Healthcare", postedDaysAgo: 2, source: "Demo data", score: 91,
    probability: 28, category: "Strong Match", status: "Shortlisted", saved: true,
    summary: "Exceptional alignment across learning program design, facilitation, stakeholder partnership and measurable program improvement.",
    strengths: ["10+ years across learning and engagement", "Designed scalable learning frameworks", "Led programs reaching 2M+ students", "Hybrid NYC location fits preferences"],
    gaps: ["No direct healthcare-sector experience identified", "LMS administration is preferred but not evidenced"],
    requirements: [
      { requirement: "Design enterprise learning programs", importance: "Required", evidence: "Designed national learning programs and scalable frameworks", strength: "Strong", gap: "None" },
      { requirement: "Senior stakeholder partnership", importance: "Required", evidence: "Managed JLL, JPMorgan and corporate learning accounts", strength: "Strong", gap: "None" },
      { requirement: "Healthcare experience", importance: "Preferred", evidence: "No verified healthcare experience", strength: "None", gap: "Industry transition" },
      { requirement: "Learning management systems", importance: "Preferred", evidence: "Digital platforms and webinar tools; no named LMS", strength: "Moderate", gap: "Specific LMS not evidenced" },
    ],
  },
  {
    id: "harbor-program-manager", title: "Learning Program Manager", company: "Harbor Labs", location: "Remote — US",
    arrangement: "Remote", salary: "$98k–$118k", employmentType: "Full-time", roleFamily: "Program Management",
    industry: "Technology", postedDaysAgo: 1, source: "Demo data", score: 86, probability: 23, category: "Strong Match", status: "Discovered",
    summary: "Strong evidence for complex program delivery, training content and cross-functional stakeholder management.",
    strengths: ["National-scale program delivery", "Project timelines and logistics", "Data-led continuous improvement"],
    gaps: ["No direct SaaS product training experience identified"],
    requirements: [
      { requirement: "Own learning programs end-to-end", importance: "Required", evidence: "Directed Sustainable Futures for 650K+ students", strength: "Strong", gap: "None" },
      { requirement: "Cross-functional delivery", importance: "Required", evidence: "Coordinated employers, educators and design teams", strength: "Strong", gap: "None" },
      { requirement: "SaaS experience", importance: "Preferred", evidence: "Salesforce, HubSpot and digital platforms used", strength: "Moderate", gap: "No SaaS employer experience" },
    ],
  },
  {
    id: "civic-employee-engagement", title: "Employee Engagement Manager", company: "Civic & Co.", location: "Jersey City, NJ",
    arrangement: "Hybrid", salary: "$90k–$110k", employmentType: "Full-time", roleFamily: "Employee Engagement", industry: "Professional Services",
    postedDaysAgo: 4, source: "Demo data", score: 82, probability: 19, category: "Strong Match", status: "Preparing Application",
    summary: "Transferable engagement, communications and campaign experience is compelling; employee-specific scope is the main stretch.",
    strengths: ["Campaign increased engagement by 30%", "Communications reached 50K+", "Team management experience"],
    gaps: ["Limited explicit internal employee-engagement ownership"],
    requirements: [{ requirement: "Build engagement campaigns", importance: "Required", evidence: "Launched campaigns increasing educator engagement 30%", strength: "Strong", gap: "Audience was educators, not employees" }],
  },
  {
    id: "lumen-community", title: "Community Partnerships Manager", company: "Lumen House", location: "New York, NY",
    arrangement: "On-site", salary: "$78k–$92k", employmentType: "Full-time", roleFamily: "Partnerships", industry: "Arts & Culture",
    postedDaysAgo: 6, source: "Demo data", score: 76, probability: 15, category: "Good / Stretch", status: "Applied",
    summary: "Partnerships and community-building are well supported, but compensation and on-site arrangement are less attractive.",
    strengths: ["Corporate partnership management", "Jersey City community building", "Events and workshop delivery"],
    gaps: ["On-site schedule", "Limited arts-sector employment evidence"],
    requirements: [{ requirement: "Community partnership development", importance: "Required", evidence: "Employer/education partnerships plus Jersey City book club", strength: "Strong", gap: "None" }],
  },
  {
    id: "arc-events", title: "Events & Engagement Lead", company: "Arcwell Foundation", location: "Brooklyn, NY", arrangement: "Hybrid",
    salary: "$84k–$96k", employmentType: "Full-time", roleFamily: "Events & Engagement", industry: "Nonprofit", postedDaysAgo: 3,
    source: "Demo data", score: 71, probability: 12, category: "Good / Stretch", status: "Recruiter Screen",
    summary: "Strong engagement and facilitation foundation, with less evidence of large-scale event production ownership.",
    strengths: ["Webinars, workshops and employer activities", "Multi-channel communications"], gaps: ["Event budgets and vendor management not evidenced"],
    requirements: [{ requirement: "Event production", importance: "Required", evidence: "Organized career workshops, field days and webinars", strength: "Moderate", gap: "Scale and budgets not evidenced" }],
  },
  {
    id: "vertex-pmo", title: "Senior Technical Program Manager", company: "Vertex Grid", location: "Remote — US", arrangement: "Remote",
    salary: "$150k–$175k", employmentType: "Full-time", roleFamily: "Program Management", industry: "Technology", postedDaysAgo: 2,
    source: "Demo data", score: 48, probability: 4, category: "Weak Match", status: "Discovered",
    summary: "Program leadership transfers, but required software delivery and technical architecture experience are not evidenced.",
    strengths: ["Program leadership", "Cross-functional stakeholder management"], gaps: ["No software engineering delivery", "No cloud architecture evidence"],
    requirements: [{ requirement: "Lead cloud platform delivery", importance: "Required", evidence: "No verified evidence", strength: "None", gap: "Core requirement missing" }],
  },
];

export const experiences: Experience[] = [
  { id: "f4s-2m", employer: "Founders4Schools", position: "Regional Engagement Manager", period: "Nov 2019 – Jun 2025", type: "Achievement", text: "Led national learning, engagement and partnership initiatives connecting employers with 2M+ students across the UK.", tags: ["learning", "engagement", "partnerships", "program delivery", "scale"], verified: true },
  { id: "f4s-sf", employer: "Founders4Schools", position: "Regional Engagement Manager", period: "Nov 2019 – Jun 2025", type: "Achievement", text: "Directed the Sustainable Futures program impacting 650K+ students with corporate stakeholders including JLL and JPMorgan.", tags: ["program management", "corporate partnerships", "stakeholders"], verified: true },
  { id: "f4s-engagement", employer: "Founders4Schools", position: "Regional Engagement Manager", period: "Nov 2019 – Jun 2025", type: "Achievement", text: "Launched data-driven campaigns that increased educator engagement by 30%.", tags: ["analytics", "campaigns", "engagement", "measurable impact"], verified: true },
  { id: "f4s-funding", employer: "Founders4Schools", position: "Regional Engagement Manager", period: "Nov 2019 – Jun 2025", type: "Achievement", text: "Secured £100K+ annual funding through strategic presentations, pitches and relationship management.", tags: ["funding", "presentations", "relationship management"], verified: true },
  { id: "f4s-team", employer: "Founders4Schools", position: "Regional Engagement Manager", period: "Nov 2019 – Jun 2025", type: "Leadership", text: "Managed and mentored a team of three and developed a training framework.", tags: ["people management", "mentoring", "training"], verified: true },
  { id: "kb-learning", employer: "KnowledgeBrief", position: "Professional Learning Advisor & Head of Learning and Safeguarding", period: "Sep 2018 – Nov 2019", type: "Responsibility", text: "Oversaw corporate learning programs and partnership accounts supporting 200+ professionals.", tags: ["corporate learning", "account management", "professional development"], verified: true },
  { id: "teacher", employer: "St Charles Catholic Sixth Form College", position: "Teacher of Sociology / Pastoral Team Lead", period: "Sep 2013 – Aug 2018", type: "Achievement", text: "Recognized as an Ofsted Outstanding Teacher for innovative lesson planning, clear communication and strong outcomes.", tags: ["facilitation", "learning design", "communication"], verified: true },
];

export const stages: ApplicationStage[] = ["Discovered", "Shortlisted", "Preparing Application", "Ready to Apply", "Applied", "Recruiter Screen", "Interview", "Final Interview", "Offer"];
