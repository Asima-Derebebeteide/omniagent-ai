import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { sendPlatformMessage } from '../services/platforms.js';
const r=Router();
r.get('/',async(req,res,next)=>{try{
 const q=await pool.query(`SELECT c.*,p.platform,p.display_name AS account_name,ct.display_name AS contact_name,ct.external_id,
 (SELECT body FROM messages m WHERE m.conversation_id=c.id ORDER BY created_at DESC LIMIT 1) AS last_message
 FROM conversations c JOIN platform_accounts p ON p.id=c.platform_account_id LEFT JOIN contacts ct ON ct.id=c.contact_id
 WHERE c.workspace_id=$1 ORDER BY c.last_message_at DESC LIMIT 200`,[req.user!.workspaceId]);res.json(q.rows);
}catch(e){next(e)}});
r.get('/:id/messages',async(req,res,next)=>{try{
 const own=await pool.query('SELECT id FROM conversations WHERE id=$1 AND workspace_id=$2',[req.params.id,req.user!.workspaceId]);if(!own.rowCount)return res.status(404).json({error:'Conversation not found'});
 const q=await pool.query('SELECT * FROM messages WHERE conversation_id=$1 ORDER BY created_at ASC',[req.params.id]);res.json(q.rows);
}catch(e){next(e)}});
r.post('/:id/takeover',async(req,res,next)=>{try{
 const q=await pool.query(`UPDATE conversations SET mode='human' WHERE id=$1 AND workspace_id=$2 RETURNING id,mode`,[req.params.id,req.user!.workspaceId]);if(!q.rowCount)return res.status(404).json({error:'Conversation not found'});res.json(q.rows[0]);
}catch(e){next(e)}});
r.post('/:id/return-to-ai',async(req,res,next)=>{try{
 const q=await pool.query(`UPDATE conversations SET mode='ai' WHERE id=$1 AND workspace_id=$2 RETURNING id,mode`,[req.params.id,req.user!.workspaceId]);if(!q.rowCount)return res.status(404).json({error:'Conversation not found'});res.json(q.rows[0]);
}catch(e){next(e)}});
r.post('/:id/messages',async(req,res,next)=>{try{
 const input=z.object({text:z.string().min(1).max(4000)}).parse(req.body);
 const q=await pool.query(`SELECT c.*,p.platform,p.credentials,p.config,ct.external_id FROM conversations c JOIN platform_accounts p ON p.id=c.platform_account_id LEFT JOIN contacts ct ON ct.id=c.contact_id WHERE c.id=$1 AND c.workspace_id=$2`,[req.params.id,req.user!.workspaceId]);
 const c=q.rows[0];if(!c)return res.status(404).json({error:'Conversation not found'});
 const creds=typeof c.credentials==='string'?JSON.parse(c.credentials):c.credentials;const config=typeof c.config==='string'?JSON.parse(c.config):c.config;
 const result=await sendPlatformMessage(c.platform,creds,c.external_id,input.text,config);
 const saved=await pool.query(`INSERT INTO messages(conversation_id,direction,sender_type,body,status,metadata) VALUES($1,'outbound','human',$2,'sent',$3) RETURNING *`,[c.id,input.text,JSON.stringify({platformResult:result})]);
 res.status(201).json(saved.rows[0]);
}catch(e){next(e)}});
export default r;
