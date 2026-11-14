import { Router } from 'express';
import { pool } from '../db/pool.js';
import { processIncoming } from '../services/inbox.js';
const r=Router();

r.get('/meta', (req,res)=>{
 const mode=req.query['hub.mode'];const token=req.query['hub.verify_token'];const challenge=req.query['hub.challenge'];
 if(mode==='subscribe' && token===process.env.META_VERIFY_TOKEN) return res.status(200).send(challenge);
 return res.sendStatus(403);
});

r.post('/meta',async(req,res)=>{
 res.sendStatus(200);
 try {
  const body=req.body;
  for(const entry of body.entry ?? []) {
   const changes=entry.changes ?? [];
   for(const change of changes) {
    const value=change.value ?? {};
    const phoneId=value.metadata?.phone_number_id;
    if(phoneId) {
     const accounts=await pool.query(
       `SELECT id FROM platform_accounts WHERE platform='whatsapp' AND external_account_id=$1 AND enabled=true`,
       [String(phoneId)]);
     for(const account of accounts.rows) {
      for(const m of value.messages ?? []) {
       const text=m.text?.body;
       if(text && m.from && m.id) await processIncoming({
        platform:'whatsapp',accountId:account.id,senderId:String(m.from),
        messageId:String(m.id),text,raw:m
       });
      }
     }
    }
   }
   const externalId=String(entry.id ?? '');
   const object=String(body.object ?? '');
   const platform=object==='instagram'?'instagram':object==='page'?'facebook':null;
   if(platform) {
    const accounts=await pool.query(
      `SELECT id FROM platform_accounts WHERE platform=$1 AND external_account_id=$2 AND enabled=true`,
      [platform,externalId]);
    for(const account of accounts.rows) {
     for(const m of entry.messaging ?? []) {
      const text=m.message?.text;
      const sender=m.sender?.id;
      const id=m.message?.mid;
      if(text && sender && id) await processIncoming({
       platform,accountId:account.id,senderId:String(sender),
       messageId:String(id),text,raw:m
      });
     }
    }
   }
  }
 } catch(e) { console.error('Meta webhook processing error',e); }
});

r.post('/telegram/:accountId',async(req,res)=>{
 res.sendStatus(200);
 try {
  const secret=process.env.TELEGRAM_WEBHOOK_SECRET;
  if(secret && req.header('x-telegram-bot-api-secret-token')!==secret) return;
  const accountQ=await pool.query(`SELECT id FROM platform_accounts WHERE id=$1 AND platform='telegram' AND enabled=true`,[req.params.accountId]);
  const account=accountQ.rows[0];if(!account)return;
  const msg=req.body?.message;const text=msg?.text;const chatId=msg?.chat?.id;const id=msg?.message_id;
  if(text && chatId && id) await processIncoming({platform:'telegram',accountId:account.id,senderId:String(chatId),senderName:msg.from?.username ?? msg.from?.first_name,messageId:String(id),text,raw:req.body});
 } catch(e){console.error('Telegram webhook processing error',e);}
});
export default r;
