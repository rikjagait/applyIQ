import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { previewAvailable, publicDemoEnabled } from "@/lib/preview";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  if (publicDemoEnabled()) redirect("/");
  if (!isSupabaseConfigured()) redirect("/");
  const { error, message } = await searchParams;
  return <div className="login-shell"><div className="login-card"><div className="brand" style={{color:"var(--ink)",padding:0,marginBottom:28}}><span className="brand-mark">A</span>ApplyIQ</div><div className="eyebrow">Private workspace</div><h1>Welcome back, Neelam</h1><p className="subtle">Sign in to access your career data and applications.</p>{message&&<p className="analysis-banner">{message}</p>}{error && <p className="error-box">{error}</p>}<form className="form" action="/auth/login" method="post"><label className="field">Email<input className="input" name="email" type="email" autoComplete="email" required/></label><label className="field">Password<input className="input" name="password" type="password" autoComplete="current-password" required minLength={8}/></label><button className="btn primary" type="submit">Sign in securely</button><a href="/forgot-password" style={{textAlign:"center",fontSize:13,color:"var(--green)",fontWeight:700}}>Create or reset password</a></form>{previewAvailable()&&<><div className="preview-divider"><span>or test locally</span></div><form action="/auth/preview" method="post"><button className="btn" style={{width:"100%",justifyContent:"center"}} type="submit">Open preview workspace</button><p className="subtle" style={{textAlign:"center",marginBottom:0}}>Demo data only · disabled in production</p></form></>}</div></div>;
}
