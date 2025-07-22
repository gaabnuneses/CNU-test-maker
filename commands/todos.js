/**
 * Comando para mencionar todos os membros do grupo
 * Uso: !todos [mensagem opcional]
 */
module.exports = async function handleTodosCommand({ text, chatId, sock, msg }) {
  try {
    if (!chatId.endsWith('@g.us')) {
      await sock.sendMessage(chatId, { text: '❌ Este comando só pode ser usado em grupos.' }, { quoted: msg });
      return;
    }
    // Mensagem opcional após !todos
    const args = text.trim().slice(6).trim();
    const message = args ? args : 'Atenção todos!';
    // Obtém os participantes do grupo
    let groupMetadata;
    try {
      groupMetadata = await sock.groupMetadata(chatId);
    } catch (error) {
      await sock.sendMessage(chatId, { text: '❌ Não foi possível obter a lista de participantes do grupo.' }, { quoted: msg });
      throw error;
    }
    // Prepara as menções
    const mentions = groupMetadata.participants.map(p => p.id);
    // Monta a mensagem com menções
    let mentionMessage = message + '\n\n';
    mentions.forEach(jid => {
      mentionMessage += `@${jid.split('@')[0]} `;
    });
    mentionMessage += '\n';
    // Envia a mensagem com menções
    await sock.sendMessage(chatId, {
      text: mentionMessage,
      mentions
    }, { quoted: msg });
  } catch (error) {
    console.error('Erro ao executar comando todos:', error);
    await sock.sendMessage(chatId, { text: '❌ Ocorreu um erro ao mencionar todos.' }, { quoted: msg });
  }
};
