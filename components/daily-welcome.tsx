"use client";

import { useEffect, useState } from "react";
import { encouragementForDate, greetingForHour } from "@/lib/daily-welcome";

function currentWelcome(){const now=new Date();return {date:new Intl.DateTimeFormat(undefined,{weekday:"long",month:"long",day:"numeric"}).format(now),greeting:greetingForHour(now.getHours()),quote:encouragementForDate(now)};}

export function DailyWelcome(){const [welcome,setWelcome]=useState<ReturnType<typeof currentWelcome>|null>(null);useEffect(()=>{const first=window.setTimeout(()=>setWelcome(currentWelcome()),0);const timer=window.setInterval(()=>setWelcome(currentWelcome()),60_000);return()=>{window.clearTimeout(first);window.clearInterval(timer)};},[]);return <header className="daily-welcome"><div className="eyebrow">{welcome?.date??"Today"}</div><h1>{welcome?.greeting??"Welcome"}, Neelam</h1><p className="subtle">Here’s where your attention will have the most impact today.</p><blockquote>{welcome?.quote??"Your next purposeful step starts here."}</blockquote></header>}
