const multer = require("multer");
const path = require("path");

// ✅ Storage Configuration (Local)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save files in "uploads/" directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
  },
});

// ✅ File Type Filter (Only Images Allowed)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPG, PNG, and JPEG are allowed."), false);
  }
};

// ✅ Configure Multer
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
});

// ✅ Exports for Routes
module.exports = {
  uploadSingle: upload.single("file"),
  uploadMultiple: upload.array("files", 10),
  uploadFields: upload.fields([
    { name: "photoid_image", maxCount: 1 }, // Single ID photo
    { name: "selfie_image", maxCount: 1 },  // Single selfie photo
  ]),
};
