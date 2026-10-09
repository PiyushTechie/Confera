import { Device } from 'mediasoup-client';

export class MediasoupClient {
  constructor(socket, roomId, onNewConsumer) {
    this.socket = socket;
    this.roomId = roomId;
    this.device = null;
    this.sendTransport = null;
    this.recvTransport = null;
    this.producers = new Map();
    this.consumers = new Map();
    this.onNewConsumer = onNewConsumer;
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.socket.emit('getRouterRtpCapabilities', async (response) => {
        if (response.error) return reject(response.error);
        try {
          this.device = new Device();
          await this.device.load({ routerRtpCapabilities: response.rtpCapabilities });
          await this.initSendTransport();
          await this.initRecvTransport();
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  async initSendTransport() {
    return new Promise((resolve, reject) => {
      this.socket.emit('createWebRtcTransport', { sender: true }, async (params) => {
        if (params.error) return reject(params.error);
        try {
          this.sendTransport = this.device.createSendTransport(params);
          this.sendTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
            this.socket.emit('connectTransport', { transportId: this.sendTransport.id, dtlsParameters }, (response) => {
              if (response.error) errback(new Error(response.error));
              else callback();
            });
          });
          this.sendTransport.on('produce', async (parameters, callback, errback) => {
            this.socket.emit('produce', {
              transportId: this.sendTransport.id,
              kind: parameters.kind,
              rtpParameters: parameters.rtpParameters,
              appData: parameters.appData
            }, (response) => {
              if (response.error) errback(new Error(response.error));
              else callback({ id: response.id });
            });
          });
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  async initRecvTransport() {
    return new Promise((resolve, reject) => {
      this.socket.emit('createWebRtcTransport', { sender: false }, async (params) => {
        if (params.error) return reject(params.error);
        try {
          this.recvTransport = this.device.createRecvTransport(params);
          this.recvTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
            this.socket.emit('connectTransport', { transportId: this.recvTransport.id, dtlsParameters }, (response) => {
              if (response.error) errback(new Error(response.error));
              else callback();
            });
          });
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  async produce(track, appData = {}) {
    if (!this.sendTransport) throw new Error("Send transport not initialized");
    const producer = await this.sendTransport.produce({ track, appData });
    this.producers.set(producer.kind, producer);
    return producer;
  }

  async consume(producerId, socketId, appData) {
    return new Promise((resolve, reject) => {
      this.socket.emit('consumeWithTransport', {
        consumerTransportId: this.recvTransport.id,
        producerId,
        rtpCapabilities: this.device.rtpCapabilities
      }, async (response) => {
        if (response.error) return reject(response.error);
        const consumer = await this.recvTransport.consume({
          id: response.id,
          producerId: response.producerId,
          kind: response.kind,
          rtpParameters: response.rtpParameters
        });
        this.consumers.set(consumer.id, consumer);
        this.socket.emit('resume', { consumerId: consumer.id }, () => {
          if (this.onNewConsumer) {
             this.onNewConsumer(socketId, consumer.track, response.kind, appData);
          }
          resolve(consumer);
        });
      });
    });
  }

  close() {
    if (this.sendTransport) this.sendTransport.close();
    if (this.recvTransport) this.recvTransport.close();
    this.producers.forEach(p => p.close());
    this.consumers.forEach(c => c.close());
  }
}
