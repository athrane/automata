import { Simulation, SimulationOptions } from "./simulation";
import { GuiOptions, SimulationRenderer } from "./gui";

const simulationOptions = SimulationOptions.create();
export const simulation = Simulation.create(simulationOptions);

if (typeof document !== "undefined") {
  const guiOptions = GuiOptions.create(
    800,
    800,
    document.body,
    new Map([[1, 0xff0000]]),
  );

  SimulationRenderer.create(simulation, guiOptions).start();
}
