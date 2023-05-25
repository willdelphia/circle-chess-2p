import express, { Request, Response, NextFunction } from "express";
import { Server, Socket } from "socket.io";
import http from "http";

const app = express();
const port = process.env.PORT || 5555;

const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("../client/dist"));

io.on("connection", (socket: Socket) => {
  console.log("Connection");

  const roomName = socket.handshake.query.roomName;
  if (roomName && typeof roomName === "string") {
    console.log("Someone is joining ", socket.handshake.query.roomName);
    socket.join(socket.handshake.query.roomName);
  }

  socket.on("action", (action) => {
    console.log("Move Taken Action", action.length);
    socket.broadcast.to(roomName).emit("action", action);
  });
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
