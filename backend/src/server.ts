import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pool } from './db/pool.js';
import { auth } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import accountRoutes from './routes/accounts.js';
import conversationRoutes from './routes/conversations.js';
import webhookRoutes from './routes/webhooks.js';

const app=express();
app.use(helmet());
app.use(cors({origin:(process.env.CORS_ORIGIN||'http://127.0.0.1:3000').split(',')}));
app.use(express.json({limit:'1mb'}));
app.get('/health',async(_req,res)=>{try{await pool.query('SELECT 1');res.json({ok:true,service:'omniagent-api',database:'connected'})}catch{res.status(503).json({ok:false,database:'disconnected'})}});
app.use('/api/v1/auth',authRoutes);
app.use('/api/v1/webhooks',webhookRoutes);
app.use('/api/v1',auth);
app.use('/api/v1/accounts',accountRoutes);
app.use('/api/v1/conversations',conversationRoutes);
app.use((err:any,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{
 console.error(err);if(err?.name==='ZodError')return res.status(400).json({error:'Validation failed',details:err.issues});
 res.status(500).json({error:process.env.NODE_ENV==='production'?'Internal server error':String(err?.message??err)});
});
const port=Number(process.env.PORT||4000);
app.listen(port,'0.0.0.0',()=>console.log(`OmniAgent API listening on ${port}`));
