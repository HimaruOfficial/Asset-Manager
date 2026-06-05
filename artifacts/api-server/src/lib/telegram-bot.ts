// Telegram Admin Bot — long-polling listener
// Only responds to TELEGRAM_ADMIN_CHAT_ID for security.
// Commands:
//   /upgrade <username> pro       → pro_blue  / Verified Blue
//   /upgrade <username> pro_blue  → pro_blue  / Verified Blue
//   /upgrade <username> purple    → pro_purple / Verified Purple
//   /upgrade <username> pro_purple→ pro_purple / Verified Purple
//   /upgrade <username> basic     → basic     / New Member
//   /list                         → show all registered users

import { getAllUsers, upgradeUser, type UserTier } from "./user-store.js";

interface TelegramUpdate {
  update_id: number;
  message?: {
    chat: { id: number };
    text?: string;
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendAdminMessage(token: string, adminChatId: string, text: string): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: adminChatId, text, parse_mode: "HTML" }),
    });
  } catch (err) {
    console.error("[TelegramBot] Failed to send admin message:", err);
  }
}

async function handleUpgrade(
  token: string,
  adminChatId: string,
  username: string,
  tierArg: string,
): Promise<void> {
  let newTier: UserTier;
  let newBadge: string;

  switch (tierArg.toLowerCase()) {
    case "pro":
    case "pro_blue":
    case "blue":
      newTier = "pro_blue";
      newBadge = "Verified Blue";
      break;
    case "purple":
    case "pro_purple":
      newTier = "pro_purple";
      newBadge = "Verified Purple";
      break;
    case "basic":
      newTier = "basic";
      newBadge = "New Member";
      break;
    default:
      await sendAdminMessage(
        token,
        adminChatId,
        `❓ Unknown tier: <b>${tierArg}</b>.\nUse: <code>pro</code>, <code>purple</code>, or <code>basic</code>.`,
      );
      return;
  }

  // Write directly to the server-side user store (source of truth)
  upgradeUser(username, newTier, newBadge);

  // Also fire-and-forget to Google Sheets if configured (optional sync)
  const webhook = process.env["GOOGLE_SHEETS_WEBHOOK_URL"];
  if (webhook) {
    fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "users",
        action: "update",
        target_username: username,
        new_tier: newBadge,
        new_badge: newBadge,
      }),
    }).catch(() => {/* non-critical */});
  }

  await sendAdminMessage(
    token,
    adminChatId,
    `✅ User <b>@${username}</b> upgraded!\nTier: <b>${newTier}</b> · Badge: <b>${newBadge}</b>\n\n` +
    `The user will see a congratulatory notification next time they open the app.`,
  );
}

async function handleList(token: string, adminChatId: string): Promise<void> {
  const users = getAllUsers();
  if (users.length === 0) {
    await sendAdminMessage(token, adminChatId, "📋 No registered users yet.");
    return;
  }
  const lines = users.map((u) => {
    const emoji = u.tier === "pro_purple" ? "🟣" : u.tier === "pro_blue" ? "🔵" : "⚪";
    return `${emoji} <b>@${u.username}</b> — ${u.badge_type}`;
  });
  await sendAdminMessage(token, adminChatId, `📋 <b>Registered Users (${users.length})</b>\n\n${lines.join("\n")}`);
}

async function handleUpdate(update: TelegramUpdate, token: string, adminChatId: string): Promise<void> {
  const message = update.message;
  if (!message?.text) return;

  const fromChatId = String(message.chat.id);
  if (fromChatId !== adminChatId) return;

  const text = message.text.trim();

  if (text.startsWith("/list")) {
    await handleList(token, adminChatId);
    return;
  }

  if (!text.startsWith("/upgrade")) {
    await sendAdminMessage(
      token,
      adminChatId,
      "🤖 <b>FinTrack Admin Bot</b>\n\nCommands:\n" +
      "<code>/upgrade &lt;username&gt; &lt;pro|purple|basic&gt;</code>\n" +
      "<code>/list</code> — show all users",
    );
    return;
  }

  const parts = text.split(/\s+/);
  if (parts.length < 3) {
    await sendAdminMessage(
      token,
      adminChatId,
      "Usage: <code>/upgrade &lt;username&gt; &lt;pro|purple|basic&gt;</code>\nExample: <code>/upgrade alex pro</code>",
    );
    return;
  }

  // Strip leading @ so "@alex" and "alex" both work
  const username = parts[1]!.replace(/^@/, "");
  const tierArg = parts[2]!;
  await handleUpgrade(token, adminChatId, username, tierArg);
}

async function pollLoop(token: string, adminChatId: string): Promise<void> {
  let offset = 0;
  while (true) {
    try {
      const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=30&allowed_updates=%5B%22message%22%5D`;
      const res = await fetch(url, { signal: AbortSignal.timeout(40_000) });

      if (!res.ok) {
        console.error(`[TelegramBot] getUpdates returned HTTP ${res.status}`);
        await sleep(5_000);
        continue;
      }

      const data = (await res.json()) as { ok: boolean; result: TelegramUpdate[] };
      if (!data.ok) { await sleep(5_000); continue; }

      for (const update of data.result) {
        offset = update.update_id + 1;
        await handleUpdate(update, token, adminChatId);
      }
    } catch (err) {
      console.error("[TelegramBot] Poll loop error:", err);
      await sleep(5_000);
    }
  }
}

export function startTelegramAdminBot(): void {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  const adminChatId = process.env["TELEGRAM_ADMIN_CHAT_ID"];

  if (!token || !adminChatId) {
    console.log("[TelegramBot] TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID not set — admin bot disabled.");
    return;
  }

  console.log("[TelegramBot] Admin bot started. Listening for /upgrade and /list commands...");
  pollLoop(token, adminChatId).catch((err) => {
    console.error("[TelegramBot] Poll loop crashed:", err);
  });
}
