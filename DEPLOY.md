# Guía de Deployment en GitHub Pages

## 1. Crear un repositorio en GitHub

1. Ve a https://github.com/new
2. Dale un nombre: `detapas-app`
3. Haz que sea público
4. Click en "Create repository"

## 2. Subir el código a GitHub

```bash
# Dentro de la carpeta del proyecto:
git init
git add .
git commit -m "Initial commit - De Tapas con Chencho App"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/detapas-app.git
git push -u origin main
```

## 3. Habilitar GitHub Pages

1. Ve a tu repo en GitHub
2. Click en "Settings" (Configuración)
3. En el menú izquierdo, selecciona "Pages"
4. Bajo "Build and deployment":
   - Source: Deploy from a branch
   - Branch: Selecciona "main" y "/" (root)
5. Click en "Save"

¡Listo! En unos minutos tu app estará disponible en:
```
https://tu-usuario.github.io/detapas-app
```

## Alternativa: Deploy automático con GitHub Actions

Crea un archivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

## 4. Compartir el enlace

Una vez desplegado, puedes compartir:
```
https://tu-usuario.github.io/detapas-app
```

Los usuarios pueden:
- Abrir en su navegador
- Instalar como app en su pantalla de inicio
- Usarla offline (una vez cargada)

## Troubleshooting

### "Blank page" en GitHub Pages
- Verifica que el archivo `index.html` exista en la raíz
- Comprueba que GitHub Pages está habilitado en Settings
- Espera unos minutos a que se complete el deployment

### Service Worker no funciona
- Los service workers requieren HTTPS (GitHub Pages lo proporciona)
- Abre la consola (F12) para ver mensajes de error

### Datos no se cargan
- La app necesita conexión a internet la primera vez
- Verifica que https://www.detapasconchencho.es sea accesible
- Comprueba la consola (F12) para ver errores de CORS

## Actualizaciones

Para actualizar la app:

```bash
git add .
git commit -m "Update: descripción del cambio"
git push origin main
```

GitHub Pages se actualizará automáticamente en unos minutos.
