import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

/**
 * Compress Image (JPEG, PNG, WebP)
 */
export const compressImage = async (inputPath, outputPath, quality = 80) => {
    try {
        const TARGET_SIZE = 5 * 1024 * 1024; // 5MB
        let currentQuality = quality;
        let currentWidth = 1920;
        let compressedSize = 0;

        // Initial compression
        await sharp(inputPath)
            .resize(currentWidth, currentWidth, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .jpeg({ quality: currentQuality, progressive: true })
            .toFile(outputPath);

        compressedSize = (await fs.stat(outputPath)).size;

        // Iterative compression if too large
        let attempts = 0;
        while (compressedSize > TARGET_SIZE && attempts < 3) {
            attempts++;
            currentQuality -= 20; // Reduce quality
            currentWidth = Math.floor(currentWidth * 0.8); // Reduce dimensions

            if (currentQuality < 10) currentQuality = 10;

            console.log(`File > 5MB (${(compressedSize / 1024 / 1024).toFixed(2)}MB). Retrying with Q:${currentQuality}, W:${currentWidth}`);

            // Overwrite previous attempt
            await sharp(inputPath)
                .resize(currentWidth, currentWidth, {
                    fit: 'inside',
                    withoutEnlargement: true,
                })
                .jpeg({ quality: currentQuality, progressive: true })
                .toFile(outputPath);

            compressedSize = (await fs.stat(outputPath)).size;
        }

        const originalSize = (await fs.stat(inputPath)).size;
        const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(2);

        return {
            originalSize,
            compressedSize,
            compressionRatio: parseFloat(compressionRatio),
        };
    } catch (error) {
        console.error('Error compressing image:', error);
        throw error;
    }
};

/**
 * Compress PDF
 */
export const compressPDF = async (inputPath, outputPath) => {
    try {
        const existingPdfBytes = await fs.readFile(inputPath);
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        // Basic metadata stripping for "compression"
        // (pdf-lib doesn't support deep content compression like Ghostscript, but this helps slightly)
        pdfDoc.setTitle('');
        pdfDoc.setAuthor('');
        pdfDoc.setSubject('');
        pdfDoc.setProducer('');
        pdfDoc.setCreator('');

        const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
        await fs.writeFile(outputPath, pdfBytes);

        const originalSize = (await fs.stat(inputPath)).size;
        const compressedSize = pdfBytes.length;
        const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(2);

        return {
            originalSize,
            compressedSize,
            compressionRatio: parseFloat(compressionRatio),
        };
    } catch (error) {
        console.error('Error compressing PDF:', error);
        // Fallback: just copy if compression fails
        await fs.copyFile(inputPath, outputPath);
        return { originalSize: 0, compressedSize: 0, compressionRatio: 0 };
    }
};

/**
 * Main compression function - detects type and compresses
 * UPDATED: Skips local compression to let Cloudinary handle it
 */
export const compressFile = async (filePath, mimeType) => {
    try {
        const stats = await fs.stat(filePath);
        console.log('Skipping local compression (Cloudinary will handle optimization)');

        return {
            originalSize: stats.size,
            compressedSize: stats.size,
            compressionRatio: 0,
        };
    } catch (error) {
        console.error('Error in compressFile:', error);
        return {
            originalSize: 0,
            compressedSize: 0,
            compressionRatio: 0,
        };
    }
};
