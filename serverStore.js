import { createWebRtcTransport, mediaCodecs } from './mediasoupSever';

let producerTransport;
let consumerTransport;
//rooms
let classSessions = {};
//peers
let participants = {};
let transports = [];
let producers = [];
let consumers = [];

let io = null;
const setSocketServerInstance = (ioInstance) => {
  io = ioInstance;
};

const removeItems = (items, userId, type) => {
  items.forEach((item) => {
    if (item.userId === userId) {
      item[type].close();
    }
  });
  items = items.filter((item) => item.userId !== userId);

  return items;
};
const handleDisconnect = (userId) => {
  console.log('peer disconnected');
  consumers = removeItems(consumers, userId, 'consumer');
  producers = removeItems(producers, userId, 'producer');
  transports = removeItems(transports, userId, 'transport');
};

const handleJoinSession = async ({ sessionId }, callback, socket, worker) => {
  const router = await createSession(sessionId, socket.userId, worker);

  participants[socket.userId] = {
    socket,
    sessionId,
    transports: [],
    producer: [],
    participantDetails: {
      name: '',
      isTutor: false,
    },
  };
  const rtpCapabilities = router.rtpCapabilities;
  callback({ rtpCapabilities });
};

const handleCreateTransport = async ({ consumer }, callback, userId) => {
  console.log(`Is this a sender request? ${sender}`);

  const sessionId = participants[userId].sessionId;

  const router = classSessions[sessionId].router;

  createWebRtcTransport(router)
    .then((transport) => {
      callback({
        serverParams: {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        },
      });
      addTransport(transport, sessionId, consumer, userId);
    })
    .catch((error) => {
      callback({
        serverParams: {
          error,
        },
      });
      console.log(error);
    });
};

const addTransport = (transport, sessionId, consumer, userId) => {
  transports = [
    ...transports,
    {
      userId,
      transport,
      sessionId,
      consumer,
    },
  ];

  participants[userId] = {
    ...participants[userId],
    transports: [...participants[userId].transports, transport.id],
  };
};
const handleGetProducers = (callback, userId) => {
  const { sessionId } = participants[userId];

  let producerList = [];
  producers.forEach((producerData) => {
    if (producerData.userId !== userId && producerData.sessionId === roomName) {
      producerList = [...producerList, producerData.produce.id];
    }
  });

  callback(producerList);
};

const addProducer = (producer, sessionId, userId) => {
  producers = [...producers, { userId, producer, sessionId }];
  participants[userId] = {
    ...participants[userId],
    producers: [...participants[userId].producers, producer.id],
  };
};
const addConsumer = (consumer, sessionId, userId) => {
  consumers = [...consumers, { userId, consumer, sessionId }];

  participants[userId] = {
    ...participants[userId],
    consumers: [...participants[userId].consumers, consumer.id],
  };
};

const informConsumers = (sessionId, userId, id) => {
  console.log(`just joined, id ${id} ${roomName}, ${socketId}`);

  producers.forEach((producerData) => {
    if (
      producerData.userId !== userId &&
      producerData.sessionId === sessionId
    ) {
      const produceSocket = peers[producerData.userId].socket;
      produceSocket.emit('new-producer', { producerId: id });
    }
  });
};

const getTransport = (userId) => {
  const [producerTransport] = transports.filter((transport) => {
    return transport.userId === userId && !transport.consumer;
  });
  return producerTransport.transport;
};

const handleTransportConnect = async ({ dtlsParameters }, userId) => {
  console.log('DTLS PARAMS... ', { dtlsParameters });
  await getTransport(userId).connect({ dtlsParameters });
};

const handleTransportProduce = async (
  { kind, rtpParameters, appData },
  callback,
  userId
) => {
  const producer = await producerTransport.produce({
    kind,
    rtpParameters,
  });
  const { sessionId } = peers[userId];

  addProducer(producer, sessionId);
  informConsumers(sessionId, userId, producer.id);

  console.log('Producer ID: ', producer.id, producer.kind);

  producer.on('transportclose', () => {
    console.log('transport for this producer closed ');
    producer.close();
  });

  callback({
    id: producer.id,
    producersExist: producers.length > 1 ? true : false,
  });
};

const handleTransportReceiveConnect = async ({
  dtlsParameters,
  serverConsumerTransportId,
}) => {
  console.log(`DTLS PARAMS: ${dtlsParameters}`);
  const consumerTransport = transports.find(
    (transportData) =>
      transportData.consumer &&
      transportData.transport.id === serverConsumerTransportId
  ).transport;
  await consumerTransport.connect({ dtlsParameters });
};

const handleConsume = async (
  { rtpCapabilities, remoteProducerId, serverConsumerTransportId },
  callback,
  socket
) => {
  try {
    const { sessionId } = participants[socket.userId];
    const router = classSessions[sessionId].router;

    let consumerTransport = transports.find(
      (transportData) =>
        transportData.consumer &&
        transportData.transport.id === serverConsumerTransportId
    ).transport;

    if (
      router.canConsume({
        producerId: remoteProducerId,
        rtpCapabilities,
      })
    ) {
      const consumer = await consumerTransport.consume({
        producerId: remoteProducerId,
        rtpCapabilities,
        paused: true,
      });

      console.log(consumer);
      consumer.on('transportclose', () => {
        console.log('transport close from consumer');
      });
      consumer.on('producerclose', () => {
        console.log('producer of consumer closed');
        socket.emit('producer-closed', { remoteProducerId });

        consumerTransport.close([]);
        transports = transports.filter(
          (transportData) => transportData.transport.id !== consumerTransport.id
        );
        consumer.close();
        consumers = consumers.filter(
          (consumerData) => consumerData.consumer.id !== consumer.id
        );
      });

      addConsumer(consumer, sessionId);

      const serverParams = {
        id: consumer.id,
        producerId: remoteProducerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        serverConsumerId: consumer.id,
      };

      callback({ serverParams });
    }
  } catch (error) {
    console.log(error);
    callback({
      params: {
        error,
      },
    });
  }
};

const handleConsumeResume = async () => {
  console.log('consumer resume');
  const { consumer } = consumers.find(
    (consumerData) => consumerData.consumer.id === serverConsumerId
  );
  await consumer.resume();
};

const createSession = async (sessionId, userId, worker) => {
  let router;
  let peers = [];
  if (classSessions[sessionId]) {
    router = classSessions[sessionId].router;
    peers = classSessions[sessionId].peers || [];
  } else {
    router = await worker.createRouter({ mediaCodecs });
  }
  console.log(`Router ID: ${router.id}`, peers.length);

  classSessions[sessionId] = {
    router,
    peers: [...peers, userId],
  };
  return router;
};

export {
  setSocketServerInstance,
  handleJoinSession,
  handleCreateTransport,
  handleTransportConnect,
  handleTransportProduce,
  handleTransportReceiveConnect,
  handleConsume,
  handleConsumeResume,
  handleGetProducers,
  handleDisconnect,
};
