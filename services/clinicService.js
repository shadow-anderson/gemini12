export async function filterClinics(filters) {
  try {
    const searchTerm = `%${filters.treatmentType.toLowerCase()}%`;
    const locationTerm = `%${filters.location.toLowerCase()}%`;

    const query = `
      SELECT * FROM (
        SELECT Cid, Name, Fulladdress, Municipality, Categories, 
               "Average Rating" AS rating, Website, Phone,
               'clinics' AS source_table
        FROM clinics
        UNION ALL
        SELECT Cid, Name, Fulladdress, Municipality, Categories, 
               "Average Rating", Website, Phone, 'dendata'
        FROM dendata
        UNION ALL
        SELECT Cid, Name, Fulladdress, Municipality, Categories, 
               "Average Rating", Website, Phone, 'cosdata'
        FROM cosdata
        UNION ALL
        SELECT Cid, Name, Fulladdress, Municipality, Categories, 
               "Average Rating", Website, Phone, 'hairdata'
        FROM hairdata
        UNION ALL
        SELECT Cid, Name, Fulladdress, Municipality, Categories, 
               "Average Rating", Website, Phone, 'ivfdata' 
        FROM ivfdata
      )
      WHERE 
        LOWER(Municipality) LIKE ? AND
        (
          LOWER(Categories) LIKE ? OR
          EXISTS (
            SELECT 1 
            FROM json_each('["' || REPLACE(Categories, ', ', '","') || '"]') 
            WHERE LOWER(json_each.value) LIKE ?
          )
        )
      ORDER BY rating DESC
      LIMIT 20
    `;

    console.log('Executing query:', query);
    console.log('Parameters:', [locationTerm, searchTerm, `%${filters.treatmentType}%`]);

    const results = await db.all(query, [
      locationTerm,
      searchTerm,
      `%${filters.treatmentType.toLowerCase()}%`
    ]);
    
    console.log('Raw database results:', results.slice(0, 2)); // First 2 results
    
    return results.map(clinic => ({
      Cid: clinic.Cid,
      Name: clinic.Name || 'Unknown Clinic',
      Municipality: clinic.Municipality || 'Unknown Location',
      Phone: clinic.Phone || 'Not Available',
      rating: clinic.rating ? Number(clinic.rating).toFixed(1) : 'N/A',
      services: clinic.categories ? clinic.categories.split(',').map(c => c.trim()) : 'No services listed',
      Fulladdress: clinic.Fulladdress,
      Website: clinic.Website,
      "Opening hours": clinic["Opening hours"],
      source_table: clinic.source_table
    }));
    
  } catch (error) {
    console.error('Database error:', error);
    return [];
  }
} 