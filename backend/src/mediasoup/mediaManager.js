import * as mediasoup from 'mediasoup';
import { config } from './config.js';

let workers = [];
let nextWorkerIdx = 0;

export const initWorkers = async () => {
  const { numWorkers } = config.mediasoup;
  for (let i = 0; i < numWorkers; i++) {
    const worker = await mediasoup.createWorker({
      logLevel: config.mediasoup.worker.logLevel,
      logTags: config.mediasoup.worker.logTags,
      rtcMinPort: config.mediasoup.worker.rtcMinPort,
      rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
    });
    worker.on('died', () => {
      console.error(`worker died [pid:${worker.pid}]`);
      process.exit(1);
    });
    workers.push(worker);
  }
};

const getNextWorker = () => {
  const worker = workers[nextWorkerIdx];
  nextWorkerIdx = (nextWorkerIdx + 1) % workers.length;
  return worker;
};

// roomId -> { router, peers: { socketId: { transports, producers, consumers } } }
const rooms = new Map();

export const getRouter = async (roomId) => {
  if (!rooms.has(roomId)) {
    const worker = getNextWorker();
    const router = await worker.createRouter({ mediaCodecs: config.mediasoup.router.mediaCodecs });
    rooms.set(roomId, { router, peers: new Map() });
  }
  return rooms.get(roomId).router;
};

export const getRoomPeers = (roomId) => {
  return rooms.get(roomId)?.peers;
};

export const initPeer = (roomId, socketId) => {
  const room = rooms.get(roomId);
  if (!room) return;
  if (!room.peers.has(socketId)) {
    room.peers.set(socketId, {
      transports: new Map(),
      producers: new Map(),
      consumers: new Map(),
    });
  }
};

export const createWebRtcTransport = async (roomId) => {
  const router = await getRouter(roomId);
  const transport = await router.createWebRtcTransport({
    listenIps: config.mediasoup.webRtcTransport.listenIps,
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    initialAvailableOutgoingBitrate: config.mediasoup.webRtcTransport.initialAvailableOutgoingBitrate,
  });

  transport.on('dtlsstatechange', dtlsState => {
    if (dtlsState === 'closed') transport.close();
  });

  return {
    transport,
    params: {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    }
  };
};

export const addTransport = (roomId, socketId, transport) => {
  const peer = rooms.get(roomId)?.peers.get(socketId);
  if (peer) peer.transports.set(transport.id, transport);
};

export const getTransport = (roomId, socketId, transportId) => {
  return rooms.get(roomId)?.peers.get(socketId)?.transports.get(transportId);
};

export const addProducer = (roomId, socketId, producer) => {
  const peer = rooms.get(roomId)?.peers.get(socketId);
  if (peer) peer.producers.set(producer.id, producer);
};

export const addConsumer = (roomId, socketId, consumer) => {
  const peer = rooms.get(roomId)?.peers.get(socketId);
  if (peer) peer.consumers.set(consumer.id, consumer);
};

export const removePeer = (roomId, socketId) => {
  const room = rooms.get(roomId);
  if (!room) return;
  const peer = room.peers.get(socketId);
  if (!peer) return;

  for (const transport of peer.transports.values()) transport.close();
  for (const producer of peer.producers.values()) producer.close();
  for (const consumer of peer.consumers.values()) consumer.close();

  room.peers.delete(socketId);

  if (room.peers.size === 0) {
    room.router.close();
    rooms.delete(roomId);
  }
};
