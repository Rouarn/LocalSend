import mitt from 'mitt';

type ApplicationEvents = {
  online_users: Api.Websocket.OnlineUser[];
};

const mittBus = mitt<ApplicationEvents>();

export default mittBus;
