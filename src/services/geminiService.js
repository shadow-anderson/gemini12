import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are a professional medical clinic advisor. Your role is to help users find the right clinic by gathering specific information through conversation. 

CONVERSATION GUIDELINES:
1. Start with understanding their primary medical concern
2. Ask relevant follow-up questions to gather these key details:
   - Specific treatment/procedure they're interested in
   - Preferred location/area
   - Any specific requirements (e.g., ratings, facilities, doctors)
   - Budget considerations (if any)

SPECIALTY-SPECIFIC QUESTIONS:

For Hair Treatment:
- Pattern and duration of hair loss
- Previous treatments tried
- Type of treatment preferred (transplant, PRP, medications)
- Budget range for treatment

For IVF/Fertility:
- Duration of fertility concerns
- Previous treatments or diagnoses
- Specific fertility treatments interested in
- Preferred hospital facilities

For Cosmetic Procedures:
- Specific cosmetic concerns
- Type of procedures interested in
- Previous cosmetic treatments
- Recovery time preferences

For Dental Care:
- Specific dental issues
- Type of dental work needed
- Previous dental procedures
- Emergency or routine care

RECOMMENDATION PROCESS:
1. Only suggest clinics after gathering sufficient information
2. When ready to recommend, say "Based on your requirements, let me find suitable clinics for you."
3. Wait for the database results before providing specific recommendations

IMPORTANT:
- Ask one question at a time
- Confirm understanding before moving to next question
- Be empathetic and professional
- Don't make assumptions about clinics or treatments
- Don't provide specific clinic recommendations until all necessary information is gathered

Example conversation flow:
User: "I'm looking for hair treatment"
Assistant: "I understand you're interested in hair treatment. Could you tell me more about your hair concerns and how long you've been experiencing them?"
[Wait for user response]
Assistant: "Thank you for sharing. Which area or location would be convenient for you to visit the clinic?"
[Wait for user response]
[Continue gathering relevant information]`;

class GeminiService {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: "gemini-pro" });
    this.chat = this.model.startChat({
      history: [{
        role: "user",
        parts: [{ text: SYSTEM_PROMPT }]
      }]
    });

    // Track conversation state
    this.conversationState = {
      primaryConcern: null,
      location: null,
      specificRequirements: {},
      readyForRecommendations: false
    };
  }

  async sendMessage(message) {
    try {
      const result = await this.chat.sendMessage(message);
      const response = await result.response;
      
      // Update conversation state based on user input and AI response
      this.updateConversationState(message, response.text());
      
      return response.text();
    } catch (error) {
      console.error('Gemini AI Error:', error);
      return "I apologize, but I'm having trouble processing your request. Could you please try again?";
    }
  }

  updateConversationState(userMessage, aiResponse) {
    const lowerUserMessage = userMessage.toLowerCase();
    
    // Detect primary concern if not already set
    if (!this.conversationState.primaryConcern) {
      if (lowerUserMessage.includes('hair')) this.conversationState.primaryConcern = 'hair';
      else if (lowerUserMessage.includes('ivf') || lowerUserMessage.includes('fertility')) 
        this.conversationState.primaryConcern = 'ivf';
      else if (lowerUserMessage.includes('cosmetic')) 
        this.conversationState.primaryConcern = 'cosmetic';
      else if (lowerUserMessage.includes('dental')) 
        this.conversationState.primaryConcern = 'dental';
    }

    // Detect location
    const locationMatch = lowerUserMessage.match(/in\s+([^,.]+)/i);
    if (locationMatch) {
      this.conversationState.location = locationMatch[1].trim();
    }

    // Update specific requirements based on context
    if (lowerUserMessage.includes('rating')) {
      const ratingMatch = lowerUserMessage.match(/(\d+(\.\d+)?)\s*star/i);
      if (ratingMatch) {
        this.conversationState.specificRequirements.minRating = parseFloat(ratingMatch[1]);
      }
    }

    // Check if ready for recommendations
    this.conversationState.readyForRecommendations = 
      this.conversationState.primaryConcern && 
      this.conversationState.location &&
      aiResponse.toLowerCase().includes('based on your requirements');
  }

  getConversationState() {
    return this.conversationState;
  }
}

export default new GeminiService(); 