import * as THREE from "three";

import { GuiOptions } from "./GuiOptions";
import { Simulation } from "../simulation";

/** Near clipping plane distance for the orthographic camera. */
const CAMERA_NEAR = 0.1;

/** Far clipping plane distance for the orthographic camera. */
const CAMERA_FAR = 10;

/** Z position of the orthographic camera. */
const CAMERA_Z = 1;

/** Default cell colour (black) used when a player id has no mapping in playerColors. */
const DEFAULT_CELL_COLOR = 0x000000;

/**
 * Minimum number of generations that must elapse before a grid with no living
 * cells triggers the game-over callback.
 */
const MINIMUM_GENERATIONS_BEFORE_GAME_OVER = 5;

/** Frames each generation is held for until {@link SimulationRenderer.setFramesPerGeneration} says otherwise. */
const DEFAULT_FRAMES_PER_GENERATION = 1;

/**
 * Renders a {@link Simulation} grid in a browser using Three.js.
 *
 * Use the static factory method {@link SimulationRenderer.create} to construct an instance.
 */
export class SimulationRenderer {
  private readonly simulation: Simulation;
  private readonly options: GuiOptions;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.OrthographicCamera;
  private readonly meshGrid: THREE.Mesh[][];
  private frameId: number | null;
  private framesPerGeneration: number;
  private frameCount: number;

  /**
   * Private constructor — use {@link SimulationRenderer.create} instead.
   *
   * @param simulation - The simulation whose grid will be rendered.
   * @param options - Renderer configuration.
   */
  private constructor(simulation: Simulation, options: GuiOptions) {
    this.simulation = simulation;
    this.options = options;
    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(
      0,
      simulation.width,
      simulation.height,
      0,
      CAMERA_NEAR,
      CAMERA_FAR,
    );
    this.meshGrid = [];
    this.frameId = null;
    this.framesPerGeneration = DEFAULT_FRAMES_PER_GENERATION;
    this.frameCount = 0;
  }

  /**
   * Creates and initialises a {@link SimulationRenderer}.
   *
   * @param simulation - The simulation whose grid will be rendered.
   * @param options - Renderer configuration.
   * @returns A fully initialised renderer ready to call {@link start}.
   */
  public static create(simulation: Simulation, options: GuiOptions): SimulationRenderer {
    const instance = new SimulationRenderer(simulation, options);
    instance.initThree();

    return instance;
  }

  /**
   * Initialises the Three.js renderer, scene, camera, and per-cell meshes.
   */
  private initThree(): void {
    this.renderer.setSize(this.options.width, this.options.height);
    this.options.container.appendChild(this.renderer.domElement);

    this.camera.position.set(0, 0, CAMERA_Z);
    this.camera.lookAt(0, 0, 0);

    for (let y = 0; y < this.simulation.height; y += 1) {
      this.meshGrid[y] = [];
      for (let x = 0; x < this.simulation.width; x += 1) {
        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = new THREE.MeshBasicMaterial({ color: DEFAULT_CELL_COLOR });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x + 0.5, y + 0.5, 0);
        this.scene.add(mesh);
        this.meshGrid[y][x] = mesh;
      }
    }
  }

  /**
   * Synchronises the Three.js scene to the current simulation grid state.
   * Updates each cell mesh colour based on the player id mapped in `playerColors`.
   */
  public render(): void {
    const grid = this.simulation.getGrid();

    for (let y = 0; y < this.simulation.height; y += 1) {
      for (let x = 0; x < this.simulation.width; x += 1) {
        const cell = grid[y][x];
        const color = cell !== null
          ? (this.options.playerColors.get(cell) ?? DEFAULT_CELL_COLOR)
          : DEFAULT_CELL_COLOR;
        (this.meshGrid[y][x].material as THREE.MeshBasicMaterial).color.setHex(color);
      }
    }
  }

  /**
   * Sets how many animation frames each generation is held on screen.
   *
   * A value of 1 advances the simulation once per frame, which is the fastest
   * rate supported; higher values slow the simulation down without affecting
   * the frame rate the scene is rendered at.
   *
   * @param frames - Number of frames per generation. Must be at least 1.
   * @throws {RangeError} If frames is less than 1.
   */
  public setFramesPerGeneration(frames: number): void {
    if (frames < 1) {
      throw new RangeError('frames must be at least 1');
    }

    this.framesPerGeneration = frames;
    this.frameCount = 0;
  }

  /**
   * Starts the animation loop: each frame synchronises the scene and renders it,
   * advancing the simulation by one generation every `framesPerGeneration` frames.
   * The loop continues until {@link stop} is called.
   *
   * When all cells die after at least {@link MINIMUM_GENERATIONS_BEFORE_GAME_OVER} generations,
   * the loop stops automatically and `onGameOver` is invoked with the final generation count.
   *
   * @param onGameOver - Optional callback invoked when the game ends. Receives the final generation number.
   */
  public start(onGameOver?: (generation: number) => void): void {
    const loop = (): void => {
      this.frameCount += 1;
      if (this.frameCount >= this.framesPerGeneration) {
        this.frameCount = 0;
        this.simulation.run();
      }

      this.render();
      this.renderer.render(this.scene, this.camera);

      if (
        this.simulation.generation >= MINIMUM_GENERATIONS_BEFORE_GAME_OVER &&
        !this.simulation.hasLivingCells()
      ) {
        this.stop();
        onGameOver?.(this.simulation.generation);
        return;
      }

      this.frameId = requestAnimationFrame(loop);
    };

    this.frameId = requestAnimationFrame(loop);
  }

  /**
   * Stops the animation loop started by {@link start}.
   */
  public stop(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  /**
   * Stops the animation loop and removes the canvas element from the DOM.
   * Call this when discarding a renderer to avoid stale canvases.
   */
  public destroy(): void {
    this.stop();
    this.renderer.domElement.remove();
  }
}
