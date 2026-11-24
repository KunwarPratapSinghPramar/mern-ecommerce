import { Request, Response } from "express";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

const uploadToCloudinary = (
  buffer: Buffer,
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "mern-ecommerce/products",
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Image upload failed"));
          return;
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      },
    );

    Readable.from(buffer).pipe(stream);
  });
};

export const uploadProductImages = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({ message: "Please select at least one image" });
      return;
    }

    const results = await Promise.all(
      req.files.map((file) => uploadToCloudinary(file.buffer)),
    );

    res.status(200).json({
      message: "Images uploaded successfully",
      images: results,
    });
  } catch (error) {
    res.status(500).json({
      message: "Image upload failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
