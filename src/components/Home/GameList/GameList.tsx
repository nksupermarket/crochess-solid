import GameDoor from "./GameDoor";

import styles from "../../../styles/Home/GameList.module.scss";
import { Index, useContext } from "solid-js";
import { useListOfGames } from "../../../hooks/useListOfGames";
import { GameSeek } from "../../../types/types";
import { socket } from "../../../utils/global_state/globalState";

type GameListProps = {
  active: boolean;
};

export function GameList(props: GameListProps) {
  const { listOfGames } = useListOfGames(socket!);

  return (
    <div
      class={styles.game_list_main}
      classList={{
        [styles.inactive]: !props.active,
      }}
    >
      <header class={["section-header", styles.header].join(" ")}>
        <ul class="space-evenly">
          {["Color", "Time Control", "Game Type"].map((t) => (
            <li class="text-center">{t}</li>
          ))}
        </ul>
      </header>
      <section class={styles["game_door-ctn"]}>
        <div class={["scroller", styles.list_wrapper].join(" ")}>
          <Index each={listOfGames}>
            {(gs) => <GameDoor gameSeek={gs()} />}
          </Index>
        </div>
      </section>
    </div>
  );
}
