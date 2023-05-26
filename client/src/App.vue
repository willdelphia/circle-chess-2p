<script setup lang="ts">
import "cm-chessboard/assets/chessboard.css";
import "./main.scss";
import "./circle-chessboard.scss";

import WelcomeNewPlayer from "./components/WelcomeNewPlayer.vue";
import { nextTick, onMounted, ref } from "vue";
import { useMainStore } from "./store";
import { makeid } from "./utils";
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
const yourTurn = ref(true);

function newGame() {
  game = new Game();
}

function initBoards(color: string) {
  circleBoard = new CircleBoard(
    color,
    document.querySelector("#circle-board"),
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",
    game,
    validateMove
  );

  board = new Chessboard(document.getElementById("square-board"), {
    position: FEN.start,
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

// @ts-ignore
function updateCircleBoard() {
  const fen = game.exportFEN();
  circleBoard.setFen(fen);
}

//@ts-ignore
function updateBoard() {
  const fen = game.exportFEN();
  board.setPosition(fen, true);
}

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const roomName = urlParams.get("roomname");

  if (roomName) {
    store.roomName = roomName;
    store.color = "b";
    store.host = false;
    yourTurn.value = false;
  } else {
    store.roomName = makeid(7);
    store.color = "w";
  }

  socket = io({
    query: {
      roomName: store.roomName,
    },
  });

  socket.on("connect", () => {
    console.log("Connection Established");
    store.connectionMade = true;

    if (!store.host) {
      console.log("I am not the host, so I will let them know I am here");
      socket.emit("friendJoined", true);
      store.friendJoined = true;
      nextTick(() => {
        newGame();
        initBoards(store.host ? "w" : "b");
      });
    }
  });

  socket.on("friendJoined", () => {
    console.log("My friend joined");
    if (store.host) {
      store.friendJoined = true;
      nextTick(() => {
        newGame();
        initBoards(store.host ? "w" : "b");
      });
    }
  });

  socket.on("move", (move: FromTo) => {
    validateMove(move, BoardType.Opponent);
  });
});

function validateMove(fromTo: FromTo, sourceBoard: BoardType) {
  try {
    const moveValue = game.move(fromTo.from, fromTo.to);
    console.log(moveValue);

    if (sourceBoard === BoardType.Circle) {
      board.movePiece(fromTo.from, fromTo.to, true);
      socket.emit("move", { from: fromTo.from, to: fromTo.to });
    } else if (sourceBoard === BoardType.Classic) {
      circleBoard.movePiece(fromTo.from, fromTo.to);
      socket.emit("move", { from: fromTo.from, to: fromTo.to });
    } else if (sourceBoard === BoardType.Opponent) {
      board.movePiece(fromTo.from, fromTo.to, true);
      circleBoard.movePiece(fromTo.from, fromTo.to);
    }

    if (moveValue.additional) {
      const { from, to } = moveValue.additional;
      setTimeout(() => {
        board.movePiece(from.toLowerCase(), to.toLowerCase(), true);
        circleBoard.movePiece(from.toLowerCase(), to.toLowerCase());
      }, 100);
    }

    yourTurn.value = !yourTurn.value;

    return { valid: true, additional: moveValue.additional };
  } catch (e) {
    console.log("Invalid Move", e);
    return { valid: false, additional: null };
  }
}
</script>

<template>
  <WelcomeNewPlayer v-if="store.host && !store.friendJoined" />
  <div id="board-container" v-if="store.friendJoined">
    <div class="button-row">
      <button @click="showCircle = !showCircle">Toggle View</button>
    </div>
    <div v-show="showCircle" id="circle-board" class="circle-board"></div>
    <div v-show="!showCircle" id="square-board" class="square-board"></div>
    <div class="turn-note">
      <span v-if="yourTurn"> Your turn </span>

      <span v-else> Opponent's Turn </span>

      <span v-if="yourTurn && store.color == 'w'">⚪</span>
      <span v-if="yourTurn && store.color == 'b'">⚫</span>
      <span v-if="!yourTurn && store.color == 'w'">⚫</span>
      <span v-if="!yourTurn && store.color == 'b'">⚪</span>
    </div>
  </div>
</template>

<style lang="scss"></style>
