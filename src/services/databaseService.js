// Mock database service for frontend
const mockClinics = {
  hair: [
    { name: "Hair Care Clinic", rating: 4.5, address: "123 Main St", contact: "555-0123" },
    { name: "Advanced Hair Center", rating: 4.8, address: "456 Oak Ave", contact: "555-0456" }
  ],
  ivf: [
    { name: "Fertility Center", rating: 4.7, address: "789 Pine Rd", contact: "555-0789" },
    { name: "IVF Specialists", rating: 4.6, address: "321 Elm St", contact: "555-0321" }
  ],
  cosmetic: [
    { name: "Beauty Med Spa", rating: 4.4, address: "654 Maple Dr", contact: "555-0654" },
    { name: "Cosmetic Surgery Center", rating: 4.9, address: "987 Cedar Ln", contact: "555-0987" }
  ],
  dental: [
    { name: "Smile Dental Care", rating: 4.6, address: "147 Birch St", contact: "555-0147" },
    { name: "Advanced Dentistry", rating: 4.7, address: "258 Willow Ave", contact: "555-0258" }
  ]
};

class DatabaseService {
  async getClinics(params) {
    try {
      const { type, location, rating } = params;
      
      // Get clinics based on type
      let clinics = mockClinics[type] || [];
      
      // Filter based on parameters using substring matching
      if (clinics.length > 0) {
        if (location) {
          clinics = clinics.filter(clinic => 
            clinic.address.toLowerCase().includes(location.toLowerCase())
          );
        }
        
        if (rating) {
          clinics = clinics.filter(clinic => 
            clinic.rating >= rating
          );
        }
      }
      
      return clinics;
    } catch (error) {
      console.error('Database Error:', error);
      return [];
    }
  }
}

export default new DatabaseService(); 