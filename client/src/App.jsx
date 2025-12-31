import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import ExcelViewer from './ExcelViewer';
import Settings from './Settings';
import SharePointFiles from './SharePointFiles';
import ExcelDirectoryViewer from './ExcelDirectoryViewer';
import { saveExcelToDB, loadExcelFromDB } from './useExcelDB';
import CircularProgress from '@mui/material/CircularProgress';

function App() {
  const [form, setForm] = useState({ name: '', mappingName: '', smeName: '', address: '' });
  const [message, setMessage] = useState('');
  const [dapForm, setDapForm] = useState({ entityName: '', change: '' });
  const [dapMessage, setDapMessage] = useState('');
  const [transformation, setTransformation] = useState({ type: 'Camopi' });
  const [transMessage, setTransMessage] = useState('');
  const [notification, setNotification] = useState('');
  const [page, setPage] = useState('main');
  const [excelFile, setExcelFile] = useState(null);
  const [compareAllTabsReport, setCompareAllTabsReport] = useState(null);
  const [excelDirState, setExcelDirState] = useState(null);

  useEffect(() => {
    document.title = 'ETL Portal';
  }, []);

  // Disabled WebSocket connection to avoid connection errors
  // useEffect(() => {
  //   // Connect to WebSocket server for notifications
  //   const ws = new window.WebSocket('ws://localhost:3002');
  //   ws.onmessage = (event) => {
  //     try {
  //       const data = JSON.parse(event.data);
  //       if (data.type === 'excel_update') {
  //         if (Array.isArray(data.changes) && data.changes.length > 0) {
  //           const details = data.changes.map(c => `${c.cell}: ${c.text}`).join(' | ');
  //           setNotification(`Excel file updated! Changes: ${details}`);
  //         } else {
  //           setNotification('Excel file updated! No cell changes detected.');
  //         }
  //         setTimeout(() => setNotification(''), 10000);
  //       }
  //       // Optionally handle other message types
  //       if (data.type === 'new_record') {
  //         setNotification(`New record detected: ${data.payload ? JSON.stringify(data.payload) : ''}`);
  //         setTimeout(() => setNotification(''), 7000);
  //       }
  //     } catch (err) {
  //       // Ignore parse errors
  //     }
  //   };
  //   ws.onerror = () => {
  //     setNotification('WebSocket connection error.');
  //     setTimeout(() => setNotification(''), 7000);
  //   };
  //   return () => {
  //     ws.close();
  //   };
  // }, []);

  // Load file from IndexedDB on mount
  useEffect(() => {
    loadExcelFromDB().then(file => {
      if (file) setExcelFile(file);
    });
  }, []);

  // Save file to IndexedDB when selected
  const handleExcelFile = (file) => {
    if (file) {
      saveExcelToDB(file).then(() => setExcelFile(file));
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setMessage('Saved successfully!');
        setForm({ name: '', mappingName: '', smeName: '', address: '' });
      } else {
        setMessage('Error saving data.');
      }
    } catch (err) {
      setMessage('Error saving data.');
    }
  };

  return (
    <div style={{ fontFamily: 'Segoe UI, Arial, sans-serif', margin: '48px auto' }}>
      {notification && (
        <div style={{
          position: 'fixed',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)',
          color: '#fff',
          padding: '18px 32px',
          borderRadius: 12,
          fontWeight: 700,
          fontSize: 20,
          boxShadow: '0 4px 24px rgba(60,72,88,0.18)',
          zIndex: 9999,
          textAlign: 'center',
        }}>
          {notification}
        </div>
      )}
        <div style={{
          width: '100%',
          position: 'fixed',
          top: 0,
          left: 0,
          background: 'linear-gradient(90deg, #2563eb 0%, #1e40af 100%)',
          padding: '10px 0 6px 0',
          boxShadow: '0 2px 8px rgba(60,72,88,0.10)',
          zIndex: 1000,
        }}>
          <h1
            style={{
              textAlign: 'center',
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: 2,
              color: '#fff',
              margin: 0,
              fontFamily: 'Segoe UI, Arial, sans-serif',
            }}
          >
            ETL Portal
          </h1>
          <div style={{ position: 'absolute', top: 0, right: 32, height: '100%', display: 'flex', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(37,99,235,0.08)', borderRadius: 18, padding: '6px 18px', fontWeight: 600, color: '#fff', fontSize: 18 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ marginRight: 4 }}>
                <circle cx="12" cy="12" r="12" fill="#2563eb" />
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#fff" />
              </svg>
              User connected: Uri Koaz
            </span>
          </div>
        </div>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        gap: 32,
        marginTop: '96px',
        marginLeft: 180,
        marginLeft: 200,
      }}>
        {/* Menu Bar */}
        <div style={{
          width: 200,
          height: '100vh',
          background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)',
          borderRadius: '0 18px 18px 0',
          boxShadow: '2px 0 16px rgba(60,72,88,0.10)',
          padding: '48px 0 0 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          fontFamily: 'Segoe UI, Arial, sans-serif',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 999,
        }}>
          <div style={{ height: 64 }} />
          <button style={{ width: '80%', padding: '16px 0', marginBottom: 24, borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: 18, cursor: 'pointer', boxShadow: '0 2px 8px rgba(60,72,88,0.08)' }} onClick={() => setPage('dashboard')}>Dashboard</button>
          <button style={{ width: '80%', padding: '16px 0', marginBottom: 24, borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: 18, cursor: 'pointer', boxShadow: '0 2px 8px rgba(60,72,88,0.08)' }} onClick={() => setPage('main')}>Mappings</button>
          <button style={{ width: '80%', padding: '16px 0', marginBottom: 24, borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: 18, cursor: 'pointer', boxShadow: '0 2px 8px rgba(60,72,88,0.08)' }} onClick={() => setPage('transformations')}>Transformations</button>
          <button style={{ width: '80%', padding: '16px 0', marginBottom: 24, borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: 18, cursor: 'pointer', boxShadow: '0 2px 8px rgba(60,72,88,0.08)' }} onClick={() => setPage('settings')}>Run Transformation</button>
          <button style={{ width: '80%', padding: '16px 0', marginBottom: 24, borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: 18, cursor: 'pointer', boxShadow: '0 2px 8px rgba(60,72,88,0.08)' }} onClick={() => setPage('sharepoint')}>SharePoint Files</button>
          <button style={{ width: '80%', padding: '16px 0', marginBottom: 24, borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: 18, cursor: 'pointer', boxShadow: '0 2px 8px rgba(60,72,88,0.08)' }} onClick={() => setPage('exceldir')}>Find Fields Gaps</button>
        </div>
        {/* Main Content */}
        <div style={{ flex: 1, width: 'calc(100vw - 200px)' }}>
          {page === 'dashboard' ? (
            <Dashboard />
          ) : page === 'exceldir' ? (
            <ExcelDirectoryViewer
              onShowCompareAllTabsReport={report => {
                setCompareAllTabsReport(report);
                setPage('comparealltabs');
              }}
              savedState={excelDirState}
              onSaveState={state => setExcelDirState(state)}
            />
          ) : page === 'comparealltabs' ? (
            <div style={{ padding: 48 }}>
              <h2 style={{ color: '#2563eb', fontWeight: 700, marginBottom: 32, fontSize: 32 }}>Compare All Tabs Report</h2>
              {(!compareAllTabsReport || compareAllTabsReport.length === 0) && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 64 }}>
                  <CircularProgress style={{ color: '#2563eb', width: 64, height: 64, marginBottom: 24 }} />
                  <div style={{ color: '#64748b', fontSize: 20, fontWeight: 500 }}>Generating report...</div>
                </div>
              )}
              {compareAllTabsReport && compareAllTabsReport.length > 0 ? (
                compareAllTabsReport.map((row, idx) => (
                  <div key={idx} style={{ marginBottom: 40 }}>
                    <h3 style={{ color: '#6366f1', fontWeight: 700, fontSize: 22, marginBottom: 12 }}>
                      {row.tab} compared to {row.schema}.{row.table}:
                    </h3>
                    <div style={{ maxWidth: 650, background: '#f9fafb', borderRadius: 12, boxShadow: '0 2px 8px rgba(60,72,88,0.04)', padding: 24 }}>
                      <table style={{ width: '100%', minWidth: '400px', borderCollapse: 'collapse', marginBottom: 18 }}>
                        <thead>
                          <tr style={{ background: '#e0e7ff' }}>
                            <th style={{ border: '1px solid #a5b4fc', padding: '8px 12px', color: '#2563eb', fontWeight: 700, fontSize: 16 }}>Field Name</th>
                            <th style={{ border: '1px solid #a5b4fc', padding: '8px 12px', color: '#2563eb', fontWeight: 700, fontSize: 16 }}>In IDB Fields</th>
                            <th style={{ border: '1px solid #a5b4fc', padding: '8px 12px', color: '#2563eb', fontWeight: 700, fontSize: 16 }}>In Table Fields</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const allFields = Array.from(new Set([
                              ...(row.onlyInIdb || []),
                              ...(row.onlyInPg || []),
                              ...(row.idbFields || []).map(f => f && f.toString().trim().toLowerCase()),
                              ...(row.pgFields || []).map(f => f && f.toString().trim().toLowerCase()),
                            ]));
                            return allFields.map((field, idx2) => (
                              <tr key={idx2}>
                                <td style={{ border: '1px solid #a5b4fc', padding: '8px 12px', fontSize: 15 }}>{field}</td>
                                <td style={{ border: '1px solid #a5b4fc', padding: '8px 12px', textAlign: 'center', fontSize: 15 }}>{(row.idbFields || []).map(f => f && f.toString().trim().toLowerCase()).includes(field) ? '✔️' : ''}</td>
                                <td style={{ border: '1px solid #a5b4fc', padding: '8px 12px', textAlign: 'center', fontSize: 15 }}>{(row.pgFields || []).map(f => f && f.toString().trim().toLowerCase()).includes(field) ? '✔️' : ''}</td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                      <div style={{ marginBottom: 8, fontSize: 15 }}>
                        <b style={{ color: '#6366f1' }}>Only in IDB Fields:</b>
                        <span>{row.onlyInIdb && row.onlyInIdb.length > 0 ? row.onlyInIdb.join(', ') : 'None'}</span>
                      </div>
                      <div style={{ fontSize: 15 }}>
                        <b style={{ color: '#6366f1' }}>Only in Table Fields:</b>
                        <span>{row.onlyInPg && row.onlyInPg.length > 0 ? row.onlyInPg.join(', ') : 'None'}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div>No report data available.</div>
              )}
              <button style={{ marginTop: 32, padding: '12px 32px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 18, cursor: 'pointer' }} onClick={() => setPage('exceldir')}>Back to Fields Gaps</button>
            </div>
          ) : page === 'main' ? (
            <ExcelViewer excelFile={excelFile} onFileSelect={handleExcelFile} />
          ) : page === 'settings' ? (
            <Settings />
          ) : page === 'sharepoint' ? (
            <SharePointFiles />
          ) : null}
        </div>
      </div>
    </div>
  );
}
export default App;
