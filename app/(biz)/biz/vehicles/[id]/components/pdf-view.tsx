import React from 'react';
import { VehiclePics } from '../../admin/tables/components/row-actions';

interface RegistrationPDFProps {
  registrationImages: VehiclePics[]; // Array of PDF objects with `name` and `url`
}

const RegistrationPDFList: React.FC<RegistrationPDFProps> = ({ registrationImages }) => {
  if (!registrationImages || registrationImages.length === 0) {
    return <p>No registration documents available.</p>;
  }

  return (
    <div className="registration-pdf-list">
      <h3>Registration Documents</h3>
      <ul>
        {registrationImages.map((doc, index) => (
          <li key={index} className="registration-pdf-item">
            <a href={doc.url} target="_blank" rel="noopener noreferrer">
              {doc.name || `Registration Document ${index + 1}`}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RegistrationPDFList;
