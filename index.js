import dotenv from 'dotenv';
dotenv.config();
import { createServer } from 'http';
import express from 'express';
import { createWorker } from 'mediasoup';
import { default as mongoose } from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';

import tutorRouter from './routes/tutorRouter';
import studentRouter from './routes/studentRouter';
import shareRoutes from './routes/shareRouter';
import { statusCode } from './util/statusCodes';
import { registerSocketServer } from './socketSever';

const app = express();
const httpServer = createServer(app);
let worker;

app.use(
  cors({
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
);
app.use(bodyParser.json());


app.use('/tutor', tutorRouter);
app.use('/student', studentRouter);
app.use(shareRoutes);


app.use((error, _req, res, _next) => {
  console.log(error.stack);
  const status = error.statusCode || statusCode.INTERNAL_SERVER_ERROR;
  const { message, data, type } = error;
  res.status(status).json({ message, data, type });
});

const createNewWorker = async () => {
  const newWorker = await createWorker({
    rtcMinPort: 10000,
    rtcMaxPort: 10100,
    logLevel: 'warn',
    logTags: ['info', 'ice', 'dtls', 'rtp', 'rtcp', 'srtp'],
  });

  console.log(`worker pid ${newWorker.pid}`);

  newWorker.on('died', (error) => {
    // This implies something serious happened, so kill the application
    console.error('mediasoup worker has died', error);
    // exit in 2 seconds
    setTimeout(
      () => process.exit(1),
      parseFloat(process.env.WORKER_DIE_TIMEOUT)
    );
  });
  return newWorker;
};

(async () => {
  worker = await createNewWorker();
  registerSocketServer(httpServer, worker);
})();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    httpServer.listen(process.env.PORT, () => {
      console.log(`App is listening on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
