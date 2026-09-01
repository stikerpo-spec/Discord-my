const CHANNELS = [
  { id: 1, name: "general" },
  { id: 2, name: "introduce-yourself" },
  { id: 3, name: "welcome" },
  { id: 4, name: "programming" },
  { id: 5, name: "gaming" },
];

const messagesKey = (channelId) => `discord-my-messages-${channelId}`;

const readMessages = (channelId) => {
  try {
    return JSON.parse(localStorage.getItem(messagesKey(channelId)) || "[]");
  } catch {
    return [];
  }
};

export const getChannels = async () => ({ data: CHANNELS });

export const getMessages = async (channelId) => ({ data: readMessages(channelId) });
