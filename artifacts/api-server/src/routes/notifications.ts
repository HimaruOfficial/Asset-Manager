import { Router } from "express";

const router = Router();

// ─── Google Sheets Sync Layer ─────────────────────────────────────────────────
//
// To connect your Google Sheets database, set these environment variables:
//
//   GOOGLE_SHEETS_WEBHOOK_URL — A webhook URL (e.g. from Google Apps Script)
//                               that accepts POST requests to sync data.
//                               The app will POST { event, payload } to it.
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

// NOTE: All env vars are read lazily inside functions (not at module load time)
// so that dotenv has already populated process.env before they are accessed.

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

// Throws on any failure so callers can return 500 to the client.
async function syncToSheets(event: string, payload: Record<string, unknown>): Promise<void> {
  const webhook = process.env["GOOGLE_SHEETS_WEBHOOK_URL"];
  if (!webhook) {
    throw new Error("[Sheets] GOOGLE_SHEETS_WEBHOOK_URL is not set in environment variables.");
  }

  let responseText = "";
  try {
    const body = JSON.stringify({ event, payload });
    console.log(`[Sheets] Sending to webhook — event: "${event}", payload:`, payload);

    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    responseText = await res.text();

    if (!res.ok) {
      throw new Error(
        `[Sheets] Webhook returned HTTP ${res.status} for event "${event}". Response body: ${responseText}`,
      );
    }

    console.log(`[Sheets] Webhook succeeded for event "${event}". Response: ${responseText}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Sheets] Sync failed for event "${event}":`, message);
    throw err;
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

  if (telegramChatId) {
    results.userNotified = await sendTelegramMessage(telegramChatId, message);
  }
  if (adminChatId) {
    results.adminNotified = await sendTelegramMessage(adminChatId, message);
  }

  try {
    await syncToSheets("transactions", req.body as Record<string, unknown>);
    results.sheetsSynced = true;
  } catch (err) {
    results.sheetsSynced = false;
    results.sheetsSyncError = err instanceof Error ? err.message : String(err);
  }

  res.json({ success: true, results });
});

// POST /api/notifications/register
// Called on new user registration — alerts admin + syncs to Sheets
router.post("/register", async (req, res) => {
  const { username, displayName, email, password } = req.body as {
    username?: string;
    displayName?: string;
    email?: string;
    password?: string;
  };

  if (!username || !displayName) {
    res.status(400).json({ error: "Missing required fields: username, displayName" });
    return;
  }

  const adminChatId = process.env["TELEGRAM_ADMIN_CHAT_ID"];
  const createdAt = new Date().toISOString();

  const message = [
    `🎉 <b>New User Registered</b>`,
    ``,
    `👤 @${username} (${displayName})`,
    `📧 ${email ?? "—"}`,
    `🕐 ${new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`,
    ``,
    `ℹ️ Verify their badge in the admin panel.`,
  ].join("\n");

  if (adminChatId) {
    await sendTelegramMessage(adminChatId, message);
  }

  // Payload columns match the "users" sheet exactly (A→G):
  // A: id  B: nama  C: email  D: password  E: tier  F: badge_type  G: created_at
  const sheetsPayload: Record<string, unknown> = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    nama: displayName,
    email: email ?? "",
    password: password ?? "",
    tier: "Basic",
    badge_type: "New Member",
    created_at: createdAt,
  };

  try {
    await syncToSheets("users", sheetsPayload);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Register] Google Sheets sync failed:", message);
    res.status(500).json({ error: "Google Sheets sync failed", detail: message });
    return;
  }

  res.json({ success: true, sheetsSynced: true });
});

// POST /api/notifications/telegram/test
// Test your Telegram bot setup — sends a test message to a given chat ID
router.post("/telegram/test", async (req, res) => {
  const { chatId } = req.body as { chatId?: string };
  if (!chatId) {
    res.status(400).json({ error: "chatId is required" });
    return;
  }
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  const sent = await sendTelegramMessage(
    chatId,
    "✅ <b>FinTrack Telegram bot connected!</b>\n\nYou'll receive notifications here whenever you log a transaction.",
  );
  res.json({ success: sent, tokenConfigured: !!token });
});

export default router;
