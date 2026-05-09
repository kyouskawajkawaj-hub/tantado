import CloudVisionService from './services/cloudVisionService';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Example usage of Cloud Vision Service
 */
async function main() {
  try {
    const visionService = new CloudVisionService();

    // Example: Extract text from a local image
    // const imagePath = './sample-image.jpg';
    // const result = await visionService.extractTextFromImage(imagePath);
    // console.log('Extracted text:', result);

    // Example: Analyze image with all features
    // const analysisResult = await visionService.analyzeImage(imagePath);
    // console.log('Analysis result:', analysisResult);
    // await visionService.saveResults(analysisResult, './output/analysis.json');

    console.log('Cloud Vision Service initialized successfully');
    console.log('Project ID:', process.env.GOOGLE_CLOUD_PROJECT_ID);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Uncomment to run
// main();

export { CloudVisionService };
