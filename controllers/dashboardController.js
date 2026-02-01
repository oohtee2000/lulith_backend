const Ticket = require("../models/Ticket");
const User = require("../models/User");
const mongoose = require("mongoose");

// GET DASHBOARD METRICS
exports.getDashboardMetrics = async (req, res) => {
  try {
    // ----- Ticket Metrics -----
    const totalTickets = await Ticket.countDocuments();
    const openTickets = await Ticket.countDocuments({ status: "Open" });
    const inProgressTickets = await Ticket.countDocuments({ status: "In Progress" });
    const resolvedTickets = await Ticket.countDocuments({ status: "Resolved" });
    const closedTickets = await Ticket.countDocuments({ status: "Closed" });

    // Tickets created per month (last 12 months)
    const monthlyTickets = await Ticket.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    // Tickets per department
    const ticketsByDepartment = await Ticket.aggregate([
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
        },
      },
    ]);

    // Tickets per category
    const ticketsByCategory = await Ticket.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    // Tickets per staff
    const ticketsPerStaff = await Ticket.aggregate([
      { $match: { assignedTo: { $ne: null } } },
      {
        $group: {
          _id: "$assignedTo",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "staff",
        },
      },
      { $unwind: "$staff" },
      {
        $project: {
          _id: 0,
          staffName: "$staff.name",
          email: "$staff.email",
          count: 1,
        },
      },
    ]);

    // ----- User Metrics -----
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalAdmins = await User.countDocuments({ role: "admin" });
    const totalSuperAdmins = await User.countDocuments({ role: "super_admin" });

    // ----- Comments Metrics -----
    const ticketsWithComments = await Ticket.aggregate([
      { $unwind: "$comments" },
      {
        $group: {
          _id: "$_id",
          totalComments: { $sum: 1 },
        },
      },
      { $sort: { totalComments: -1 } },
      { $limit: 5 }, // top 5 tickets with most comments
    ]);

    res.json({
      tickets: {
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        closedTickets,
        monthlyTickets,
        ticketsByDepartment,
        ticketsByCategory,
        ticketsPerStaff,
        ticketsWithComments,
      },
      users: {
        totalUsers,
        totalAdmins,
        totalSuperAdmins,
      },
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
