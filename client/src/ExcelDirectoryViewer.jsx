
import React, { useState, useEffect, useRef } from 'react';
import { Button, Table, Tabs, Tab, Box, Typography, CircularProgress, Alert } from '@mui/material';
import { styled } from '@mui/system';
import axios from 'axios';
import { Scrollbars } from 'react-custom-scrollbars-2';
import { visuallyHidden } from '@mui/utils';
import { SaveAlt } from '@mui/icons-material';
import { saveAs } from 'file-saver';
import PropTypes from 'prop-types';
import PostgresSchemaTree from './PostgresSchemaTree';
import * as XLSX from 'xlsx';


// Helper to extract all IDB Table values from all Excel files/tabs
async function extractIdbSchemasFromAllFiles(files) {
  const idbSchemas = new Set();
  for (const file of files) {
    try {
      const wb = await fetchExcelFile(file.url);
      for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        for (let i = 0; i < data.length; i++) {
          if (data[i][0] && data[i][0].toString().trim().toLowerCase() === 'idb table') {
            const val = data[i][1];
            if (val && typeof val === 'string') {
              // e.g. inventory.physical_port -> idb_inventory
              const schema = val.split('.')[0];
              if (schema) idbSchemas.add('idb_' + schema.toLowerCase());
            }
          }
        }
      }
    } catch (e) { /* ignore errors for missing/invalid files */ }
  }
  return Array.from(idbSchemas);
}

// Helper to read all Excel files in a directory (requires backend API)
async function fetchExcelFiles() {
  // This should call your backend API to list Excel files in a directory
  // Example: GET /api/excels returns [{ name, url }]
  const res = await fetch('/api/excels');
  return res.json();
}

// Helper to fetch and parse an Excel file
async function fetchExcelFile(url) {
  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  return wb;
}

export default function ExcelDirectoryViewer({ onShowCompareAllTabsReport, savedState, onSaveState }) {
  const [files, setFiles] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [selected, setSelected] = useState({ file: null, sheet: null });
  const [sheetData, setSheetData] = useState([]);
  // Map of IDB Field name -> SDB Expression (from current sheet)
  const [idbFieldSdbExpr, setIdbFieldSdbExpr] = useState({});
  const [idbFields, setIdbFields] = useState([]);
  const [pgFields, setPgFields] = useState([]);
  const [compareResult, setCompareResult] = useState(null);
  const [compareError, setCompareError] = useState('');
  const [allTabsReport, setAllTabsReport] = useState([]);
  const [allTabsLoading, setAllTabsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const selectedPgTable = useRef({ schema: null, table: null, fields: [] });
  const idbSchemas = Array.from(new Set(files.flatMap(file => {
    if (!file._workbook) return [];
    return file._workbook.SheetNames.flatMap(sheet => {
      const ws = file._workbook.Sheets[sheet];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      return data.flatMap((row, i) => {
        if (row[0] && row[0].toString().trim().toLowerCase() === 'idb table') {
          const val = row[1];
          if (val && typeof val === 'string') {
            // e.g. inventory.physical_port -> idb_inventory
            const schema = val.split('.')[0];
            return schema ? ['idb_' + schema.toLowerCase()] : [];
          }
        }
        return [];
      });
    });
  })));

  // Track relevant schemas for PostgresSchemaTree
  const [relevantSchemas, setRelevantSchemas] = useState([]);

  // Track available tables from Excel tabs
  const [availableTables, setAvailableTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");

  // State for Excel file filter
  const [selectedExcel, setSelectedExcel] = useState("");

  // Add state for showing single compare report as a full page/tab
  const [showCompareReportTab, setShowCompareReportTab] = useState(false);

  useEffect(() => {
    async function loadFilesAndSchemas() {
      setLoading(true);
      const excelFiles = await fetchExcelFiles();
      setFiles(excelFiles);
      // Extract relevant schemas from Excel files
      const schemas = await extractIdbSchemasFromAllFiles(excelFiles);
      setRelevantSchemas(schemas);
      // Extract available tables from Excel tabs, filtered by selectedExcel
      let tables = [];
      const filteredFiles = selectedExcel ? excelFiles.filter(f => f.name === selectedExcel) : excelFiles;
      for (const file of filteredFiles) {
        const wb = await fetchExcelFile(file.url);
        for (const sheetName of wb.SheetNames) {
          const ws = wb.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
          for (let i = 0; i < data.length; i++) {
            if (data[i][0] && data[i][0].toString().trim().toLowerCase() === 'idb table') {
              const val = data[i][1];
              if (val && typeof val === 'string') {
                const parts = val.split('.');
          // If any value is exactly false, use 'FALSE' (all caps)
          if (debugSdbExpr.valDisplayField === false) {
            sdbExpr = 'FALSE';
          } else if (debugSdbExpr.valIdbFieldMap === false) {
            sdbExpr = 'FALSE';
          } else if (debugSdbExpr.valNormField === false) {
            sdbExpr = 'FALSE';
          } else {
            sdbExpr = debugSdbExpr.valDisplayField || debugSdbExpr.valIdbFieldMap || debugSdbExpr.valNormField || '';
          }
              }
            }
          }
        }
      }
      setAvailableTables(Array.from(new Set(tables)));
      setLoading(false);
    }
    loadFilesAndSchemas();
  }, [selectedExcel]);

  // Restore state from savedState if provided
  useEffect(() => {
    if (savedState) {
      setSelected(savedState.selected || { file: null, sheet: null });
      setExpanded(savedState.expanded || {});
      setSelectedTable(savedState.selectedTable || "");
    }
  }, [savedState]);

  // Save state before navigating away
  async function handleCompareAllTabs() {
    if (onSaveState) {
      onSaveState({ selected, expanded, selectedTable });
    }
    setAllTabsLoading(true);
    const report = [];
    // Filter files by selectedExcel if set
    const filteredFiles = selectedExcel ? files.filter(f => f.name === selectedExcel) : files;
    for (const file of filteredFiles) {
      if (!file._workbook) {
        try {
          // Use Promise.all to fetch all missing workbooks before loop
          const wb = await fetchExcelFile(file.url);
          file._workbook = wb;
        } catch (e) { continue; }
      }
      if (!file._workbook) continue;
      for (const sheet of file._workbook.SheetNames) {
        const ws = file._workbook.Sheets[sheet];
        if (!ws) continue;
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        // Find IDB Table and IDB Fields
        let idbTable = null;
        let idbFields = [];
        for (let i = 0; i < data.length; i++) {
          if (data[i][0] && data[i][0].toString().trim().toLowerCase() === 'idb table') {
            idbTable = data[i][1];
          }
        }
        let idbFieldStart = -1;
        for (let i = 0; i < data.length; i++) {
          if (data[i][1] && data[i][1].toString().trim().toLowerCase() === 'idb field') {
            idbFieldStart = i + 1;
            break;
          }
        }
        if (idbFieldStart >= 0) {
          for (let i = idbFieldStart; i < data.length; i++) {
            if (!data[i]) continue;
            const val = data[i][1];
            if (!val) continue;
            if (val.toString().trim().toLowerCase() === 'idb table' || val.toString().trim().toLowerCase() === 'idb field') break;
            idbFields.push(val);
          }
        }
        if (!idbTable || idbFields.length === 0) continue;
        // Parse schema and table from idbTable
        const [schemaRaw, tableRaw] = idbTable.split('.');
        const schema = schemaRaw ? 'idb_' + schemaRaw.toLowerCase() : null;
        const table = tableRaw ? tableRaw.toLowerCase() : null;
        if (selectedTable && table !== selectedTable) continue;
        // Fetch Postgres table fields
        let pgFields = [];
        if (schema && table) {
          try {
            const res = await fetch(`/pg/schemas/${schema}/tables/${table}/columns`);
            pgFields = await res.json();
          } catch (e) { /* ignore errors */ }
        }
        // Compare fields
        const normalize = f => f && f.toString().replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
        const idbMap = new Map(idbFields.map(f => [normalize(f), f]));
        const pgMap = new Map(pgFields.map(f => [normalize(f), f]));
        const allFields = Array.from(new Set([...idbMap.keys(), ...pgMap.keys()]));
        // Prepare report rows, display canonical field name (prefer Postgres, else Excel)
        const reportRows = allFields.map(f => {
          const canonical = pgMap.get(f) || idbMap.get(f) || f;
          return {
            field: canonical,
            inExcel: idbMap.has(f),
            inPg: pgMap.has(f)
          };
        });
        // Sanitize fields before storing in report
        const sanitize = f => (typeof f === 'object' && f !== null) ? (f.name || f.column_name || JSON.stringify(f)) : (f || '');
        report.push({
          file: file.name,
          tab: sheet,
          idbTable,
          schema,
          table,
          idbFields: idbFields.map(sanitize),
          pgFields: pgFields.map(sanitize),
          reportRows
        });
      }
    }
    setAllTabsReport(report);
    setAllTabsLoading(false);
    if (onShowCompareAllTabsReport) {
      onShowCompareAllTabsReport(report);
    }
  }

  // Expand/collapse Excel file in tree and load workbook if not loaded
  const handleExpand = async (file) => {
    // If already expanded, collapse
    if (expanded[file.name]) {
      setExpanded(prev => ({ ...prev, [file.name]: false }));
      return;
    }
    // If workbook not loaded, fetch and parse it
    if (!file._workbook) {
      try {
        const wb = await fetchExcelFile(file.url);
        // Attach workbook to file object
        setFiles(prevFiles => prevFiles.map(f => f.name === file.name ? { ...f, _workbook: wb } : f));
        setExpanded(prev => ({ ...prev, [file.name]: wb.SheetNames }));
      } catch (e) {
        // Optionally show error
        setExpanded(prev => ({ ...prev, [file.name]: false }));
      }
    } else {
      // Workbook already loaded, just expand
      setExpanded(prev => ({ ...prev, [file.name]: file._workbook.SheetNames }));
    }
  };

  // Select a specific sheet in an Excel file
  const handleSelectSheet = (file, sheet) => {
    if (!file._workbook) return setSelected({ file: file.name, sheet });
    const ws = file._workbook.Sheets[sheet];
    if (!ws) return setSelected({ file: file.name, sheet });
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    setSheetData(data);
    // Extract IDB Table
    let idbTableValue = null;
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().trim().toLowerCase() === 'idb table') {
        idbTableValue = data[i][1];
        break;
      }
    }
    // Extract IDB Fields
    let idbFieldStart = -1;
    for (let i = 0; i < data.length; i++) {
      if (data[i][1] && data[i][1].toString().trim().toLowerCase() === 'idb field') {
        idbFieldStart = i + 1;
        break;
      }
    }
    const idbFieldsArr = [];
    const sdbExprMap = {};
    if (idbFieldStart >= 0) {
      for (let i = idbFieldStart; i < data.length; i++) {
        if (!data[i]) continue;
        const val = data[i][1];
        if (!val) continue;
        if (val.toString().trim().toLowerCase() === 'idb table' || val.toString().trim().toLowerCase() === 'idb field') break;
        idbFieldsArr.push(val);
        // SDB Expression is in column 4 (index 3)
        const sdbExpr = data[i][4];
        // Accept all defined values, including 'False', 0, ''
        if (sdbExpr !== undefined && sdbExpr !== null) {
          sdbExprMap[val] = sdbExpr;
        }
      }
    }
    setIdbFields(idbFieldsArr);
    setIdbFieldSdbExpr(sdbExprMap);
    setSelected({ file: file.name, sheet });
  };

  // Add at the top:
  function CompareFieldsReportPage({ compareResult, idbFields, pgFields, onBack, selected, selectedPgTable, idbFieldSdbExpr }) {
        // Handler to send this report by email
        async function handleSendCompareReportEmail() {
          const emails = window.prompt('Enter comma-separated email addresses:');
          if (!emails) return;
          try {
            const response = await fetch('/api/send-emails', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                emails: emails.split(',').map(e => e.trim()),
                report: {
                  compareResult,
                  idbFields: safeIdbFields,
                  pgFields: safePgFields,
                  selected,
                  selectedPgTable: selectedPgTable.current
                }
              })
            });
            const result = await response.json();
            if (response.ok) {
              alert('Email sent!');
            } else {
              alert('Failed to send email: ' + (result.message || 'Unknown error'));
            }
          } catch (e) {
            alert('Failed to send email: ' + (e.message || e));
          }
        }
    // Extra sanitization: ensure all fields are strings
    const sanitize = f => (typeof f === 'object' && f !== null) ? (f.name || f.column_name || JSON.stringify(f)) : (f || '');
    // Normalize for comparison
    const normalize = f => f && f.toString().replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    const safeIdbFieldsRaw = idbFields.map(sanitize);
    // For pgFields, use the 'name' property for normalization and display
    const safePgFieldsRaw = pgFields.map(f => (typeof f === 'object' && f !== null) ? (f.name || f.column_name || JSON.stringify(f)) : (f || ''));
    const safeIdbFields = safeIdbFieldsRaw.map(normalize);
    const safePgFields = safePgFieldsRaw.map(normalize);
    // Helper to filter out fields that start with 'etl_' (case-insensitive)
    const isNotEtl = f => !(typeof f === 'string' && f.trim().toLowerCase().startsWith('etl_'));

    // Set of normalized Excel fields for quick lookup
    const idbFieldSet = new Set(safeIdbFields);
    // Set of normalized DB fields for quick lookup
    const pgFieldSet = new Set(safePgFields);

    // Map normalized field -> original field for display
    const idbFieldMap = new Map();
    safeIdbFields.forEach((norm, i) => { idbFieldMap.set(norm, safeIdbFieldsRaw[i]); });
    const pgFieldMap = new Map();
    safePgFields.forEach((norm, i) => { pgFieldMap.set(norm, safePgFieldsRaw[i]); });

    // Build allFields as normalized, but display original
    const allFieldsNorm = Array.from(new Set([
      ...compareResult.onlyInIdb.map(normalize),
      ...compareResult.onlyInPg.map(normalize),
      ...safeIdbFields,
      ...safePgFields,
    ]))
      // Remove empty, null, or fields that are objects without a name/column_name
      .filter(f => {
        const orig = idbFieldMap.get(f) || pgFieldMap.get(f) || f;
        if (orig === null || orig === undefined || orig === '') return false;
        if (typeof orig === 'object') {
          if (orig.name) return true;
          if (orig.column_name) return true;
          return false;
        }
        // Remove fields that normalize to 'objectobject'
        if (typeof orig === 'string' && orig.trim().toLowerCase() === 'objectobject') return false;
        return true;
      })
      .filter(f => isNotEtl(idbFieldMap.get(f) || pgFieldMap.get(f) || f));

    // Build a normalized SDB Expression map for robust lookup
    const normSdbExprMap = {};
    if (idbFieldSdbExpr) {
      Object.keys(idbFieldSdbExpr).forEach(key => {
        normSdbExprMap[normalize(key)] = idbFieldSdbExpr[key];
      });
    }

    return (
      <div style={{ width: '100%', marginTop: 32, background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)', borderRadius: 28, boxShadow: '0 12px 36px rgba(60,72,88,0.22)', padding: 56, maxWidth: 1300, marginLeft: 'auto', marginRight: 'auto', border: '2px solid #a5b4fc', transition: 'box-shadow 0.2s, border 0.2s' }}>
        <h2 style={{ marginBottom: 40, color: '#2563eb', fontWeight: 900, fontSize: 40, letterSpacing: 2, textAlign: 'center', textShadow: '0 4px 16px rgba(60,72,88,0.18)' }}>Compare Fields Report</h2>
        <div style={{ marginBottom: 16, fontSize: 16 }}>
          <strong>Excel Tab:</strong> {selected.sheet || 'N/A'} <br />
          <strong>Postgres Table:</strong> {selectedPgTable.current.schema || 'N/A'}.{selectedPgTable.current.table || 'N/A'}
        </div>
        <div style={{ overflowX: 'auto', paddingBottom: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: '#fff', borderRadius: 20, boxShadow: '0 4px 16px rgba(60,72,88,0.12)', fontSize: 18 }}>
            <thead>
              <tr style={{ background: 'linear-gradient(90deg, #e0e7ff 0%, #f8fafc 100%)', fontSize: 20 }}>
                <th style={{ border: '1px solid #a5b4fc', padding: '18px 24px', color: '#2563eb', fontWeight: 900 }}>Field Name</th>
                <th style={{ border: '1px solid #a5b4fc', padding: '18px 24px', color: '#2563eb', fontWeight: 900 }}>In Excel Fields</th>
                <th style={{ border: '1px solid #a5b4fc', padding: '18px 24px', color: '#2563eb', fontWeight: 900 }}>In DB Table Fields</th>
                <th style={{ border: '1px solid #a5b4fc', padding: '18px 24px', color: '#6366f1', fontWeight: 900 }}>DB Field Type</th>
                <th style={{ border: '1px solid #a5b4fc', padding: '18px 24px', color: '#6366f1', fontWeight: 900 }}>Not Null in DB</th>
                <th style={{ border: '1px solid #a5b4fc', padding: '18px 24px', color: '#6366f1', fontWeight: 900 }}>SDB Expression</th>
                {/* Removed debug columns */}
              </tr>
            </thead>
            <tbody>
              {(() => {
                return allFieldsNorm
                  .map((normField, idx) => {
                    // Display original field name (prefer DB, then Excel, then normalized)
                    let displayField = pgFieldMap.get(normField) || idbFieldMap.get(normField) || normField;
                    // If displayField is an object, extract name or column_name
                    if (displayField && typeof displayField === 'object') {
                      displayField = displayField.name || displayField.column_name || JSON.stringify(displayField);
                    }
                    // Highlight logic: _id in DB, not in Excel, and _comp in Excel
                    let highlight = false;
                    let debugReason = '';
                    if (
                      normField.endsWith('_id') &&
                      pgFieldSet.has(normField) &&
                      !idbFieldSet.has(normField)
                    ) {
                      // Look for <base>_id_comp in Excel
                      const compField = normField + '_comp';
                      if (idbFieldSet.has(compField)) {
                        highlight = true;
                        debugReason = `compField: ${compField} in idbFieldSet`;
                      } else {
                        debugReason = `compField: ${compField} NOT in idbFieldSet`;
                      }
                    } else {
                      debugReason = 'not _id or present in Excel';
                    }
                    // For yellow-highlighted _id fields, show the _comp field name in the Excel column
                    let excelFieldDisplay = '';
                    if (highlight) {
                      const compField = normField + '_comp';
                      let excelFieldObj = idbFieldMap.get(compField);
                      if (excelFieldObj && typeof excelFieldObj === 'object') {
                        excelFieldDisplay = excelFieldObj.name || excelFieldObj.column_name || JSON.stringify(excelFieldObj);
                      } else {
                        excelFieldDisplay = excelFieldObj || compField;
                      }
                    } else {
                      if (idbFieldSet.has(normField)) {
                        let excelFieldObj = idbFieldMap.get(normField);
                        if (excelFieldObj && typeof excelFieldObj === 'object') {
                          excelFieldDisplay = excelFieldObj.name || excelFieldObj.column_name || JSON.stringify(excelFieldObj);
                        } else {
                          excelFieldDisplay = '✔️';
                        }
                      } else {
                        excelFieldDisplay = '';
                      }
                    }
                    // SDB Expression: always use normalized lookup for robust matching
                    let sdbExpr = '';
                    let debugSdbExpr = {};
                    if (normSdbExprMap) {
                      debugSdbExpr.normDisplayField = normalize(displayField);
                      debugSdbExpr.normIdbFieldMap = normalize(idbFieldMap.get(normField));
                      debugSdbExpr.normNormField = normField;
                      debugSdbExpr.valDisplayField = normSdbExprMap[normalize(displayField)];
                      debugSdbExpr.valIdbFieldMap = normSdbExprMap[normalize(idbFieldMap.get(normField))];
                      debugSdbExpr.valNormField = normSdbExprMap[normField];
                      // If all are boolean false, set to 'FALSE'; if all are boolean true, set to 'TRUE'
                      if (
                        debugSdbExpr.valDisplayField === false &&
                        debugSdbExpr.valIdbFieldMap === false &&
                        debugSdbExpr.valNormField === false
                      ) {
                        sdbExpr = 'FALSE';
                      } else if (
                        debugSdbExpr.valDisplayField === true &&
                        debugSdbExpr.valIdbFieldMap === true &&
                        debugSdbExpr.valNormField === true
                      ) {
                        sdbExpr = 'TRUE';
                      } else {
                        sdbExpr = debugSdbExpr.valDisplayField || debugSdbExpr.valIdbFieldMap || debugSdbExpr.valNormField || '';
                        // If the chosen value is boolean false, set to 'FALSE'; if true, set to 'TRUE'
                        if (sdbExpr === false) sdbExpr = 'FALSE';
                        if (sdbExpr === true) sdbExpr = 'TRUE';
                      }
                    }
                    return (
                      <tr key={idx}>
                        <td
                          style={{
                            border: '1px solid #a5b4fc',
                            padding: '8px 12px',
                            fontSize: 15,
                            background: highlight ? '#fffbe6' : undefined,
                            color: highlight ? '#b45309' : undefined,
                            fontWeight: highlight ? 700 : undefined
                          }}
                        >{displayField}</td>
                        <td style={{ border: '1px solid #a5b4fc', padding: '8px 12px', textAlign: 'center', fontSize: 15 }}>{excelFieldDisplay}</td>
                        <td style={{ border: '1px solid #a5b4fc', padding: '8px 12px', textAlign: 'center', fontSize: 15 }}>{pgFieldSet.has(normField) ? '✔️' : ''}</td>
                        {/* DB Field Type column */}
                        <td style={{ border: '1px solid #a5b4fc', padding: '8px 12px', color: '#334155', fontSize: 14 }}>
                          {(() => {
                            // Find the matching pgField object by normalized name
                            const idx = pgFields.findIndex(f => {
                              if (typeof f === 'object' && f !== null && f.name) {
                                return normalize(f.name) === normField;
                              }
                              return false;
                            });
                            if (idx !== -1 && pgFields[idx] && typeof pgFields[idx] === 'object') {
                              return pgFields[idx].data_type || '';
                            }
                            return '';
                          })()}
                        </td>
                        {/* Mandatory column */}
                        <td style={{ border: '1px solid #a5b4fc', padding: '8px 12px', color: '#334155', fontSize: 14, textAlign: 'center' }}>
                          {(() => {
                            const idx = pgFields.findIndex(f => {
                              if (typeof f === 'object' && f !== null && f.name) {
                                return normalize(f.name) === normField;
                              }
                              return false;
                            });
                            if (idx !== -1 && pgFields[idx] && typeof pgFields[idx] === 'object') {
                              if (pgFields[idx].is_nullable === 'NO') return 'TRUE';
                              if (pgFields[idx].is_nullable === 'YES') return 'FALSE';
                            }
                            return '';
                          })()}
                        </td>
                        <td
                          style={{
                            border: '1px solid #a5b4fc',
                            padding: '8px 12px',
                            color: (
                              sdbExpr === null ||
                              sdbExpr === undefined ||
                              String(sdbExpr).trim() === '' ||
                              (typeof sdbExpr === 'string' && sdbExpr.trim().toLowerCase() === 'null')
                            ) ? '#b91c1c' : '#6366f1',
                            fontSize: 14,
                            background: (
                              sdbExpr === null ||
                              sdbExpr === undefined ||
                              String(sdbExpr).trim() === '' ||
                              (typeof sdbExpr === 'string' && sdbExpr.trim().toLowerCase() === 'null')
                            ) ? '#fee2e2' : undefined
                          }}
                        >
                          {(() => {
                            // Print the value even if it's null/empty, and style accordingly
                            if (sdbExpr === null) return 'null';
                            if (sdbExpr === undefined) return 'undefined';
                            if (String(sdbExpr).trim() === '') return '';
                            if (typeof sdbExpr === 'string' && sdbExpr.trim().toLowerCase() === 'null') return 'null';
                            if (sdbExpr === false || (typeof sdbExpr === 'string' && sdbExpr.trim().toLowerCase() === 'false')) return 'FALSE';
                            if (sdbExpr === true || (typeof sdbExpr === 'string' && sdbExpr.trim().toLowerCase() === 'true')) return 'TRUE';
                            return String(sdbExpr);
                          })()}
                        </td>
                        {/* Removed debug columns */}
                      </tr>
                    );
                  });
              })()}
            </tbody>
          </table>
        </div>
        <div style={{ marginBottom: 8, fontSize: 15 }}>
          <b style={{ color: '#6366f1' }}>Only in IDB Fields:</b>
          <span>{compareResult.onlyInIdb.length > 0 ? compareResult.onlyInIdb.join(', ') : 'None'}</span>
        </div>
        <div style={{ fontSize: 15 }}>
          <b style={{ color: '#6366f1' }}>Only in Table Fields:</b>
          <span>{compareResult.onlyInPg.length > 0 ? compareResult.onlyInPg.join(', ') : 'None'}</span>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
          <button
            style={{ padding: '12px 32px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 18, cursor: 'pointer' }}
            onClick={handleSendCompareReportEmail}
          >Send Email</button>
          <button
            style={{ padding: '12px 32px', background: '#64748b', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 18, cursor: 'pointer' }}
            onClick={onBack}
          >Back</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 0', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px' }}>
        <h2 style={{ color: '#2563eb', fontWeight: 700, marginBottom: 32, fontSize: 32, letterSpacing: 1 }}>Find Fields Gaps</h2>
        {loading && <div style={{ color: '#64748b', fontSize: 18, marginBottom: 16 }}>Loading...</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32, alignItems: 'start', position: 'relative' }}>
          {/* Excel File & Tab Selection */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(60,72,88,0.08)', padding: 24, position: 'relative' }}>
            <h3 style={{ color: '#2563eb', fontWeight: 700, marginBottom: 16, fontSize: 22 }}>Select Excel File & Tab</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {files.map(file => (
                <li key={file.name} style={{ marginBottom: 12 }}>
                  <span style={{ cursor: 'pointer', color: '#2563eb', fontWeight: 600, fontSize: 17 }} onClick={() => handleExpand(file)}>
                    {expanded[file.name] ? '▼' : '►'} {file.name}
                  </span>
                  {expanded[file.name] && Array.isArray(expanded[file.name]) && file._workbook && (
                    <ul style={{ marginLeft: 24, listStyle: 'none', padding: 0 }}>
                      {expanded[file.name].filter(sheet => {
                        // Only show sheets that have both IDB Table and IDB Fields
                        const ws = file._workbook.Sheets[sheet];
                        if (!ws) return false;
                        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                        let hasIdbTable = false, hasIdbFields = false;
                        for (let i = 0; i < data.length; i++) {
                          if (data[i][0] && data[i][0].toString().trim().toLowerCase() === 'idb table') hasIdbTable = true;
                          if (data[i][1] && data[i][1].toString().trim().toLowerCase() === 'idb field') hasIdbFields = true;
                        }
                        return hasIdbTable && hasIdbFields;
                      }).map(sheet => (
                        <li key={sheet}>
                          <span
                            style={{ cursor: 'pointer', color: selected.file === file.name && selected.sheet === sheet ? '#10b981' : '#6366f1', fontWeight: 500, fontSize: 16 }}
                            onClick={() => handleSelectSheet(file, sheet)}
                          >
                            {sheet}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            {selected.file && selected.sheet && (
              <div style={{ marginTop: 24, background: '#f1f5f9', borderRadius: 8, padding: 16 }}>
                <div style={{ fontWeight: 600, color: '#6366f1', marginBottom: 4 }}>IDB Table:</div>
                <ul style={{ margin: 0, paddingLeft: 20, marginBottom: 10 }}>
                  {(() => {
                    let idbTableValue = null;
                    if (sheetData && sheetData.length > 0) {
                      for (let i = 0; i < sheetData.length; i++) {
                        if (
                          sheetData[i][0] &&
                          sheetData[i][0].toString().trim().toLowerCase() === 'idb table'
                        ) {
                          idbTableValue = sheetData[i][1];
                          break;
                        }
                      }
                    }
                    return idbTableValue ? (
                      <li style={{ color: '#0f172a', fontSize: 18 }}>{idbTableValue}</li>
                    ) : <li style={{ color: '#64748b' }}>No value found</li>;
                  })()}
                </ul>
                <div style={{ fontWeight: 600, color: '#6366f1', marginBottom: 4 }}>IDB Fields & SDB Expressions:</div>
                <ul style={{ margin: 0, paddingLeft: 20, marginBottom: 0 }}>
                  {idbFields.length > 0
                    ? idbFields.map((val, idx) => {
                        let sdbValue = idbFieldSdbExpr && (idbFieldSdbExpr[val] !== undefined && idbFieldSdbExpr[val] !== null)
                          ? (idbFieldSdbExpr[val] === false ? 'FALSE' : (idbFieldSdbExpr[val] === true ? 'TRUE' : String(idbFieldSdbExpr[val])))
                          : null;
                        return (
                          <li key={idx} style={{ color: '#334155', fontSize: 16 }}>
                            <span>{val}</span>
                            {sdbValue !== null ? (
                              <span style={{ color: '#64748b', marginLeft: 8 }}>
                                [SDB: <span style={{ fontStyle: 'italic' }}>{sdbValue}</span>]
                              </span>
                            ) : null}
                          </li>
                        );
                      })
                    : <li style={{ color: '#64748b' }}>No fields found</li>}
                </ul>
              </div>
            )}
          </div>
          {/* Postgres Table Selection */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(60,72,88,0.08)', padding: 24, position: 'relative' }}>
            <h3 style={{ color: '#2563eb', fontWeight: 700, marginBottom: 16, fontSize: 22 }}>Select Postgres Table</h3>
            <PostgresSchemaTree
              onTableSelect={(schema, table, fields) => {
                // Pass full field objects (with data_type, is_nullable, etc.)
                selectedPgTable.current = { schema, table, fields };
                console.debug("selectedPgTable = ", selectedPgTable);
                setPgFields(fields);
              }}
            />
          </div>
          {/* Compare & View Report box below, spanning both columns */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(60,72,88,0.08)', padding: 24, minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <h3 style={{ color: '#2563eb', fontWeight: 700, marginBottom: 16, fontSize: 22 }}>Compare & View Report</h3>
            {/* Hide Compare Fields button and controls if report tab is open */}
            {!showCompareReportTab && (
              <>
                <button
                  style={{ marginBottom: 24, padding: '14px 40px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 20, cursor: 'pointer', boxShadow: '0 2px 8px rgba(60,72,88,0.10)' }}
                  onClick={() => {
                    setCompareError("");
                    if (!selected.file || !selected.sheet) {
                      setCompareError("Please select an Excel file and tab before comparing.");
                      return;
                    }
                    console.debug("selected = ", selected);
                    console.debug("selectedPgTable = ", selectedPgTable);
                    if (!selectedPgTable.current.schema || !selectedPgTable.current.table) {
                      setCompareError("Please select a Postgres schema and table before comparing.");
                      return;
                    }
                    // Use normalized fields for comparison
                    const normalize = f => f && f.toString().replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
                    const idbSet = new Set(idbFields.map(normalize).filter(Boolean));
                    const pgSet = new Set(pgFields.map(normalize).filter(Boolean));
                    if (idbSet.size === 0 || pgSet.size === 0) {
                      setCompareError("Both Excel tab and Postgres table must have fields to compare.");
                      return;
                    }
                    const onlyInIdb = Array.from(idbSet).filter(f => !pgSet.has(f));
                    const onlyInPg = Array.from(pgSet).filter(f => !idbSet.has(f));
                    setCompareResult({ onlyInIdb, onlyInPg });
                    setShowCompareReportTab(true);
                  }}
                >Compare Fields</button>
                {/* ComboBox for Excel file filter - above table combobox */}
                <div style={{ marginBottom: 16, width: 'auto', minWidth: 240, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <label htmlFor="excel-combobox" style={{ fontWeight: 600, color: '#2563eb', marginBottom: 8, display: 'block' }}>Select Excel File:</label>
                  <select
                    id="excel-combobox"
                    value={selectedExcel}
                    onChange={e => setSelectedExcel(e.target.value)}
                    style={{ width: 240, minWidth: 240, padding: '14px 40px', borderRadius: 10, border: '1px solid #a5b4fc', fontSize: 16, boxSizing: 'border-box' }}
                  >
                    <option value="">All Excels</option>
                    {files.map((file, idx) => (
                      <option key={idx} value={file.name}>{file.name}</option>
                    ))}
                  </select>
                </div>
                {/* ComboBox for available tables - below Excel combobox */}
                <div style={{ marginBottom: 24, width: 'auto', minWidth: 240, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <label htmlFor="table-combobox" style={{ fontWeight: 600, color: '#2563eb', marginBottom: 8, display: 'block' }}>Select Table to Compare:</label>
                  <select
                    id="table-combobox"
                    value={selectedTable}
                    onChange={e => setSelectedTable(e.target.value)}
                    style={{ width: 240, minWidth: 240, padding: '14px 40px', borderRadius: 10, border: '1px solid #a5b4fc', fontSize: 16, boxSizing: 'border-box' }}
                  >
                    <option value="">All Tables</option>
                    {availableTables.map((tbl, idx) => (
                      <option key={idx} value={tbl}>{tbl}</option>
                    ))}
                  </select>
                </div>
                <button
                  style={{ marginBottom: 24, padding: '14px 40px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 20, cursor: 'pointer', boxShadow: '0 2px 8px rgba(60,72,88,0.10)' }}
                  onClick={handleCompareAllTabs}
                  disabled={allTabsLoading}
                >{allTabsLoading ? 'Comparing All...' : 'Compare All Tabs'}</button>
                {allTabsLoading && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 32 }}>
                    <CircularProgress style={{ color: '#10b981', width: 48, height: 48, marginBottom: 16 }} />
                    <div style={{ color: '#64748b', fontSize: 18, fontWeight: 500 }}>Comparing all tabs...</div>
                  </div>
                )}
                {compareError && (
                  <div style={{ color: '#ef4444', background: '#fef2f2', borderRadius: 8, padding: '10px 18px', marginBottom: 16, fontWeight: 600, fontSize: 16, textAlign: 'center' }}>
                    {compareError}
                  </div>
                )}
              </>
            )}
            {/* Show Compare Fields report as a full page/tab like Compare All Tabs */}
            {showCompareReportTab && compareResult && (
              <CompareFieldsReportPage
                compareResult={compareResult}
                idbFields={idbFields}
                pgFields={pgFields}
                onBack={() => setShowCompareReportTab(false)}
                selected={selected}
                selectedPgTable={selectedPgTable}
                idbFieldSdbExpr={idbFieldSdbExpr}
              />
            )}
            {/* All Tabs Report */}
            {!allTabsLoading && allTabsReport.length > 0 && (
              <div style={{ width: '100%', marginTop: 32, background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)', borderRadius: 28, boxShadow: '0 12px 36px rgba(60,72,88,0.22)', padding: 56, maxWidth: 1300, marginLeft: 'auto', marginRight: 'auto', border: '2px solid #a5b4fc', transition: 'box-shadow 0.2s, border 0.2s' }}>
                <h2 style={{ marginBottom: 40, color: '#10b981', fontWeight: 900, fontSize: 40, letterSpacing: 2, textAlign: 'center', textShadow: '0 4px 16px rgba(60,72,88,0.18)' }}>All Tabs Comparison Report</h2>
                <div style={{ overflowX: 'auto', paddingBottom: 12 }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: '#fff', borderRadius: 20, boxShadow: '0 4px 16px rgba(60,72,88,0.12)', fontSize: 18 }}>
                    <thead>
                      <tr style={{ background: 'linear-gradient(90deg, #e0e7ff 0%, #f8fafc 100%)', fontSize: 20 }}>
                        <th style={{ border: '1px solid #a5b4fc', padding: '18px 24px', color: '#2563eb', fontWeight: 900 }}>File</th>
                        <th style={{ border: '1px solid #a5b4fc', padding: '18px 24px', color: '#2563eb', fontWeight: 900 }}>Tab</th>
                        <th style={{ border: '1px solid #a5b4fc', padding: '18px 24px', color: '#2563eb', fontWeight: 900 }}>IDB Table</th>
                        <th style={{ border: '1px solid #a5b4fc', padding: '18px 24px', color: '#2563eb', fontWeight: 900 }}>Schema</th>
                        <th style={{ border: '1px solid #a5b4fc', padding: '18px 24px', color: '#2563eb', fontWeight: 900 }}>Table</th>
                        <th style={{ border: '1px solid #a5b4fc', padding: '18px 24px', color: '#ef4444', fontWeight: 900 }}>Fields only in Excel</th>
                        <th style={{ border: '1px solid #a5b4fc', padding: '18px 24px', color: '#6366f1', fontWeight: 900 }}>Fields only in Postgres</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allTabsReport.map((row, idx) => (
                        <tr key={idx} style={{ background: idx % 2 === 0 ? '#f1f5f9' : '#fff', fontSize: 18, transition: 'background 0.2s' }}>
                          <td style={{ border: '1px solid #a5b4fc', padding: '14px 20px', fontWeight: 700 }}>{row.file}</td>
                          <td style={{ border: '1px solid #a5b4fc', padding: '14px 20px', fontWeight: 700 }}>{row.tab}</td>
                          <td style={{ border: '1px solid #a5b4fc', padding: '14px 20px', fontWeight: 700 }}>{row.idbTable}</td>
                          <td style={{ border: '1px solid #a5b4fc', padding: '14px 20px', fontWeight: 700 }}>{row.schema}</td>
                          <td style={{ border: '1px solid #a5b4fc', padding: '14px 20px', fontWeight: 700 }}>{row.table}</td>
                          <td style={{ border: '1px solid #a5b4fc', padding: '14px 20px', color: '#ef4444', fontWeight: 700 }}>{row.onlyInIdb.join(', ') || 'None'}</td>
                          <td style={{ border: '1px solid #a5b4fc', padding: '14px 20px', color: '#6366f1', fontWeight: 700 }}>{row.onlyInPg.join(', ') || 'None'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
