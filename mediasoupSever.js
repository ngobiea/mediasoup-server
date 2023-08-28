const createWebRtcTransport = async (router) => {
  return new Promise(async (resolve, reject) => {
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
        resolve(transport)
      } catch (error) {
        console.log(error);
        reject(error)
      }
  })

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
