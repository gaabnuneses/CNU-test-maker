const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Handler para comando !lastfm no WhatsApp
 * @param {Object} params - Parâmetros do evento
 * @param {string} params.text - Texto da mensagem
 * @param {string} params.chatId - ID do chat
 * @param {Object} params.sock - Instância do socket Baileys
 * @param {Object} params.msg - Mensagem original recebida
 */
module.exports = async function handleLastfmCommand({ text, chatId, sock, msg }) {
  const args = text.trim().split(' ');
  if (args.length < 2) {
    await sock.sendMessage(chatId, { text: 'Por favor, informe o nome de usuário do Last.fm. Exemplo: !lastfm gaabnuneses' }, { quoted: msg });
    return;
  }
  const username = args[1];
  try {
    const profileUrl = `https://www.last.fm/user/${username}`;
    const profileRes = await axios.get(profileUrl);
    const $profile = cheerio.load(profileRes.data);
    const recentTracks = [];
    $profile('tr.chartlist-row').each((i, row) => {
      if (i < 3) {
        const trackName = $profile(row).find('td.chartlist-name a').text().trim();
        const artistName = $profile(row).find('td.chartlist-artist a').text().trim();
        const nowPlaying = $profile(row).find('.chartlist-now-scrobbling').length > 0;
        recentTracks.push({ trackName, artistName, nowPlaying });
      }
    });
    let recentTracksList = '';
    recentTracks.forEach((track, index) => {
      let line = `${index + 1}. ${track.trackName} - ${track.artistName}`;
      if (index === 0 && track.nowPlaying) {
        line += ' 🔊 [Agora]';
      }
      recentTracksList += line + '\n';
    });
    let topArtistsStr = 'N/A';
    const metaDesc = $profile('meta[name="description"]').attr('content');
    if (metaDesc) {
      const regex = /top artists:\s*([^\.]+)\./i;
      const match = metaDesc.match(regex);
      if (match && match[1]) {
        topArtistsStr = match[1].trim();
      }
    }
    let topArtistsList = '';
    if (topArtistsStr !== 'N/A') {
      const artistsArr = topArtistsStr.split(',').map(a => a.trim()).filter(a => a.length > 0);
      const topThreeArtists = artistsArr.slice(0, 3);
      topThreeArtists.forEach((artist, index) => {
        topArtistsList += `${index + 1}. ${artist}\n`;
      });
    }
    let replyMsg = `*Perfil LastFM de ${username}:*\n\n`;
    replyMsg += `🎧 *Últimas 3 músicas:*\n${recentTracksList}\n`;
    replyMsg += `*Top Artists:*\n${topArtistsList}`;
    await sock.sendMessage(chatId, { text: replyMsg }, { quoted: msg });
  } catch (error) {
    console.error('Erro ao obter dados do Last.fm:', error);
    await sock.sendMessage(chatId, { text: 'Desculpe, ocorreu um erro ao obter os dados do Last.fm.' }, { quoted: msg });
  }
};
