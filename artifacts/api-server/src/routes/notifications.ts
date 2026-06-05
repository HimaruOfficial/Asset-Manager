import { Router } from "express";
import { registerUser } from "../lib/user-store.js";

const router = Router();

async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    const json = (await res.json()) as { ok: boolean };
    return json.ok;
  } catch {
    return false;
  }
}

async function syncToSheets(event: string, payload: Record<string, unknown>): Promise<void> {
  const webhook = process.env["GOOGLE_SHEETS_WEBHOOK_URL"];
  if (!webhook) {
    throw new Error("[Sheets] GOOGLE_SHEETS_WEBHOOK_URL is not set in environment variables.");
  }
  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, payload }),
  });
  const responseText = await res.text();
  if (!res.ok) {
    throw new Error(`[Sheets] Webhook returned HTTP ${res.status} for event "${event}". Body: ${responseText}`);
  }
}

// POST /api/notifications/transaction
router.post("/transaction", async (req, res) => {
  const { username, telegramChatId, type, formattedAmount, description, category } = req.body as {
    username?: string; telegramChatId?: string; type?: string;
    formattedAmount?: string; description?: string; category?: string;
  };

  if (!username || !type || !formattedAmount) {
    res.status(400).json({ error: "Missing required fields: username, type, formattedAmount" });
    return;
  }

  const adminChatId = process.env["TELEGRAM_ADMIN_CHAT_ID"];
  const emoji = type === "income" ? "💚" : "🔴";
  const typeLabel = type === "income" ? "Income" : "Expense";
  const message = [
    `${emoji} <b>New ${typeLabel} Logged</b>`,
    ``,
    `👤 <b>@${username}</b>`,
    `💰 Amount: <b>${formattedAmount}</b>`,
    `📁 Category: ${category ?? "—"}`,
    `📝 Note: ${description ?? "—"}`,
    `🕐 ${new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`,
  ].join("\n");

  const results: Record<string, unknown> = {};
  if (telegramChatId) results.userNotified = await sendTelegramMessage(telegramChatId, message);
  if (adminChatId) results.adminNotified = await sendTelegramMessage(adminChatId, message);

  const txPayload: Record<string, unknown> = {
    id: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    username, type,
    amount: (req.body as Record<string, unknown>)["amount"] ?? 0,
    category: category ?? "",
    date: (req.body as Record<string, unknown>)["date"] ?? new Date().toISOString(),
    notes: description ?? "",
  };

  try {
    await syncToSheets("transactions", txPayload);
    results.sheetsSynced = true;
  } catch (err) {
    results.sheetsSynced = false;
    results.sheetsSyncError = err instanceof Error ? err.message : String(err);
  }

  res.json({ success: true, results });
});

// POST /api/notifications/register
router.post("/register", async (req, res) => {
  const { username, displayName, email } = req.body as {
    username?: string; displayName?: string; email?: string;
  };

  if (!username || !displayName) {
    res.status(400).json({ error: "Missing required fields: username, displayName" });
    return;
  }

  // Register in the server-side user store (source of truth for tier upgrades)
  registerUser(username, displayName, email ?? "");

  const adminChatId = process.env["TELEGRAM_ADMIN_CHAT_ID"];
  const regMessage = [
    `🎉 <b>New User Registered</b>`,
    ``,
    `👤 @${username} (${displayName})`,
    `📧 ${email ?? "—"}`,
    `🕐 ${new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`,
    ``,
    `ℹ️ Use <code>/upgrade ${username} pro</code> to grant Pro Blue.`,
  ].join("\n");

  if (adminChatId) await sendTelegramMessage(adminChatId, regMessage);

  // Also sync to Sheets if configured
  const sheetsPayload: Record<string, unknown> = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    nama: displayName, email: email ?? "",
    tier: "Basic", badge_type: "New Member",
    created_at: new Date().toISOString(),
  };

  try {
    await syncToSheets("users", sheetsPayload);
  } catch {/* non-critical if Sheets not configured */}

  res.json({ success: true });
});

// POST /api/notifications/telegram/test
router.post("/telegram/test", async (req, res) => {
  const { chatId } = req.body as { chatId?: string };
  if (!chatId) { res.status(400).json({ error: "chatId is required" }); return; }
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  const sent = await sendTelegramMessage(
    chatId,
    "✅ <b>FinTrack Telegram bot connected!</b>\n\nYou'll receive notifications here whenever you log a transaction.",
  );
  res.json({ success: sent, tokenConfigured: !!token });
});

export default router;
