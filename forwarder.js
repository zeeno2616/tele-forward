require("dotenv").config();
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const input = require("input");

const apiId = parseInt(process.env.api_id);
const apiHash = process.env.api_hash;
const stringSession = new StringSession(process.env.string_session || "");

(async () => {
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input.text("Phone number: "),
    password: async () => await input.text("2FA Password: "),
    phoneCode: async () => await input.text("Code: "),
    onError: (err) => console.error(err),
  });

  console.log("Logged in.");
  console.log("Your session string:", client.session.save());

  const sourceChat = await client.getEntity(process.env.source_chat);
  const targetChat = await client.getEntity(process.env.target_chat);

  console.log(`Forwarding from ${sourceChat.username || sourceChat.id} to ${targetChat.username || targetChat.id}`);

  client.addEventHandler(async (event) => {
    const msg = event.message;

    // Check if message is from the source chat
    if (msg.chatId?.toString() !== sourceChat.id.toString()) return;

    if (msg.message) {
      try {
        await client.sendMessage(targetChat, { message: msg.message });
        console.log("Forwarded:", msg.message);
      } catch (err) {
        console.error("Send failed:", err.message);
      }
    }
  }, new NewMessage({}));

})();
