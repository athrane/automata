import { GameController } from "./gui";

if (typeof document !== "undefined") {
  GameController.create(document.body).start();
}
