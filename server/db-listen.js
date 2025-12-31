import WebSocket, { WebSocketServer } from 'ws';
import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXCEL_PATH = path.resolve(__dirname, 'data.xlsx');
const wss = new WebSocketServer({ port: 3002 });

wss.on('connection', ws => {
  ws.send(JSON.stringify({ type: 'info', message: 'WebSocket connected' }));
});

function readExcelRaw() {
  if (!fs.existsSync(EXCEL_PATH)) return {};
  const workbook = XLSX.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return sheet;
}

let lastSheet = readExcelRaw();

chokidar.watch(EXCEL_PATH).on('change', () => {
  const newSheet = readExcelRaw();
  const changes = [];
  const allCells = new Set([...Object.keys(lastSheet), ...Object.keys(newSheet)]);
  for (const cell of allCells) {
    if (cell[0] === '!') continue; // skip meta keys
    const oldValue = lastSheet[cell]?.v;
    const newValue = newSheet[cell]?.v;
    console.log(`Cell ${cell}: oldValue=${oldValue}, newValue=${newValue}`);
    if (oldValue !== newValue) {
      changes.push({ cell, text: newValue });
    }
  }
  lastSheet = newSheet;
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'excel_update', changes }));
    }
  });
  console.log('Excel file updated, notification sent.', changes);
});

console.log('WebSocket server running on ws://localhost:3002');
console.log('Watching for changes in', EXCEL_PATH);
