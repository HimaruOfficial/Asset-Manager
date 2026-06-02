import { Router } from "express";

const router = Router();

// ─── Google Sheets Sync Layer ─────────────────────────────────────────────────
//
// To connect your Google Sheets database, set these environment variables:
//
//   GOOGLE_SHEETS_ID         — The ID from your sheet's URL:
//                              docs.google.com/spreadsheets/d/<SHEET_ID>/edit
//
//   GOOGLE_SHEETS_WEBHOOK_URL — A webhook URL (e.g. from Google Apps Script)
//                               that accepts POST requests to sync data.
//                               The app will POST { event, payload } to it.
//
//   GOOGLE_SHEETS_API_KEY    — Google Sheets API key for direct read access.
//
// Example Apps Script webhook handler (paste in your Google Sheet's script editor):
//   function doPost(e) {
//     const data = JSON.parse(e.postData.contents);
//     const sheet = SpreadsheetApp.openById('<YOUR_SHEET_ID>').getSheetByName(data.event);
//     if (sheet) sheet.appendRow(Object.values(data.payload));
//     return ContentService.createTextOutput('ok');
//   }
// ─────────────────────────────────────────────────────────────────────────────

// ─── Telegram Bot Integration ─────────────────────────────────────────────────
//
// Set these environment variables to enable Telegram notifications:
//
//   TELEGRAM_BOT_TOKEN      — Your bot token from @BotFather on Telegram
//   TELEGRAM_ADMIN_CHAT_ID  — (Optional) Admin's chat ID for registration alerts
//
// To get your Chat ID: message @userinfobot on Telegram.
// ─────────────────────────────────────────────────────────────────────────────

const TELEGRAM_TOKEN = process.env["TELEGRAM_BOT_TOKEN"];
const ADMIN_CHAT_ID = process.env["TELEGRAM_ADMIN_CHAT_ID"];
const SHEETS_WEBHOOK = process.env["GOOGLE_SHEETS_WEBHOOK_URL"];

async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  if (!TELEGRAM_TOKEN) {
    return false;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
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
  if (!SHEETS_WEBHOOK) return;
  try {
    await fetch(SHEETS_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, payload }),
    });
  } catch {
    // Non-critical
  }
}

// POST /api/notifications/transaction
// Called when a user logs a transaction — sends Telegram message + syncs to Sheets
router.post("/transaction", async (req, res) => {
  const { username, telegramChatId, type, formattedAmount, description, category } = req.body as {
    username?: string;
    telegramChatId?: string;
    type?: string;
    formattedAmount?: string;
    description?: string;
    category?: string;
  };

  if (!username || !type || !formattedAmount) {
    res.status(400).json({ error: "Missing required fields: username, type, formattedAmount" });
    return;
  }

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

  const results: Record<string, boolean> = {};

  if (telegramChatId) {
    results.userNotified = await sendTelegramMessage(telegramChatId, message);
  }
  if (ADMIN_CHAT_ID) {
    results.adminNotified = await sendTelegramMessage(ADMIN_CHAT_ID, message);
  }

  await syncToSheets("transactions", req.body as Record<string, unknown>);
  results.sheetsSynced = !!SHEETS_WEBHOOK;

  res.json({ success: true, results });
});

// POST /api/notifications/register
// Called on new user registration — alerts admin + syncs to Sheets
router.post("/register", async (req, res) => {
  const { username, displayName, email } = req.body as {
    username?: string;
    displayName?: string;
    email?: string;
  };

  if (!username || !displayName) {
    res.status(400).json({ error: "Missing required fields: username, displayName" });
    return;
  }

  const message = [
    `🎉 <b>New User Registered</b>`,
    ``,
    `👤 @${username} (${displayName})`,
    `📧 ${email ?? "—"}`,
    `🕐 ${new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`,
    ``,
    `ℹ️ Verify their badge in the admin panel.`,
  ].join("\n");

  const results: Record<string, boolean> = {};

  if (ADMIN_CHAT_ID) {
    results.adminNotified = await sendTelegramMessage(ADMIN_CHAT_ID, message);
  }

  await syncToSheets("users", req.body as Record<string, unknown>);
  results.sheetsSynced = !!SHEETS_WEBHOOK;

  res.json({ success: true, results });
});

// POST /api/notifications/telegram/test
// Test your Telegram bot setup — sends a test message to a given chat ID
router.post("/telegram/test", async (req, res) => {
  const { chatId } = req.body as { chatId?: string };
  if (!chatId) {
    res.status(400).json({ error: "chatId is required" });
    return;
  }
  const sent = await sendTelegramMessage(
    chatId,
    "✅ <b>FinTrack Telegram bot connected!</b>\n\nYou'll receive notifications here whenever you log a transaction.",
  );
  res.json({ success: sent, tokenConfigured: !!TELEGRAM_TOKEN });
});

export default router;
