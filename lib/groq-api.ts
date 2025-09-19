// lib/groq-api.ts
// Service for interacting with the Groq API

interface GroqRecommendationOptions {
  studentData: any;
  recommendationType?: string;
  count?: number;
  includeDetails?: boolean;
  prompt?: {
    title: string;
    description: string;
  };
}

interface Recommendation {
  id: string;
  type: "study_tip" | "schedule_optimization" | "attendance_improvement" | "task_prioritization";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  actionable: boolean;
  estimated_impact: string;
  category: string;
}

export const groqApi = {
  async generateRecommendations({ studentData, recommendationType = 'all', count = 4, includeDetails = true, prompt }: GroqRecommendationOptions): Promise<Recommendation[]> {
    console.log("Prompt received:", prompt);

    try {
      // Create a more specific prompt to get structured recommendations
      const structuredPrompt = `
        Generate ${count} personalized study recommendations for a student based on their data.
        Return ONLY a valid JSON array with exactly ${count} recommendation objects.
        
        Each recommendation object must have these exact properties:
        - id: a unique string identifier
        - type: one of ["study_tip", "schedule_optimization", "attendance_improvement", "task_prioritization"]
        - title: a concise title (4-8 words)
        - description: a detailed description (1-2 sentences)
        - priority: one of ["high", "medium", "low"]
        - actionable: boolean
        - estimated_impact: a brief impact statement
        - category: a relevant category name
        
        Student data: ${JSON.stringify(studentData)}
        
        Focus on: ${prompt?.description || 'Provide recommendations.'}
        
        Return ONLY the JSON array, no other text.
      `;

      console.log("Structured prompt sent to Groq API:", structuredPrompt);

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'user',
              content: structuredPrompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      console.log("Groq API response status:", response.status);
      const responseBody = await response.text();
      console.log("Groq API response body:", responseBody);

      if (!response.ok) {
        console.error("Groq API error:", responseBody);
        throw new Error(`Groq API returned status ${response.status}`);
      }

      const data = JSON.parse(responseBody);
      console.log("Groq API response:", data);

      // Extract and parse JSON from the response
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        const content = data.choices[0].message.content.trim();
        
        // Try to extract JSON from the response
        try {
          // Look for JSON array pattern in the response
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const recommendations = JSON.parse(jsonMatch[0]);
            
            // Validate the recommendations structure
            if (Array.isArray(recommendations) && recommendations.length > 0) {
              console.log("Parsed recommendations:", recommendations);
              return recommendations.slice(0, count).map((rec: any, index: number) => ({
                id: rec.id || `groq-${index + 1}`,
                type: rec.type || "study_tip",
                title: rec.title || "AI Recommendation",
                description: rec.description || "Personalized suggestion based on your learning patterns.",
                priority: rec.priority || "medium",
                actionable: rec.actionable !== undefined ? rec.actionable : true,
                estimated_impact: rec.estimated_impact || "Moderate impact",
                category: rec.category || "General"
              }));
            }
          }
        } catch (parseError) {
          console.error("Failed to parse JSON from Groq response:", parseError);
        }
        
        // Fallback: if JSON parsing fails, create a single recommendation from the text
        return [
          {
            id: 'groq-1',
            type: 'study_tip',
            title: 'AI-Generated Suggestion',
            description: content.length > 200 ? content.substring(0, 200) + '...' : content,
            priority: 'medium',
            actionable: false,
            estimated_impact: 'AI generated recommendation',
            category: 'AI'
          }
        ];
      } else {
        console.warn("Groq API returned no valid recommendations, triggering fallback.");
        return [];
      }
    } catch (error) {
      console.error("Error calling Groq API:", error);
      throw error;
    }
  },
};