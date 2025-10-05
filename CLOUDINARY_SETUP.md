# Cloudinary Setup Guide

## Getting Your Cloudinary API Secret

1. Go to [Cloudinary Console](https://cloudinary.com/console)
2. Log in to your account
3. In the dashboard, you'll see your **Cloud Name** and **API Key** (already provided)
4. To get your **API Secret**:
   - Click on the "API Keys" section or look for "API Secret" in the dashboard
   - Copy the API Secret value

## Environment Configuration

Once you have your API Secret, update your `.env` file with:

```env
CLOUDINARY_CLOUD_NAME=dguz3xo20
CLOUDINARY_API_KEY=TooNVwMl6nyg7wrQm92WFf0d6Ds
CLOUDINARY_API_SECRET=your-actual-api-secret-here
```

## For Render Deployment

Add these environment variables in your Render dashboard:

1. Go to your Render service dashboard
2. Navigate to "Environment" tab
3. Add these variables:
   - `CLOUDINARY_CLOUD_NAME` = `dguz3xo20`
   - `CLOUDINARY_API_KEY` = `TooNVwMl6nyg7wrQm92WFf0d6Ds`
   - `CLOUDINARY_API_SECRET` = `your-actual-api-secret-here`

## Testing the Setup

Once configured, you can test the product creation:

1. The "Add New Product" button in the admin dashboard will now work
2. Products will be saved to your MongoDB database
3. Images (when uploaded) will be stored in Cloudinary under the `resellhub/products` folder
4. Images will be automatically optimized and resized by Cloudinary

## Features

- ✅ Cloud storage for images (no local file system needed)
- ✅ Automatic image optimization and resizing
- ✅ Support for multiple image formats (JPEG, PNG, GIF, WebP)
- ✅ 10MB file size limit per image
- ✅ Up to 5 images per product
- ✅ Automatic fallback to placeholder if no images uploaded

## Next Steps

1. Get your API Secret from Cloudinary
2. Update your `.env` file or Render environment variables
3. Deploy the updated backend
4. Test product creation from the admin dashboard
