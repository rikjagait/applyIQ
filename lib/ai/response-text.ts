export type ResponsesPayload={output_text?:string;output?:Array<{content?:Array<{type?:string;text?:string}>}>};
export function responseText(data:ResponsesPayload){
  if(data.output_text?.trim())return data.output_text.trim();
  return (data.output??[]).flatMap(item=>item.content??[]).filter(item=>item.type==="output_text"||typeof item.text==="string").map(item=>item.text??"").join("").trim();
}
