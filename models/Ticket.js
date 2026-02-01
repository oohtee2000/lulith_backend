const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    senderType: {
      type: String,
      enum: ["user", "staff"], // user = ticket creator, staff = assigned admin
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for ticket creator (not logged in)
    },

    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const ticketSchema = new mongoose.Schema(
  {
    fullName: String,
    email: String,
    phone: String,
    location: String,
    department: String,
    category: String,
    subCategory: String,
    title: String,
    description: String,

    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed"],
      default: "Open",
    },

    trackingToken: {
      type: String,
      unique: true,
      index: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    image: String,

    // 💬 COMMENTS
    comments: [commentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);
