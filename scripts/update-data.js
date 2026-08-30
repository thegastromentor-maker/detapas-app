#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data.json');

console.log('🔄 Actualizando datos de restaurantes...');

https.get('https://www.detapasconchencho.es/mapa/', { timeout: 30000 }, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const startIdx = data.indexOf('window.DTCC_MAP');
            if (startIdx === -1) throw new Error('No se encontró DTCC_MAP');

            const startJson = data.indexOf('{', startIdx);
            const endJson = data.indexOf('});', startJson) + 2;
            const jsonStr = data.substring(startJson, endJson);

            const mapData = JSON.parse(jsonStr);
            const restaurants = mapData.points || [];

            if (restaurants.length === 0) throw new Error('Sin restaurantes');

            console.log(`✓ ${restaurants.length} restaurantes encontrados`);

            const cleanData = {
                points: restaurants,
                total: restaurants.length,
                updated: new Date().toISOString()
            };

            fs.writeFileSync(DATA_FILE, JSON.stringify(cleanData, null, 2), 'utf8');
            console.log(`✅ Datos actualizados`);
            process.exit(0);

        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(0);
        }
    });

}).on('error', (error) => {
    console.error('❌ Error:', error.message);
    process.exit(0);
});
