import Pending from './models/pending.js';
import {isOnline, getSocket} from "./users.js";

const emitSocket = async (id, to) => {
  let socket = getSocket(id)
  return {
    emit: async (name, data) => {
      const offlineMembers = [];
      const onlineMembers = [];
      for(const p in to.peoples){
        if(typeof p == Object){
          p = String(p._id) || String(p)
        }
        
        if(p !== id){
          if(!isOnline(p) || !socket){
            offlineMembers.push(p)
          }else{
            onlineMembers.push(p)
          }
        }
      }
      // they must come online to receive there messages 
      await Pending.create({
        to: offlineMembers,
        from: id,
        name,
        data
      })
      // send to online members
      socket.to(onlineMembers).emit(name, data)
    }
  }
}

const listenSocket = (id, name, cb) => {
  getSocket(id)?.listen(name, cb)
}

export {
  emitSocket,
  listenSocket
}