import GameDoor from "./GameDoor";

import styles from "../../../styles/Home/GameList.module.scss";
import { Index } from "solid-js";
import { useSubscribeToGameseeks } from "../../../hooks/useSubscribeToGameseeks";

type GameListProps = {
  active: boolean;
};

export function GameList(props: GameListProps) {
  const { listOfGames } = useSubscribeToGameseeks();

  return (
    <div
      class={styles.game_list_main}
      classList={{
        inactive: !props.active,
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
          <Index each={listOfGames()}>
            {(gs) => <GameDoor gameSeek={gs()} />}
          </Index>
        </div>
      </section>
    </div>
  );
}
