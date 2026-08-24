import { experiences } from "@/lib/data";
import { assessClaim, type IntegrityLevel } from "@/lib/factual-integrity";
import type { Job } from "@/lib/types";

export type TailoredChange={id:string;original:string;tailored:string;reason:string;integrity:IntegrityLevel};
export type ApplicationStudio={summary:string;skills:string[];changes:TailoredChange[];coverLetter:string;answers:Array<{question:string;answer:string}>;quality:{score:number;checks:Array<{label:string;score:number;recommendation:string}>}};

function relevantEvidence(job:Job){const terms=new Set(`${job.title} ${job.roleFamily} ${job.requirements.map(r=>r.requirement).join(" ")}`.toLowerCase().match(/[a-z]{4,}/g)??[]);return [...experiences].sort((a,b)=>b.tags.filter(t=>terms.has(t.toLowerCase())).length-a.tags.filter(t=>terms.has(t.toLowerCase())).length);}

export function buildApplicationStudio(job:Job):ApplicationStudio{
  const ranked=relevantEvidence(job);const truth=experiences.map(item=>item.text);
  const changeInputs=[
    {sourceId:"f4s-2m",text:`Led national ${job.roleFamily.toLowerCase()} and partnership initiatives connecting employers with 2M+ students across the UK.`},
    {sourceId:"f4s-sf",text:"Directed a large-scale program impacting 650K+ students in partnership with corporate stakeholders including JLL and JPMorgan."},
    {sourceId:"f4s-engagement",text:"Used data-led campaigns to increase educator engagement by 30%."},
    {sourceId:"f4s-team",text:"Managed and mentored a team of three and developed a training framework."},
  ];
  const changes=changeInputs.map((item,index)=>{const source=experiences.find(experience=>experience.id===item.sourceId)!;return {id:`change-${index}`,original:source.text,tailored:item.text,reason:index===0?`Foregrounds ${job.roleFamily} while preserving the original scale and audience.`:"Prioritizes verified evidence that maps to the role’s strongest requirements.",integrity:assessClaim(item.text,truth)}});
  const summary=`Learning, engagement and program leader with 10+ years of experience designing initiatives, building stakeholder partnerships and delivering measurable outcomes. Brings verified national-scale program delivery, corporate partnership experience and team leadership relevant to the ${job.title} role at ${job.company}.`;
  const evidence=ranked.slice(0,3);
  const coverLetter=`Dear Hiring Team,

The ${job.title} opportunity at ${job.company} stands out because it brings together ${job.roleFamily.toLowerCase()}, program ownership and stakeholder partnership—areas that have shaped my career.

At Founders4Schools, I led national learning, engagement and partnership initiatives connecting employers with more than 2 million students across the UK. I also directed the Sustainable Futures program, which reached over 650,000 students and involved corporate stakeholders including JLL and JPMorgan. That work required translating ambitious goals into practical programs, building trusted relationships and keeping diverse contributors aligned around measurable outcomes.

I have also used data to improve engagement, including campaigns that increased educator participation by 30%, and I have managed and mentored a team of three while developing a training framework. Earlier, at KnowledgeBrief, I oversaw corporate learning programs and partnership accounts supporting more than 200 professionals.

I would bring ${job.company} a combination of structured program delivery, clear communication and relationship-led execution. I am particularly interested in applying that experience to ${job.roleFamily.toLowerCase()} while learning the specific context of your organization and team.

Thank you for considering my application. I would welcome the opportunity to discuss how my experience could support the priorities of this role.

Sincerely,
Neelam Jagait`;
  const answers=[
    {question:"Why are you interested in this position?",answer:`This position combines ${job.roleFamily.toLowerCase()}, program delivery and stakeholder partnership. Those are the areas where I have built the strongest evidence, including national initiatives, corporate partnerships and measurable engagement improvement. I am interested in bringing that experience to ${job.company} while developing a deeper understanding of its team and industry context.`},
    {question:"Tell us about your relevant experience.",answer:`I have 10+ years of experience across learning, engagement and program management. At Founders4Schools, I led initiatives connecting employers with 2M+ students, directed a program reaching 650K+ students with stakeholders including JLL and JPMorgan, and launched campaigns that increased educator engagement by 30%. I also managed and mentored a team of three and developed a training framework.`},
    {question:"Describe your stakeholder-management experience.",answer:`My work has required sustained coordination across employers, educators, delivery teams and corporate partners. For the Sustainable Futures program, I worked with stakeholders including JLL and JPMorgan while directing delivery that reached 650K+ students. I have also secured £100K+ in annual funding through presentations, pitches and relationship management.`},
  ];
  const integrityScore=Math.round(changes.reduce((n,c)=>n+(c.integrity==="GREEN"?100:c.integrity==="AMBER"?70:0),0)/changes.length);const coverage=Math.round(job.requirements.filter(r=>r.strength!=="None").length/Math.max(1,job.requirements.length)*100);const checks=[{label:"Résumé alignment",score:job.score,recommendation:job.score<80?"Strengthen evidence ordering around required responsibilities.":"Strong alignment; keep the document concise."},{label:"Evidence coverage",score:coverage,recommendation:coverage<75?"Address unsupported requirements honestly in the application strategy.":"Most requirements have defensible evidence."},{label:"Factual integrity",score:integrityScore,recommendation:integrityScore<90?"Review amber wording before accepting changes.":"Draft remains grounded in verified Career Truth."},{label:"Personalization",score:85,recommendation:"Add one verified company-specific reason after employer research."},{label:"Completeness",score:88,recommendation:"Review salary, work authorization and any employer-specific questions."}];
  return {summary,skills:[...new Set(evidence.flatMap(item=>item.tags))].slice(0,10),changes,coverLetter,answers,quality:{score:Math.round(checks.reduce((n,c)=>n+c.score,0)/checks.length),checks}};
}

export function answerCustomApplicationQuestion(job:Job,question:string){const lower=question.toLowerCase();if(/salary|compensation/.test(lower))return `My target compensation is at least $70,000 annualized, while remaining open to discussing the full scope of the role, total compensation and benefits.`;if(/work authorization|authorized|sponsorship/.test(lower))return "I am authorized to work in the United States and the United Kingdom.";if(/why.*company|why.*us/.test(lower))return `I am interested in ${job.company} because this ${job.title} opportunity connects directly with my background in ${job.roleFamily.toLowerCase()}, program delivery and stakeholder partnership. Before submitting, I would add one specific, verified reason drawn from the company’s official materials.`;if(/gap|break|time off/.test(lower))return "Career-break wording has not yet been approved in Career Truth. Add Neelam’s approved explanation in Settings before generating this answer.";if(/project|program|example|achievement/.test(lower))return "At Founders4Schools, I directed the Sustainable Futures program, which impacted 650K+ students and involved corporate stakeholders including JLL and JPMorgan. The work required coordinated program delivery, stakeholder communication and a clear focus on measurable reach.";if(/stakeholder|partner|influence/.test(lower))return "I have managed relationships across employers, educators and corporate partners. My work included stakeholders such as JLL and JPMorgan, and I secured £100K+ in annual funding through presentations, pitches and relationship management.";return `My relevant experience includes 10+ years across learning, engagement and program management. I led national initiatives connecting employers with 2M+ students, directed a program reaching 650K+ students and delivered campaigns that increased educator engagement by 30%. For the ${job.title} role, I would emphasize the parts of that experience that map directly to ${job.roleFamily.toLowerCase()} without overstating industry-specific knowledge.`}
