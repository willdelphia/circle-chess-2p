//@ts-ignore
import FENBoard from "fen-chess-board";
import { BoardType, FromTo, Validation } from "./types";

import gsap from "gsap";
gsap.registerPlugin(Draggable);

import Draggable from "gsap/Draggable";

const coords = [
  ["a8", "b8", "c8", "d8", "e8", "f8", "g8", "h8"],
  ["a7", "b7", "c7", "d7", "e7", "f7", "g7", "h7"],
  ["a6", "b6", "c6", "d6", "e6", "f6", "g6", "h6"],
  ["a5", "b5", "c5", "d5", "e5", "f5", "g5", "h5"],
  ["a4", "b4", "c4", "d4", "e4", "f4", "g4", "h4"],
  ["a3", "b3", "c3", "d3", "e3", "f3", "g3", "h3"],
  ["a2", "b2", "c2", "d2", "e2", "f2", "g2", "h2"],
  ["a1", "b1", "c1", "d1", "e1", "f1", "g1", "h1"],
];

const pieceMap = {
  p: "bp",
  r: "br",
  n: "bn",
  b: "bb",
  q: "bq",
  k: "bk",
  P: "wp",
  R: "wr",
  N: "wn",
  B: "wb",
  Q: "wq",
  K: "wk",
};

type FENpiece =
  | "p"
  | "r"
  | "n"
  | "b"
  | "k"
  | "q"
  | "P"
  | "R"
  | "N"
  | "B"
  | "K"
  | "Q"
  | "K";

export class CircleBoard {
  color: string;
  svg: SVGSVGElement | null | undefined;
  pieceContainer: SVGGElement | null | undefined;
  game: any;
  validateMove: (fromTo: FromTo, sourceBoard: BoardType) => Validation;

  constructor(
    color: string,
    element: HTMLDivElement | null,
    initialPosition: string,
    game: any,
    validateMove: (fromTo: FromTo, sourceBoard: BoardType) => Validation
  ) {
    this.color = color;
    this.game = game;
    if (element) {
      this.renderBoard(element);
    }
    this.pieceContainer = this.svg?.querySelector(".pieces");
    this.setFen(initialPosition);
    this.validateMove = validateMove;
  }

  setFen(fenString: string) {
    const fenBoard = new FENBoard(fenString);
    const positionArray = fenBoard.board as FENpiece[][];

    this.clearPieces();
    positionArray.forEach((rank, rankIndex) => {
      rank.forEach((piece, fileIndex) => {
        const pieceCode = pieceMap[piece];
        if (piece) {
          this.addPiece(pieceCode, coords[rankIndex][fileIndex]);
        }
      });
    });
  }

  clearPieces() {
    this.pieceContainer
      ?.querySelectorAll("[data-piece]")
      .forEach((elem) => elem.remove());
  }

  getCoordOffset(coordinate: string) {
    const square = this.svg?.querySelector(`[data-square="${coordinate}"]`);
    const x = square?.getAttribute("cx");
    const y = square?.getAttribute("cy");

    const offsetX = -22;
    const offsetY = -22;
    if (x && y) {
      const numX = parseFloat(x);
      const numY = parseFloat(y);
      return { x: numX + offsetX, y: numY + offsetY };
    } else {
      return { x: 0, y: 0 };
    }
  }

  addPiece(pieceType: string, coordinate: string) {
    const _this = this as CircleBoard;

    const squareCoordinates = this.getCoordOffset(coordinate);
    if (squareCoordinates.x && squareCoordinates.y) {
      const id = `piece${pieceType}${coordinate}`;

      this.pieceContainer?.insertAdjacentHTML(
        "beforeend",
        `
          <g id=${id} data-piece="${pieceType}" data-square="${coordinate}" transform="translate(${squareCoordinates.x} ${squareCoordinates.y})">
            <use href="#${pieceType}" class="piece" xlink:href="#${pieceType}" transform="translate(0 0) scale(1.1 1.1)"></use>
          </g>
        `
      );

      const thisPiece = this.svg?.querySelector(`#${id}`) as SVGGElement;

      const snapBack = () => {
        const currentSquare = thisPiece.getAttribute("data-square");
        if (currentSquare) {
          console.log(currentSquare);
          const currentSquareCoordinates = this.getCoordOffset(currentSquare);

          gsap.to(thisPiece, {
            x: currentSquareCoordinates.x,
            y: currentSquareCoordinates.y,
            duration: 0.2,
          });
        }
      };

      const snapToSquare = (coordinate: string) => {
        const toSquareCoordinate = this.getCoordOffset(coordinate);
        gsap.to(thisPiece, {
          x: toSquareCoordinate.x,
          y: toSquareCoordinate.y,
          duration: 0.2,
        });
      };

      if (pieceType.substring(0, 1) === this.color) {
        Draggable.create("#" + id, {
          bounds: this.svg,
          onClick: function () {
            console.log("clicked");
          },
          onDragStart: function () {
            //move z position to top of everything else
            const parent = thisPiece.parentElement;
            parent?.append(thisPiece);
            const from = thisPiece.getAttribute("data-square");
            const moves = _this.game.moves(from);
            _this.highlightSquares(moves);
          },
          onDragEnd: function () {
            _this.clearHighlights();
            const from = thisPiece.getAttribute("data-square");
            let to;
            _this.svg
              ?.querySelectorAll("[data-square]")
              ?.forEach((element: Element) => {
                if (this.hitTest(element, "50%")) {
                  to = element.getAttribute("data-square");
                }
              });

            if (to && from) {
              const response = _this.validateMove(
                {
                  from,
                  to: to,
                },
                BoardType.Circle
              );
              if (response.valid) {
                _this.removePiece(to);
                snapToSquare(to);
                thisPiece.setAttribute("data-square", to);
              } else {
                snapBack();
              }
            } else {
              snapBack();
            }
          },
        });
      }
    }
  }

  movePiece(from: string, to: string) {
    const pieceOnFromSquare = this.pieceContainer?.querySelector(
      `[data-square=${from}]`
    );

    this.removePiece(to);

    if (pieceOnFromSquare) {
      const parent = pieceOnFromSquare.parentElement;
      parent?.append(pieceOnFromSquare);
      const toSquareCoordinate = this.getCoordOffset(to);
      gsap.to(pieceOnFromSquare, {
        x: toSquareCoordinate.x,
        y: toSquareCoordinate.y,
        duration: 0.2,
      });

      pieceOnFromSquare.setAttribute("data-square", to);
    }
  }

  removePiece(square: string) {
    const pieceOnToSquare = this.pieceContainer?.querySelector(
      `[data-square=${square}]`
    );
    if (pieceOnToSquare) {
      pieceOnToSquare.remove();
    }
  }

  highlightSquares(moves: string[]) {
    moves.forEach((move) => {
      const code = move.toLowerCase();
      const circle = this.svg?.querySelector(`circle[data-square="${code}"]`);
      if (circle) {
        circle.classList.add("possible");
      }
    });
  }

  clearHighlights() {
    this.svg
      ?.querySelectorAll("circle.possible")
      .forEach((circle: Element) => circle.classList.remove("possible"));
  }

  renderBoard(element: HTMLDivElement) {
    element.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 966.423 966.423">
        <defs>
          <style>
            .cls-1 {
              stroke: white;
              stroke-width: 2;
            }

            .cls-1 {
              fill: transparent;
            }
            .cls-2 {
              fill: #fff;
            }

            .cls-1,
            .cls-2,
            .cls-3 {
              stroke-miterlimit: 10;
            }

            .cls-3 {
              fill: #c5a076;
            }

            .cls-2,
            .cls-3 {
              stroke: #231f20;
            }
          </style>
        </defs>
        <g id="background">
          <circle class="cls-1" cx="478.148" cy="479.853" r="458.213" />
          <circle class="cls-1" cx="478.148" cy="479.853" r="403.712" />
          <circle class="cls-1" cx="478.148" cy="479.853" r="350.664" />
          <circle class="cls-1" cx="478.148" cy="479.853" r="294.181" />
          <circle class="cls-1" cx="481.989" cy="483.694" r="238.721" />
          <circle class="cls-1" cx="481.989" cy="483.694" r="185.486" />
          <circle class="cls-1" cx="481.989" cy="483.694" r="130.248" />
          <circle class="cls-1" cx="481.908" cy="483.727" r="75.6" />
        </g>
        <g id="circles">
          <circle
            data-square="h8"
            class="cls-2"
            cx="510.839"
            cy="413.983"
            r="25.075"
          />
          <circle
            data-square="g8"
            class="cls-3"
            cx="551.637"
            cy="454.859"
            r="25.075"
          />
          <circle
            data-square="f8"
            class="cls-2"
            cx="551.627"
            cy="512.721"
            r="25.075"
          />
          <circle
            data-square="e8"
            class="cls-3"
            cx="510.839"
            cy="553.573"
            r="25.075"
          />
          <circle
            data-square="d8"
            class="cls-2"
            cx="452.977"
            cy="553.673"
            r="25.075"
          />
          <circle
            data-square="c8"
            class="cls-3"
            cx="411.947"
            cy="512.721"
            r="25.075"
          />
          <circle
            data-square="b8"
            class="cls-2"
            cx="411.937"
            cy="454.859"
            r="25.075"
          />
          <circle
            data-square="a8"
            class="cls-3"
            cx="452.977"
            cy="413.882"
            r="25.075"
          />
          <circle
            data-square="h7"
            class="cls-3"
            cx="531.841"
            cy="363.381"
            r="25.075"
          />
          <circle
            data-square="g7"
            class="cls-2"
            cx="602.331"
            cy="433.87"
            r="25.075"
          />
          <circle
            data-square="f7"
            class="cls-3"
            cx="602.331"
            cy="533.558"
            r="25.075"
          />
          <circle
            data-square="e7"
            class="cls-2"
            cx="531.841"
            cy="604.048"
            r="25.075"
          />
          <circle
            data-square="d7"
            class="cls-3"
            cx="432.154"
            cy="604.048"
            r="25.075"
          />
          <circle
            data-square="c7"
            class="cls-2"
            cx="361.664"
            cy="533.558"
            r="25.075"
          />
          <circle
            data-square="b7"
            class="cls-3"
            cx="361.664"
            cy="433.87"
            r="25.075"
          />
          <circle
            data-square="a7"
            class="cls-2"
            cx="432.154"
            cy="363.381"
            r="25.075"
          />
          <circle
            data-square="h6"
            class="cls-2"
            cx="552.956"
            cy="312.809"
            r="25.075"
          />
          <circle
            data-square="g6"
            class="cls-3"
            cx="653.021"
            cy="412.874"
            r="25.075"
          />
          <circle
            data-square="f6"
            class="cls-2"
            cx="653.021"
            cy="554.387"
            r="25.075"
          />
          <circle
            data-square="e6"
            class="cls-3"
            cx="552.957"
            cy="654.452"
            r="25.075"
          />
          <circle
            data-square="d6"
            class="cls-2"
            cx="411.443"
            cy="654.452"
            r="25.075"
          />
          <circle
            data-square="c6"
            class="cls-3"
            cx="311.378"
            cy="554.387"
            r="25.075"
          />
          <circle
            data-square="b6"
            class="cls-2"
            cx="311.378"
            cy="412.874"
            r="25.075"
          />
          <circle
            data-square="a6"
            class="cls-3"
            cx="411.443"
            cy="312.809"
            r="25.075"
          />
          <circle
            data-square="h5"
            class="cls-3"
            cx="574.072"
            cy="262.237"
            r="25.075"
          />
          <circle
            data-square="g5"
            class="cls-2"
            cx="703.712"
            cy="391.877"
            r="25.075"
          />
          <circle
            data-square="f5"
            class="cls-3"
            cx="703.712"
            cy="575.216"
            r="25.075"
          />
          <circle
            data-square="e5"
            class="cls-2"
            cx="574.072"
            cy="704.856"
            r="25.075"
          />
          <circle
            data-square="d5"
            class="cls-3"
            cx="390.733"
            cy="704.856"
            r="25.075"
          />
          <circle
            data-square="c5"
            class="cls-2"
            cx="261.092"
            cy="575.216"
            r="25.075"
          />
          <circle
            data-square="b5"
            class="cls-3"
            cx="261.092"
            cy="391.877"
            r="25.075"
          />
          <circle
            data-square="a5"
            class="cls-2"
            cx="390.733"
            cy="262.237"
            r="25.075"
          />
          <circle
            data-square="h4"
            class="cls-2"
            cx="595.187"
            cy="211.665"
            r="25.075"
          />
          <circle
            data-square="g4"
            class="cls-3"
            cx="754.402"
            cy="370.88"
            r="25.075"
          />
          <circle
            data-square="f4"
            class="cls-2"
            cx="754.402"
            cy="596.045"
            r="25.075"
          />
          <circle
            data-square="e4"
            class="cls-3"
            cx="595.187"
            cy="755.261"
            r="25.075"
          />
          <circle
            data-square="d4"
            class="cls-2"
            cx="370.022"
            cy="755.261"
            r="25.075"
          />
          <circle
            data-square="c4"
            class="cls-3"
            cx="210.806"
            cy="596.045"
            r="25.075"
          />
          <circle
            data-square="b4"
            class="cls-2"
            cx="210.806"
            cy="370.881"
            r="25.075"
          />
          <circle
            data-square="a4"
            class="cls-3"
            cx="370.022"
            cy="211.665"
            r="25.075"
          />
          <circle
            data-square="h3"
            class="cls-3"
            cx="616.302"
            cy="161.093"
            r="25.075"
          />
          <circle
            data-square="g3"
            class="cls-2"
            cx="805.093"
            cy="349.884"
            r="25.075"
          />
          <circle
            data-square="f3"
            class="cls-3"
            cx="805.093"
            cy="616.874"
            r="25.075"
          />
          <circle
            data-square="e3"
            class="cls-2"
            cx="616.302"
            cy="805.665"
            r="25.075"
          />
          <circle
            data-square="d3"
            class="cls-3"
            cx="349.312"
            cy="805.665"
            r="25.075"
          />
          <circle
            data-square="c3"
            class="cls-2"
            cx="160.521"
            cy="616.874"
            r="25.075"
          />
          <circle
            data-square="b3"
            class="cls-3"
            cx="160.521"
            cy="349.884"
            r="25.075"
          />
          <circle
            data-square="a3"
            class="cls-2"
            cx="349.311"
            cy="161.093"
            r="25.075"
          />
          <circle
            data-square="h2"
            class="cls-2"
            cx="637.703"
            cy="110.235"
            r="25.075"
          />
          <circle
            data-square="g2"
            class="cls-3"
            cx="855.783"
            cy="328.887"
            r="25.075"
          />
          <circle
            data-square="f2"
            class="cls-2"
            cx="855.783"
            cy="637.536"
            r="25.075"
          />
          <circle
            data-square="e2"
            class="cls-3"
            cx="637.536"
            cy="855.783"
            r="25.075"
          />
          <circle
            data-square="d2"
            class="cls-2"
            cx="328.887"
            cy="855.783"
            r="25.075"
          />
          <circle
            data-square="c2"
            class="cls-3"
            cx="110.235"
            cy="637.703"
            r="25.075"
          />
          <circle
            data-square="b2"
            class="cls-2"
            cx="110.235"
            cy="328.719"
            r="25.075"
          />
          <circle
            data-square="a2"
            class="cls-3"
            cx="328.719"
            cy="110.235"
            r="25.075"
          />
          <circle
            data-square="h1"
            class="cls-3"
            cx="658.532"
            cy="59.949"
            r="25.075"
          />
          <circle
            data-square="g1"
            class="cls-2"
            cx="906.474"
            cy="307.89"
            r="25.075"
          />
          <circle
            data-square="f1"
            class="cls-3"
            cx="906.474"
            cy="658.532"
            r="25.075"
          />
          <circle
            data-square="e1"
            class="cls-2"
            cx="658.532"
            cy="906.474"
            r="25.075"
          />
          <circle
            data-square="d1"
            class="cls-3"
            cx="307.89"
            cy="906.474"
            r="25.075"
          />
          <circle
            data-square="c1"
            class="cls-2"
            cx="59.949"
            cy="658.532"
            r="25.075"
          />
          <circle
            data-square="b1"
            class="cls-3"
            cx="59.949"
            cy="307.89"
            r="25.075"
          />
          <circle
            data-square="a1"
            class="cls-2"
            cx="307.89"
            cy="59.949"
            r="25.075"
          />
        </g>
        <g class="pieces"></g>
    </svg>
    `;

    this.svg = element?.querySelector("svg");
  }
}
