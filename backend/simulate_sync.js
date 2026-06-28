require('dotenv').config();
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./config');

async function run() {
    const payload = {
        id: 'd901e0ae-1a79-4503-ae6a-18313ac08b52',
        nom: 'Directeur Test',
        role: 'directeur',
        schoolSlug: 'csyzomacamb'
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    try {
        const url = 'http://localhost:3001/api/sync';
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-academic-year': '2025-2026',
                'Content-Type': 'application/json'
            }
        });

        console.log('Response Status:', response.status);
        const data = await response.json();
        console.log('JSON Keys:', Object.keys(data));
        console.log('academicYears in response:', data.academicYears);
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

run();
