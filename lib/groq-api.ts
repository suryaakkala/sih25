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

export const groqApi = {
  async generateRecommendations({ studentData, recommendationType = 'all', count = 6, includeDetails = true, prompt }: GroqRecommendationOptions) {
    console.log("Prompt received:", prompt); // Log the prompt for debugging

    try {
      console.log("Payload sent to Groq API:", {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: prompt?.description || 'Provide recommendations.',
          },
        ],
      });

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
              content: prompt?.description || 'Provide recommendations.',
            },
          ],
        }),
      });

      console.log("Groq API response status:", response.status);
      const responseBody = await response.text(); // Read the response body once
      console.log("Groq API response body:", responseBody);

      if (!response.ok) {
        console.error("Groq API error:", responseBody);
        throw new Error(`Groq API returned status ${response.status}`);
      }

      const data = JSON.parse(responseBody); // Parse the response body
      console.log("Groq API response:", data);

      // Extract recommendations from Groq API response
      if (
        data.choices &&
        Array.isArray(data.choices) &&
        data.choices.length > 0 &&
        data.choices[0].message &&
        typeof data.choices[0].message.content === 'string'
      ) {
        // Extract title and description from the content
        const content = data.choices[0].message.content.trim();
        let title = prompt?.title || 'AI Recommendations';
        let description = content;
        // Try to extract a title from the first line or a heading
        const lines = content.split('\n').filter(Boolean);
        if (lines.length > 1) {
          // If the first line is a heading (starts with ** or #), use it as the title (preserve spaces)
          const firstLineRaw = lines[0].trim();
          const headingMatch = firstLineRaw.match(/^(\*\*|#+)\s*(.+?)(\*\*|#+)?$/);
          if (headingMatch && headingMatch[2] && headingMatch[2].length < 100) {
            title = headingMatch[2].trim();
            description = lines.slice(1).join('\n').trim();
          } else if (firstLineRaw.length > 0 && firstLineRaw.length < 100) {
            // If not a heading but a short first line, use as title
            title = firstLineRaw;
            description = lines.slice(1).join('\n').trim();
          }
        }
        return [
          {
            id: 'groq-1',
            type: 'ai_recommendation',
            title,
            description,
            priority: 'medium',
            actionable: true,
            estimated_impact: 'AI generated',
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
  // Optionally, add generateSmartNotification if needed
};
