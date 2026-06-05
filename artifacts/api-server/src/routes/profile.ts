import { Router } from "express";
import { getUser, markNotified } from "../lib/user-store.js";

const router = Router();

// GET /api/profile/:username — mobile polls this to detect upgrades
router.get("/:username", (req, res) => {
  const username = (req.params["username"] ?? "").replace(/^@/, "").toLowerCase();
  const user = getUser(username);

  if (!user) {
    // Unknown user — return basic defaults so the app doesn't error
    res.json({ success: true, found: false, tier: "basic", badge_type: "New Member", upgradeNotified: true });
    return;
  }

  res.json({
    success: true,
    found: true,
    username: user.username,
    tier: user.tier,
    badge_type: user.badge_type,
    upgradedAt: user.upgradedAt,
    upgradeNotified: user.upgradeNotified,
  });
});

// POST /api/profile/:username/ack — mobile calls this after showing the upgrade notification
router.post("/:username/ack", (req, res) => {
  const username = (req.params["username"] ?? "").replace(/^@/, "").toLowerCase();
  markNotified(username);
  res.json({ success: true });
});

export default router;
