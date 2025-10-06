/**
 * File Processing API
 * 
 * Handles file upload, validation, processing, and optimization
 * that was previously done in the frontend
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Max 10 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// File processing configurations
const processingConfig = {
  // Image optimization settings
  imageOptimization: {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 85,
    format: 'webp',
    progressive: true
  },
  
  // Thumbnail generation settings
  thumbnails: {
    sizes: [
      { name: 'small', width: 150, height: 150 },
      { name: 'medium', width: 300, height: 300 },
      { name: 'large', width: 600, height: 600 }
    ]
  },
  
  // File validation
  validation: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    maxFiles: 10
  }
};

// Helper function to validate file
const validateFile = (file) => {
  const errors = [];
  
  // Check file size
  if (file.size > processingConfig.validation.maxFileSize) {
    errors.push(`File ${file.originalname} is too large. Maximum size is ${processingConfig.validation.maxFileSize / (1024 * 1024)}MB`);
  }
  
  // Check file type
  if (!processingConfig.validation.allowedTypes.includes(file.mimetype)) {
    errors.push(`File ${file.originalname} has invalid type. Allowed types: ${processingConfig.validation.allowedTypes.join(', ')}`);
  }
  
  return errors;
};

// Helper function to optimize image
const optimizeImage = async (buffer, options = {}) => {
  const config = { ...processingConfig.imageOptimization, ...options };
  
  return await sharp(buffer)
    .resize(config.maxWidth, config.maxHeight, { 
      fit: 'inside',
      withoutEnlargement: true 
    })
    .webp({ 
      quality: config.quality,
      progressive: config.progressive 
    })
    .toBuffer();
};

// Helper function to generate thumbnails
const generateThumbnails = async (buffer) => {
  const thumbnails = {};
  
  for (const size of processingConfig.thumbnails.sizes) {
    const thumbnail = await sharp(buffer)
      .resize(size.width, size.height, { 
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 80 })
      .toBuffer();
    
    thumbnails[size.name] = thumbnail;
  }
  
  return thumbnails;
};

// Helper function to upload to Cloudinary
const uploadToCloudinary = async (buffer, folder, publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: publicId,
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit', quality: 'auto' },
          { format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    ).end(buffer);
  });
};

// POST /api/file-processing/upload - Upload and process files
router.post('/upload', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided'
      });
    }

    const { folder = 'uploads', generateThumbnails: createThumbnails = true } = req.body;
    const processedFiles = [];
    const errors = [];

    for (const file of req.files) {
      try {
        // Validate file
        const validationErrors = validateFile(file);
        if (validationErrors.length > 0) {
          errors.push(...validationErrors);
          continue;
        }

        // Generate unique ID for the file
        const fileId = uuidv4();
        const fileExtension = path.extname(file.originalname);
        const fileName = `${fileId}${fileExtension}`;

        // Optimize the image
        const optimizedBuffer = await optimizeImage(file.buffer);
        
        // Upload optimized image to Cloudinary
        const uploadResult = await uploadToCloudinary(
          optimizedBuffer, 
          folder, 
          fileName
        );

        const processedFile = {
          id: fileId,
          originalName: file.originalname,
          fileName: fileName,
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          size: optimizedBuffer.length,
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format,
          folder: folder
        };

        // Generate thumbnails if requested
        if (createThumbnails === 'true' || createThumbnails === true) {
          const thumbnails = await generateThumbnails(optimizedBuffer);
          const thumbnailUrls = {};
          
          for (const [sizeName, thumbnailBuffer] of Object.entries(thumbnails)) {
            const thumbnailResult = await uploadToCloudinary(
              thumbnailBuffer,
              `${folder}/thumbnails`,
              `${fileId}_${sizeName}`
            );
            thumbnailUrls[sizeName] = thumbnailResult.secure_url;
          }
          
          processedFile.thumbnails = thumbnailUrls;
        }

        processedFiles.push(processedFile);

      } catch (fileError) {
        console.error(`Error processing file ${file.originalname}:`, fileError);
        errors.push(`Failed to process ${file.originalname}: ${fileError.message}`);
      }
    }

    // Return results
    const response = {
      success: processedFiles.length > 0,
      data: {
        files: processedFiles,
        totalFiles: req.files.length,
        processedFiles: processedFiles.length,
        errors: errors
      }
    };

    if (errors.length > 0) {
      response.warnings = errors;
    }

    res.json(response);

  } catch (error) {
    console.error('Error in file upload processing:', error);
    res.status(500).json({
      success: false,
      error: 'File processing failed',
      message: error.message
    });
  }
});

// POST /api/file-processing/optimize - Optimize existing images
router.post('/optimize', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided'
      });
    }

    const { options = {} } = req.body;
    const optimizedFiles = [];

    for (const file of req.files) {
      try {
        // Optimize the image with custom options
        const optimizedBuffer = await optimizeImage(file.buffer, options);
        
        optimizedFiles.push({
          originalName: file.originalname,
          originalSize: file.size,
          optimizedSize: optimizedBuffer.length,
          compressionRatio: ((file.size - optimizedBuffer.length) / file.size * 100).toFixed(2),
          buffer: optimizedBuffer.toString('base64') // Return as base64 for frontend
        });

      } catch (fileError) {
        console.error(`Error optimizing file ${file.originalname}:`, fileError);
      }
    }

    res.json({
      success: true,
      data: {
        files: optimizedFiles,
        totalFiles: req.files.length,
        optimizedFiles: optimizedFiles.length
      }
    });

  } catch (error) {
    console.error('Error in image optimization:', error);
    res.status(500).json({
      success: false,
      error: 'Image optimization failed',
      message: error.message
    });
  }
});

// POST /api/file-processing/thumbnails - Generate thumbnails for images
router.post('/thumbnails', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided'
      });
    }

    const { folder = 'thumbnails' } = req.body;
    const thumbnailResults = [];

    for (const file of req.files) {
      try {
        // Generate thumbnails
        const thumbnails = await generateThumbnails(file.buffer);
        const thumbnailUrls = {};
        
        for (const [sizeName, thumbnailBuffer] of Object.entries(thumbnails)) {
          const thumbnailResult = await uploadToCloudinary(
            thumbnailBuffer,
            folder,
            `${uuidv4()}_${sizeName}`
          );
          thumbnailUrls[sizeName] = thumbnailResult.secure_url;
        }
        
        thumbnailResults.push({
          originalName: file.originalname,
          thumbnails: thumbnailUrls
        });

      } catch (fileError) {
        console.error(`Error generating thumbnails for ${file.originalname}:`, fileError);
      }
    }

    res.json({
      success: true,
      data: {
        files: thumbnailResults,
        totalFiles: req.files.length,
        processedFiles: thumbnailResults.length
      }
    });

  } catch (error) {
    console.error('Error generating thumbnails:', error);
    res.status(500).json({
      success: false,
      error: 'Thumbnail generation failed',
      message: error.message
    });
  }
});

// DELETE /api/file-processing/delete - Delete files from Cloudinary
router.delete('/delete', async (req, res) => {
  try {
    const { publicIds } = req.body;
    
    if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Public IDs array is required'
      });
    }

    const deletionResults = [];
    
    for (const publicId of publicIds) {
      try {
        const result = await cloudinary.uploader.destroy(publicId);
        deletionResults.push({
          publicId,
          success: result.result === 'ok',
          message: result.result
        });
      } catch (error) {
        deletionResults.push({
          publicId,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        results: deletionResults,
        totalFiles: publicIds.length,
        successfulDeletions: deletionResults.filter(r => r.success).length
      }
    });

  } catch (error) {
    console.error('Error deleting files:', error);
    res.status(500).json({
      success: false,
      error: 'File deletion failed',
      message: error.message
    });
  }
});

// GET /api/file-processing/config - Get file processing configuration
router.get('/config', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        validation: processingConfig.validation,
        imageOptimization: processingConfig.imageOptimization,
        thumbnails: processingConfig.thumbnails
      }
    });
  } catch (error) {
    console.error('Error getting file processing config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get configuration',
      message: error.message
    });
  }
});

module.exports = router;
