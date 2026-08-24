import "server-only";
import PDFDocument from "pdfkit";
import type { CareerEvidence } from "@/lib/repositories/career-truth";

type ResumePdfInput={company:string;role:string;summary:string;skills:string[];evidence:CareerEvidence[];acceptedChanges:Record<string,string>;changeSources:Array<{id:string;original:string;tailored:string}>};
const INK="#17211f"; const GREEN="#176b57"; const MUTED="#63716d"; const LINE="#d7ddda";
function safeText(value:string){return value.replace(/[–—]/g,"-").replace(/•/g,"-")}

export async function createResumePdf(input:ResumePdfInput):Promise<Buffer>{
  const document=new PDFDocument({size:"LETTER",bufferPages:true,margins:{top:42,bottom:42,left:52,right:52},info:{Title:`Neelam Jagait - ${input.role}`,Author:"Neelam Jagait",Subject:`Tailored resume for ${input.company}`}}); const chunks:Buffer[]=[]; document.on("data",chunk=>chunks.push(Buffer.from(chunk))); const complete=new Promise<Buffer>((resolve,reject)=>{document.on("end",()=>resolve(Buffer.concat(chunks)));document.on("error",reject)});
  const pageWidth=document.page.width-document.page.margins.left-document.page.margins.right;
  function rule(){document.moveDown(.25).strokeColor(LINE).lineWidth(.7).moveTo(document.x,document.y).lineTo(document.x+pageWidth,document.y).stroke().moveDown(.55)}
  function section(title:string){if(document.y>document.page.height-120)document.addPage();document.moveDown(.55).font("Helvetica-Bold").fontSize(9).fillColor(GREEN).text(title.toUpperCase(),{characterSpacing:1.3});rule()}
  function bullet(text:string){const y=document.y;document.fillColor(GREEN).font("Helvetica-Bold").fontSize(10).text("-",52,y,{width:12});document.fillColor(INK).font("Helvetica").fontSize(9.4).text(safeText(text),68,y,{width:document.page.width-120,lineGap:2});document.moveDown(.3)}
  document.fillColor(INK).font("Helvetica-Bold").fontSize(25).text("NEELAM JAGAIT");document.moveDown(.15).font("Helvetica").fontSize(10).fillColor(MUTED).text(`${safeText(input.role)} | Tailored for ${safeText(input.company)}`);document.moveDown(.7);document.fillColor(GREEN).rect(52,document.y,pageWidth,3).fill();document.moveDown(1);
  section("Professional profile");document.fillColor(INK).font("Helvetica").fontSize(10).text(safeText(input.summary),{lineGap:3});
  section("Core capabilities");document.fillColor(INK).font("Helvetica").fontSize(9.5).text(input.skills.map(safeText).join("  |  "),{lineGap:3});
  section("Professional experience");
  const replacements=new Map(input.changeSources.map(change=>[change.original,input.acceptedChanges[change.id]??change.tailored])); const groups=new Map<string,CareerEvidence[]>(); for(const item of input.evidence.filter(item=>item.verified)){const key=`${item.position}\u0000${item.employer}\u0000${item.period}`;groups.set(key,[...(groups.get(key)??[]),item])}
  for(const [key,items] of groups){if(document.y>document.page.height-130)document.addPage();const [position,employer,period]=key.split("\u0000");document.font("Helvetica-Bold").fontSize(11).fillColor(INK).text(safeText(position),{continued:true}).font("Helvetica").fillColor(MUTED).text(`  |  ${safeText(employer)}`);document.font("Helvetica").fontSize(8.8).fillColor(MUTED).text(safeText(period));document.moveDown(.45);for(const item of items)bullet(replacements.get(item.content)??item.content);document.moveDown(.35)}
  section("Additional information");document.fillColor(INK).font("Helvetica").fontSize(9.4).text("Work authorization: United States and United Kingdom",{lineGap:3});document.moveDown(.3).fillColor(MUTED).fontSize(8.5).text("Prepared from verified Career Truth evidence. Review contact details and final formatting before submission.");
  const pages=document.bufferedPageRange(); for(let index=0;index<pages.count;index++){document.switchToPage(index);document.font("Helvetica").fontSize(7.5).fillColor(MUTED).text(`Neelam Jagait  |  ${safeText(input.company)}  |  ${index+1} of ${pages.count}`,52,document.page.height-55,{width:pageWidth,align:"center",lineBreak:false})}
  document.end(); return complete;
}
