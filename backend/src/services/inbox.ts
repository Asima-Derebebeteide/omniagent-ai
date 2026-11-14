import { pool } from '../db/pool.js';
import type { IncomingMessage } from '../types.js';
import { draftReply } from './ai.js';
import { sendPlatformMessage } from './platforms.js';

export async function processIncoming(msg:IncomingMessage) {
  const accountQ = await pool.query('SELECT * FROM platform_accounts WHERE id=$1 AND enabled=true',[msg.accountId]);
  const account = accountQ.rows[0];
  if (!account) throw new Error('Connected platform account not found or disabled');

  const eventKey = `${msg.platform}:${msg.accountId}:${msg.messageId}`;
  const event = await pool.query('INSERT INTO webhook_events(platform,event_key,payload) VALUES($1,$2,$3) ON CONFLICT(event_key) DO NOTHING RETURNING id',[msg.platform,eventKey,JSON.stringify(msg.raw ?? msg)]);
  if (!event.rowCount) return { duplicate:true };

  const contactQ = await pool.query(
    `INSERT INTO contacts(workspace_id,platform_account_id,external_id,display_name)
     VALUES($1,$2,$3,$4) ON CONFLICT(platform_account_id,external_id)
     DO UPDATE SET display_name=COALESCE(EXCLUDED.display_name,contacts.display_name) RETURNING id`,
    [account.workspace_id,account.id,msg.senderId,msg.senderName ?? null]);
  const contactId = contactQ.rows[0].id;

  let convQ = await pool.query(
    `SELECT * FROM conversations WHERE platform_account_id=$1 AND contact_id=$2 AND status='open' ORDER BY created_at DESC LIMIT 1`,
    [account.id,contactId]);
  let conv = convQ.rows[0];
  if (!conv) {
    const created = await pool.query(
      `INSERT INTO conversations(workspace_id,platform_account_id,contact_id,external_thread_id)
       VALUES($1,$2,$3,$4) RETURNING *`,
      [account.workspace_id,account.id,contactId,msg.threadId ?? msg.senderId]);
    conv = created.rows[0];
  }

  await pool.query(
    `INSERT INTO messages(conversation_id,external_message_id,direction,sender_type,body,metadata)
     VALUES($1,$2,'inbound','customer',$3,$4) ON CONFLICT DO NOTHING`,
    [conv.id,msg.messageId,msg.text,JSON.stringify({platform:msg.platform})]);
  await pool.query('UPDATE conversations SET last_message_at=now() WHERE id=$1',[conv.id]);

  if (conv.mode === 'human') return { conversationId:conv.id, autoReplied:false, reason:'human_takeover' };
  if (msg.platform === 'tiktok') return { conversationId:conv.id, autoReplied:false, reason:'tiktok_messaging_not_supported' };

  const reply = await draftReply(conv.id,msg.text);
  const credentials = typeof account.credentials === 'string' ? JSON.parse(account.credentials) : account.credentials;
  const config = typeof account.config === 'string' ? JSON.parse(account.config) : account.config;
  const result = await sendPlatformMessage(msg.platform,credentials,msg.senderId,reply,config);
  await pool.query(
    `INSERT INTO messages(conversation_id,direction,sender_type,body,status,metadata)
     VALUES($1,'outbound','ai',$2,'sent',$3)`,
    [conv.id,reply,JSON.stringify({platformResult:result})]);
  return { conversationId:conv.id, autoReplied:true, reply };
}
