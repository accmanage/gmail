import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";

export async function queueNotification(userId: number | null, title: string, body: string, channel: "telegram" | "whatsapp" | "system" = "system") {
  return prisma.notification.create({
    data: {
      userId,
      title,
      body,
      channel,
      status: channel === "whatsapp" ? "queued_provider_pending" : "queued"
    }
  });
}

export async function sendTelegram(chatId: string, text: string) {
  if (!env.TELEGRAM_BOT_TOKEN) return { skipped: true };
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });
  if (!response.ok) throw new Error(`Telegram send failed: ${response.status}`);
  return response.json();
}
