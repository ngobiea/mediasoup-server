import { Server } from 'socket.io';
import authSocket from './middlewares/authSocket';

import {
  setSocketServerInstance,
  handleCreateTransport,
  handleTransportConnect,
  handleTransportProduce,
  handleTransportReceiveConnect,
  handleConsume,
  handleConsumeResume,
  handleJoinSession,
  handleGetProducers,
  handleDisconnect,
} from './serverStore';

const registerSocketServer = async (server, worker) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  setSocketServerInstance(io);

  io.use((socket, next) => {
    authSocket(socket, next);
  });

  io.on('connection', (socket) => {
    console.log(typeof socket.userId)
    socket.on('disconnect', () => {
      handleDisconnect(socket.userId);
    });
    socket.on('createSession', async ({ sessionId }, callback) => {
      handleJoinSession({ sessionId }, callback, socket, worker);
    });

    socket.on('createWebRtcTransport', async ({ consumer }, callback) => {
      handleCreateTransport({ consumer }, callback, socket.userId);
    });

    socket.on('transport-connect', ({ dtlsParameters }) => {
      handleTransportConnect({ dtlsParameters }, socket.userId);
    });

    socket.on(
      'transport-produce',
      ({ kind, rtpParameters, appData }, callback) => {
        handleTransportProduce(
          { kind, rtpParameters, appData },
          callback,
          socket.userId
        );
      }
    );
    socket.on('getProducers', (callback) => {
      handleGetProducers(callback, socket.userId);
    });
    socket.on('transport-recv-connect', handleTransportReceiveConnect);
    socket.on(
      'consume',
      (
        { rtpCapabilities, remoteProducerId, serverConsumerTransportId },
        callback
      ) => {
        handleConsume(
          { rtpCapabilities, remoteProducerId, serverConsumerTransportId },
          callback,
          socket
        );
      }
    );

    socket.on('consumer-resume', handleConsumeResume);
  });
};

export { registerSocketServer };
