import { NextRequest, NextResponse } from "next/server";
import multer from "multer";
import path from "path";
import fs from "fs";

// ✅ Ensure `public/uploads/` exists
const uploadDir = path.join(process.cwd(), "public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

export async function POST(req: NextRequest) {
  return new Promise((resolve, reject) => {
    upload.single("image")(req as any, {} as any, (err: any) => {
      if (err) {
        reject(NextResponse.json({ error: "Upload failed" }, { status: 500 }));
      }
      resolve(NextResponse.json({ url: `/uploads/${req.file?.filename}` }, { status: 201 }));
    });
  });
}
