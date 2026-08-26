const knownCompanySlugs:Record<string,string>={google:"google",anthropic:"anthropicresearch"};
export function linkedInCurrentCompanySearch(company:string,keywords:string){
  const normalized=company.trim().toLowerCase();
  const slug=knownCompanySlugs[normalized]||normalized.replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  return `https://www.linkedin.com/company/${slug}/people/?keywords=${encodeURIComponent(keywords)}`;
}
