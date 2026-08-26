export function linkedInCurrentCompanySearch(company:string,keywords:string){
  const query=`"${company.trim()}" ${keywords.replace(company,"").trim()}`;
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}&origin=GLOBAL_SEARCH_HEADER`;
}
