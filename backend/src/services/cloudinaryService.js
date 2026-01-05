import cloudinary from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('Cloudinary Config Check:', {
    cloud_name: cloudName ? `${cloudName.substring(0, 3)}***` : 'MISSING',
    api_key: apiKey ? `${apiKey.substring(0, 3)}***` : 'MISSING',
    api_secret: apiSecret ? `Present (Length: ${apiSecret.length})` : 'MISSING',
    upload_folder: process.env.CLOUDINARY_UPLOAD_FOLDER
});

cloudinary.v2.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
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
