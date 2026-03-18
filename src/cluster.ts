import cluster from 'cluster';
import http from 'http';
import 'dotenv/config';
import { buildApp } from './app';
import { db } from './db/inMemoryDb';
import { Product } from './types/product';

const PORT = Number(process.env.PORT) || 4000;
const PARALLELISM = Math.max(1, (require('os').availableParallelism?.() ?? require('os').cpus().length) - 1);

if (cluster.isPrimary) {
  console.log(`Master process ${process.pid} started`);
  console.log(`Starting ${PARALLELISM} workers...`);

  const workerPorts: number[] = [];

  for (let i = 0; i < PARALLELISM; i++) {
    const workerPort = PORT + 1 + i;
    workerPorts.push(workerPort);
    const worker = cluster.fork({ WORKER_PORT: workerPort });

    worker.on('message', (msg: { type: string; products: Product[] }) => {
      if (msg.type === 'sync') {
        for (const id in cluster.workers) {
          cluster.workers[id]?.send({ type: 'update', products: msg.products });
        }
      }
    });
  }

  let current = 0;

  const loadBalancer = http.createServer((req, res) => {
    const targetPort = workerPorts[current];
    current = (current + 1) % workerPorts.length;

    const options = {
      hostname: 'localhost',
      port: targetPort,
      path: req.url,
      method: req.method,
      headers: req.headers,
    };

    const proxy = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 500, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxy.on('error', (err) => {
      console.error('Proxy error:', err);
      res.writeHead(500);
      res.end('Internal server error');
    });

    req.pipe(proxy);
  });

  loadBalancer.listen(PORT, () => {
    console.log(`Load balancer listening on port ${PORT}`);
    console.log(`Workers on ports: ${workerPorts.join(', ')}`);
  });

} else {
  const workerPort = Number(process.env.WORKER_PORT);

  process.on('message', (msg: { type: string; products: Product[] }) => {
    if (msg.type === 'update') {
      db.sync(msg.products);
    }
  });

  const start = async () => {
    const app = buildApp();
    await app.listen({ port: workerPort, host: '0.0.0.0' });
    console.log(`Worker ${process.pid} listening on port ${workerPort}`);
  };

  start();
}