import React, { useEffect, useState } from 'react';
import { signInAndGetToken } from './msalAuth';

// You need to set up authentication and get an access token for Microsoft Graph API
// This example assumes you have a valid token and site/drive info
// For production, use MSAL.js or similar to authenticate

const SHAREPOINT_SITE_ID = 'att.sharepoint.com,8e741d71-c6b6-47b0-803c-0f3b32b07556,1765188651025'; // Example, replace with your actual site ID
const DRIVE_ID = 'b!1234567890abcdef'; // Example, replace with your actual drive ID
const FOLDER_PATH = '/sites/Artemis_ATT_TLV/Shared Documents/ETL Team/ETL-transformations';

export default function SharePointFiles() {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const accessToken = window.localStorage.getItem('graphToken');
    if (!accessToken) return;
    const url = `https://graph.microsoft.com/v1.0/sites/${SHAREPOINT_SITE_ID}/drive/root:${FOLDER_PATH}:/children`;
    fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.value) {
          setFiles(data.value);
        } else {
          setError('No files found or error fetching files.');
        }
      })
      .catch(err => setError('Error fetching files: ' + err));
  }, []);

  const handleSignIn = async () => {
    setError('');
    try {
      await signInAndGetToken();
      window.location.reload();
    } catch (err) {
      setError('Authentication failed.');
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2 style={{ color: '#2563eb', fontWeight: 700 }}>SharePoint ETL Files</h2>
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      {!window.localStorage.getItem('graphToken') && (
        <button onClick={handleSignIn} style={{ background: '#2563eb', color: '#fff', fontWeight: 600, border: 'none', borderRadius: 8, padding: '12px 32px', fontSize: 18, cursor: 'pointer', marginBottom: 24 }}>
          Sign in with Microsoft
        </button>
      )}
      <ul style={{ fontSize: 18, listStyle: 'none', padding: 0 }}>
        {files.map(file => (
          <li key={file.id} style={{ marginBottom: 12 }}>
            <a href={file.webUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>{file.name}</a>
          </li>
        ))}
      </ul>
      {!error && files.length === 0 && window.localStorage.getItem('graphToken') && <div>No files found.</div>}
    </div>
  );
}
