import JSZip from "jszip";

const anchors:Record<string,string>={"change-0":"2M+ students","change-1":"650K+ students","change-2":"increased educator engagement by 30%","change-3":"Managed and mentored a team"};
function escapeRegex(value:string){return value.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}
function escapeXml(value:string){return value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
export async function tailorOriginalDocx(original:Buffer,acceptedChanges:Record<string,string>){const zip=await JSZip.loadAsync(original);const entry=zip.file("word/document.xml");if(!entry)throw new Error("The master Word file is missing document content");let xml=await entry.async("string");for(const [changeId,value] of Object.entries(acceptedChanges)){const anchor=anchors[changeId];if(!anchor||!value.trim())continue;const pattern=new RegExp(`(<w:t(?:\\s[^>]*)?>)([^<]*${escapeRegex(anchor)}[^<]*)(<\\/w:t>)`);if(!pattern.test(xml))continue;xml=xml.replace(pattern,(_match,open,_original,close)=>`${open}${escapeXml(value.trim().replace(/^•\\s*/,""))}${close}`)}zip.file("word/document.xml",xml);return Buffer.from(await zip.generateAsync({type:"uint8array",compression:"DEFLATE"}))}
