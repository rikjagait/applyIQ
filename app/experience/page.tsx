import { PageHead } from "@/components/ui";
import { ExperienceBank } from "@/components/experience-bank";
import { listCareerEvidence } from "@/lib/repositories/career-truth";
export default async function ExperiencePage(){const evidence=await listCareerEvidence();return <div className="content"><PageHead eyebrow="Career Truth Layer" title="Experience Bank" copy={`${evidence.filter(item=>item.verified).length} verified evidence items available for applications.`}/><ExperienceBank initial={evidence}/></div>}
