import React, { useEffect, useState } from 'react';

export default function PostgresSchemaTree({ filterSchemas, onTableSelect }) {
  const [schemas, setSchemas] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [tables, setTables] = useState({});
  const [columns, setColumns] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/pg/schemas')
      .then(res => res.json())
      .then(data => {
        console.log('DEBUG: Loaded schemas', data);
        setSchemas(data);
      });
  }, []);

  const handleExpandSchema = async (schema) => {
    if (expanded[schema]) {
      setExpanded({ ...expanded, [schema]: false });
      return;
    }
    setLoading(true);
    const res = await fetch(`/pg/schemas/${schema}/tables`);
    const tbls = await res.json();
    setTables({ ...tables, [schema]: tbls });
    setExpanded({ ...expanded, [schema]: true });
    setLoading(false);
  };

  const handleExpandTable = async (schema, table) => {
    const key = `${schema}.${table}`;
    if (columns[key]) {
      setColumns({ ...columns, [key]: null });
      return;
    }
    setLoading(true);
    const res = await fetch(`/pg/schemas/${schema}/tables/${table}/columns`);
    let cols = await res.json();
    // Do not sanitize: keep full column object for type and is_nullable
    setColumns({ ...columns, [key]: cols });
    setLoading(false);
    // Notify parent of selection
    if (onTableSelect && typeof onTableSelect === 'function') {
      console.debug("schema = ", schema)
      console.debug("table = ", table)
      console.debug("cols = ", cols)
      onTableSelect(schema, table, cols);
    }
  };

  // Filter schemas if filterSchemas is provided
  const shownSchemas = filterSchemas && Array.isArray(filterSchemas) && filterSchemas.length > 0
    ? schemas.filter(s => filterSchemas.includes(s))
    : schemas;
  return (
    <div style={{ minWidth: 320, maxWidth: 400, background: '#f8fafc', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(60,72,88,0.06)' }}>
      {loading && <div>Loading...</div>}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {shownSchemas.length === 0 && <li style={{ color: '#64748b' }}>No schemas found</li>}
        {shownSchemas.map(schema => (
          <li key={schema} style={{ marginBottom: 8 }}>
            <span style={{ cursor: 'pointer', color: '#6366f1', fontWeight: 600 }} onClick={() => handleExpandSchema(schema)}>
              {expanded[schema] ? '▼' : '►'} {schema}
            </span>
            {expanded[schema] && tables[schema] && (
              <ul style={{ marginLeft: 24, listStyle: 'none', padding: 0 }}>
                {tables[schema].map(table => (
                  <li key={table}>
                    <span style={{ cursor: 'pointer', color: '#10b981', fontWeight: 500 }} onClick={() => handleExpandTable(schema, table)}>
                      {columns[`${schema}.${table}`] ? '▼' : '►'} {table}
                    </span>
                    {columns[`${schema}.${table}`] && (
                      <ul style={{ marginLeft: 24, listStyle: 'none', padding: 0 }}>
                        {columns[`${schema}.${table}`].map((col, idx) => {
                          let colName = (typeof col === 'object' && col !== null) ? (col.name || col.column_name || '[unnamed]') : String(col);
                          let colType = (typeof col === 'object' && col !== null) ? (col.data_type || '') : '';
                          let colNullable = (typeof col === 'object' && col !== null) ? (col.is_nullable === 'YES' ? 'NULLABLE' : 'NOT NULL') : '';
                          return (
                            <li key={idx} style={{ color: '#334155', fontSize: 15 }}>
                              {colName}
                              {colType && (
                                <span style={{ color: '#64748b', marginLeft: 8, fontStyle: 'italic', fontSize: 13 }}>
                                  [{colType}]
                                </span>
                              )}
                              {colNullable && (
                                <span style={{ color: colNullable === 'NULLABLE' ? '#10b981' : '#b91c1c', marginLeft: 8, fontSize: 13 }}>
                                  {colNullable}
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
