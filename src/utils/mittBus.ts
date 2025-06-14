import mitt from 'mitt';

type ApplicationEvents = {
  'listen:onlineUsers': Api.Websocket.OnlineUser[];
  'listen:message': Api.Websocket.Message;
  'emit:logInfo': Api.Websocket.LogInfo;
  'emit:callback': Api.Websocket.Callback;
  'emit:scrollToBottom': undefined;
};

const mittBus = mitt<ApplicationEvents>();

export function emitLogInfo(log: Api.Websocket.LogInfo) {
  mittBus.emit('emit:logInfo', log);
}

export default mittBus;
