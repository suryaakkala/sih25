/**
 * Grok API Service for AI-powered educational insights
 * 
 * This module provides a streamlined interface to the Grok AI API
 * specifically tailored for educational applications. It handles:
 * 
 * - Student performance analysis
 * - Personalized learning recommendations
 * - Intervention suggestions for educators
 * - Educational content recommendations
 */

interface GrokRequestOptions {
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  model?: string;
}

interface GrokResponse {
  id: string;
  choices: {
    text: string;
    index: number;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface RecommendationGenerationParams {
  studentData: any;
  recommendationType?: 'study' | 'attendance' | 'task' | 'schedule' | 'all';
  count?: number;
  includeDetails?: boolean;
}

export interface InterventionSuggestionParams {
  studentData: any;
  attendanceData: any;
  taskCompletionData: any;
  academicPerformance: any;
  specificConcern?: string;
}

/**
 * Main Grok API client class
 */
export class GrokApiClient {
  private apiKey: string;
  private apiUrl: string;
  private apiVersion: string;
  private defaultModel: string = 'grok-2'; // Or whatever Grok's model name is

  constructor() {
    this.apiKey = process.env.GROK_API_KEY || '';
    this.apiUrl = process.env.GROK_API_URL || 'https://api.grok.ai/v1';
    this.apiVersion = process.env.GROK_API_VERSION || '2023-09-01';

    if (!this.apiKey) {
      console.warn('Grok API key not found. Please set the GROK_API_KEY environment variable.');
    }
  }

  /**
   * Make a request to the Grok API
   */
  private async makeRequest(
    prompt: string,
    options: GrokRequestOptions = {}
  ): Promise<GrokResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Grok-Version': this.apiVersion
        },
        body: JSON.stringify({
          model: options.model || this.defaultModel,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: options.max_tokens || 1000,
          temperature: options.temperature || 0.7,
          top_p: options.top_p || 1,
          stream: options.stream || false
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Grok API error: ${error.message || response.statusText}`);
      }

      return await response.json() as GrokResponse;
    } catch (error) {
      console.error('Grok API request failed:', error);
      throw error;
    }
  }

  /**
   * Generate personalized learning recommendations for a student
   */
  async generateRecommendations(
    params: RecommendationGenerationParams
  ): Promise<any[]> {
    const { studentData, recommendationType = 'all', count = 3, includeDetails = true } = params;

    // Create a detailed prompt based on the student data
    const prompt = `
      As an educational AI assistant, generate ${count} personalized learning recommendations 
      for a student with the following data:
      
      Attendance Rate: ${studentData.attendance_rate}%
      Recent Attendance: ${JSON.stringify(studentData.recent_attendance?.slice(0, 5))}
      Pending Tasks: ${JSON.stringify(studentData.tasks?.filter((t: any) => t.status !== 'completed')?.slice(0, 5))}
      Schedule: ${JSON.stringify(studentData.schedule?.slice(0, 5))}
      ${studentData.performance_metrics ? `Performance Metrics: ${JSON.stringify(studentData.performance_metrics)}` : ''}
      
      ${recommendationType !== 'all' ? `Focus specifically on ${recommendationType} recommendations.` : 'Provide a diverse set of recommendations.'}
      
      Format each recommendation as a JSON object with these fields:
      - id: A unique identifier for the recommendation
      - type: The category (study_tip, attendance_improvement, task_prioritization, schedule_optimization)
      - title: A concise, actionable title
      - description: A helpful, personalized explanation (2-3 sentences)
      - priority: The importance level (high, medium, low)
      - actionable: Whether this can be immediately acted upon (true/false)
      - estimated_impact: Expected benefit if implemented
      - category: General classification
      
      Return ONLY the JSON array without additional text.
    `;

    const response = await this.makeRequest(prompt, {
      temperature: 0.7,
      max_tokens: 2000
    });

    try {
      // The response might contain explanatory text around the JSON, so we need to extract just the JSON
      const text = response.choices[0].text.trim();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        // If we can't find a JSON array, try to parse the whole response
        return JSON.parse(text);
      }
    } catch (error) {
      console.error('Failed to parse Grok recommendation response:', error);
      console.log('Raw response:', response.choices[0].text);
      return [];
    }
  }

  /**
   * Generate intervention suggestions for counselors and educators
   */
  async generateInterventionSuggestions(
    params: InterventionSuggestionParams
  ): Promise<any[]> {
    const { 
      studentData, 
      attendanceData, 
      taskCompletionData, 
      academicPerformance,
      specificConcern 
    } = params;

    const prompt = `
      As an educational AI advisor for counselors, generate personalized intervention suggestions
      for a student with these attributes:
      
      Student Info: ${JSON.stringify(studentData)}
      Attendance Data: ${JSON.stringify(attendanceData)}
      Task Completion: ${JSON.stringify(taskCompletionData)}
      Academic Performance: ${JSON.stringify(academicPerformance)}
      ${specificConcern ? `Specific Concern: ${specificConcern}` : ''}
      
      Format each intervention suggestion as a JSON object with these fields:
      - id: A unique identifier
      - type: The category (attendance, academic, personal, behavioral)
      - title: A concise title for the intervention
      - approach: The recommended counseling approach
      - description: A detailed explanation of the intervention (3-5 sentences)
      - urgency: How quickly this should be addressed (immediate, soon, monitoring)
      - expected_outcome: The anticipated result of successful intervention
      - follow_up: Suggested follow-up actions and timeframe
      
      Return ONLY the JSON array without additional text.
    `;

    const response = await this.makeRequest(prompt, {
      temperature: 0.5,
      max_tokens: 2000
    });

    try {
      // Extract the JSON array from the response
      const text = response.choices[0].text.trim();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        return JSON.parse(text);
      }
    } catch (error) {
      console.error('Failed to parse Grok intervention response:', error);
      console.log('Raw response:', response.choices[0].text);
      return [];
    }
  }

  /**
   * Analyze student performance trends and provide insights
   */
  async analyzeStudentPerformance(studentId: string, academicData: any): Promise<any> {
    const prompt = `
      Analyze the following academic performance data for a student:
      
      ${JSON.stringify(academicData)}
      
      Provide an analysis including:
      1. Key performance trends
      2. Strengths and areas for improvement
      3. Comparative performance against peers (if data available)
      4. Suggested focus areas for improvement
      5. Early warning indicators, if any
      
      Format the response as a structured JSON object with these sections.
      Return ONLY the JSON without additional text.
    `;

    const response = await this.makeRequest(prompt, {
      temperature: 0.3,
      max_tokens: 1500
    });

    try {
      // Extract the JSON from the response
      const text = response.choices[0].text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        return JSON.parse(text);
      }
    } catch (error) {
      console.error('Failed to parse Grok performance analysis response:', error);
      return {
        error: 'Failed to parse performance analysis',
        rawResponse: response.choices[0].text
      };
    }
  }

  /**
   * Generate content for an educational notification
   */
  async generateSmartNotification(context: any): Promise<any> {
    const prompt = `
      Create a personalized, motivational educational notification for a student based on:
      
      ${JSON.stringify(context)}
      
      The notification should be:
      - Brief (under 150 characters)
      - Motivational but not patronizing
      - Specific to the student's current situation
      - Action-oriented
      
      Format as a JSON object with title, message, priority, and action fields.
      Return ONLY the JSON without additional text.
    `;

    const response = await this.makeRequest(prompt, {
      temperature: 0.7,
      max_tokens: 500
    });

    try {
      // Extract the JSON from the response
      const text = response.choices[0].text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        return JSON.parse(text);
      }
    } catch (error) {
      console.error('Failed to parse Grok notification response:', error);
      return null;
    }
  }
}

// Export a singleton instance for use throughout the application
export const grokApi = new GrokApiClient();