const USERS_KEY = "discord-my-users";
const CURRENT_USER_KEY = "discord-my-current-user";

const readUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
};

const writeUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

const makeUser = (username) => ({
  id: username.toLowerCase(),
  username,
  avatarColor: "#5865f2",
});

export const login = async ({ username, password }) => {
  const users = readUsers();
  let user = users.find((item) => item.username.toLowerCase() === username.toLowerCase());

  if (!user && password === username) {
    user = makeUser(username);
    users.push({ ...user, password });
    writeUsers(users);
  }

  if (!user) {
    throw { response: { data: "User not found. Register first." } };
  }
  if (user.password !== password) {
    throw { response: { data: "Incorrect password." } };
  }

  const safeUser = { id: user.id, username: user.username, avatarColor: user.avatarColor };
  sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
  return { data: safeUser };
};

export const signup = async ({ username, password }) => {
  const users = readUsers();
  if (users.some((item) => item.username.toLowerCase() === username.toLowerCase())) {
    throw { response: { data: "Username already exists." } };
  }

  const user = makeUser(username);
  users.push({ ...user, password });
  writeUsers(users);
  return { data: user };
};
