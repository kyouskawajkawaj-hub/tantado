import vision from '@google-cloud/vision';
import * as fs from 'fs';
import * as path from 'path';

interface TextDetectionResult {
  fullText: string;
  blocks: Array<{
    text: string;
    confidence: number;
    bounds: {
      vertices: Array<{ x: number; y: number }>;
    };
  }>;
  language: string;
  rawResponse: any;
}

interface ImageAnalysisResult {
  text?: TextDetectionResult;
  labels?: Array<{
    description: string;
    score: number;
  }>;
  faces?: Array<{
    confidence: number;
    bounds: {
      vertices: Array<{ x: number; y: number }>;
    };
  }>;
  logos?: Array<{
    description: string;
    score: number;
  }>;
  error?: string;
}

class CloudVisionService {
  private client: vision.ImageAnnotatorClient;
  private projectId: string;

  constructor() {
    // Initialize with environment credentials
    this.client = new vision.ImageAnnotatorClient({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || '';
  }

  /**
   * Extract text from an image using OCR
   * @param imagePath Local file path or URL
   * @returns TextDetectionResult with extracted text and confidence scores
   */
  async extractTextFromImage(imagePath: string): Promise<TextDetectionResult | null> {
    try {
      const request = this.buildRequest(imagePath);

      const [result] = await this.client.textDetection(request);
      const detections = result.textAnnotations || [];

      if (detections.length === 0) {
        return null;
      }

      // First detection is the full text
      const fullTextAnnotation = result.fullTextAnnotation || {};
      const fullText = fullTextAnnotation.text || detections[0]?.description || '';

      // Parse individual blocks
      const blocks = detections.slice(1).map((detection) => ({
        text: detection.description || '',
        confidence: detection.confidence || 0,
        bounds: {
          vertices: detection.boundingPoly?.vertices || [],
        },
      }));

      return {
        fullText,
        blocks,
        language: fullTextAnnotation.pages?.[0]?.property?.detectedLanguages?.[0]?.languageCode || 'unknown',
        rawResponse: result,
      };
    } catch (error) {
      console.error('Error extracting text from image:', error);
      throw error;
    }
  }

  /**
   * Detect labels in an image
   * @param imagePath Local file path or URL
   * @returns Array of detected labels with confidence scores
   */
  async detectLabels(imagePath: string): Promise<Array<{ description: string; score: number }>> {
    try {
      const request = this.buildRequest(imagePath);

      const [result] = await this.client.labelDetection(request);
      const labels = result.labelAnnotations || [];

      return labels.map((label) => ({
        description: label.description || '',
        score: label.score || 0,
      }));
    } catch (error) {
      console.error('Error detecting labels:', error);
      throw error;
    }
  }

  /**
   * Detect faces in an image
   * @param imagePath Local file path or URL
   * @returns Array of detected faces with bounds and confidence
   */
  async detectFaces(imagePath: string) {
    try {
      const request = this.buildRequest(imagePath);

      const [result] = await this.client.faceDetection(request);
      const faces = result.faceAnnotations || [];

      return faces.map((face) => ({
        confidence: face.detectionConfidence || 0,
        bounds: {
          vertices: face.boundingPoly?.vertices || [],
        },
      }));
    } catch (error) {
      console.error('Error detecting faces:', error);
      throw error;
    }
  }

  /**
   * Detect logos in an image
   * @param imagePath Local file path or URL
   * @returns Array of detected logos with confidence scores
   */
  async detectLogos(imagePath: string): Promise<Array<{ description: string; score: number }>> {
    try {
      const request = this.buildRequest(imagePath);

      const [result] = await this.client.logoDetection(request);
      const logos = result.logoAnnotations || [];

      return logos.map((logo) => ({
        description: logo.description || '',
        score: logo.score || 0,
      }));
    } catch (error) {
      console.error('Error detecting logos:', error);
      throw error;
    }
  }

  /**
   * Perform comprehensive image analysis
   * @param imagePath Local file path or URL
   * @returns Combined analysis results
   */
  async analyzeImage(imagePath: string): Promise<ImageAnalysisResult> {
    try {
      const results: ImageAnalysisResult = {};

      // Run all detections in parallel
      const [text, labels, faces, logos] = await Promise.all([
        this.extractTextFromImage(imagePath).catch(() => null),
        this.detectLabels(imagePath).catch(() => []),
        this.detectFaces(imagePath).catch(() => []),
        this.detectLogos(imagePath).catch(() => []),
      ]);

      if (text) results.text = text;
      if (labels.length > 0) results.labels = labels;
      if (faces.length > 0) results.faces = faces;
      if (logos.length > 0) results.logos = logos;

      return results;
    } catch (error) {
      return {
        error: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Save analysis results to JSON file
   * @param results Analysis results
   * @param outputPath Output file path
   */
  async saveResults(results: ImageAnalysisResult, outputPath: string): Promise<void> {
    try {
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
      console.log(`Results saved to ${outputPath}`);
    } catch (error) {
      console.error('Error saving results:', error);
      throw error;
    }
  }

  /**
   * Build vision API request object
   * @param imagePath Local file path or URL
   */
  private buildRequest(imagePath: string) {
    // Check if it's a URL or local file
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return {
        image: {
          source: {
            imageUri: imagePath,
          },
        },
      };
    }

    // Local file
    const imageContent = fs.readFileSync(imagePath);
    return {
      image: {
        content: imageContent.toString('base64'),
      },
    };
  }
}

export default CloudVisionService;
