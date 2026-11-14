import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
const r=Router();
const allowed=['whatsapp','instagram','telegram','tiktok','facebook'];
r.get('/',async(req,res,next)=>{try{
 const q=await pool.query('SELECT id,platform,display_name,external_account_id,config,enabled,created_at FROM platform_accounts WHERE workspace_id=$1 ORDER BY created_at DESC',[req.user!.workspaceId]);res.json(q.rows);
}catch(e){next(e)}});
r.post('/',async(req,res,next)=>{try{
 const input=z.object({platform:z.enum(['whatsapp','instagram','telegram','tiktok','facebook']),displayName:z.string().min(1),externalAccountId:z.string().optional(),credentials:z.record(z.any()).default({}),config:z.record(z.any()).default({}),enabled:z.boolean().default(false)}).parse(req.body);
 if(input.platform==='tiktok' && input.enabled) return res.status(400).json({error:'TikTok messaging automation is capability-gated; this starter cannot enable general DM automation.'});
 const q=await pool.query(`INSERT INTO platform_accounts(workspace_id,platform,display_name,external_account_id,credentials,config,enabled)
 VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,platform,display_name,external_account_id,config,enabled`,
 [req.user!.workspaceId,input.platform,input.displayName,input.externalAccountId??null,JSON.stringify(input.credentials),JSON.stringify(input.config),input.enabled]);
 res.status(201).json(q.rows[0]);
}catch(e){next(e)}});
r.patch('/:id',async(req,res,next)=>{try{
 const input=z.object({displayName:z.string().optional(),credentials:z.record(z.any()).optional(),config:z.record(z.any()).optional(),enabled:z.boolean().optional()}).parse(req.body);
 const q=await pool.query(`UPDATE platform_accounts SET display_name=COALESCE($1,display_name),credentials=COALESCE($2,credentials),config=COALESCE($3,config),enabled=COALESCE($4,enabled)
 WHERE id=$5 AND workspace_id=$6 RETURNING id,platform,display_name,external_account_id,config,enabled`,
 [input.displayName??null,input.credentials?JSON.stringify(input.credentials):null,input.config?JSON.stringify(input.config):null,input.enabled??null,req.params.id,req.user!.workspaceId]);
 if(!q.rowCount)return res.status(404).json({error:'Account not found'});res.json(q.rows[0]);
}catch(e){next(e)}});
r.delete('/:id',async(req,res,next)=>{try{const q=await pool.query('DELETE FROM platform_accounts WHERE id=$1 AND workspace_id=$2',[req.params.id,req.user!.workspaceId]);if(!q.rowCount)return res.status(404).json({error:'Account not found'});res.status(204).end()}catch(e){next(e)}});
export default r;
