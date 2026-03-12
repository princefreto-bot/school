const fs = require('fs');
const path = require('path');
const DATA_PATH = path.join('c:', 'Users', 'LENOVO', 'Desktop', 'D', 'backend', 'data', 'edufinance_db.json');
const db = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
console.log('Students count in JSON:', db.students.length);
