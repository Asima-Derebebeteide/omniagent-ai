import type { Platform } from '../types.js';

async function jsonPost(url:string, token:string, body:unknown) {
  const r = await fetch(url,{method:'POST',headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data:any = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(`Platform API ${r.status}: ${JSON.stringify(data)}`);
  return data;
}

export async function sendPlatformMessage(platform:Platform, credentials:any, recipientId:string, text:string, config:any={}) {
  switch(platform) {
    case 'whatsapp':
      if (!credentials.accessToken || !config.phoneNumberId) throw new Error('WhatsApp account needs accessToken and phoneNumberId');
      return jsonPost(`https://graph.facebook.com/${process.env.META_GRAPH_API_VERSION || 'v23.0'}/${config.phoneNumberId}/messages`,credentials.accessToken,{
        messaging_product:'whatsapp',to:recipientId,type:'text',text:{body:text}
      });
    case 'instagram':
      if (!credentials.accessToken || !config.instagramAccountId) throw new Error('Instagram account needs accessToken and instagramAccountId');
      return jsonPost(`https://graph.facebook.com/${process.env.META_GRAPH_API_VERSION || 'v23.0'}/${config.instagramAccountId}/messages`,credentials.accessToken,{
        recipient:{id:recipientId},message:{text}
      });
    case 'facebook':
      if (!credentials.accessToken || !config.pageId) throw new Error('Facebook account needs accessToken and pageId');
      return jsonPost(`https://graph.facebook.com/${process.env.META_GRAPH_API_VERSION || 'v23.0'}/${config.pageId}/messages`,credentials.accessToken,{
        recipient:{id:recipientId},messaging_type:'RESPONSE',message:{text}
      });
    case 'telegram':
      if (!credentials.botToken) throw new Error('Telegram account needs botToken');
      return jsonPost(`https://api.telegram.org/bot${credentials.botToken}/sendMessage`,'', {chat_id:recipientId,text});
    case 'tiktok':
      throw new Error('TikTok general-purpose DM sending is not available in this connector. Use only an approved TikTok API product explicitly granting this capability.');
  }
}
