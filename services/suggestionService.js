export function getAlternativeSuggestions(treatmentType) {
  const suggestions = {
    'ivf': ['Fertility Treatments', 'Egg Freezing', 'Surrogacy'],
    'hair': ['Scalp Treatments', 'Dermatology', 'Skin Care'],
    'cosmetic': ['Plastic Surgery', 'Dermal Fillers', 'Skin Rejuvenation']
  };
  
  return suggestions[treatmentType.toLowerCase()] || [
    'General Medicine',
    'Dermatology',
    'Wellness Centers'
  ];
} 