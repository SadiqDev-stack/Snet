import Pending from './models/pending.js';
import { isOnline, getSocket } from "./users.js";

const emitSocket = async (id, to, name, data) => {
  const socket = getSocket(id);
  const offlineMembers = [];
  const onlineMembers = [];

  for (const person of to.peoples) {
    const personId = person.toString()
    if (personId === id.toString()) continue;
    
    if (!isOnline(personId)) {
      offlineMembers.push(personId);
    } else {
      onlineMembers.push(personId);
    }
  }

  // Save messages for offline members
  if (offlineMembers.length) {
    await Pending.create({
      to: offlineMembers,
      from: id.toString(),
      name,
      data
    });
  }
  

  // Emit to online members
  if (onlineMembers.length && socket) {
    for (const memberId of onlineMembers) {
      const memberSocket = getSocket(memberId);
      if (memberSocket) {
        memberSocket.emit(name, data);
      }
    }
  }

 };

const listenSocket = (id, name, cb) => {
  getSocket(id)?.listen(name, cb)
}

export {
  emitSocket,
  listenSocket
}