"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
export function CopyMessage({text}:{text:string}){const [copied,setCopied]=useState(false);async function copy(){await navigator.clipboard.writeText(text);setCopied(true);setTimeout(()=>setCopied(false),1800)}return <button className="btn" type="button" onClick={copy}>{copied?<Check size={14}/>:<Copy size={14}/>} {copied?"Copied":"Copy draft"}</button>}
