// Endpoint para probar la conexión con Telegram
module.exports = async (req, res) => {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7532643566:AAF7Qyz0jYP0ck20RJdFyZNe1L9fETFU-IM';
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '12075234';
  
  console.log('=== TEST TELEGRAM ===');
  console.log('Token:', TELEGRAM_BOT_TOKEN ? 'Configurado' : 'No configurado');
  console.log('Chat ID:', TELEGRAM_CHAT_ID);
  
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return res.json({
      status: 'error',
      message: 'Telegram no configurado',
      token: !!TELEGRAM_BOT_TOKEN,
      chatId: !!TELEGRAM_CHAT_ID
    });
  }

  try {
    // Enviar mensaje de prueba
    const testMessage = `🧪 <b>TEST DE CONEXIÓN</b>

⏰ <b>Hora:</b> ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
🤖 <b>Bot Token:</b> ${TELEGRAM_BOT_TOKEN.substring(0, 10)}...
💬 <b>Chat ID:</b> ${TELEGRAM_CHAT_ID}

✅ ¡La conexión con Telegram funciona correctamente!`;

    console.log('Enviando mensaje de prueba...');
    
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: testMessage,
        parse_mode: 'HTML'
      })
    });

    const result = await response.json();
    console.log('Resultado de Telegram:', result);

    if (response.ok) {
      return res.json({
        status: 'success',
        message: 'Mensaje de prueba enviado correctamente a Telegram',
        telegramResponse: result,
        config: {
          botToken: TELEGRAM_BOT_TOKEN.substring(0, 10) + '...',
          chatId: TELEGRAM_CHAT_ID
        }
      });
    } else {
      return res.json({
        status: 'error',
        message: 'Error enviando mensaje a Telegram',
        telegramError: result,
        config: {
          botToken: TELEGRAM_BOT_TOKEN.substring(0, 10) + '...',
          chatId: TELEGRAM_CHAT_ID
        }
      });
    }
  } catch (error) {
    console.error('Error crítico:', error);
    return res.json({
      status: 'error',
      message: 'Error crítico conectando con Telegram',
      error: error.message,
      config: {
        botToken: TELEGRAM_BOT_TOKEN.substring(0, 10) + '...',
        chatId: TELEGRAM_CHAT_ID
      }
    });
  }
}; 