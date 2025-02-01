import React, { useState, useRef, useEffect } from 'react';
import './ClinicChatInterface.css';
import geminiService from '../services/geminiService';
import databaseService from '../services/databaseService';

const ClinicsTable = ({ clinics, onClinicClick }) => (
  <div className="clinics-container">
    <div className="clinics-header">
      <div>Clinic Name</div>
      <div>Rating</div>
      <div>Address</div>
      <div>Contact</div>
    </div>
    {clinics.map((clinic, index) => (
      <div key={index} className="clinic-card" onClick={() => onClinicClick(clinic)}>
        <div className="clinic-grid">
          <div className="clinic-name">{clinic.name}</div>
          <div className="clinic-rating">
            {clinic.rating} <span className="star">⭐</span>
          </div>
          <div className="clinic-address">{clinic.address}</div>
          <div className="clinic-contact">{clinic.contact}</div>
        </div>
      </div>
    ))}
  </div>
);

const ClinicDetailView = ({ clinic, onClose }) => (
  <div className="clinic-detail-modal">
    <div className="clinic-detail-header">
      <div className="clinic-detail-name">{clinic.name}</div>
      <div className="clinic-detail-rating">
        {clinic.rating} <span className="star">⭐</span>
      </div>
    </div>
    <div className="clinic-detail-info">
      <div><strong>Address:</strong> {clinic.address}</div>
      <div><strong>Contact:</strong> {clinic.contact}</div>
      <div><strong>Services:</strong> {clinic.services}</div>
      <div><strong>Working Hours:</strong> {clinic.working_hours}</div>
      {clinic.doctors && <div><strong>Doctors:</strong> {clinic.doctors}</div>}
      {clinic.facilities && <div><strong>Facilities:</strong> {clinic.facilities}</div>}
      {clinic.website && <div><strong>Website:</strong> {clinic.website}</div>}
      {clinic.social_media && <div><strong>Social Media:</strong> {clinic.social_media}</div>}
    </div>
    <button className="book-appointment-btn">
      Book Appointment
    </button>
  </div>
);

const ClinicChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: "Hello! I'm your personal clinic advisor. How can I help you today?",
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  // Add a conversation state tracker
  const [conversationState, setConversationState] = useState({
    questionCount: 0,
    categoryIdentified: false,
    readyForRecommendations: false,
    category: null
  });

  // Add state to track user preferences
  const [userPreferences, setUserPreferences] = useState({
    type: null,
    location: null,
    rating: null,
    services: null
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to format clinic data as a table in markdown
  const [selectedClinic, setSelectedClinic] = useState(null);

const handleClinicClick = (clinic) => {
  setSelectedClinic(clinic);
};

const renderClinics = (clinics) => {
  return (
    <div className="clinics-container">
      {clinics.map((clinic, index) => (
        <ClinicCard 
          key={index} 
          clinic={clinic} 
          onClick={() => handleClinicClick(clinic)} 
        />
      ))}
    </div>
  );
};

// Function to extract preferences from conversation
const extractPreferences = (messages) => {
  const fullContext = messages.map(m => m.content).join(' ').toLowerCase();
  
  // Extract clinic type
  let type = null;
  if (fullContext.includes('hair') || fullContext.includes('bald')) type = 'hair';
  if (fullContext.includes('ivf') || fullContext.includes('fertility')) type = 'ivf';
  if (fullContext.includes('cosmetic') || fullContext.includes('beauty')) type = 'cosmetic';
  if (fullContext.includes('dental') || fullContext.includes('teeth')) type = 'dental';

  // Extract location using regex
  const locationMatch = fullContext.match(/in\s+([^,.]+)/i);
  const location = locationMatch ? locationMatch[1].trim() : null;

  // Extract minimum rating if mentioned
  const ratingMatch = fullContext.match(/(\d+(\.\d+)?)\s*star/i);
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

  return { type, location, rating };
};

const handleSend = async (e) => {
  e.preventDefault();
  if (!inputMessage.trim()) return;

  setMessages(prev => [...prev, { type: 'user', content: inputMessage }]);
  setIsLoading(true);

  try {
    const aiResponse = await geminiService.sendMessage(inputMessage);
    const conversationState = geminiService.getConversationState();

    if (conversationState.readyForRecommendations) {
      // Query database with gathered preferences
      const clinics = await databaseService.getClinics({
        type: conversationState.primaryConcern,
        location: conversationState.location,
        rating: conversationState.specificRequirements.minRating
      });

      if (clinics && clinics.length > 0) {
        setMessages(prev => [
          ...prev,
          { 
            type: 'bot',
            content: "Based on your requirements, I found these clinics that might be suitable for you:",
            isClinicList: true,
            clinics: clinics
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { 
            type: 'bot',
            content: "I apologize, but I couldn't find any clinics matching your requirements in our database. Would you like to broaden your search criteria or try a different location?"
          }
        ]);
      }
    } else {
      setMessages(prev => [...prev, { type: 'bot', content: aiResponse }]);
    }
  } catch (error) {
    console.error('Error:', error);
    setMessages(prev => [...prev, { 
      type: 'bot', 
      content: "I apologize, but I'm having trouble processing your request. Could you please try again?" 
    }]);
  }

  setIsLoading(false);
  setInputMessage('');
};

// Helper function to determine if enough information has been gathered
const shouldShowRecommendations = (questionCount, lastResponse) => {
  // Only show recommendations after at least 3 exchanges
  if (questionCount < 3) return false;

  // Check if the last response indicates readiness for recommendations
  const readinessIndicators = [
    'based on what you\'ve told me',
    'i understand your needs',
    'i can now recommend',
    'let me suggest',
    'i can help you find'
  ];

  return readinessIndicators.some(indicator => 
    lastResponse.toLowerCase().includes(indicator)
  );
};

// Helper function to determine category from user input
const determineCategory = (input) => {
  const text = input.toLowerCase();
  if (text.includes('hair') || text.includes('bald')) return 'hair';
  if (text.includes('ivf') || text.includes('fertility')) return 'ivf';
  if (text.includes('cosmetic') || text.includes('beauty')) return 'cosmetic';
  if (text.includes('dental') || text.includes('teeth')) return 'dental';
  return null;
};

// Helper function to determine clinic type from conversation
const determineClinicType = (messages, currentMessage) => {
  const fullContext = [...messages.map(m => m.content), currentMessage].join(' ').toLowerCase();
  
  if (fullContext.includes('hair') || fullContext.includes('transplant')) return 'hair';
  if (fullContext.includes('ivf') || fullContext.includes('fertility')) return 'ivf';
  if (fullContext.includes('cosmetic') || fullContext.includes('beauty')) return 'cosmetic';
  if (fullContext.includes('dental') || fullContext.includes('teeth')) return 'dental';
  
  return 'clinics';
};

// Update the render method to handle tables
const renderMessage = (message) => {
  if (message.isClinicList && message.clinics) {
    return (
      <div className="clinic-recommendations">
        <div className="message-bubble">
          {message.content}
          <ClinicsTable 
            clinics={message.clinics} 
            onClinicClick={setSelectedClinic} 
          />
          {selectedClinic && (
            <ClinicDetailView 
              clinic={selectedClinic} 
              onClose={() => setSelectedClinic(null)} 
            />
          )}
        </div>
      </div>
    );
  }
  return <div className="message-bubble">{message.content}</div>;
};

return (
  <div className="chat-container">
    <div className="chat-header">
      <h2>🏥 Clinic Advisor</h2>
      <p>Find the right clinic for your needs</p>
    </div>

    <div className="messages-container">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`message ${message.type === 'user' ? 'user-message' : 'bot-message'}`}
        >
          <div className="message-content">
            {message.type === 'bot' && (
              <div className="bot-avatar">🤖</div>
            )}
            {renderMessage(message)}
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="message bot-message">
          <div className="message-content">
            <div className="bot-avatar">🤖</div>
            <div className="message-bubble typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>

    <form className="input-container" onSubmit={handleSend}>
      <input
        type="text"
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        placeholder="Type your message here..."
        className="message-input"
      />
      <button type="submit" className="send-button">
        Send
      </button>
    </form>
  </div>
);
};

export default ClinicChatInterface; 