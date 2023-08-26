import { createWebRtcTransport } from './mediasoupSever';

let producerTransport;
let consumerTransport;
let producer;
let consumer;
let io = null;
const setSocketServerInstance = (ioInstance) => {
  io = ioInstance;
};
const handleCreateTransport = async ({ sender }, callback, router) => {
  console.log(`Is this a sender request? ${sender}`);
  if (sender) {
    producerTransport = await createWebRtcTransport(callback, router);
  } else {
    consumerTransport = await createWebRtcTransport(callback, router);
  }
};
const handleTransportConnect = async ({ dtlsParameters }) => {
  console.log('DTLS PARAMS... ', { dtlsParameters });
  await producerTransport.connect({ dtlsParameters });
};
const handleTransportProduce = async (
  { kind, rtpParameters, appData },
  callback
) => {
  producer = await producerTransport.produce({
    kind,
    rtpParameters,
  });

  console.log('Producer ID: ', producer.id, producer.kind);
  producer.on('transportclose', () => {
    console.log('transport for this producer closed ');
    producer.close();
  });

  callback({
    id: producer.id,
  });
};

const handleTransportReceiveConnect = async ({ dtlsParameters }) => {
  console.log(`DTLS PARAMS: ${dtlsParameters}`);
  await consumerTransport.connect({ dtlsParameters });
};

const handleConsume = async ({ rtpCapabilities }, callback, router) => {
  try {
    if (
      router.canConsume({
        producerId: producer.id,
        rtpCapabilities,
      })
    ) {
      consumer = await consumerTransport.consume({
        producerId: producer.id,
        rtpCapabilities,
      });
      console.log(consumer);
      consumer.on('transportclose', () => {
        console.log('transport close from consumer');
      });
      consumer.on('producerclose', () => {
        console.log('producer of consumer closed');
      });

      const serverParams = {
        id: consumer.id,
        producerId: producer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
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

const handleConsumeResume = async (callback) => {
  console.log('consumer resume');
  await consumer.resume();
};

export {
  setSocketServerInstance,
  handleCreateTransport,
  handleTransportConnect,
  handleTransportProduce,
  handleTransportReceiveConnect,
  handleConsume,
  handleConsumeResume,
};
