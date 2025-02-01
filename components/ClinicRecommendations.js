import { useEffect, useState } from 'react';

function ClinicDetailModal({ clinic, onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="clinic-modal">
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h3>{clinic.Name}</h3>
        <div className="modal-grid">
          <div><strong>Address:</strong> {clinic.Fulladdress}</div>
          <div><strong>Contact:</strong> {clinic.Phone}</div>
          <div><strong>Rating:</strong> {clinic.rating}/5</div>
          <div><strong>Services:</strong> {clinic.services}</div>
          <div><strong>Website:</strong> {clinic.Website ? 
            <a href={clinic.Website} target="_blank" rel="noopener noreferrer">
              Visit Website
            </a> : 'N/A'}
          </div>
          <div><strong>Opening Hours:</strong> {clinic["Opening hours"] || 'N/A'}</div>
        </div>
      </div>
    </div>
  );
}

function ClinicRecommendations() {
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useState(new URLSearchParams(window.location.search));

  useEffect(() => {
    const fetchClinics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const treatment = searchParams.get('treatmentType');
        const location = searchParams.get('location');
        
        const response = await fetch(`/api/clinics?treatmentType=${treatment}&location=${location}`);
        const data = await response.json();
        
        if (data.success) {
          setClinics(data.clinics);
        } else {
          setError(data.error || 'Failed to fetch clinics');
        }
      } catch (error) {
        setError('Failed to connect to the server');
      } finally {
        setLoading(false);
      }
    };

    fetchClinics();
  }, [searchParams]);

  if (loading) {
    return <div className="loading">Loading clinics...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="clinics-container">
      <h2>Recommended Clinics</h2>
      <table className="clinic-table">
        <thead>
          <tr>
            <th>Clinic Name</th>
            <th>Location</th>
            <th>Rating</th>
            <th>Contact</th>
            <th>Services</th>
          </tr>
        </thead>
        <tbody>
          {clinics.map((clinic) => (
            <tr 
              key={clinic.Cid} 
              onClick={() => setSelectedClinic(clinic)}
              className="clinic-row"
            >
              <td>{clinic.Name}</td>
              <td>{clinic.Municipality}</td>
              <td>{clinic.rating}/5</td>
              <td>{clinic.Phone}</td>
              <td>{clinic.services}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {selectedClinic && (
        <ClinicDetailModal 
          clinic={selectedClinic} 
          onClose={() => setSelectedClinic(null)} 
        />
      )}
    </div>
  );
}

export default ClinicRecommendations; 