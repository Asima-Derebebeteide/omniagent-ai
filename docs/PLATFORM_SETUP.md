# Platform setup checklist

## WhatsApp Cloud API
1. Create/configure a Meta developer app and WhatsApp Business Platform product.
2. Add a business phone number and obtain its Phone Number ID and access token.
3. Configure webhook callback: `https://YOUR_DOMAIN/api/v1/webhooks/meta`.
4. Set the same verification string in `META_VERIFY_TOKEN`.
5. Subscribe to the required WhatsApp message fields and configure app permissions/review.
6. Add an account with platform `whatsapp`, credentials `accessToken`, config `phoneNumberId`, and external account ID matching the WhatsApp webhook entry ID.
7. Validate current Graph API version and messaging policy in Meta docs before production.

## Instagram
1. Use an eligible Instagram professional account and connect it to the required Meta business/Page setup.
2. Configure the supported Instagram Messaging API product and permissions for the account/app type.
3. Complete Meta app review/advanced access where required.
4. Configure the Meta webhook callback and subscribe to supported messaging events.
5. Store the Instagram access token and Instagram account ID in the account configuration.
6. Test only with accounts and conversations allowed by Meta policy.

## Facebook Messenger
1. Create a Facebook Page and Meta developer app with Messenger product.
2. Obtain a Page access token and request required permissions/review.
3. Subscribe the Page to relevant webhook events.
4. Store Page ID and Page access token.
5. Respect Messenger response windows and policy.

## Telegram
1. Create a bot using `@BotFather`; copy its token.
2. Create a Telegram account record with `credentials.botToken`.
3. Set webhook to `https://YOUR_DOMAIN/api/v1/webhooks/telegram/ACCOUNT_UUID`.
4. Configure a random webhook secret and implement/check the `X-Telegram-Bot-Api-Secret-Token` header before public deployment.
5. Use `getWebhookInfo` to verify delivery.

## TikTok
This repository does not implement arbitrary TikTok DM automation. Check TikTok for Developers and the products/permissions available to your business and region. Only implement a messaging adapter if TikTok officially grants the exact required messaging capability. Do not scrape, automate the consumer app UI, or use unofficial private endpoints.
