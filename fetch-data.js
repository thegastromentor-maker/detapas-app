#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('📥 Descargando datos de De Tapas con Chencho...');

const url = 'https://www.detapasconchencho.es/mapa/';

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const startIdx = data.indexOf('window.DTCC_MAP');
            if (startIdx === -1) {
                throw new Error('No se encontró window.DTCC_MAP en el sitio');
            }

            const startJson = data.indexOf('{', startIdx);
            const endJson = data.indexOf('});', startJson) + 2;
            const jsonStr = data.substring(startJson, endJson);

            const mapData = JSON.parse(jsonStr);
            const restaurants = mapData.points || [];

            console.log(`✓ Se encontraron ${restaurants.length} restaurantes`);

            const zones = new Set();
            const categories = new Set();

            restaurants.forEach(r => {
                if (r.zone) zones.add(r.zone);
                if (Array.isArray(r.cuisines)) {
                    r.cuisines.forEach(c => categories.add(c));
                }
            });

            console.log(`✓ Zonas encontradas: ${zones.size}`);
            console.log(`✓ Categorías encontradas: ${categories.size}`);

            const dataFile = path.join(__dirname, 'data.json');
            fs.writeFileSync(dataFile, JSON.stringify(mapData, null, 2), 'utf8');

            console.log(`✅ Datos guardados en: data.json`);

        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    });

}).on('error', (error) => {
    console.error('❌ Error de conexión:', error.message);
    process.exit(1);
});
