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

        // Estrategia 1: Si estamos en la página de mapa en vivo, usar window.DTCC_MAP directamente
        if (window.DTCC_MAP && window.DTCC_MAP.points) {
            console.log('✓ Usando datos desde window.DTCC_MAP (página en vivo)');
            allRestaurants = window.DTCC_MAP.points;
        } else {
            // Estrategia 2: Intentar cargar desde data.json local
            console.log('Intentando cargar data.json...');
            let dataLoaded = false;

            // Primero intentar desde ruta relativa
            try {
                const response = await fetch('data.json');
                if (response.ok) {
                    const mapData = await response.json();
                    if (mapData.points && mapData.points.length > 0) {
                        allRestaurants = mapData.points;
                        console.log('✓ Datos cargados desde data.json (local)');
                        dataLoaded = true;
                    }
                }
            } catch (e) {
                console.log('data.json local no disponible, probando desde GitHub raw...');
            }

            // Si falla localmente, intentar desde GitHub raw
            if (!dataLoaded) {
                try {
                    const response = await fetch('https://raw.githubusercontent.com/thegastromentor-maker/detapas-app/main/data.json');
                    if (response.ok) {
                        const mapData = await response.json();
                        if (mapData.points && mapData.points.length > 0) {
                            allRestaurants = mapData.points;
                            console.log('✓ Datos cargados desde GitHub raw');
                            dataLoaded = true;
                        }
                    }
                } catch (e) {
                    console.log('GitHub raw también falló, intentando desde web original...');
                }
            }

            if (!dataLoaded) {
                console.log('data.json no disponible, intentando desde web...');

                // Estrategia 3: Intentar cargar desde la web original
                const targetUrl = 'https://www.detapasconchencho.es/mapa/';
                const response = await fetch(targetUrl);
                const html = await response.text();

                // Buscar el script que contiene DTCC_MAP
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const scripts = doc.querySelectorAll('script');

                let dataScript = null;
                for (let script of scripts) {
                    if (script.textContent.includes('DTCC_MAP')) {
                        dataScript = script.textContent;
                        break;
                    }
                }

                if (!dataScript) {
                    throw new Error('No se encontraron los datos del mapa en el sitio');
                }

                // Extraer JSON usando regex
                const match = dataScript.match(/window\.DTCC_MAP\s*=\s*(\{[\s\S]*?\});/);
                if (!match) {
                    throw new Error('No se pudo parsear los datos del mapa');
                }

                const mapData = JSON.parse(match[1]);
                allRestaurants = mapData.points || [];
                console.log('✓ Datos cargados desde web');
            }
        }

        console.log(`✓ Cargados ${allRestaurants.length} restaurantes`);

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

        console.log(`Zonas encontradas: ${allZones.size}, Categorías: ${allCategories.size}`);

        // Llenar dropdowns
        populateFilters();

        // Cargar artículo más reciente
        loadLatestArticle();

    } catch (error) {
        console.error('Error cargando restaurantes:', error);
        console.log('Usando datos de demostración...');

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

    allZones = new Set(allRestaurants.map(r => r.zone));
    allCategories = new Set();
    allRestaurants.forEach(r => {
        if (Array.isArray(r.cuisines)) {
            r.cuisines.forEach(c => allCategories.add(c));
        }
    });

    populateFilters();
    loadLatestArticle();
}

// Llenar los filtros de zona y categoría
function populateFilters() {
    // Zona
    const zoneSelect = document.getElementById('zoneFilter');
    if (zoneSelect) {
        Array.from(allZones)
            .sort()
            .forEach(zone => {
                const option = document.createElement('option');
                option.value = zone;
                option.textContent = zone;
                zoneSelect.appendChild(option);
            });
    }

    // Categoría
    const categorySelect = document.getElementById('categoryFilter');
    if (categorySelect) {
        Array.from(allCategories)
            .sort()
            .forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });
    }

    // Cargar mapa
    if (map === null) {
        initMap();
    } else {
        filterRestaurants();
    }
}

// Inicializar el mapa
function initMap() {
    map = L.map('map').setView([37.3891, -5.9845], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
    }).addTo(map);

    filterRestaurants();
}

// Filtrar y mostrar restaurantes
function filterRestaurants() {
    const selectedZone = document.getElementById('zoneFilter')?.value || '';
    const selectedCategory = document.getElementById('categoryFilter')?.value || '';
    const searchText = document.getElementById('searchInput')?.value.toLowerCase() || '';

    // Limpiar marcadores anteriores
    markers.forEach(marker => marker.remove());
    markers = [];

    const filteredRestaurants = allRestaurants.filter(r => {
        const matchZone = !selectedZone || r.zone === selectedZone;
        const matchCategory = !selectedCategory || 
                            (Array.isArray(r.cuisines) && r.cuisines.includes(selectedCategory));
        const matchSearch = !searchText || 
                           r.title.toLowerCase().includes(searchText) ||
                           r.address.toLowerCase().includes(searchText);
        return matchZone && matchCategory && matchSearch;
    });

    filteredRestaurants.forEach(restaurant => {
        const marker = L.marker([restaurant.lat, restaurant.lng])
            .addTo(map)
            .bindPopup(`
                <div class="popup">
                    <h4>${restaurant.title}</h4>
                    <p>${restaurant.address}</p>
                    <p><strong>Zona:</strong> ${restaurant.zone}</p>
                    ${restaurant.cuisines ? `<p><strong>Cocina:</strong> ${Array.isArray(restaurant.cuisines) ? restaurant.cuisines.join(', ') : restaurant.cuisines}</p>` : ''}
                    <a href="${restaurant.url}" target="_blank">Ver más</a>
                </div>
            `);
        markers.push(marker);
    });

    // Actualizar lista de restaurantes
    updateRestaurantsList(filteredRestaurants);

    console.log(`Mostrando ${filteredRestaurants.length} restaurantes`);
}

// Actualizar lista de restaurantes
function updateRestaurantsList(restaurants) {
    const restaurantList = document.getElementById('restaurantList');
    if (!restaurantList) return;

    restaurantList.innerHTML = '';

    if (restaurants.length === 0) {
        restaurantList.innerHTML = '<p style="padding: 20px; text-align: center; color: #999;">No hay restaurantes que coincidan con los filtros</p>';
        return;
    }

    restaurants.forEach(r => {
        const div = document.createElement('div');
        div.className = 'restaurant-item';
        div.innerHTML = `
            <h4>${r.title}</h4>
            <p>${r.address}</p>
            <p><strong>Zona:</strong> ${r.zone}</p>
            ${r.cuisines ? `<p><strong>Cocina:</strong> ${Array.isArray(r.cuisines) ? r.cuisines.join(', ') : r.cuisines}</p>` : ''}
            ${r.specialties && r.specialties.length > 0 ? `<p><strong>Especialidades:</strong> ${r.specialties.join(', ')}</p>` : ''}
            <a href="${r.url}" target="_blank" class="btn-link">Ver en web</a>
        `;
        restaurantList.appendChild(div);
    });
}

// Cargar último artículo
async function loadLatestArticle() {
    try {
        const response = await fetch('https://www.detapasconchencho.es/');
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');

        // Buscar el primer artículo en la página
        const article = doc.querySelector('article') || doc.querySelector('.post');
        if (article) {
            const title = article.querySelector('h2, h3, .title')?.textContent || 'Artículo destacado';
            const link = article.querySelector('a')?.href || 'https://www.detapasconchencho.es/';
            
            const articleSection = document.getElementById('latestArticle');
            if (articleSection) {
                articleSection.innerHTML = `
                    <div class="article-card">
                        <h3>${title}</h3>
                        <a href="${link}" target="_blank" class="btn-link">Leer más</a>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.log('No se pudo cargar el artículo:', error);
    }
}

// Configurar Service Worker
function setupServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('✓ Service Worker registrado'))
            .catch(err => console.log('Service Worker no disponible:', err));
    }
}

// Mostrar modal de instalación
function showInstallModal() {
    const modal = document.getElementById('installModal');
    if (modal) {
        modal.style.display = 'block';
    }

    const installBtn = document.getElementById('installBtn');
    if (installBtn && installPrompt) {
        installBtn.addEventListener('click', async () => {
            installPrompt.prompt();
            const result = await installPrompt.userChoice;
            if (result.outcome === 'accepted') {
                console.log('✓ App instalada');
            }
            modal.style.display = 'none';
        });
    }
}

// Cerrar modal
const closeBtn = document.querySelector('.close');
if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        document.getElementById('installModal').style.display = 'none';
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('zoneFilter')?.addEventListener('change', filterRestaurants);
    document.getElementById('categoryFilter')?.addEventListener('change', filterRestaurants);
    document.getElementById('searchInput')?.addEventListener('keyup', filterRestaurants);
});
