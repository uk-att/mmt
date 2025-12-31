const express = require('express');
const cors = require('cors');
const path = require('path');
const excelApi = require('./excelApi');
const pgApi = require('./pgApi');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Serve Excel files statically
app.use('/excel-files', express.static(path.join(__dirname, '../excel-files')));

// API route for listing Excel files
app.use('/api', excelApi);
// API route for PostgreSQL schemas/tables/columns
app.use('/pg', pgApi);

const sendMail = require('./sendMail');
// API endpoint to send emails with a report
app.post('/api/send-emails', async (req, res) => {
  const { emails, report } = req.body;
  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ message: 'No emails provided' });
  }
  try {
    const subject = 'Report from Compare Fields App';
    const text = typeof report === 'string' ? report : JSON.stringify(report, null, 2);
    const html = `<pre>${text}</pre>`;
    await sendMail({
      to: emails.join(','),
      subject,
      text,
      html,
    });
    res.status(200).json({ message: 'Emails sent' });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ message: 'Failed to send emails', error: err && err.message ? err.message : String(err) });
  }
});

let savedData = [];

app.post('/save', (req, res) => {
  const { name, mappingName, smeName, address } = req.body;
  if (name && mappingName && smeName && address) {
    savedData.push({ name, mappingName, smeName, address });
    res.status(200).json({ message: 'Saved successfully' });
  } else {
    res.status(400).json({ message: 'Name, Mapping Name, SME name, and address required' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
