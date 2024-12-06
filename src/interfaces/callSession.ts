import { Socket } from "socket.io";

export interface ServerToClientEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
  withAck: (d: string, callback: (e: number) => void) => void;
  notif: (data: Buffer) => void;

  endCall: () => void;
  callAccepted: () => void;
  callDeclined: () => void;
  callAvailable: () => void;

}

export interface ClientToServerEvents {
  new_order: () => void;
  callRequest: () => void;
  declineCall: () => void;
  acceptCall: () => void;
  endCall: () => void;
  registerManager: () => void;

}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  name: string;
  age: number;
}

export interface ISessionCall {
  type: string;
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
}