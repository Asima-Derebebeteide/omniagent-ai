'use client';
import {useEffect,useState} from 'react';
const API=process.env.NEXT_PUBLIC_API_URL||'http://127.0.0.1:4000/api/v1';
type Account={id:string;platform:string;display_name:string;enabled:boolean};
type Conversation={id:string;platform:string;account_name:string;contact_name:string;external_id:string;mode:string;last_message:string};
type Message={id:string;direction:string;sender_type:string;body:string;created_at:string};
export default function Home(){
 const [token,setToken]=useState('');const [email,setEmail]=useState('');const [password,setPassword]=useState('');
 const [accounts,setAccounts]=useState<Account[]>([]);const [convos,setConvos]=useState<Conversation[]>([]);
 const [selected,setSelected]=useState('');const [messages,setMessages]=useState<Message[]>([]);const [text,setText]=useState('');
 const [status,setStatus]=useState('Sign in or create the first workspace owner account.');
 const [platform,setPlatform]=useState('telegram');const [displayName,setDisplayName]=useState('');
 const [externalId,setExternalId]=useState('');const [credentials,setCredentials]=useState('{}');const [config,setConfig]=useState('{}');
 async function call(path:string,method='GET',body?:unknown){
  const r=await fetch(API+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined});
  const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||`Request failed ${r.status}`);return data;
 }
 async function login(mode:'login'|'register'){
  try{const data=await call('/auth/'+mode,'POST',mode==='login'?{email,password}:{name:'Workspace Owner',email,password});
   setToken(data.token);localStorage.setItem('omniagent_token',data.token);setStatus('Connected. Your workspace is ready.');}
  catch(e:any){setStatus(e.message)}
 }
 async function refresh(t=token){if(!t)return;try{
  const [a,c]=await Promise.all([fetch(API+'/accounts',{headers:{Authorization:`Bearer ${t}`}}),fetch(API+'/conversations',{headers:{Authorization:`Bearer ${t}`}})]);
  if(!a.ok||!c.ok)throw new Error('Could not load workspace data');setAccounts(await a.json());setConvos(await c.json());
 }catch(e:any){setStatus(e.message)}}
 async function openConversation(id:string){setSelected(id);try{setMessages(await call(`/conversations/${id}/messages`))}catch(e:any){setStatus(e.message)}}
 async function addAccount(){try{
  const data=await call('/accounts','POST',{platform,displayName,externalAccountId:externalId||undefined,credentials:JSON.parse(credentials),config:JSON.parse(config),enabled:true});
  setStatus(`Connected account record created: ${data.display_name}`);setDisplayName('');await refresh();
 }catch(e:any){setStatus(e.message)}}
 async function send(){if(!selected||!text.trim())return;try{await call(`/conversations/${selected}/messages`,'POST',{text});setText('');await openConversation(selected);await refresh()}catch(e:any){setStatus(e.message)}}
 async function mode(action:'takeover'|'return-to-ai'){try{await call(`/conversations/${selected}/${action}`,'POST',{});await refresh();await openConversation(selected)}catch(e:any){setStatus(e.message)}}
 useEffect(()=>{const t=localStorage.getItem('omniagent_token')||'';if(t){setToken(t);setStatus('Restoring session...')}},[]);
 useEffect(()=>{if(token)refresh(token)},[token]);
 return <main className="shell">
  <header className="top"><div><h1>🤖 OmniAgent AI</h1><div className="muted">One inbox. Multiple platforms. AI + human support.</div></div><span className="pill">MVP · Multi-account</span></header>
  <p className="muted">{status}</p>
  {!token?<section className="panel"><h2>Workspace access</h2><label>Email</label><input className="field" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/><label>Password (12+ characters for registration)</label><input className="field" type="password" value={password} onChange={e=>setPassword(e.target.value)}/><div className="row"><button className="btn" onClick={()=>login('login')}>Sign in</button><button className="btn secondary" onClick={()=>login('register')}>Create workspace</button></div></section>:
  <>
   <section className="grid"><div className="card"><div className="muted">Connected account records</div><h2>{accounts.length}</h2></div><div className="card"><div className="muted">Conversations</div><h2>{convos.length}</h2></div><div className="card"><div className="muted">AI mode</div><h2>Human takeover ready</h2></div></section>
   <section className="panel"><h2>Connect a platform account</h2><div className="grid">
    <div><label>Platform</label><select className="field" value={platform} onChange={e=>setPlatform(e.target.value)}>{['whatsapp','instagram','telegram','tiktok','facebook'].map(p=><option key={p}>{p}</option>)}</select></div>
    <div><label>Account display name</label><input className="field" value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="My support account"/></div>
    <div><label>External account ID (where required)</label><input className="field" value={externalId} onChange={e=>setExternalId(e.target.value)} placeholder="Page / phone number / IG ID"/></div>
   </div><label>Credentials JSON (keep private)</label><textarea className="field" rows={3} value={credentials} onChange={e=>setCredentials(e.target.value)} />
   <label>Platform config JSON</label><textarea className="field" rows={3} value={config} onChange={e=>setConfig(e.target.value)}/>
   <button className="btn" onClick={addAccount}>Save account</button>
   <p className="muted">TikTok is capability-gated and cannot be enabled for general DM automation in this starter. Account credentials are never returned by the API, but production encryption-at-rest must be added before real customer use.</p>
   <h3>Accounts</h3>{accounts.map(a=><div className="row" key={a.id}><span className="pill">{a.platform}</span>{a.display_name} · {a.enabled?'enabled':'disabled'}</div>)}
   </section>
   <div className="cols"><section className="panel"><h2>Unified inbox</h2>{convos.map(c=><div className="conversation" key={c.id} onClick={()=>openConversation(c.id)}><b>{c.contact_name||c.external_id||'Customer'}</b><div className="muted">{c.platform} · {c.account_name} · {c.mode}</div><div>{c.last_message}</div></div>)}</section>
   <section className="panel"><h2>Conversation</h2>{selected?<><div className="row"><button className="btn secondary" onClick={()=>mode('takeover')}>Human takeover</button><button className="btn" onClick={()=>mode('return-to-ai')}>Return to AI</button></div><div style={{minHeight:220,marginTop:12}}>{messages.map(m=><div key={m.id} className={'message '+(m.direction==='outbound'?'out':'')}><small className="muted">{m.sender_type}</small><div>{m.body}</div></div>)}</div><textarea className="field" rows={3} value={text} onChange={e=>setText(e.target.value)} placeholder="Write a human reply..."/><button className="btn" onClick={send}>Send reply</button></>:<p className="muted">Choose a conversation to view messages and take over.</p>}</section></div>
   <button className="btn secondary" onClick={()=>{localStorage.removeItem('omniagent_token');setToken('')}}>Sign out</button>
  </>}
  <footer className="muted" style={{marginTop:30,fontSize:12}}>OmniAgent AI · Configure official platform credentials and webhook subscriptions before going live.</footer>
 </main>
}
