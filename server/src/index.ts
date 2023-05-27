import express, { Request, Response, NextFunction } from "express";
import { Server, Socket } from "socket.io";
import http from "http";

const app = express();
const port = process.env.PORT || 5555;

const server = http.createServer(app);
const io = new Server(server);

const fens = new Map();

app.use(express.static("../client/dist"));

interface Move {
  from: string;
  to: string;
  fen: string;
}

io.on("connection", (socket: Socket) => {
  console.log("Connection");

  const roomName = socket.handshake.query.roomName;

  if (roomName && typeof roomName === "string") {
    console.log("Someone is joining ", socket.handshake.query.roomName);
    socket.join(socket.handshake.query.roomName);

    const fen = fens.get(roomName);
    if (fen) {
      socket.emit("fen", fen);
    } else {
      socket.emit("new");
    }
  }

  socket.on("move", (action: Move) => {
    console.log("Move Taken", action);
    const { fen, from, to } = action;
    fens.set(roomName, fen);
    socket.broadcast.to(roomName).emit("move", { to, from });
  });

  socket.on("friendJoined", (action) => {
    console.log("Friend Joined", action);
    socket.to(roomName).emit("friendJoined");
  });

  socket.on("hostJoined", (action) => {
    console.log("hostJoined", action);
    socket.to(roomName).emit("updateFen");
  });
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
