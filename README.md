# tantado - Google Cloud Vision API Integration

Complete TypeScript implementation for Google Cloud Vision API with OCR, image recognition, and text extraction capabilities.

## 🎯 Features

- **Text Extraction (OCR)** - Extract text from images with confidence scores
- **Object Detection** - Identify objects and concepts in images
- **Face Detection** - Locate and analyze faces with bounding boxes
- **Logo Recognition** - Detect brand logos and trademarks
- **Comprehensive Analysis** - Run all detections simultaneously
- **Local & Remote** - Process local files or image URLs
- **Type-Safe** - Full TypeScript support with interfaces
- **Results Export** - Save analysis results to JSON

## 📋 Prerequisites

- Node.js 14+
- Google Cloud Project with Vision API enabled
- Google Cloud API Key
- Project ID from Google Cloud Console

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/kyouskawajkawaj-hub/tantado.git
cd tantado
npm install
```

### 2. Configure Credentials

Create a `.env` file from the template:

```bash
cp .env.example .env
```

Update `.env` with your credentials:

```env
GOOGLE_CLOUD_PROJECT_ID=pares-ni-balong-749a0
GOOGLE_CLOUD_API_KEY=AIzaSyCgIfvP2uPr_n0g_Q2v8Gy8RNFfivnYlvI
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
```

### 3. Build and Run

```bash
npm run build
npm run dev
```

## 📖 Usage Examples

### Extract Text from Image

```typescript
import CloudVisionService from './services/cloudVisionService';

const service = new CloudVisionService();
const result = await service.extractTextFromImage('./image.jpg');

console.log('Extracted Text:', result.fullText);
console.log('Confidence:', result.blocks[0]?.confidence);
```

### Detect Labels

```typescript
const labels = await service.detectLabels('./image.jpg');

labels.forEach(label => {
  console.log(`${label.description}: ${(label.score * 100).toFixed(2)}%`);
});
```

### Detect Faces

```typescript
const faces = await service.detectFaces('./image.jpg');

faces.forEach((face, index) => {
  console.log(`Face ${index + 1}: ${(face.confidence * 100).toFixed(2)}% confidence`);
  console.log(`Bounds:`, face.bounds.vertices);
});
```

### Detect Logos

```typescript
const logos = await service.detectLogos('./image.jpg');

logos.forEach(logo => {
  console.log(`Logo: ${logo.description} (${(logo.score * 100).toFixed(2)}%)`);
});
```

### Comprehensive Analysis

```typescript
const analysis = await service.analyzeImage('./image.jpg');

// Save to file
await service.saveResults(analysis, './output/analysis.json');
```

### From URL

```typescript
const imageUrl = 'https://example.com/image.jpg';
const result = await service.extractTextFromImage(imageUrl);
```

## 🛡️ Image Validation

Use the included validator to validate images before processing:

```typescript
import { validateImagePath, validateImageUrl } from './utils/imageValidator';

// Validate local file
const isValid = validateImagePath('./image.jpg');

// Validate URL
const isUrlValid = validateImageUrl('https://example.com/image.jpg');
```

## 📁 Project Structure

```
tantado/
├── src/
│   ├── services/
│   │   └── cloudVisionService.ts    # Core Vision API service
│   ├── utils/
│   │   └── imageValidator.ts        # Image validation utilities
│   └── index.ts                     # Entry point
├── dist/                            # Compiled JavaScript
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── .env.example                     # Environment template
├── .gitignore                       # Git exclusions
└── README.md                        # This file
```

## 🔑 API Reference

### CloudVisionService

#### `extractTextFromImage(imagePath: string): Promise<TextDetectionResult>`

Extracts text from image using OCR.

**Returns:**
- `fullText` - Complete extracted text
- `blocks` - Array of detected text blocks with confidence
- `language` - Detected language code
- `rawResponse` - Raw API response

#### `detectLabels(imagePath: string): Promise<Label[]>`

Detects objects and concepts in image.

**Returns:** Array of labels with description and confidence score

#### `detectFaces(imagePath: string): Promise<Face[]>`

Detects faces in image.

**Returns:** Array of faces with confidence and bounding boxes

#### `detectLogos(imagePath: string): Promise<Logo[]>`

Detects brand logos in image.

**Returns:** Array of logos with description and confidence score

#### `analyzeImage(imagePath: string): Promise<ImageAnalysisResult>`

Performs comprehensive analysis with all detection types.

**Returns:** Combined results from all detections

#### `saveResults(results: ImageAnalysisResult, outputPath: string): Promise<void>`

Exports analysis results to JSON file.

## 🔐 Security Notes

⚠️ **Never commit `.env` or `credentials.json` to version control!**

These files are already in `.gitignore` for protection.

### Best Practices:

1. Use GitHub Secrets for CI/CD pipelines
2. Rotate API keys regularly
3. Use service account keys for production
4. Restrict API key usage in Google Cloud Console
5. Monitor API usage and costs

## 📊 Supported Image Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- BMP (.bmp)
- TIFF (.tiff)

**File Size Limit:** 20 MB

## 🆘 Troubleshooting

### Authentication Error

```
Error: The caller does not have permission...
```

**Solution:** Verify your API key and project ID are correct in `.env`

### Image Not Found

```
Error: File not found
```

**Solution:** Check file path and ensure file exists and is readable

### Rate Limit Error

```
Error: Quota exceeded
```

**Solution:** Check your Google Cloud quotas and pricing plan

## 📝 License

MIT

## 👤 Author

kyouskawajkawaj-hub

## 🙏 Acknowledgments

- Google Cloud Vision API documentation
- TypeScript community
