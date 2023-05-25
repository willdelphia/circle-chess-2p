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

const showCircle = ref(false);

function newGame() {
  game = new Game();
}

function initBoards() {
  circleBoard = new CircleBoard(
    document.querySelector("#circle-board"),
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",
    game,
    validateMove
  );

  board = new Chessboard(document.getElementById("square-board"), {
    position: FEN.start,
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

        if (response.valid && response.additional) {
          const { from, to } = response.additional;
          setTimeout(() => {
            board.movePiece(from.toLowerCase(), to.toLowerCase(), true);
          }, 100);
        }

        return response.valid;
      case INPUT_EVENT_TYPE.moveInputCanceled:
        console.log(`moveInputCanceled`);
    }
  });
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
  } else {
    store.roomName = makeid(7);
    store.color = "w";
  }

  const socket = io({
    query: {
      roomName: store.roomName,
    },
  });

  socket.on("connect", () => {
    console.log("Connection Established");
    store.connectionMade = true;
    nextTick(() => {
      newGame();
      initBoards();
    });
  });
});

function validateMove(fromTo: FromTo, sourceBoard: BoardType) {
  try {
    const moveValue = game.move(fromTo.from, fromTo.to);

    if (sourceBoard === BoardType.Circle) {
      board.movePiece(fromTo.from, fromTo.to, true);
    } else {
      circleBoard.movePiece(fromTo.from, fromTo.to);
    }

    return { valid: true, additional: moveValue.additional };
  } catch (e) {
    console.log("Invalid Move", e);
    return { valid: false, additional: null };
  }
}
</script>

<template>
  <WelcomeNewPlayer v-if="!store.connectionMade" />
  <div id="board-container" v-else>
    <button @click="showCircle = !showCircle">Toggle View</button>
    <div v-show="showCircle" id="circle-board" class="circle-board"></div>
    <div v-show="!showCircle" id="square-board" class="square-board"></div>
  </div>
</template>

<style lang="scss"></style>
