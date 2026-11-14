import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '../db/pool.js';
const r = Router();
const schema = z.object({name:z.string().min(1),email:z.string().email(),password:z.string().min(12)});
r.post('/register',async(req,res,next)=>{
  try {
    if (process.env.ALLOW_REGISTRATION === 'false') return res.status(403).json({error:'Registration disabled'});
    const input = schema.parse(req.body);
    const exists = await pool.query('SELECT id FROM users WHERE email=$1',[input.email.toLowerCase()]);
    if (exists.rowCount) return res.status(409).json({error:'Email already registered'});
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const ws = await client.query('INSERT INTO workspaces(name) VALUES($1) RETURNING id',[`${input.name}'s workspace`]);
      const hash = await bcrypt.hash(input.password,12);
      const user = await client.query('INSERT INTO users(workspace_id,name,email,password_hash) VALUES($1,$2,$3,$4) RETURNING id,workspace_id,name,email,role',[ws.rows[0].id,input.name,input.email.toLowerCase(),hash]);
      await client.query('COMMIT');
      const u=user.rows[0];
      const token=jwt.sign({id:u.id,workspaceId:u.workspace_id,email:u.email,role:u.role},process.env.JWT_SECRET!,{expiresIn:'12h'});
      res.status(201).json({token,user:{id:u.id,name:u.name,email:u.email,role:u.role,workspaceId:u.workspace_id}});
    } catch(e){await client.query('ROLLBACK');throw e;} finally {client.release();}
  } catch(e){next(e);}
});
r.post('/login',async(req,res,next)=>{
  try {
    const input=z.object({email:z.string().email(),password:z.string()}).parse(req.body);
    const q=await pool.query('SELECT * FROM users WHERE email=$1',[input.email.toLowerCase()]);
    const u=q.rows[0];
    if(!u || !(await bcrypt.compare(input.password,u.password_hash))) return res.status(401).json({error:'Invalid credentials'});
    const token=jwt.sign({id:u.id,workspaceId:u.workspace_id,email:u.email,role:u.role},process.env.JWT_SECRET!,{expiresIn:'12h'});
    res.json({token,user:{id:u.id,name:u.name,email:u.email,role:u.role,workspaceId:u.workspace_id}});
  } catch(e){next(e);}
});
export default r;
