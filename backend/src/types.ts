export type Platform = 'whatsapp'|'instagram'|'telegram'|'tiktok'|'facebook';
export type IncomingMessage = {
  platform: Platform; accountId: string; externalAccountId?: string;
  senderId: string; senderName?: string; threadId?: string;
  messageId: string; text: string; raw?: unknown;
};
