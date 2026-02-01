const express = require("express");
const router = express.Router();

const multer = require("multer");
const path = require("path");

const ticketController = require("../controllers/ticketController");
const authMiddleware = require("../middleware/authMiddleware");

// File upload config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// TICKET ROUTES
router.post("/tickets", upload.single("image"), ticketController.createTicket);
router.get("/tickets", authMiddleware, ticketController.getAllTickets);
router.get("/tickets/:id", authMiddleware, ticketController.getTicketById);
router.get("/tickets/email/:email", authMiddleware, ticketController.getTicketsByEmail);
router.get("/tickets/track/:trackingToken", ticketController.trackTicket);

router.put("/tickets/assign/:id", authMiddleware, ticketController.assignTicket);
router.put("/tickets/unassign/:id", authMiddleware, ticketController.unassignTicket);
router.put("/tickets/status/:id", authMiddleware, ticketController.changeTicketStatus);


router.delete("/tickets/:id", authMiddleware, ticketController.deleteTicket);
router.delete("/tickets", authMiddleware, ticketController.deleteTickets); // send { ids: [...] }

// DASHBOARD METRICS
router.get("/tickets/metrics", authMiddleware, ticketController.getTicketMetrics);

// COMMENTS
router.post(
  "/tickets/track/:trackingToken/comment",
  ticketController.addCommentByTracker
);

router.post(
  "/tickets/:id/comment",
  authMiddleware,
  ticketController.addCommentByStaff
);


module.exports = router;
