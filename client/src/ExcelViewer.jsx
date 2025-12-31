import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

export default function ExcelViewer({ excelFile, onFileSelect }) {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [maxCols, setMaxCols] = useState(0);
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [workbook, setWorkbook] = useState(null);

  // Restore last selected sheet from localStorage
  useEffect(() => {
    const lastSheet = localStorage.getItem('excelSheet');
    if (lastSheet) setSelectedSheet(lastSheet);
  }, []);

  const parseSheet = (wb, sheetName) => {
    if (!sheetName) return;
    const ws = wb.Sheets[sheetName];
    if (!ws) return;
    const range = XLSX.utils.decode_range(ws['!ref']);
    const rows = [];
    let maxLen = 0;
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const row = [];
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = { c: C, r: R };
        const cellRef = XLSX.utils.encode_cell(cellAddress);
        row.push(ws[cellRef] ? ws[cellRef].v : '');
      }
      maxLen = Math.max(maxLen, row.length);
      rows.push(row);
    }
    setColumns(rows[0] || Array.from({ length: maxLen }, (_, i) => `Column ${i + 1}`));
    setMaxCols(maxLen);
    setData(rows.slice(1));
  };

  // Load from File object or ArrayBuffer
  useEffect(() => {
    if (excelFile) {
      if (excelFile instanceof File) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const arrayBuffer = evt.target.result;
          const wb = XLSX.read(arrayBuffer, { type: 'array' });
          setWorkbook(wb);
          setSheetNames(wb.SheetNames);
          const lastSheet = localStorage.getItem('excelSheet');
          const sheetToShow = lastSheet && wb.SheetNames.includes(lastSheet) ? lastSheet : wb.SheetNames[0];
          setSelectedSheet(sheetToShow);
          parseSheet(wb, sheetToShow);
        };
        reader.readAsArrayBuffer(excelFile);
      } else if (excelFile instanceof ArrayBuffer) {
        const wb = XLSX.read(excelFile, { type: 'array' });
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);
        const lastSheet = localStorage.getItem('excelSheet');
        const sheetToShow = lastSheet && wb.SheetNames.includes(lastSheet) ? lastSheet : wb.SheetNames[0];
        setSelectedSheet(sheetToShow);
        parseSheet(wb, sheetToShow);
      }
    }
    // eslint-disable-next-line
  }, [excelFile]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (onFileSelect) onFileSelect(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const arrayBuffer = evt.target.result;
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      setWorkbook(wb);
      setSheetNames(wb.SheetNames);
      setSelectedSheet(wb.SheetNames[0]);
      localStorage.setItem('excelSheet', wb.SheetNames[0]);
      parseSheet(wb, wb.SheetNames[0]);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSheetChange = (e) => {
    const sheet = e.target.value;
    setSelectedSheet(sheet);
    localStorage.setItem('excelSheet', sheet);
    if (workbook) {
      parseSheet(workbook, sheet);
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ color: '#2563eb', fontWeight: 700, fontSize: 24, marginBottom: 24 }}>Excel File Viewer</h2>
      <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} style={{ marginBottom: 24 }} />
      {sheetNames.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <label htmlFor="sheet-select" style={{ marginRight: 12, fontWeight: 600, color: '#2563eb' }}>Select Tab:</label>
          <select id="sheet-select" value={selectedSheet} onChange={handleSheetChange} style={{ padding: 8, borderRadius: 6, border: '1px solid #a5b4fc', fontSize: 16 }}>
            {sheetNames.map((name, idx) => (
              <option key={idx} value={name}>{name}</option>
            ))}
          </select>
        </div>
      )}
      {data.length > 0 ? (
        <table style={{ borderCollapse: 'collapse', width: '100%', background: '#fff', boxShadow: '0 2px 8px rgba(60,72,88,0.08)' }}>
          <thead>
            <tr>
              {Array.from({ length: maxCols }).map((_, idx) => (
                <th key={idx} style={{ border: '1px solid #a5b4fc', padding: 10, background: '#e0e7ff', color: '#2563eb', fontWeight: 700 }}>{columns[idx] || `Column ${idx + 1}`}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rIdx) => (
              <tr key={rIdx}>
                {Array.from({ length: maxCols }).map((_, cIdx) => (
                  <td key={cIdx} style={{ border: '1px solid #a5b4fc', padding: 10 }}>{row[cIdx] !== undefined ? row[cIdx] : ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ color: '#64748b', fontSize: 18 }}>No data loaded. Please select an Excel file.</div>
      )}
    </div>
  );
}
