import { Server } from 'socket.io';
import authSocket from './middlewares/authSocket';

import {
  setSocketServerInstance,
  handleCreateTransport,
  handleTransportConnect,
  handleTransportProduce,
  handleTransportReceiveConnect,
  handleConsume,
  handleConsumeResume
} from './serverStore';
import { mediaCodecs } from './mediasoupSever';

const registerSocketServer = async (server, worker) => {
  const router = await worker.createRouter({ mediaCodecs });

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
    socket.on('createSession', async (callback) => {
      const rtpCapabilities = router.rtpCapabilities;
      callback({ rtpCapabilities });
    });

    socket.on('createWebRtcTransport', async ({ sender }, callback) => {
      handleCreateTransport({ sender }, callback, router);
    });
    socket.on('transport-connect', handleTransportConnect);

    socket.on('transport-produce', handleTransportProduce);
    socket.on('transport-recv-connect', handleTransportReceiveConnect);
    socket.on('consume', ({ rtpCapabilities }, callback) => {
      handleConsume({ rtpCapabilities }, callback, router);
    });

    socket.on('consumer-resume',handleConsumeResume)
  });
};

export { registerSocketServer };
