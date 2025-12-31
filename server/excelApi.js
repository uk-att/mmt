const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Directory containing Excel files
const EXCEL_DIR = path.join(__dirname, '../excel-files');

// List all Excel files in the directory
router.get('/excels', (req, res) => {
  fs.readdir(EXCEL_DIR, (err, files) => {
    if (err) return res.status(500).json({ error: 'Failed to read directory' });
    const excelFiles = files.filter(f => f.endsWith('.xlsx') || f.endsWith('.xls')).map(f => ({
      name: f,
      url: `/excel-files/${f}`
    }));
    res.json(excelFiles);
  });
});

module.exports = router;
