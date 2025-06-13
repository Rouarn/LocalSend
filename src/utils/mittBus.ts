import mitt from 'mitt';

type ApplicationEvents = {
  'listen:onlineUsers': Api.Websocket.OnlineUser[];
  'emit:logInfo': Api.Websocket.LogInfo;
  'emit:callback': Api.Websocket.Callback;
  'listen:message': Api.Websocket.Message;
};

const mittBus = mitt<ApplicationEvents>();

export function emitLogInfo(log: Api.Websocket.LogInfo) {
  mittBus.emit('emit:logInfo', log);
}

export default mittBus;
