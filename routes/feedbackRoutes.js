const express = require("express");
const router = express.Router();
const Feedback = require("../models/Feedback");


router.post("/add", async (req, res) => {
  try {
    const { userId, rating, message } = req.body;

    if (!userId || !rating) {
      return res.status(400).json({ success: false, message: "UserId and rating are required" });
    }

    const feedback = new Feedback({
      userId,
      rating,
      message
    });

    await feedback.save();

    res.json({
      success: true,
      message: "Feedback submitted successfully"
    });

  } catch (error) {
    console.error("Feedback Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
