const payoutService = require('../services/payout.service');

// Get vendor payout statistics
const getVendorPayoutStats = async (req, res) => {
  try {
    const { vendor_id } = req.params;

    const vendorId = Number(vendor_id);
    if (isNaN(vendorId)) {
      return res.status(400).json({ 
        error: "Invalid vendor ID" 
      });
    }

    const stats = await payoutService.getVendorPayoutStats(vendorId);

    return res.status(200).json({
      message: "Payout statistics retrieved successfully",
      ...stats
    });

  } catch (error) {
    console.error("Error in getVendorPayoutStats controller:", error);
    
    if (error.message === "Vendor not found") {
      return res.status(404).json({ 
        message: "Vendor not found", 
        error: error.message 
      });
    }

    if (error.message === "Vendor wallet not found") {
      return res.status(404).json({ 
        message: "Vendor wallet not found", 
        error: error.message 
      });
    }

    return res.status(500).json({ 
      message: "Failed to retrieve payout statistics", 
      error: error.message 
    });
  }
};

// Get vendor payout history
const getVendorPayoutHistory = async (req, res) => {
  try {
    const { vendor_id } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const vendorId = Number(vendor_id);
    if (isNaN(vendorId)) {
      return res.status(400).json({ 
        error: "Invalid vendor ID" 
      });
    }

    const result = await payoutService.getVendorPayoutHistory(vendorId, {
      page,
      limit,
      status
    });

    return res.status(200).json({
      message: "Payout history retrieved successfully",
      ...result
    });

  } catch (error) {
    console.error("Error in getVendorPayoutHistory controller:", error);
    return res.status(500).json({ 
      message: "Failed to retrieve payout history", 
      error: error.message 
    });
  }
};

// Create payout request
const createPayoutRequest = async (req, res) => {
  try {
    const { vendor_id } = req.params;
    const { amount, reason } = req.body;

    if (!amount) {
      return res.status(400).json({ 
        error: "Amount is required" 
      });
    }

    const vendorId = Number(vendor_id);
    if (isNaN(vendorId)) {
      return res.status(400).json({ 
        error: "Invalid vendor ID" 
      });
    }

    const payoutRequest = await payoutService.createPayoutRequest(vendorId, amount, reason);

    return res.status(201).json({
      message: "Payout request created successfully",
      payoutRequest
    });

  } catch (error) {
    console.error("Error in createPayoutRequest controller:", error);
    
    if (error.message === "Vendor not found") {
      return res.status(404).json({ 
        message: "Vendor not found", 
        error: error.message 
      });
    }

    if (error.message === "Vendor wallet not found") {
      return res.status(404).json({ 
        message: "Vendor wallet not found", 
        error: error.message 
      });
    }

    if (error.message === "Insufficient balance") {
      return res.status(400).json({ 
        message: "Insufficient balance", 
        error: error.message 
      });
    }

    if (error.message === "You already have a pending payout request") {
      return res.status(400).json({ 
        message: "You already have a pending payout request", 
        error: error.message 
      });
    }

    return res.status(500).json({ 
      message: "Failed to create payout request", 
      error: error.message 
    });
  }
};

// Get payout request by ID
const getPayoutRequestById = async (req, res) => {
  try {
    const { payout_id } = req.params;

    const payoutId = Number(payout_id);
    if (isNaN(payoutId)) {
      return res.status(400).json({ 
        error: "Invalid payout ID" 
      });
    }

    const payoutRequest = await payoutService.getPayoutRequestById(payoutId);

    if (!payoutRequest) {
      return res.status(404).json({ 
        error: "Payout request not found" 
      });
    }

    return res.status(200).json({
      message: "Payout request retrieved successfully",
      payoutRequest
    });

  } catch (error) {
    console.error("Error in getPayoutRequestById controller:", error);
    return res.status(500).json({ 
      message: "Failed to retrieve payout request", 
      error: error.message 
    });
  }
};

// Update payout request status (admin only)
const updatePayoutRequestStatus = async (req, res) => {
  try {
    const { payout_id } = req.params;
    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({ 
        error: "Status is required" 
      });
    }

    const payoutId = Number(payout_id);
    if (isNaN(payoutId)) {
      return res.status(400).json({ 
        error: "Invalid payout ID" 
      });
    }

    const updatedPayoutRequest = await payoutService.updatePayoutRequestStatus(payoutId, status, reason);

    return res.status(200).json({
      message: "Payout request status updated successfully",
      payoutRequest: updatedPayoutRequest
    });

  } catch (error) {
    console.error("Error in updatePayoutRequestStatus controller:", error);
    
    if (error.message === "Payout request not found") {
      return res.status(404).json({ 
        message: "Payout request not found", 
        error: error.message 
      });
    }

    if (error.message === "Payout request is not pending") {
      return res.status(400).json({ 
        message: "Payout request is not pending", 
        error: error.message 
      });
    }

    if (error.message === "Insufficient wallet balance") {
      return res.status(400).json({ 
        message: "Insufficient wallet balance", 
        error: error.message 
      });
    }

    if (error.message.includes("Invalid status")) {
      return res.status(400).json({ 
        message: "Invalid status", 
        error: error.message 
      });
    }

    return res.status(500).json({ 
      message: "Failed to update payout request status", 
      error: error.message 
    });
  }
};

module.exports = {
  getVendorPayoutStats,
  getVendorPayoutHistory,
  createPayoutRequest,
  getPayoutRequestById,
  updatePayoutRequestStatus
};

