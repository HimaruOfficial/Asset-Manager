import { Router } from "express";
import { getAllUsers, upgradeUser, type UserTier } from "../lib/user-store.js";

const router = Router();

// GET /api/admin/users — returns all registered users
router.get("/users", (_req, res) => {
  res.json({ success: true, users: getAllUsers() });
});

// POST /api/admin/upgrade — upgrades a user's tier
router.post("/upgrade", async (req, res) => {
  const { username, tier } = req.body as { username?: string; tier?: string };
  if (!username || !tier) {
    res.status(400).json({ success: false, error: "username and tier are required" });
    return;
  }

  let badge_type: string;
  let normalizedTier: UserTier;

  switch (tier.toLowerCase()) {
    case "pro_blue":
      normalizedTier = "pro_blue";
      badge_type = "Verified Blue";
      break;
    case "pro_purple":
      normalizedTier = "pro_purple";
      badge_type = "Verified Purple";
      break;
    case "basic":
      normalizedTier = "basic";
      badge_type = "New Member";
      break;
    default:
      res.status(400).json({ success: false, error: "tier must be pro_blue, pro_purple, or basic" });
      return;
  }

  upgradeUser(username.replace(/^@/, ""), normalizedTier, badge_type);

  // Fire-and-forget: also sync to Google Sheets if configured
  const webhook = process.env["GOOGLE_SHEETS_WEBHOOK_URL"];
  if (webhook) {
    fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "users", action: "update", target_username: username, new_tier: badge_type, new_badge: badge_type }),
    }).catch(() => {/* non-critical */});
  }

  res.json({ success: true, username, tier: normalizedTier, badge_type });
});

export default router;
