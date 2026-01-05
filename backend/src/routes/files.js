import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinaryService.js';
import { compressFile } from '../services/compressionService.js';

const router = express.Router();

// Configure Multer for file upload
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    },
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/jpg',
            'image/webp',
            'application/pdf',
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed.'));
        }
    },
});

/**
 * POST /api/files/upload
 * Upload file with optional compression and Cloudinary storage
 */
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const originalFilePath = req.file.path;
        const originalFileName = req.file.originalname;
        const mimeType = req.file.mimetype;

        console.log('File uploaded:', originalFileName, 'Type:', mimeType);

        // Step 1: Optional - Compress file locally (or skip and let Cloudinary handle it)
        const compressionResult = await compressFile(originalFilePath, mimeType);

        // Step 2: Upload to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(
            originalFilePath,
            originalFileName,
            mimeType
        );

        console.log('Upload to Cloudinary complete');

        // Step 3: Clean up local files
        await fs.unlink(originalFilePath).catch(err => console.error('Cleanup error:', err));

        // Step 4: Return file info
        return res.json({
            success: true,
            file: {
                fileName: originalFileName,
                originalSize: compressionResult.originalSize,
                compressedSize: cloudinaryResult.size,
                compressionRatio: compressionResult.compressionRatio,
                fileType: mimeType,
                url: cloudinaryResult.url, // Cloudinary URL
                thumbnailUrl: cloudinaryResult.thumbnailUrl,
                fileId: cloudinaryResult.fileId, // Cloudinary public ID
                uploadedAt: new Date(),
            },
        });
    } catch (error) {
        console.error('Upload error:', error);

        // Clean up on error
        if (req.file && req.file.path) {
            await fs.unlink(req.file.path).catch(() => { });
        }

        return res.status(500).json({
            error: 'File upload failed',
            message: error.message,
        });
    }
});

/**
 * DELETE /api/files/delete/:fileId
 * Delete file from Cloudinary
 */
router.delete('/delete/*', async (req, res) => {
    try {
        // Handling public IDs that might contain slashes
        const fileId = req.params[0];
        const { resourceType } = req.query; // 'image' or 'raw' (for PDFs)

        await deleteFromCloudinary(fileId, resourceType || 'image');

        return res.json({
            success: true,
            message: 'File deleted from Cloudinary'
        });
    } catch (error) {
        console.error('Delete error:', error);
        return res.status(500).json({
            error: 'File deletion failed',
            message: error.message
        });
    }
});

/**
 * GET /api/files/metadata/:fileId
 * Get file metadata from Cloudinary
 */
router.get('/metadata/*', async (req, res) => {
    try {
        const fileId = req.params[0];
        const { resourceType } = req.query;

        const metadata = await getCloudinaryMetadata(fileId, resourceType || 'image');

        return res.json({
            success: true,
            metadata: metadata,
        });
    } catch (error) {
        console.error('Metadata error:', error);
        return res.status(500).json({
            error: 'Failed to get metadata',
            message: error.message,
        });
    }
});

export default router;
