import styles from "../../styles/Game/Gameboard.module.scss";
import { createSignal, For, Index, Setter, Show } from "solid-js";
import {
  Board,
  Colors,
  PieceType,
  PromotePieceType,
  Square,
  Option,
  MoveNotation,
} from "../../types/types";
import Piece from "./Piece";
import { FILES, PIECE_TYPES, RANKS } from "../../constants";
import { ClientGameInterface } from "crochess_engine";
import Promotion from "./Promotion";
import { useParams } from "@solidjs/router";
import { sendMove } from "../../utils/game/ingameActions";
import { user } from "../../globalState";

//prettier-ignore
const squaresFromBlackPov = [
  56, 57, 58, 59, 60, 61, 62, 63, 
  48, 49, 50, 51, 52, 53, 54, 55,
  40, 41, 42, 43, 44, 45, 46, 47,
  32, 33, 34, 35, 36, 37, 38, 39,
  24, 25, 26, 27, 28, 29, 30, 31,
  16, 17, 18, 19, 20, 21, 22, 23,
  8, 9, 10, 11, 12, 13, 14, 15,
  0, 1, 2, 3, 4, 5, 6, 7,
];

const squaresFromWhitePov = Array(64)
  .fill(0)
  .map((_, i) => i);

const H1 = 7;
const A8 = 56;
const FILE_BITS = 7;

type GameboardProps = {
  view: Colors;
  board: Board;
  gameActive: boolean;
  latestBoardBeingViewed: boolean;
  squareToMove: Square | null;
  setSquareToMove: Setter<Square | null>;
  getLegalMoves: (square: Square) => Uint32Array;
  validateMove: (to: number) => boolean;
  isPromotion: (to: number) => boolean;
  activePlayer: Option<Colors>;
  activeTurn: boolean;
};

export function Gameboard(props: GameboardProps) {
  const { id: gameId } = useParams();
  const [highlightedSquares, setHighlightedSquares] = createSignal<Uint32Array>(
    new Uint32Array(),
  );
  const [promotePopupSquare, setPromotePopupSquare] =
    createSignal<Square | null>(null);

  function resetSquareToMove() {
    props.setSquareToMove(null);
    setHighlightedSquares(new Uint32Array());
  }

  function onMakeMove(to: number, promotePiece: string | undefined) {
    if (!props.gameActive) return;

    let u = user();
    if (!u) return;

    if (!props.activeTurn) return;
    if (!props.squareToMove) return;
    let moveNotation = ClientGameInterface.make_move_notation(
      props.squareToMove,
      to,
      promotePiece,
    ) as MoveNotation;
    if (!props.validateMove(to)) {
      throw new Error(`${moveNotation} is not a valid move`);
    }

    try {
      sendMove(gameId, u, moveNotation);
    } catch (err) {
      console.log(err);
    }

    resetSquareToMove();
  }

  return (
    <div class={`${styles.main} ${styles[props.view]}`}>
      <For
        each={
          props.view === "white" ? squaresFromWhitePov : squaresFromBlackPov
        }
      >
        {(s) => {
          const evenFile = s % 2 != 0;
          const evenRank = Math.floor(s / 8) % 2 != 0;
          const classNames = [styles.boardSquare];
          if (evenFile) classNames.push(styles["file-even"]);
          else classNames.push(styles["file-odd"]);

          return (
            <div
              class={classNames.join(" ")}
              classList={{
                [styles["rank-even"]]: evenRank,
                [styles["rank-odd"]]: !evenRank,
                [styles["file-even"]]: evenFile,
                [styles["file-odd"]]: !evenFile,
                [styles.active]: highlightedSquares().includes(s),
              }}
              style={{
                "grid-area": ClientGameInterface.name_of_square(s),
              }}
              onClick={() => {
                if (props.activePlayer !== null) {
                  if (!props.squareToMove) return;

                  if (props.isPromotion(s)) return setPromotePopupSquare(s);

                  onMakeMove(s, undefined);
                }
              }}
            >
              <Show when={props.view === "white" ? s <= H1 : s >= A8}>
                <div class={`${styles.file} label`}>
                  {FILES[ClientGameInterface.file_of_square(s)]}
                </div>
              </Show>
              <Show
                when={
                  props.view === "white"
                    ? (s & FILE_BITS) === 0
                    : (s & FILE_BITS) === FILE_BITS
                }
              >
                <div class={`${styles.rank} label`}>
                  {RANKS[ClientGameInterface.rank_of_square(s)]}
                </div>
              </Show>
              <Show when={promotePopupSquare() === s}>
                <Promotion
                  onPromote={(e) => {
                    e.stopPropagation();
                    const pieceSelectNode = e.currentTarget as HTMLElement;
                    const promoteSquare = promotePopupSquare();
                    if (!promoteSquare) {
                      console.error(
                        "Gameboard/Promotion/onPromote, there is no promote square",
                      );
                      return;
                    }

                    onMakeMove(
                      promoteSquare,
                      pieceSelectNode.dataset.piece as PromotePieceType,
                    );
                    setPromotePopupSquare(null);
                  }}
                  square={promotePopupSquare() as number}
                  view={props.view}
                />
              </Show>
            </div>
          );
        }}
      </For>
      <Show when={props.board}>
        <Index each={props.board} fallback={[]}>
          {(char, i) => {
            if (
              PIECE_TYPES.find((piece) => piece === char().toLowerCase()) ===
                undefined &&
              char() != "."
            )
              throw new Error(
                `encountered invalid piece (${char}) on the board.\nboard: ${props.board}\n`,
              );

            function getColorOfPiece(): Colors {
              return char().toLowerCase() === char() ? "black" : "white";
            }

            function square() {
              return squaresFromBlackPov[i];
            }

            return (
              <Show when={char() !== "."}>
                <Piece
                  color={getColorOfPiece()}
                  // using squaresFromBlackPov because that's how fen strings are structured
                  square={ClientGameInterface.name_of_square(square())}
                  type={char() as PieceType}
                  onClick={() => {
                    if (promotePopupSquare() || !props.latestBoardBeingViewed)
                      return;

                    if (
                      props.activePlayer !== null &&
                      getColorOfPiece() !== props.activePlayer
                    ) {
                      if (!props.squareToMove) return; // means this click is not a capture

                      if (props.isPromotion(square()))
                        return setPromotePopupSquare(square);

                      onMakeMove(square(), undefined);
                      return;
                    }

                    if (square() === props.squareToMove) {
                      resetSquareToMove();
                    } else {
                      // display legal moves
                      props.setSquareToMove(square);
                      setHighlightedSquares(
                        props.getLegalMoves(square()) || [],
                      );
                    }
                  }}
                />
              </Show>
            );
          }}
        </Index>
      </Show>
    </div>
  );
}
