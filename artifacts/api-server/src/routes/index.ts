import { Router, type IRouter } from "express";
import adminRouter from "./admin.js";
import healthRouter from "./health.js";
import notificationsRouter from "./notifications.js";
import profileRouter from "./profile.js";
import syncRouter from "./sync.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/notifications", notificationsRouter);
router.use("/sync", syncRouter);
router.use("/admin", adminRouter);
router.use("/profile", profileRouter);

export default router;
