const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODERATION_PROMPT = `You are a content moderator for a comment system. Analyze the following comment and determine if it meets these guidelines:

Guidelines:
- No offensive or discriminatory language
- No profanity or vulgar content
- No personal attacks or harassment
- No spam or promotional content
- Be respectful and constructive
- Stay on topic

Analyze the comment and respond with a JSON object in the following format:
{
  "approved": true/false,
  "rating": 1-5 (only if approved, where 1 is poor quality and 5 is excellent quality),
  "reason": "explanation for rejection" (only if rejected),
  "feedback": "brief feedback about the comment quality"
}

Comment to analyze:
`;

async function moderateComment(commentText) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `${MODERATION_PROMPT}\n"${commentText}"\n\nProvide only the JSON response, no additional text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Try to parse the entire response as JSON
      try {
        const parsed = JSON.parse(text);
        return parsed;
      } catch (e) {
        console.error('Could not parse AI response as JSON:', text);
        return {
          approved: true,
          rating: 3,
          feedback: 'AI moderation unavailable, approved by default',
        };
      }
    }

    const moderationResult = JSON.parse(jsonMatch[0]);

    // Validate the response structure
    if (typeof moderationResult.approved !== 'boolean') {
      throw new Error('Invalid moderation response structure');
    }

    if (moderationResult.approved && !moderationResult.rating) {
      moderationResult.rating = 3; // Default rating
    }

    return moderationResult;
  } catch (error) {
    console.error('AI Moderation Error:', error);
    // In case of error, approve by default with a neutral rating
    return {
      approved: true,
      rating: 3,
      feedback: 'AI moderation service temporarily unavailable. Comment approved by default.',
      error: error.message,
    };
  }
}

module.exports = { moderateComment };
