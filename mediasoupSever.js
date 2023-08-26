const createWebRtcTransport = async (callback, router) => {
  try {
    // https://mediasoup.org/documentation/v3/mediasoup/api/#WebRtcTransportOptions
    const webRtcTransportOptions = {
      listenIps: [
        {
          // replace with relevant IP address
          ip: '192.168.18.64',

          // announcedIp: ' 192.168.18.64',
        },
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    };

    // https://mediasoup.org/documentation/v3/mediasoup/api/#router-createWebRtcTransport
    const transport = await router.createWebRtcTransport(
      webRtcTransportOptions
    );
    console.log(`transport id: ${transport.id}`);

    transport.on('dtlsstatechange', (dtlsState) => {
      if (dtlsState === 'closed') {
        transport.close();
      }
    });

    transport.on('close', () => {
      console.log('transport closed');
    });
    callback({
      // https://mediasoup.org/documentation/v3/mediasoup-client/api/#TransportOptions
      serverParams: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      },
    });
    return transport;
  } catch (error) {
    console.log(error);
    callback({
      serverParams: {
        error,
      },
    });
    return null;
  }
};

const mediaCodecs = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: {
      'x-google-start-bitrate': 1000,
    },
  },
];

export { createWebRtcTransport, mediaCodecs };
