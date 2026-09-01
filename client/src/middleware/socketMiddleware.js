import {
  receiveNewMessage,
  receiveEditedMessage,
  receiveDeletedMessage,
  updateTypingUser,
} from "../reducers/chatReducer";
import { updateOnlineUsers } from "../reducers/memberListReducer";

const messagesKey = (channelId) => `discord-my-messages-${channelId}`;
const channel = typeof window !== "undefined" && "BroadcastChannel" in window
  ? new BroadcastChannel("discord-my")
  : null;

const saveMessages = (channelId, messages) => {
  localStorage.setItem(messagesKey(channelId), JSON.stringify(messages));
};

const readMessages = (channelId) => {
  try {
    return JSON.parse(localStorage.getItem(messagesKey(channelId)) || "[]");
  } catch {
    return [];
  }
};

const socketMiddleware = () => (storeAPI) => {
  if (channel) {
    channel.onmessage = ({ data }) => {
      if (data.type === "message:add") storeAPI.dispatch(receiveNewMessage(data.message));
      if (data.type === "message:edit") storeAPI.dispatch(receiveEditedMessage(data.message));
      if (data.type === "message:delete") storeAPI.dispatch(receiveDeletedMessage(data.message));
      if (data.type === "typing") storeAPI.dispatch(updateTypingUser(data.user));
      if (data.type === "stopTyping") storeAPI.dispatch(updateTypingUser(null));
      if (data.type === "online") storeAPI.dispatch(updateOnlineUsers(data.users));
    };
  }

  return (next) => (action) => {
    const currentUser = storeAPI.getState().session.user;

    switch (action.type) {
      case "chat/sendMessage": {
        const { user, channelId, content } = action.payload;
        const message = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          createdAt: new Date().toISOString(),
          content,
          channelId,
          user,
        };
        const messages = readMessages(channelId);
        messages.push(message);
        saveMessages(channelId, messages);
        storeAPI.dispatch(receiveNewMessage(message));
        channel?.postMessage({ type: "message:add", message });
        break;
      }
      case "chat/editMessage": {
        const { id, channelId, content, user } = action.payload;
        const messages = readMessages(channelId).map((message) =>
          message.id === id
            ? { ...message, content, user, updatedAt: new Date().toISOString() }
            : message
        );
        const message = messages.find((item) => item.id === id);
        saveMessages(channelId, messages);
        if (message) storeAPI.dispatch(receiveEditedMessage(message));
        if (message) channel?.postMessage({ type: "message:edit", message });
        break;
      }
      case "chat/deleteMessage": {
        const { id, channelId } = action.payload;
        saveMessages(channelId, readMessages(channelId).filter((message) => message.id !== id));
        storeAPI.dispatch(receiveDeletedMessage({ id }));
        channel?.postMessage({ type: "message:delete", message: { id } });
        break;
      }
      case "chat/typing":
        storeAPI.dispatch(updateTypingUser(action.payload));
        channel?.postMessage({ type: "typing", user: action.payload });
        break;
      case "chat/stopTyping":
        storeAPI.dispatch(updateTypingUser(null));
        channel?.postMessage({ type: "stopTyping" });
        break;
      case "session/connectSocket":
        if (currentUser) storeAPI.dispatch(updateOnlineUsers([currentUser]));
        break;
      case "session/logout":
        storeAPI.dispatch(updateOnlineUsers([]));
        break;
      default:
        break;
    }

    return next(action);
  };
};

export default socketMiddleware();
