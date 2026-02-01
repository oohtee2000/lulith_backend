const Ticket = require("../models/Ticket");
const fs = require("fs");
const transporter = require("../config/mail");
const path = require("path");
const mongoose = require("mongoose");
const crypto = require("crypto");

const trackingToken = crypto.randomBytes(32).toString("hex");
const frontendBaseUrl =  "http://localhost:3000";


// CREATE TICKET
exports.createTicket = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      location,
      department,
      category,
      subCategory,
      title,
      description,
    } = req.body;

    if (!fullName || !email || !phone || !location || !title) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const imagePath = req.file ? `/uploads/${req.file.filename}` : undefined;

    // ✅ Generate unique tracking token PER ticket
    const trackingToken = crypto.randomBytes(32).toString("hex");

    const ticket = await Ticket.create({
      fullName,
      email,
      phone,
      location,
      department,
      category,
      subCategory,
      title,
      description,
      image: imagePath,
      trackingToken,
    });

    const trackingLink = `${frontendBaseUrl}/track/${trackingToken}`;

    // 📧 EMAIL
    await transporter.sendMail({
      to: email,
      subject: "Your support ticket has been received",
      template: "ticket-created-user",
      context: {
        name: fullName,
        title,
        description,
        department,
        trackingLink,
      },
    });

    res.status(201).json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// exports.trackTicket = async (req, res) => {
//   try {
//     const { token } = req.params;

//     const ticket = await Ticket.findOne({ trackingToken: token })
//       .populate("assignedTo", "name email role");

//     if (!ticket) {
//       return res.status(404).json({ message: "Invalid or expired tracking link" });
//     }

//     res.json(ticket);
//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

exports.trackTicket = async (req, res) => {
  try {
    const { trackingToken } = req.params;

    const ticket = await Ticket.findOne({ trackingToken })
      .populate("assignedTo", "name email role")
      .populate("comments.sender", "name email role");

    if (!ticket) {
      return res.status(404).json({ message: "Invalid or expired tracking link" });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};



// VIEW ALL TICKETS
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find().populate("assignedTo", "name email role");
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// VIEW TICKET BY ID
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate("assignedTo", "name email role");
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// VIEW TICKETS BY EMAIL
exports.getTicketsByEmail = async (req, res) => {
  try {
    const tickets = await Ticket.find({ email: req.params.email }).populate("assignedTo", "name email role");
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ASSIGN TICKET
exports.assignTicket = async (req, res) => {
  try {
    const { userId } = req.body;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { assignedTo: userId },
      { new: true } // returns updated document
    ).populate("assignedTo", "name email role");

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    res.json({ message: "Ticket assigned", ticket });
  } catch (error) {
    console.error("Assign ticket error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// UNASSIGN TICKET
exports.unassignTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.assignedTo = null;
    await ticket.save();

    res.json({ message: "Ticket unassigned", ticket });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE SINGLE TICKET
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    // Delete image if exists
    if (ticket.image) {
      const imagePath = path.join(__dirname, "../public", ticket.image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await ticket.remove();
    res.json({ message: "Ticket deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE MULTIPLE TICKETS (by IDs)
exports.deleteTickets = async (req, res) => {
  try {
    const { ids } = req.body; // array of ticket IDs
    const tickets = await Ticket.find({ _id: { $in: ids } });

    tickets.forEach((ticket) => {
      if (ticket.image) {
        const imagePath = path.join(__dirname, "../public", ticket.image);
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }
    });

    await Ticket.deleteMany({ _id: { $in: ids } });
    res.json({ message: "Tickets deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// CHANGE TICKET STATUS
exports.changeTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Open", "In Progress", "Resolved", "Closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.status = status;
    await ticket.save();

    res.json({ message: "Status updated", ticket });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// DASHBOARD METRICS
exports.getTicketMetrics = async (req, res) => {
  try {
    const totalTickets = await Ticket.countDocuments();

    // Tickets resolved monthly
    const monthlyResolved = await Ticket.aggregate([
      { $match: { status: "Resolved" } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    // Department breakdown
    const departmentBreakdown = await Ticket.aggregate([
      { $group: { _id: "$department", count: { $sum: 1 } } },
    ]);

    // Time distribution (tickets created per hour)
    const timeDistribution = await Ticket.aggregate([
      {
        $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    res.json({
      totalTickets,
      monthlyResolved,
      departmentBreakdown,
      timeDistribution,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.addCommentByTracker = async (req, res) => {
  try {
    const { trackingToken } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Comment is required" });
    }

    const ticket = await Ticket.findOne({ trackingToken });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    ticket.comments.push({
      senderType: "user",
      message,
    });

    await ticket.save();

    res.json({ message: "Comment added", comments: ticket.comments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.addCommentByStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Comment is required" });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    ticket.comments.push({
      senderType: "staff",
      sender: req.user._id,
      message,
    });

    await ticket.save();

    res.json({ message: "Reply sent", comments: ticket.comments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
