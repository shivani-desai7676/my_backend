const express = require("express");
const router = express.Router();
const multer = require("multer");
const File = require("../models/File");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const FileShare = require("../models/FileShare");



const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});


router.post("/upload", (req, res) => {

  upload.single("file")(req, res, async (err) => {

    if (err instanceof multer.MulterError) {

      if (err.code === "LIMIT_FILE_SIZE") {

        return res.status(400).json({
          success: false,
          message: "Maximum file size allowed is 50 MB"
        });
      }
    }

    if (err) {

      return res.status(500).json({
        success: false,
        message: err.message
      });
    }

    try {

      const { userId } = req.body;

      const file = await File.create({
        userId,
        filename: req.file.filename,
        filepath: req.file.path
      });

      res.json(file);

    } catch (error) {

      res.status(500).json({
        success: false,
        message: "Upload failed"
      });

    }

  });

});


router.get("/:userId", async (req, res) => {
  try {
    const files = await File.find({ userId: req.params.userId }).sort({ uploadedAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: "Error fetching files" });
  }
});

router.post("/generate-link", async (req, res) => {
  try {

    const { fileId } = req.body;

    if (!fileId) {
      return res.status(400).json({ message: "File ID required" });
    }

    
    const token = crypto.randomBytes(20).toString("hex");

    
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    
    const link = `${process.env.BASE_URL}/api/files/share/${token}`;

   
    const share = await FileShare.create({
      fileId,
      token,
      link,
      expiresAt
    });

    res.json({
      success: true,
      link: share.link
    });

  } catch (err) {

    console.error("Generate Link Error:", err);
    res.status(500).json({ message: "Error generating link" });

  }
});



router.get("/share/:token", async (req, res) => {
  try {
    const { token } = req.params;

const share = await FileShare.findOne({ token }).sort({ createdAt: -1 });
    if (!share) {
      return res.status(404).send("Invalid link");
    }

  if (!share || share.expiresAt < new Date()) {
  return res.status(400).send("Link expired or invalid");
}

    const file = await File.findById(share.fileId);

    if (!file) {
      return res.status(404).send("File not found");
    }

    res.sendFile(path.resolve(file.filepath));

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});





router.delete("/delete/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    
    if (fs.existsSync(file.filepath)) {
      fs.unlinkSync(file.filepath);
    }

    
    await File.findByIdAndDelete(req.params.id);

    res.json({ message: "File deleted successfully ✅" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting file" });
  }
});


router.get("/admin/links", async (req, res) => {
  try {

    const links = await FileShare.find()
      .populate("fileId", "filename userId")
      .sort({ createdAt: -1 });

    res.json(links);

  } catch (err) {

    console.error(err);
    res.status(500).json({ message: "Error fetching links" });

  }
});


router.get("/admin/share-links", async (req, res) => {

  try {

    const links = await FileShare.find()
      .populate({
        path: "fileId",
        select: "filename userId",
        populate: {
          path: "userId",
          select: "name email"
        }
      })
      .sort({ createdAt: -1 });

    res.json(links);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Error fetching share links"
    });

  }

});




module.exports = router;