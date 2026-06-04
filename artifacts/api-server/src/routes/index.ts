import { Router, type IRouter } from "express";
import healthRouter from "./health";
import notificationsRouter from "./notifications";
import syncRouter from "./sync";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/notifications", notificationsRouter);
router.use("/sync", syncRouter);

export default router;
