// Telegram Admin Bot — long-polling listener
// Only responds to TELEGRAM_ADMIN_CHAT_ID for security.
// Supported commands:
//   /upgrade <username> pro     → tier "Pro",   badge "Verified Blue"
//   /upgrade <username> purple  → tier "Pro",   badge "Verified Purple"
//   /upgrade <username> basic   → tier "Basic", badge "New Member"

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
  let newTier: string;
  let newBadge: string;

  switch (tierArg.toLowerCase()) {
    case "pro":
      newTier = "Pro";
      newBadge = "Verified Blue";
      break;
    case "purple":
      newTier = "Pro";
      newBadge = "Verified Purple";
      break;
    case "basic":
      newTier = "Basic";
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

  const webhook = process.env["GOOGLE_SHEETS_WEBHOOK_URL"];
  if (!webhook) {
    await sendAdminMessage(token, adminChatId, "❌ GOOGLE_SHEETS_WEBHOOK_URL is not configured on the server.");
    return;
  }

  try {
    const payload = {
      event: "users",
      action: "update",
      target_username: username,
      new_tier: newTier,
      new_badge: newBadge,
    };
    console.log("[TelegramBot] Sending upgrade to Sheets webhook:", payload);

    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = await res.text();
    let parsed: { success?: boolean } = {};
    try {
      parsed = JSON.parse(body) as { success?: boolean };
    } catch {/* response may not be JSON */}

    if (res.ok && parsed.success) {
      await sendAdminMessage(
        token,
        adminChatId,
        `✅ User <b>@${username}</b> successfully upgraded!\nTier: <b>${newTier}</b> · Badge: <b>${newBadge}</b>`,
      );
    } else {
      console.error(`[TelegramBot] Upgrade webhook failed — HTTP ${res.status}: ${body}`);
      await sendAdminMessage(
        token,
        adminChatId,
        `❌ Upgrade failed for <b>@${username}</b>.\nWebhook responded with HTTP ${res.status}:\n<code>${body}</code>`,
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[TelegramBot] Upgrade error:", msg);
    await sendAdminMessage(token, adminChatId, `❌ Error upgrading <b>@${username}</b>:\n<code>${msg}</code>`);
  }
}

async function handleUpdate(update: TelegramUpdate, token: string, adminChatId: string): Promise<void> {
  const message = update.message;
  if (!message?.text) return;

  const fromChatId = String(message.chat.id);

  // Security: silently ignore any non-admin sender
  if (fromChatId !== adminChatId) {
    console.log(`[TelegramBot] Ignored message from non-admin chat ID: ${fromChatId}`);
    return;
  }

  const text = message.text.trim();

  if (!text.startsWith("/upgrade")) {
    await sendAdminMessage(
      token,
      adminChatId,
      "🤖 <b>FinTrack Admin Bot</b>\n\nAvailable commands:\n<code>/upgrade &lt;username&gt; &lt;pro|purple|basic&gt;</code>",
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

  const username = parts[1]!;
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

      if (!data.ok) {
        console.error("[TelegramBot] Telegram API returned ok=false:", data);
        await sleep(5_000);
        continue;
      }

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
    console.log(
      "[TelegramBot] TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID not set — admin bot disabled.",
    );
    return;
  }

  console.log("[TelegramBot] Admin bot started. Listening for /upgrade commands...");

  // Fire-and-forget: runs independently of the HTTP server
  pollLoop(token, adminChatId).catch((err) => {
    console.error("[TelegramBot] Poll loop crashed unexpectedly:", err);
  });
}
