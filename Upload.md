Complete Cloudinary Migration Guide - Replace Google Drive
Overview
Replace Google Drive file upload system with Cloudinary for handling image and PDF uploads with automatic compression and CDN delivery.

STEP 1: Cloudinary Account Setup
A. Create Account

Go to https://cloudinary.com/users/register_free
Sign up (Free tier includes: 25GB storage, 25GB bandwidth/month)
Verify your email
Login to dashboard

B. Get Credentials
After login, you'll see your dashboard with:

Cloud Name: e.g., dxyz123abc
API Key: e.g., 123456789012345
API Secret: e.g., abcdefghijklmnopqrstuvwxyz123

Copy these - you'll need them!

STEP 2: Install Cloudinary Package
bashcd backend
npm install cloudinary

STEP 3: Environment Configuration
Create/Update .env file in backend root:
env# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here

# Optional: Upload folder name
CLOUDINARY_UPLOAD_FOLDER=schoolsync-uploads
```

**Replace** `your_cloud_name_here`, `your_api_key_here`, `your_api_secret_here` with your actual credentials from Cloudinary dashboard.

### Update `.gitignore` (Important - Don't commit secrets!)
```
# Environment variables
.env
.env.local
.env.production

# Google credentials (no longer needed, but keep for safety)
config/google-credentials.json
*.json

# Upload temp files
uploads/
uploads/temp/

STEP 4: Create Cloudinary Service
Delete or rename old file:
bashmv src/services/driveService.js src/services/driveService.js.backup
Create new file: src/services/cloudinaryService.js
javascriptimport cloudinary from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file to Cloudinary
 * @param {string} filePath - Local file path
 * @param {string} fileName - Original file name
 * @param {string} mimeType - File MIME type
 * @returns {Promise<object>} Upload result with URL and metadata
 */
export const uploadToCloudinary = async (filePath, fileName, mimeType) => {
  try {
    console.log('Uploading to Cloudinary:', fileName);

    // Determine resource type
    const resourceType = mimeType.startsWith('image/') ? 'image' : 'raw';
    
    // Upload options
    const uploadOptions = {
      folder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'schoolsync-uploads',
      resource_type: resourceType, // 'image' or 'raw' (for PDFs)
      public_id: `${Date.now()}-${fileName.replace(/\.[^/.]+$/, '')}`, // Remove extension, Cloudinary adds it
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    };

    // Add image-specific optimizations
    if (resourceType === 'image') {
      uploadOptions.quality = 'auto:good'; // Automatic quality optimization
      uploadOptions.fetch_format = 'auto'; // Automatic format selection (WebP, etc.)
      uploadOptions.flags = 'lossy'; // Allow lossy compression for smaller size
    }

    // Upload to Cloudinary
    const result = await cloudinary.v2.uploader.upload(filePath, uploadOptions);

    console.log('Cloudinary upload successful:', {
      publicId: result.public_id,
      url: result.secure_url,
      size: result.bytes,
    });

    return {
      fileId: result.public_id, // Cloudinary public ID (used for deletion)
      url: result.secure_url, // Direct HTTPS URL
      thumbnailUrl: resourceType === 'image' 
        ? cloudinary.v2.url(result.public_id, { width: 300, height: 300, crop: 'limit' })
        : null, // Thumbnail for images
      size: result.bytes,
      format: result.format,
      resourceType: result.resource_type,
      createdAt: result.created_at,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - 'image' or 'raw'
 * @returns {Promise<object>} Deletion result
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    console.log('Deleting from Cloudinary:', publicId);

    const result = await cloudinary.v2.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    console.log('Cloudinary deletion result:', result);

    return {
      success: result.result === 'ok',
      publicId: publicId,
    };
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
    throw new Error(`Cloudinary deletion failed: ${error.message}`);
  }
};

/**
 * Get file metadata from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - 'image' or 'raw'
 * @returns {Promise<object>} File metadata
 */
export const getCloudinaryMetadata = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.v2.api.resource(publicId, {
      resource_type: resourceType,
    });

    return {
      publicId: result.public_id,
      url: result.secure_url,
      size: result.bytes,
      format: result.format,
      width: result.width,
      height: result.height,
      createdAt: result.created_at,
    };
  } catch (error) {
    console.error('Cloudinary metadata error:', error);
    throw new Error(`Failed to get Cloudinary metadata: ${error.message}`);
  }
};

/**
 * Generate optimized image URL with transformations
 * @param {string} publicId - Cloudinary public ID
 * @param {object} options - Transformation options
 * @returns {string} Transformed image URL
 */
export const getOptimizedImageUrl = (publicId, options = {}) => {
  const defaultOptions = {
    quality: 'auto:good',
    fetch_format: 'auto',
    ...options,
  };

  return cloudinary.v2.url(publicId, defaultOptions);
};

export default {
  uploadToCloudinary,
  deleteFromCloudinary,
  getCloudinaryMetadata,
  getOptimizedImageUrl,
};

STEP 5: Update Compression Service (Optional Simplification)
Cloudinary has built-in compression, so you can simplify or skip manual compression.
Option A: Keep Existing Compression (for more control)

Keep your current compressionService.js as is
Files are compressed locally, then uploaded to Cloudinary

Option B: Remove Manual Compression (let Cloudinary handle it)
Update compressionService.js to skip compression:
javascriptexport const compressFile = async (filePath, mimeType) => {
  const fs = require('fs').promises;
  const fileStats = await fs.stat(filePath);
  
  // Skip compression - Cloudinary will handle it
  return {
    originalSize: fileStats.size,
    compressedSize: fileStats.size,
    compressionRatio: 0,
  };
};
Recommendation: Use Option B (let Cloudinary compress) - it's faster and more efficient.

STEP 6: Update File Upload Route
Replace src/routes/files.js with Cloudinary integration:
javascriptimport express from 'express';
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
    
    const ext = path.extname(originalFilePath);
    const compressedFilePath = originalFilePath.replace(ext, `_compressed${ext}`);

    // Check if compression actually created a new file
    let fileToUpload = originalFilePath;
    try {
      await fs.access(compressedFilePath);
      fileToUpload = compressedFilePath;
      console.log('Using compressed file');
    } catch {
      console.log('Using original file (no compression)');
    }

    // Step 2: Upload to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(
      fileToUpload,
      originalFileName,
      mimeType
    );

    console.log('Upload to Cloudinary complete');

    // Step 3: Clean up local files
    await fs.unlink(originalFilePath).catch(err => console.error('Cleanup error:', err));
    if (fileToUpload !== originalFilePath) {
      await fs.unlink(compressedFilePath).catch(err => console.error('Cleanup error:', err));
    }

    // Step 4: Return file info
    return res.json({
      success: true,
      file: {
        fileName: originalFileName,
        originalSize: compressionResult.originalSize,
        compressedSize: cloudinaryResult.size,
        compressionRatio: compressionResult.compressionRatio,
        fileType: mimeType,
        url: cloudinaryResult.url, // ✅ Changed from driveLink to url
        thumbnailUrl: cloudinaryResult.thumbnailUrl,
        fileId: cloudinaryResult.fileId, // ✅ Cloudinary public ID
        uploadedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Upload error:', error);

    // Clean up on error
    if (req.file && req.file.path) {
      await fs.unlink(req.file.path).catch(() => {});
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
router.delete('/delete/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
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
router.get('/metadata/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
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

STEP 7: Update Database Schema (No Changes Needed!)
Your existing schema already works! Just update field names:
javascript// Form Responses - File field structure (NO CHANGES NEEDED)
{
  responseId: String,
  formId: String,
  responses: {
    fieldId3: { // FILE FIELD
      fileName: String,
      originalSize: Number,
      compressedSize: Number,
      fileType: String,
      url: String, // ✅ Was driveLink, now Cloudinary URL
      fileId: String, // ✅ Was driveFileId, now Cloudinary public_id
      thumbnailUrl: String, // ✅ NEW: Thumbnail for images
      uploadedAt: Date
    }
  }
}
The structure is identical! Your existing code will work with minimal changes.

STEP 8: Update Frontend Components
A. Update FileUploadField.jsx
Only change needed - field names in display:
jsx// FileUploadField.jsx - MINIMAL CHANGES

// Change this:
<a href={uploadedFile.driveLink} target="_blank">View File</a>

// To this:
<a href={uploadedFile.url} target="_blank">View File</a>

// Add thumbnail preview for images (NEW):
{uploadedFile.thumbnailUrl && (
  <img 
    src={uploadedFile.thumbnailUrl} 
    alt="Preview" 
    className="thumbnail-preview"
    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
  />
)}
B. Update Delete Handler
jsx// Change fileId parameter name (if needed)
const handleRemove = async () => {
  if (uploadedFile && uploadedFile.fileId) {
    const resourceType = uploadedFile.fileType.startsWith('image/') ? 'image' : 'raw';
    await axios.delete(`/api/files/delete/${uploadedFile.fileId}?resourceType=${resourceType}`);
    setUploadedFile(null);
    onChange(field.fieldId, null);
  }
};

STEP 9: Update Report Display Components
Update FileDisplay.jsx
jsx// ReportView.jsx - Display files in reports

const FileDisplay = ({ fileData }) => {
  if (!fileData || !fileData.url) return null; // ✅ Changed from driveLink to url

  const isImage = fileData.fileType.startsWith('image/');
  const isPDF = fileData.fileType === 'application/pdf';

  return (
    <div className="file-display">
      {isImage && (
        <div className="image-preview">
          {/* ✅ Use thumbnailUrl for preview, url for full image */}
          <img 
            src={fileData.thumbnailUrl || fileData.url} 
            alt={fileData.fileName}
            onClick={() => window.open(fileData.url, '_blank')}
            style={{ maxWidth: '300px', cursor: 'pointer' }}
          />
        </div>
      )}
      
      {isPDF && (
        <div className="pdf-preview">
          <embed
            src={fileData.url}
            type="application/pdf"
            width="100%"
            height="500px"
          />
        </div>
      )}

      <div className="file-info">
        <p><strong>File:</strong> {fileData.fileName}</p>
        <p><strong>Size:</strong> {(fileData.compressedSize / 1024).toFixed(2)} KB</p>
        <a href={fileData.url} target="_blank" rel="noopener noreferrer">
          Open File
        </a>
      </div>
    </div>
  );
};

STEP 10: Testing Checklist
Test Upload Flow:
bash# Start backend
cd backend
npm run dev

# Test with curl or Postman
curl -X POST http://localhost:5000/api/files/upload \
  -F "file=@/path/to/test-image.jpg" \
  -H "Content-Type: multipart/form-data"

# Expected response:
{
  "success": true,
  "file": {
    "fileName": "test-image.jpg",
    "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/schoolsync-uploads/filename.jpg",
    "fileId": "schoolsync-uploads/filename",
    "thumbnailUrl": "https://res.cloudinary.com/your-cloud/image/upload/c_limit,h_300,w_300/v1234567890/schoolsync-uploads/filename.jpg"
  }
}
Test in Browser:

Open Form Builder
Add file upload field
Fill form as user
Upload image or PDF
Verify upload success
Check Cloudinary dashboard - file should appear
Click "View File" - should open in new tab
Test delete - file should disappear from Cloudinary


STEP 11: Remove Old Google Drive Files (Cleanup)
bash# Backend cleanup
rm src/services/driveService.js.backup
rm config/google-credentials.json

# Uninstall googleapis (optional - only if not used elsewhere)
npm uninstall googleapis
```

---

## STEP 12: Environment Variables for Production

When deploying:

### Vercel/Netlify (Frontend):
- No changes needed (frontend only sends files to backend)

### Railway/Render/Heroku (Backend):
Add environment variables in dashboard:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_FOLDER=schoolsync-uploads

MIGRATION SUMMARY
What Changed:
✅ Replaced Google Drive API with Cloudinary API
✅ No more service account quota issues
✅ Automatic image compression & optimization
✅ CDN delivery (faster loading)
✅ Thumbnail generation for images
What Stayed the Same:
✅ Database schema (same structure)
✅ Frontend components (minimal changes)
✅ Upload flow (same user experience)
✅ File validation logic
✅ Multer configuration