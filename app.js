// Variables globales
let allRestaurants = [];
let map = null;
let markers = [];
let allZones = new Set();
let allCategories = new Set();
let installPrompt = null;

// Detectar si es primera vez y mostrar modal de instalación
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPrompt = e;
    showInstallModal();
});

// Inicializar la app
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando app...');
    await loadRestaurants();
    setupServiceWorker();

    // Mostrar modal de instalación si es la primera vez
    if (!localStorage.getItem('visited')) {
        localStorage.setItem('visited', 'true');
        showInstallModal();
    }
});

// Cargar restaurantes desde la web
async function loadRestaurants() {
    try {
        console.log('Cargando restaurantes...');

        // Usar CORS proxy para evitar problemas
        const corsProxy = 'https://cors-anywhere.herokuapp.com/';
        const targetUrl = 'https://www.detapasconchencho.es/mapa/';

        // Intentar cargar sin proxy primero
        let response;
        try {
            response = await fetch(targetUrl);
        } catch (e) {
            console.log('Intentando con CORS proxy...');
            response = await fetch(corsProxy + targetUrl, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
        }

        const html = await response.text();

        // Crear un contexto para ejecutar el script
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const scripts = doc.querySelectorAll('script');

        // Buscar el script que contiene los datos
        let dataScript = null;
        for (let script of scripts) {
            if (script.textContent.includes('DTCC_MAP')) {
                dataScript = script.textContent;
                break;
            }
        }

        if (!dataScript) {
            throw new Error('No se encontraron los datos del mapa');
        }

        // Extraer los datos usando regex
        const match = dataScript.match(/window\.DTCC_MAP\s*=\s*(\{[\s\S]*?\});/);
        if (!match) {
            throw new Error('No se pudo parsear los datos del mapa');
        }

        // Parsear JSON
        const mapData = JSON.parse(match[1]);
        allRestaurants = mapData.points || [];

        console.log(`Cargados ${allRestaurants.length} restaurantes`);

        // Extraer zonas y categorías únicas
        allRestaurants.forEach(r => {
            if (r.zone) allZones.add(r.zone);
            if (r.cuisines) {
                if (Array.isArray(r.cuisines)) {
                    r.cuisines.forEach(c => allCategories.add(c));
                } else if (typeof r.cuisines === 'string') {
                    allCategories.add(r.cuisines);
                }
            }
        });

        // Llenar dropdowns
        populateFilters();

        // Cargar artículo más reciente
        loadLatestArticle();

    } catch (error) {
        console.error('Error cargando restaurantes:', error);

        // Mostrar datos de demo si hay error
        loadDemoData();
    }
}

// Datos de demostración para pruebas
function loadDemoData() {
    console.log('Usando datos de demostración...');

    allRestaurants = [
        {
            id: 1,
            title: 'Bar de Tapas El Rincón',
            address: 'Calle Betis, 1',
            lat: 37.3886,
            lng: -5.9842,
            zone: 'Sevilla (Triana)',
            cuisines: ['Tapas y cocina sevillana'],
            specialties: ['Espetos', 'Boquerones'],
            image: 'https://via.placeholder.com/150',
            url: 'https://www.detapasconchencho.es/'
        },
        {
            id: 2,
            title: 'Casa Lucio',
            address: 'Plaza Nueva, 5',
            lat: 37.3941,
            lng: -5.9884,
            zone: 'Sevilla (Centro)',
            cuisines: ['Cocina tradicional'],
            specialties: ['Rabo de toro', 'Salmorejo'],
            image: 'https://via.placeholder.com/150',
            url: 'https://www.detapasconchencho.es/'
        },
        {
            id: 3,
            title: 'Eslabón Perdido',
            address: 'Avenida Constitución, 12',
            lat: 37.3866,
            lng: -5.9823,
            zone: 'Sevilla (Centro)',
            cuisines: ['Tapas y cocina sevillana'],
            specialties: ['Atún', 'Gambas'],
            image: 'https://via.placeholder.com/150',
            url: 'https://www.detapasconchencho.es/'
        }
    ];

    allZones.add('Sevilla (Triana)');
    allZones.add('Sevilla (Centro)');
    allCategories.add('Tapas y cocina sevillana');
    allCategories.add('Cocina tradicional');

    populateFilters();

    // Mostrar mensaje
    const latestContent = document.getElementById('latestArticleContent');
    if (latestContent) {
        latestContent.innerHTML = '<p style="color: #E74C3C;">⚠️ Usando datos de demostración. Cuando se publique en GitHub Pages, los datos se cargarán en tiempo real.</p>';
    }
}

// Llenar los filtros de zona y categoría
function populateFilters() {
    const zoneFilter = document.getElementById('zoneFilter');
    const categoryFilter = document.getElementById('categoryFilter');

    // Zonas
    Array.from(allZones).sort().forEach(zone => {
        const option = document.createElement('option');
        option.value = zone;
        option.textContent = zone;
        zoneFilter.appendChild(option);
    });

    // Categorías
    Array.from(allCategories).sort().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

// Cargar último artículo
async function loadLatestArticle() {
    try {
        const response = await fetch('https://www.detapasconchencho.es/');
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');

        // Buscar el primer artículo en el listado
        const article = doc.querySelector('article');
        if (!article) {
            console.warn('No se encontró artículo');
            return;
        }

        // Extraer datos
        const title = article.querySelector('h1, h2, .entry-title, [class*="title"]')?.textContent || 'Último artículo';
        const url = article.querySelector('a')?.href || '#';
        const image = article.querySelector('img')?.src || '';
        const description = article.querySelector('.entry-excerpt, .summary, p')?.textContent || '';

        const latestContent = document.getElementById('latestArticleContent');
        latestContent.innerHTML = `
            ${image ? `<img src="${image}" alt="${title}" onerror="this.style.display='none'">` : ''}
            <h4>${title}</h4>
            <p>${description.substring(0, 150)}...</p>
            <a href="${url}" target="_blank">Leer más →</a>
        `;

    } catch (error) {
        console.warn('Error cargando artículo:', error);
        document.getElementById('latestArticleContent').innerHTML = `
            <p>No se pudo cargar el último artículo. Intenta más tarde.</p>
        `;
    }
}

// Filtrar restaurantes
function filterRestaurants() {
    const zone = document.getElementById('zoneFilter').value;
    const category = document.getElementById('categoryFilter').value;

    const filtered = allRestaurants.filter(r => {
        const zoneMatch = !zone || r.zone === zone;
        const categoryMatch = !category || (
            Array.isArray(r.cuisines) ? r.cuisines.includes(category) : r.cuisines === category
        );
        return zoneMatch && categoryMatch;
    });

    displayRestaurants(filtered);
}

// Mostrar restaurantes
function displayRestaurants(restaurants) {
    const list = document.getElementById('restaurantsList');

    if (restaurants.length === 0) {
        list.innerHTML = '<div class="loading">No se encontraron restaurantes</div>';
        return;
    }

    list.innerHTML = restaurants.map(r => `
        <div class="restaurant-card" onclick="openRestaurantArticle('${r.url}')">
            <div class="restaurant-card-header">
                ${r.image ? `<img src="${r.image}" alt="${r.title}" class="restaurant-card-image" onerror="this.style.display='none'">` : '<div class="restaurant-card-image"></div>'}
                <div class="restaurant-card-content">
                    <div class="zone">${r.zone || 'Sevilla'}</div>
                    <h4>${r.title}</h4>
                    <p>${r.address || ''}</p>
                    <div class="tags">
                        ${r.cuisines ? `<span class="tag">${Array.isArray(r.cuisines) ? r.cuisines[0] : r.cuisines}</span>` : ''}
                        ${r.specialties ? `<span class="tag">${Array.isArray(r.specialties) ? r.specialties[0] : r.specialties}</span>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Limpiar filtros
function clearFilters() {
    document.getElementById('zoneFilter').value = '';
    document.getElementById('categoryFilter').value = '';
    displayRestaurants(allRestaurants);
}

// Abrir artículo del restaurante
function openRestaurantArticle(url) {
    window.open(url, '_blank');
}

// ===== MAPA =====
function initMap() {
    if (map) {
        map.remove();
    }

    // Crear mapa centrado en Sevilla
    map = L.map('map').setView([37.3886, -5.9842], 12);

    // OpenStreetMap layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Agregar marcadores
    markers = [];
    allRestaurants.forEach(r => {
        if (r.lat && r.lng) {
            const marker = L.marker([r.lat, r.lng], {
                title: r.title
            }).addTo(map);

            // Popup al hacer click
            marker.on('click', () => {
                marker.bindPopup(`
                    <div class="map-popup">
                        <h3>${r.title}</h3>
                        <p><strong>${Array.isArray(r.cuisines) ? r.cuisines.join(', ') : (r.cuisines || 'Tapas')}</strong></p>
                        <p>${r.address || ''}</p>
                        <p style="font-size: 12px; color: #999;">${r.zone || 'Sevilla'}</p>
                        <a href="${r.url}" target="_blank">Ver artículo completo →</a>
                    </div>
                `).openPopup();
            });

            markers.push(marker);
        }
    });
}

// ===== NAVEGACIÓN =====
function showScreen(screenId) {
    // Ocultar todos
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

    // Mostrar el seleccionado
    document.getElementById(screenId).classList.add('active');

    // Inicializar mapa si es necesario
    if (screenId === 'mapScreen' && !map) {
        setTimeout(() => initMap(), 100);
    }
}

function goHome() {
    showScreen('homeScreen');
}

function goToMap() {
    showScreen('mapScreen');
}

function goToRestaurants() {
    showScreen('restaurantsScreen');
    displayRestaurants(allRestaurants);
}

// ===== MODAL DE INSTALACIÓN =====
function showInstallModal() {
    const modal = document.getElementById('installModal');
    const instructions = document.getElementById('installInstructions');

    // Detectar sistema operativo
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    let html = '<div class="install-instructions">';

    if (isIOS) {
        html += `
            <div class="install-step">
                <h3>📱 Safari (iPhone/iPad)</h3>
                <ol>
                    <li>Abre esta página en Safari</li>
                    <li>Toca el botón "Compartir" (cuadro con flecha)</li>
                    <li>Desplázate y selecciona "Añadir a pantalla de inicio"</li>
                    <li>¡Listo! La app aparecerá en tu pantalla de inicio</li>
                </ol>
            </div>
        `;
    } else if (isAndroid) {
        html += `
            <div class="install-step">
                <h3>🤖 Chrome/Android</h3>
                <ol>
                    <li>Toca el menú (tres puntos) en la esquina superior derecha</li>
                    <li>Selecciona "Instalar app" o "Agregar a pantalla de inicio"</li>
                    <li>¡Listo! La app aparecerá en tu pantalla de inicio</li>
                </ol>
            </div>
        `;
    } else {
        html += `
            <div class="install-step">
                <h3>💻 Escritorio</h3>
                <p>En tu navegador verás un icono de instalación en la barra de direcciones. ¡Haz click para instalar!</p>
            </div>
        `;
    }

    html += `
        <div class="install-step">
            <h3>✨ Beneficios</h3>
            <ul>
                <li>Acceso rápido desde tu pantalla de inicio</li>
                <li>Funciona sin conexión a internet</li>
                <li>Actualiza automáticamente con nuevos bares</li>
            </ul>
        </div>
    </div>`;

    instructions.innerHTML = html;
    modal.classList.add('active');
}

function closeInstallModal() {
    document.getElementById('installModal').classList.remove('active');

    // Si hay un prompt de instalación, mostrarlo
    if (installPrompt) {
        installPrompt.prompt();
    }
}

// ===== SERVICE WORKER =====
function setupServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registrado'))
            .catch(err => console.log('Service Worker error:', err));
    }
}
