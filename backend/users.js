import {log} from "./middlewares/logger.js";
const onlineUsers = {};
let onlineCount = 0;

const goOnline = (uid, socket) => {
  onlineUsers[uid] = socket 
  onlineCount++
}

const goOffline = uid => {
  delete onlineUsers[uid];
  onlineCount--
}

const isOnline = uid => onlineUsers[uid]

const getUser = uid => onlineUsers[uid]

const totalOnline = () => {
  return onlineCount
}

const logAll = () => log(onlineUsers);

const getSocket = uid => {
  return onlineUsers[uid]
}

export {
  totalOnline,
  goOnline,
  goOffline,
  isOnline,
  getUser,
  logAll,
  getSocket
}