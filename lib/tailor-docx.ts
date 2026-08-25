import JSZip from "jszip";

function escapeRegex(value:string){return value.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}
function escapeXml(value:string){return value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function decodeXml(value:string){return value.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&apos;/g,"'")}

export async function tailorOriginalDocx(original:Buffer,acceptedChanges:Array<{original:string;tailored:string}>){
  const zip=await JSZip.loadAsync(original);const entry=zip.file("word/document.xml");
  if(!entry)throw new Error("The master Word file is missing document content");
  let xml=await entry.async("string");
  for(const change of acceptedChanges){
    const originalText=change.original.trim().replace(/^•\s*/,"");const tailored=change.tailored.trim().replace(/^•\s*/,"");
    if(!originalText||!tailored)continue;
    let replaced=false;
    xml=xml.replace(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g,paragraph=>{
      if(replaced)return paragraph;
      const texts=[...paragraph.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)];
      const visible=texts.map(match=>decodeXml(match[1])).join("");
      if(!visible.includes(originalText))return paragraph;
      replaced=true;let first=true;
      return paragraph.replace(/(<w:t(?:\s[^>]*)?>)([\s\S]*?)(<\/w:t>)/g,(_match,open,_text,close)=>{if(first){first=false;return `${open}${escapeXml(visible.replace(originalText,tailored))}${close}`}return `${open}${close}`});
    });
    if(!replaced){const pattern=new RegExp(`(<w:t(?:\\s[^>]*)?>)([^<]*${escapeRegex(originalText)}[^<]*)(<\\/w:t>)`);xml=xml.replace(pattern,(_match,open,text,close)=>`${open}${escapeXml(decodeXml(text).replace(originalText,tailored))}${close}`)}
  }
  zip.file("word/document.xml",xml);
  return Buffer.from(await zip.generateAsync({type:"uint8array",compression:"DEFLATE"}));
}
