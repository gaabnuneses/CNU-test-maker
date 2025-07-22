const axios = require('axios');

/**
 * Handler para comando !yt no WhatsApp
 * @param {Object} params - Parâmetros do evento
 * @param {string} params.text - Texto da mensagem
 * @param {string} params.chatId - ID do chat
 * @param {Object} params.sock - Instância do socket Baileys
 * @param {Object} params.msg - Mensagem original recebida
 */
module.exports = async function handleYoutubeCommand({ text, chatId, sock, msg }) {
  const query = text.substring(4).trim();
  if (!query) {
    await sock.sendMessage(chatId, { text: 'Por favor, informe um termo de busca. Exemplo: !yt música' }, { quoted: msg });
    return;
  }
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  try {
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      }
    });
    const html = response.data;
    const regex = /var ytInitialData = (.*?);<\/script>/s;
    const match = html.match(regex);
    if (!match || !match[1]) {
      await sock.sendMessage(chatId, { text: 'Não foi possível extrair dados do YouTube.' }, { quoted: msg });
      return;
    }
    let initialData;
    try {
      initialData = JSON.parse(match[1]);
    } catch (error) {
      await sock.sendMessage(chatId, { text: 'Erro ao processar dados do YouTube.' }, { quoted: msg });
      return;
    }
    const sections = initialData.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents;
    let videoRenderer = null;
    for (const section of sections) {
      if (section.itemSectionRenderer && section.itemSectionRenderer.contents) {
        for (const item of section.itemSectionRenderer.contents) {
          if (item.videoRenderer) {
            videoRenderer = item.videoRenderer;
            break;
          }
        }
      }
      if (videoRenderer) break;
    }
    if (!videoRenderer) {
      await sock.sendMessage(chatId, { text: 'Não foi encontrado nenhum vídeo para a busca.' }, { quoted: msg });
      return;
    }
    const videoId = videoRenderer.videoId;
    const title = videoRenderer.title && videoRenderer.title.runs ? videoRenderer.title.runs[0].text : 'Sem título';
    let views = 'N/A';
    if (videoRenderer.viewCountText) {
      if (videoRenderer.viewCountText.simpleText) {
        views = videoRenderer.viewCountText.simpleText;
      } else if (videoRenderer.viewCountText.runs) {
        views = videoRenderer.viewCountText.runs.map(run => run.text).join('');
      }
    }
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const replyMsgText = `🎥 *Resultado da sua busca por:* ${query}\n\n` +
      `*Título:* ${title}\n` +
      `*Visualizações:* ${views}\n` +
      `*Link:* ${videoUrl}`;
    await sock.sendMessage(chatId, { text: replyMsgText }, { quoted: msg });
  } catch (error) {
    console.error('Erro ao realizar a busca no YouTube:', error);
    await sock.sendMessage(chatId, { text: 'Desculpe, ocorreu um erro ao buscar no YouTube.' }, { quoted: msg });
  }
};
