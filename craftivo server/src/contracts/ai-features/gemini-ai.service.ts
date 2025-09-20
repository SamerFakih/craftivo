import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateContractDto } from './generate-contract.dto';

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

@Injectable()
export class GeminiAiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    if (!this.apiKey) console.warn('GEMINI_API_KEY missing: using stub.');
  }

  async generateContract(
    generateDto: GenerateContractDto,
  ): Promise<AiGenerationResult> {
    if (!this.apiKey) {
      return this.getStubResponse();
    }

    try {
      const prompt = this.buildContractPrompt(generateDto);
      const response = await this.callGeminiAPI(prompt);

      return {
        generationId: Math.floor(Math.random() * 10000),
        generatedContent: response,
        aiModel: 'gemini-1.5-flash',
        processingTime: 2000,
        estimatedCost: 0.001,
        confidenceScore: 92,
        reviewSuggestions: [
          'Review payment terms for your jurisdiction',
          'Consider adding specific deliverable deadlines',
          'Verify liability limits are appropriate',
        ],
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.getStubResponse();
    }
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    if (!this.apiKey || this.apiKey.length < 10) {
      throw new Error('Invalid or missing GEMINI_API_KEY');
    }

    const url = `${this.baseUrl}/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4000,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      ],
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error details:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText,
        url: url.replace(this.apiKey, '[API_KEY_HIDDEN]'),
      });
      throw new Error(
        `Gemini API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const data = (await response.json()) as GeminiResponse;
    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Failed to generate contract'
    );
  }

  private buildContractPrompt(generateDto: GenerateContractDto): string {
    const parties = (() => {
      const client = generateDto.clientName || '[CLIENT NAME]';
      const freelancer = generateDto.freelancerName || '[FREELANCER NAME]';
      return `PARTIES:\n- Client: ${client}\n- Service Provider: ${freelancer}`;
    })();
    return `You are a professional legal contract generator. Create a comprehensive service agreement contract based on the following requirements:

PROJECT DETAILS:
- Title: ${generateDto.projectTitle}
- Type: ${generateDto.projectType}
- Description: ${generateDto.projectDescription}
- Budget: ${generateDto.budget} ${generateDto.currency || 'USD'}
- Duration: ${generateDto.durationWeeks} weeks
- Start Date: ${generateDto.startDate}

PAYMENT STRUCTURE: ${generateDto.paymentStructure}
DELIVERABLES: ${generateDto.deliverables?.join(', ') || 'As specified in project description'}

${parties}

CONTRACT REQUIREMENTS:
1. Professional legal language appropriate for business use
2. Include standard clauses: scope of work, payment terms, intellectual property, confidentiality, termination
3. Specify clear milestones and deadlines
4. Include dispute resolution mechanisms
5. Address liability and indemnification
6. Make it specific to ${generateDto.projectType} projects

IMPORTANT: Generate a complete, professional contract that could be used in real business situations. Structure it with clear sections and professional formatting.

CONTRACT:`;
  }

  private getStubResponse(): AiGenerationResult {
    return {
      generationId: 999,
      generatedContent: `
# SERVICE AGREEMENT CONTRACT

**Project:** Sample Web Development Project
**Date:** ${new Date().toLocaleDateString()}

## 1. PARTIES
This agreement is between [CLIENT NAME] ("Client") and [FREELANCER NAME] ("Service Provider").

## 2. SCOPE OF WORK
Service Provider agrees to develop a complete web application including:
- Frontend development using modern frameworks
- Backend API development
- Database design and implementation
- Testing and deployment

## 3. PAYMENT TERMS
- Total Project Value: $15,000 USD
- Payment Schedule: 50% upfront, 50% upon completion
- Payment Method: Bank transfer or approved digital payment

## 4. TIMELINE
- Project Duration: 8 weeks from start date
- Milestone reviews every 2 weeks
- Final delivery by [END DATE]

## 5. INTELLECTUAL PROPERTY
All work product shall become the exclusive property of the Client upon full payment.

## 6. CONFIDENTIALITY
Both parties agree to maintain confidentiality of all project-related information.

## 7. TERMINATION
Either party may terminate with 14 days written notice.

---
*This is a sample contract generated for testing purposes. Please customize for your specific needs.*
      `,
      aiModel: 'gemini-stub',
      processingTime: 100,
      estimatedCost: 0,
      confidenceScore: 85,
      reviewSuggestions: [
        'Add specific deliverable dates',
        'Include local law compliance',
      ],
    };
  }
}

export interface AiGenerationResult {
  generationId: number;
  generatedContent: string;
  aiModel: string;
  processingTime: number;
  estimatedCost: number;
  confidenceScore: number;
  reviewSuggestions: string[];
}
