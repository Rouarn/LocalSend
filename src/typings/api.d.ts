/**
 * Namespace Api
 *
 * All backend api type
 */
declare namespace Api {
  namespace Common {
    /** common params of paginating */
    interface PaginatingCommonParams {
      /** current page number */
      current: number;
      /** page size */
      size: number;
      /** total count */
      total: number;
    }

    /** common params of paginating query list data */
    interface PaginatingQueryRecord<T = any> extends PaginatingCommonParams {
      records: T[];
    }

    /** common search params of table */
    type CommonSearchParams = Pick<Common.PaginatingCommonParams, 'current' | 'size'>;

    /**
     * enable status
     *
     * - "1": enabled
     * - "2": disabled
     */
    type EnableStatus = '1' | '2';

    /** common record */
    type CommonRecord<T = any> = {
      /** record id */
      id: number;
      /** record creator */
      createBy: string;
      /** record create time */
      createTime: string;
      /** record updater */
      updateBy: string;
      /** record update time */
      updateTime: string;
      /** record status */
      status: EnableStatus | null;
    } & T;
  }

  /**
   * namespace Auth
   *
   * backend api module: "auth"
   */
  namespace Auth {
    interface LoginToken {
      token: string;
      refreshToken: string;
    }

    interface UserInfo {
      userId: string;
      userName: string;
      roles: string[];
      buttons: string[];
    }
  }

  /**
   * namespace Route
   *
   * backend api module: "route"
   */
  namespace Route {
    type ElegantConstRoute = import('@elegant-router/types').ElegantConstRoute;

    interface MenuRoute extends ElegantConstRoute {
      id: string;
    }

    interface UserRoute {
      routes: MenuRoute[];
      home: import('@elegant-router/types').LastLevelRouteKey;
    }
  }

  /**
   * namespace Websocket
   *
   * backend api module: "websocket"
   */
  namespace Websocket {
    interface OnlineUser {
      socketId: string;
      socketName: string;
      ip: string;
      avatar?: string;
    }

    // 新增带扩展属性的类型
    interface OnlineUserWithState extends OnlineUser {
      show: boolean;
      current?: boolean;
    }

    interface LogInfo {
      id: string;
      message: string;
      type: 'info' | 'warn' | 'error' | 'debug' | 'success';
    }

    // 任意类型
    interface Callback {
      [key: string]: any;
    }

    interface Message {
      id: string;
      roomId?: string;
      senderId: string;
      type?: 'text' | 'image' | 'file' | 'video' | 'audio';
      content?: string | File;
      sender?: string;
      timestamp?: Date;
      status?: 'sending' | 'sent' | 'failed';
      text: string;
      file?: File;
      [key: string]: any;
    }

    interface File {
      name: string;
      size: number;
      type: string;
      url: string;
    }
  }
}
