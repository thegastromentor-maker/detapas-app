# De Tapas con Chencho - App

Una Progressive Web App (PWA) para descubrir los mejores bares de tapas en Sevilla.

## Características

- 🗺️ **Mapa interactivo** con establecimientos
- 🔍 **Buscador** por zona y categoría de comida
- 📰 **Último artículo** publicado en la web
- 📱 **Instalable** en pantalla de inicio (iOS y Android)
- 🔌 **Funciona offline** (con datos cacheados)
- 🔄 **Actualización automática** con nuevos bares y artículos

## Instalación

### En iPhone/iPad (Safari)
1. Abre esta app en Safari
2. Toca el botón "Compartir" (cuadro con flecha)
3. Desplázate y selecciona "Añadir a pantalla de inicio"
4. ¡Listo!

### En Android (Chrome)
1. Toca el menú (tres puntos) en la esquina superior derecha
2. Selecciona "Instalar app" o "Agregar a pantalla de inicio"
3. ¡Listo!

## Desarrollo Local

```bash
# No hay build necesario, solo necesitas un servidor web
python3 -m http.server 8000

# Luego abre http://localhost:8000 en tu navegador
```

## Deploy en GitHub Pages

```bash
# 1. Crear repo en GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/detapas-app.git
git branch -M main
git push -u origin main

# 2. Habilitar GitHub Pages
# En el repo → Settings → Pages
# Selecciona "Deploy from a branch" y elige "main"
```

## Archivos

- `index.html` - Estructura HTML principal
- `styles.css` - Estilos de la app
- `app.js` - Lógica principal (carga de datos, navegación, filtros)
- `service-worker.js` - Service Worker para funcionalidad offline
- `manifest.json` - Configuración de PWA
- `data.json` - Datos de restaurantes

## Datos

La app intenta cargar datos en este orden:

1. **data.json** - Archivo local con todos los restaurantes (más rápido y confiable)
2. **window.DTCC_MAP** - Si estás en https://www.detapasconchencho.es/mapa/
3. **Fetch desde web** - Intenta descargar de la web original
4. **Datos de demostración** - Restaurantes de ejemplo como fallback

### Actualizar con datos reales (678 establecimientos)

**Desde tu Mac:**

```bash
cd "Desktop/detapas-app 4"
node fetch-data.js
```

Este script descargará todos los 678 restaurantes y actualizará `data.json`.

**Luego sube los cambios a GitHub:**

```bash
git add data.json
git commit -m "Update: Todos los 678 restaurantes"
git push origin main
```

En 2-3 minutos, tu app en GitHub Pages tendrá los datos actualizados.

## Tecnologías

- HTML5
- CSS3
- Vanilla JavaScript
- Leaflet.js (mapas)
- Service Workers (offline)

## Licencia

Esta app es un proyecto no oficial basado en De Tapas con Chencho.
