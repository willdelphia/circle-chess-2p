<script setup lang="ts">
import "cm-chessboard/assets/chessboard.css";
import "./main.scss";
import "./circle-chessboard.scss";

import WelcomeNewPlayer from "./components/WelcomeNewPlayer.vue";
import { onMounted, ref } from "vue";
import { useMainStore } from "./store";
import { makeid, setQueryParam } from "./utils";
import { io } from "socket.io-client";

// @ts-ignore
// prettier-ignore
import {  Game,  move,  status,  moves,  getFen, } from "./chess-library/js-chess-engine.js";
import { CircleBoard } from "./CircleBoard";

// @ts-ignore
// prettier-ignore
import { Chessboard, INPUT_EVENT_TYPE, COLOR, FEN, PIECE } from "cm-chessboard";

import { FromTo, BoardType } from "./types.js";

const store = useMainStore();

let game: any;
let circleBoard: any;
let board: any;
let socket: any;

const showCircle = ref(true);

function newGame() {
  console.log("Starting new game...");
  if (store.fen) {
    console.log("...with fen from server");
    game = new Game(store.fen);
  } else {
    game = new Game();
  }

  initBoards(store.host ? "w" : "b", store.fen);
  store.gameStarted = true;
  if (store.roomName && store.host) {
    setQueryParam("host", store.roomName);
  }
}

function initBoards(color: string, fen: string | null) {
  circleBoard = new CircleBoard(
    color,
    document.querySelector("#circle-board"),
    fen ? fen : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",
    game,
    validateMove
  );

  board = new Chessboard(document.getElementById("square-board"), {
    position: fen ? fen : FEN.start,
    orientation: color,
    assetsUrl: "./assets/",
  });

  board.enableMoveInput((event: any) => {
    switch (event.type) {
      case INPUT_EVENT_TYPE.moveInputStarted:
        console.log(`moveInputStarted: ${event.square}`);
        return true;
      case INPUT_EVENT_TYPE.validateMoveInput:
        console.log(`validateMoveInput: ${event.squareFrom}-${event.squareTo}`);
        const response = validateMove(
          {
            from: event.squareFrom,
            to: event.squareTo,
          },
          BoardType.Classic
        );
        return response.valid;
      case INPUT_EVENT_TYPE.moveInputCanceled:
        console.log(`moveInputCanceled`);
    }
  }, color);
}

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const roomName = urlParams.get("roomname");
  const hostRoomName = urlParams.get("host");

  if (roomName) {
    store.roomName = roomName;
    store.color = "b";
    store.host = false;
    store.yourTurn = false;
  } else if (hostRoomName) {
    store.roomName = hostRoomName;
    store.host = true;
    store.color = "w";
    //don't know whose turn it is at this point
  } else {
    store.roomName = makeid(7);
    store.color = "w";
    store.host = true;
  }

  socket = io({
    query: {
      roomName: store.roomName,
    },
  });

  socket.on("connect", (arg: any) => {
    console.log(arg);
    console.log("Connection Established");
    store.connectionMade = true;

    if (!store.host) {
      //for the friend
      socket.emit("friendJoined", true);
      store.hostJoined = true;
      store.friendJoined = true;
    } else {
      // for the host
      store.hostJoined = true;
    }
  });

  socket.on("new", () => {
    console.log("New game event");
    if (!store.host) {
      //if friend
      afterJoin();
    }
  });

  socket.on("fen", (fen: string) => {
    console.log("Fen event");
    store.fen = fen;
    setCurrentTurnFromFen();
    store.hostJoined = true;
    store.friendJoined = true;
    afterJoin();
  });

  socket.on("friendJoined", () => {
    console.log("Friend joined event");
    store.friendJoined = true;
    afterJoin();
  });

  socket.on("move", (move: FromTo) => {
    validateMove(move, BoardType.Opponent);
  });
});

function afterJoin() {
  console.log(
    "After join check...",
    store.friendJoined,
    store.hostJoined,
    !store.gameStarted
  );
  if (store.friendJoined && store.hostJoined && !store.gameStarted) {
    newGame();
  } else {
    console.warn("Not ready yet...");
  }
}

function setCurrentTurnFromFen() {
  if (store.fen) {
    const splitFen = store.fen.split(" ");
    const playersTurn = splitFen[1];
    store.yourTurn = store.color === playersTurn;
  }
}

function validateMove(fromTo: FromTo, sourceBoard: BoardType) {
  try {
    const moveValue = game.move(fromTo.from, fromTo.to);
    const fenNow = game.exportFEN();
    console.log(moveValue);

    if (sourceBoard === BoardType.Circle) {
      board.movePiece(fromTo.from, fromTo.to, true);
      socket.emit("move", { from: fromTo.from, to: fromTo.to, fen: fenNow });
    } else if (sourceBoard === BoardType.Classic) {
      circleBoard.movePiece(fromTo.from, fromTo.to);
      socket.emit("move", { from: fromTo.from, to: fromTo.to, fen: fenNow });
    } else if (sourceBoard === BoardType.Opponent) {
      board.movePiece(fromTo.from, fromTo.to, true);
      circleBoard.movePiece(fromTo.from, fromTo.to);
    }

    if (moveValue?.additional?.castle) {
      const { from, to } = moveValue.additional;
      setTimeout(() => {
        board.movePiece(from.toLowerCase(), to.toLowerCase(), true);
        circleBoard.movePiece(from.toLowerCase(), to.toLowerCase());
      }, 100);
    }

    if (moveValue?.additional?.enPassant) {
      board.setPiece(moveValue.additional.capture, null);
      circleBoard.removePiece(moveValue.additional.capture);
    }

    if (moveValue?.additional?.promotion) {
      const { piece, color } = moveValue.additional;
      console.log("Promoting", fromTo.to, piece, color);

      setTimeout(() => {
        board.setPiece(fromTo.to, `${color}${piece}`);
        circleBoard.removePiece(fromTo.to);
        circleBoard.addPiece(`${color}${piece}`, fromTo.to);
      }, 10);
    }

    store.yourTurn = !store.yourTurn;

    return { valid: true, additional: moveValue.additional };
  } catch (e) {
    console.log("Invalid Move", e);
    return { valid: false, additional: null };
  }
}
</script>

<template>
  <WelcomeNewPlayer v-if="!store.gameStarted && store.host" />
  <div id="board-container" v-show="store.gameStarted">
    <div class="button-row">
      <button @click="showCircle = !showCircle">Toggle View</button>
    </div>
    <div v-show="showCircle" id="circle-board" class="circle-board"></div>
    <div v-show="!showCircle" id="square-board" class="square-board"></div>
    <div class="turn-note">
      <span v-if="store.yourTurn">Your turn </span>

      <span v-else>Opponent's Turn </span>

      <span v-if="store.yourTurn && store.color == 'w'">⚪</span>
      <span v-if="store.yourTurn && store.color == 'b'">⚫</span>
      <span v-if="!store.yourTurn && store.color == 'w'">⚫</span>
      <span v-if="!store.yourTurn && store.color == 'b'">⚪</span>
    </div>
  </div>
</template>

<style lang="scss"></style>
