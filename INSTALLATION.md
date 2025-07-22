# Instalação – CNU Test Maker

## Pré-requisitos
- Node.js 18+
- Conta OpenAI com API Key
- WhatsApp (número para uso do bot)

## Passos
1. Clone este repositório:
   ```
   git clone https://github.com/seu-usuario/cnu-test-maker.git
   cd cnu-test-maker
   ```
2. Instale as dependências:
   ```
   npm install
   ```
3. Configure sua OpenAI API Key:
   - Crie um arquivo `.env` na raiz:
     ```
     OPENAI_API_KEY=sua-chave-aqui
     ```
   - Ou edite o arquivo `utils/openaiKey.js` para retornar sua chave.
4. Inicie o bot:
   ```
   node whatsapp-bot.js
   ```
5. Siga as instruções no terminal para conectar o WhatsApp via QR Code.

## Observações
- O bot salva lições recentes em `last_lesson.json`.
- O áudio é gerado apenas para idiomas suportados pelo OpenAI TTS.
- Para personalizar comandos, edite os arquivos em `commands/`.
