import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { processAttendanceFile, createCsvBuffer } from '../services/attendanceService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputArg = process.argv[2];
if (!inputArg) {
  console.error('Usage: node generateReportPreview.mjs <path-to-attendance-file>');
  process.exit(1);
}

const inputPath = path.isAbsolute(inputArg) ? inputArg : path.resolve(__dirname, '..', '..', inputArg);
const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads');
const outputPath = path.join(uploadsDir, 'report-preview.csv');

const data = await processAttendanceFile(inputPath);
console.log('Parsed headers:', Object.keys(data[0] || {}));
console.log('Sample row 1:', data[0]);
const buf = createCsvBuffer(data);
fs.writeFileSync(outputPath, buf);

console.log('Wrote:', outputPath);
console.log('Bytes:', buf.length);
console.log('Rows:', data.length);
