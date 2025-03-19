'use client'; // Important: Mark as Client Component

import { useState } from 'react';

interface ApiResponse {
  message: string;
}

const MyComponent: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    setError(null); // Clear any previous errors

    try {
      const response = await fetch('https://soupersizeme.com/index.php', { // Replace with your PHP server URL
        method: 'POST', // Or 'GET' if your PHP handles GET requests
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'User' }), // Send data to PHP (if needed for POST)
      });

      if (!response.ok) {
        const errorData = await response.json(); // Try to parse error response from PHP
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`); // Use error message from PHP if available
      }

      const data: ApiResponse = await response.json();
      setMessage(data.message);
    } catch (err: any) {
      console.error('Error calling PHP API:', err);
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleClick} disabled={loading}>
        {loading ? 'Loading...' : 'Call AAPI by Jimmie'}
      </button>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {message && <p>{message}</p>}
    </div>
  );
};

export default MyComponent;