import { Router } from "express";

const router = Router();

// Shared helper — throws on any failure so callers can return 500
async function syncToSheets(event: string, payload: Record<string, unknown>): Promise<void> {
  const webhook = process.env["GOOGLE_SHEETS_WEBHOOK_URL"];
  if (!webhook) {
    throw new Error("[Sheets] GOOGLE_SHEETS_WEBHOOK_URL is not set in environment variables.");
  }

  console.log(`[Sheets] Sending to webhook — event: "${event}", payload:`, payload);

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, payload }),
  });

  const responseText = await res.text();

  if (!res.ok) {
    throw new Error(
      `[Sheets] Webhook returned HTTP ${res.status} for event "${event}". Body: ${responseText}`,
    );
  }

  console.log(`[Sheets] Webhook succeeded for event "${event}". Response: ${responseText}`);
}

// ─── POST /api/sync/goal ──────────────────────────────────────────────────────
// Syncs a new or updated savings goal to the "savings_goals" sheet.
// Sheet columns (A→F): id, username, goal_name, target_amount, current_amount, deadline
router.post("/goal", async (req, res) => {
  const { username, goal_name, target_amount, current_amount, deadline } = req.body as {
    username?: string;
    goal_name?: string;
    target_amount?: number;
    current_amount?: number;
    deadline?: string;
  };

  if (!username || !goal_name || target_amount == null) {
    res.status(400).json({ error: "Missing required fields: username, goal_name, target_amount" });
    return;
  }

  // Payload order matches sheet columns A→F exactly
  const sheetsPayload: Record<string, unknown> = {
    id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    username,
    goal_name,
    target_amount,
    current_amount: current_amount ?? 0,
    deadline: deadline ?? "",
  };

  try {
    await syncToSheets("savings_goals", sheetsPayload);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Sync/Goal] Google Sheets sync failed:", msg);
    res.status(500).json({ error: "Google Sheets sync failed", detail: msg });
    return;
  }

  res.json({ success: true, sheetsSynced: true });
});

// ─── POST /api/sync/notification ─────────────────────────────────────────────
// Syncs a notification entry to the "notifications" sheet.
// Sheet columns (A→E): id, target_username, message, is_read, created_at
router.post("/notification", async (req, res) => {
  const { target_username, message, is_read } = req.body as {
    target_username?: string;
    message?: string;
    is_read?: boolean;
  };

  if (!target_username || !message) {
    res.status(400).json({ error: "Missing required fields: target_username, message" });
    return;
  }

  const sheetsPayload: Record<string, unknown> = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    target_username,
    message,
    is_read: is_read ?? false,
    created_at: new Date().toISOString(),
  };

  try {
    await syncToSheets("notifications", sheetsPayload);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Sync/Notification] Google Sheets sync failed:", msg);
    res.status(500).json({ error: "Google Sheets sync failed", detail: msg });
    return;
  }

  res.json({ success: true, sheetsSynced: true });
});

export default router;
