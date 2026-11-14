import OpenAI from 'openai';
import { pool } from '../db/pool.js';
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'not-configured' });

export async function draftReply(conversationId:string, incomingText:string):Promise<string> {
  if (!process.env.OPENAI_API_KEY) return "Thanks for contacting us. A support agent will follow up shortly.";
  const { rows } = await pool.query(
    `SELECT m.direction,m.body FROM messages m WHERE m.conversation_id=$1 ORDER BY m.created_at DESC LIMIT 12`,
    [conversationId]
  );
  const history = rows.reverse().map((m:any)=>`${m.direction === 'inbound' ? 'Customer' : 'Support'}: ${m.body}`).join('\n');
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    instructions: `You are a careful, friendly customer-support assistant. Answer only using information actually available in the conversation. Never invent policies, prices, order status, refunds, delivery dates, or account facts. If the customer asks for a sensitive action, refund, complaint escalation, legal/medical/financial advice, or something you cannot verify, politely say a human agent will help. Keep replies concise. Do not claim an action was completed unless a connected tool confirms it.`,
    input: `Conversation history:\n${history}\n\nLatest customer message: ${incomingText}`
  });
  return response.output_text?.trim() || "Thanks for your message. A human support agent will follow up.";
}
