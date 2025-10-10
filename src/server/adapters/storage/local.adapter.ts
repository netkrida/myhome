/**
 * Local Storage Adapter
 * Stores files on local filesystem (VPS/Docker volume)
 */

import type { StorageAdapter, UploadResult } from "./index";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

export class LocalStorageAdapter implements StorageAdapter {
  private baseDir: string;
  private publicBaseUrl: string;

  constructor() {
    // Base directory for uploads (should be mounted as Docker volume)
    this.baseDir = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "public", "uploads", "avatars");
    
    // Public URL base (served by Next.js static or Nginx)
    this.publicBaseUrl = process.env.UPLOAD_BASE_URL ?? "/uploads/avatars";
  }

  async uploadAvatar(params: {
    userId: string;
    file: Buffer;
    filename: string;
    mime: string;
  }): Promise<UploadResult> {
    const { userId, file, filename } = params;

    // Generate safe filename
    const ext = path.extname(filename || "").toLowerCase() || ".jpg";
    const safeFilename = `${userId}-${randomUUID()}${ext}`;

    // Ensure directory exists
    fs.mkdirSync(this.baseDir, { recursive: true });

    // Full path
    const fullPath = path.join(this.baseDir, safeFilename);

    // Write file
    fs.writeFileSync(fullPath, file);

    // Return public URL
    const url = `${this.publicBaseUrl}/${safeFilename}`;

    return {
      url,
      path: fullPath,
    };
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      // Don't throw, just log
    }
  }
}

