import { filterClinics } from '../services/clinicService.js';

app.get('/api/clinics', async (req, res) => {
  try {
    const { treatmentType, location } = req.query;
    
    // Validate parameters
    if (!treatmentType?.trim() || !location?.trim()) {
      return res.status(400).json({
        error: 'Both treatmentType and location are required',
        clinics: []
      });
    }

    // Get clinics from database
    const clinics = await filterClinics({
      treatmentType: treatmentType.toLowerCase(),
      location: location.toLowerCase()
    });

    // Return structured response
    res.json({
      success: true,
      clinics,
      suggestions: clinics.length === 0 ? getAlternativeSuggestions(treatmentType) : []
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      clinics: [],
      suggestions: []
    });
  }
}); 