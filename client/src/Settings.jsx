import React, { useState } from 'react';

export default function Settings() {
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [option, setOption] = useState('Cable');
  const [mode, setMode] = useState('Sdb2TDB');
  const [chunkProgress, setChunkProgress] = useState([]);
  const [chunkCount, setChunkCount] = useState(5);

  const startRun = () => {
    setRunning(true);
    setStarted(true);
    setProgress(0);
    const randomChunks = Math.floor(Math.random() * 6) + 3; // 3 to 8
    setChunkCount(randomChunks);
    let chunkVals = Array(randomChunks).fill(0);
    setChunkProgress(chunkVals);
    let total = 0;
    const interval = setInterval(() => {
      let doneChunks = 0;
      chunkVals = chunkVals.map((val, idx) => {
        if (val < 100) {
          const inc = Math.floor(Math.random() * 10) + 5;
          const newVal = Math.min(val + inc, 100);
          if (newVal === 100) doneChunks++;
          return newVal;
        } else {
          doneChunks++;
          return 100;
        }
      });
      setChunkProgress([...chunkVals]);
      total = Math.round(chunkVals.reduce((a, b) => a + b, 0) / randomChunks);
      setProgress(total);
      if (doneChunks === randomChunks) {
        clearInterval(interval);
        setRunning(false);
      }
    }, 500);
  };

  return (
    <div style={{ padding: 40 }}>
      <div style={{ marginBottom: 32, display: 'flex', gap: 32, alignItems: 'center' }}>
        <div>
          <label htmlFor="run-type" style={{ fontWeight: 600, color: '#2563eb', marginRight: 12 }}>Select Type:</label>
          <select id="run-type" value={option} onChange={e => setOption(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #a5b4fc', fontSize: 16 }}>
            <option value="Cable">Cable</option>
            <option value="Element">Element</option>
            <option value="Ports">Ports</option>
          </select>
        </div>
        <div>
          <label htmlFor="run-mode" style={{ fontWeight: 600, color: '#2563eb', marginRight: 12 }}>Select Mode:</label>
          <select id="run-mode" value={mode} onChange={e => setMode(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #a5b4fc', fontSize: 16 }}>
            <option value="Sdb2TDB">Sdb2TDB</option>
            <option value="TDB2MDB">TDB2MDB</option>
            <option value="Load">Load</option>
          </select>
        </div>
      </div>
      <button onClick={startRun} disabled={running} style={{ background: '#2563eb', color: '#fff', fontWeight: 600, border: 'none', borderRadius: 8, padding: '12px 32px', fontSize: 18, cursor: running ? 'not-allowed' : 'pointer', marginBottom: 32 }}>
        {running ? 'Running...' : 'Start Run'}
      </button>
      {started && (
        <>
          <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', background: '#e0e7ff', borderRadius: 12, boxShadow: '0 2px 8px rgba(60,72,88,0.08)', padding: 24, marginBottom: 32 }}>
            <div style={{ fontWeight: 600, color: '#2563eb', marginBottom: 12 }}>Total Progress</div>
            <div style={{ height: 32, background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(60,72,88,0.06)' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: '#2563eb', transition: 'width 0.4s', borderRadius: 8 }}></div>
            </div>
            <div style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb', marginTop: 8 }}>{progress}%</div>
          </div>
          <table style={{ width: '100%', maxWidth: 480, margin: '0 auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(60,72,88,0.08)', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: 12, background: '#e0e7ff', color: '#2563eb', fontWeight: 700, borderRadius: '12px 12px 0 0' }}>Chunk</th>
                <th style={{ padding: 12, background: '#e0e7ff', color: '#2563eb', fontWeight: 700, borderRadius: '12px 12px 0 0' }}>Progress</th>
              </tr>
            </thead>
            <tbody>
              {chunkProgress.map((val, idx) => (
                <tr key={idx}>
                  <td style={{ padding: 10, fontWeight: 600, color: '#2563eb', textAlign: 'center' }}>Chunk {idx + 1}</td>
                  <td style={{ padding: 10 }}>
                    <div style={{ height: 24, background: '#e0e7ff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(60,72,88,0.06)' }}>
                      <div style={{ height: '100%', width: `${val}%`, background: '#2563eb', transition: 'width 0.4s', borderRadius: 8 }}></div>
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb', marginTop: 4 }}>{val}%</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
