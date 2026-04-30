import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { protect, adminOnly } from '../middleware/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.post('/', protect, adminOnly, upload.array('images', 10), asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  const uploadPromises = files.map(
    (file) =>
      new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'sterling-jewellers', resource_type: 'auto' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result!.secure_url);
          }
        );
        stream.end(file.buffer);
      })
  );
  const urls = await Promise.all(uploadPromises);
  res.json({ urls });
}));

export default router;
