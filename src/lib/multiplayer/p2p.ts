export const defaultIceServers = [
  { urls: "stun:stun.l.google.com:19302" },
];

export class P2PRoom {
  constructor(_options?: P2PRoomOptions) {}
  close() {}
}

export type P2PRoomOptions = {
  roomId?: string;
};

export type PeerInfo = { id: string };
export type SignalKind = string;
export type PeerRow = { id: string };
export type SignalRow = { type: string };
export type RtcPollResponse = { ok: boolean };
