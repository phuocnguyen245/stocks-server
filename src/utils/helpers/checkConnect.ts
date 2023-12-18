import mongoose from "mongoose";
import os from "os";
import process from "process";
const SECOND = 60000;
const countConnect = () => {
  const numberConnect = mongoose.connections.length;
  console.log(`Number of connections: ${numberConnect}`);
  return numberConnect;
};

const checkConnect = () => {
  setInterval(() => {
    const numberConnect = countConnect();
    const numberCore = os.cpus().length;
    const memoryUsage = process.memoryUsage().rss;

    const maxConnection = numberCore * 4;
    console.log(`Memory usage: ${memoryUsage / 1024 / 1024} MB`);
    if (numberConnect > maxConnection) {
      console.log(`Number of connections: ${numberConnect} > ${maxConnection}`);
      process.exit(1);
    }
  }, SECOND);
};

export { countConnect, checkConnect };
