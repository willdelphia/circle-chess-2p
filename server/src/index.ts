import express, { Request, Response, NextFunction } from "express";
import { Server, Socket } from "socket.io";
import http from "http";

const app = express();
const port = process.env.PORT || 5555;

const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("../client/dist"));

interface Move {
  from: string;
  to: string;
}

io.on("connection", (socket: Socket) => {
  console.log("Connection");

  const roomName = socket.handshake.query.roomName;
  let roomJoined = false;
  if (roomName && typeof roomName === "string") {
    console.log("Someone is joining ", socket.handshake.query.roomName);
    socket.join(socket.handshake.query.roomName);
  }

  socket.on("move", (action: Move) => {
    console.log("Move Taken", action);
    socket.broadcast.to(roomName).emit("move", action);
  });

  socket.on("friendJoined", (action) => {
    console.log("Friend Joined", action);
    if (!roomJoined) {
      roomJoined = true;
      socket.broadcast.to(roomName).emit("friendJoined", action);
    }
  });
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
