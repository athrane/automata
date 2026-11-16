import * as THREE from "three";

import { GuiOptions } from "./GuiOptions";
import { resolveParticleTimeStep } from "./ParticleTimeStep";
import { DEFAULT_REPULSION_RATIO, ParticleSimulation } from "../simulation";

/** Near clipping plane distance for the orthographic camera. */
const CAMERA_NEAR = 0.1;

/** Far clipping plane distance for the orthographic camera. */
const CAMERA_FAR = 10;

/** Z position of the orthographic camera. */
const CAMERA_Z = 1;

/** Number of straight segments approximating each particle's disc. */
const DISC_SEGMENTS = 16;

/** Base colour of the disc material; each instance's colour multiplies it. */
const DISC_BASE_COLOR = 0xffffff;

/** Frames per generation until {@link ParticleRenderer.setFramesPerGeneration} says otherwise. */
const DEFAULT_FRAMES_PER_GENERATION = 1;

/**
 * Renders a {@link ParticleSimulation} in a browser using Three.js.
 *
 * Every particle is one instance of a single disc mesh, so the whole
 * simulation is one draw call. Instance colours are set once, since a
 * particle's type never changes; instance positions are updated every frame.
 *
 * Use the static factory method {@link ParticleRenderer.create} to construct an instance.
 */
export class ParticleRenderer {
  private readonly simulation: ParticleSimulation;
  private readonly options: GuiOptions;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.OrthographicCamera;
  private readonly discs: THREE.InstancedMesh;
  /** Scratch matrix reused every frame, so positioning the discs allocates nothing. */
  private readonly placement: THREE.Matrix4;
  private frameId: number | null;
  private timeStep: number;

  /**
   * Private constructor — use {@link ParticleRenderer.create} instead.
   *
   * @param simulation - The simulation whose particles will be rendered.
   * @param options - Renderer configuration.
   */
  private constructor(simulation: ParticleSimulation, options: GuiOptions) {
    this.simulation = simulation;
    this.options = options;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(
      0,
      simulation.width,
      simulation.height,
      0,
      CAMERA_NEAR,
      CAMERA_FAR,
    );

    // A disc as wide as the repulsion distance, so a packed cluster looks packed.
    const discRadius = (simulation.interactionRadius * DEFAULT_REPULSION_RATIO) / 2;
    this.discs = new THREE.InstancedMesh(
      new THREE.CircleGeometry(discRadius, DISC_SEGMENTS),
      new THREE.MeshBasicMaterial({ color: DISC_BASE_COLOR }),
      simulation.getParticles().length,
    );
    // The discs move every frame, so a bounding volume computed once would go stale.
    this.discs.frustumCulled = false;
    this.placement = new THREE.Matrix4();
    this.frameId = null;
    this.timeStep = resolveParticleTimeStep(DEFAULT_FRAMES_PER_GENERATION);
  }

  /**
   * Creates and initialises a {@link ParticleRenderer}.
   *
   * @param simulation - The simulation whose particles will be rendered.
   * @param options - Renderer configuration; `playerColors` maps each particle type to its colour.
   * @returns A fully initialised renderer ready to call {@link start}.
   */
  public static create(simulation: ParticleSimulation, options: GuiOptions): ParticleRenderer {
    const instance = new ParticleRenderer(simulation, options);
    instance.initThree();

    return instance;
  }

  /** Appends the canvas, aims the camera, and colours and places every disc. */
  private initThree(): void {
    this.renderer.setSize(this.options.width, this.options.height);
    this.options.container.appendChild(this.renderer.domElement);

    this.camera.position.set(0, 0, CAMERA_Z);
    this.camera.lookAt(0, 0, 0);

    const color = new THREE.Color();
    const particles = this.simulation.getParticles();
    for (let index = 0; index < particles.length; index += 1) {
      color.setHex(this.options.playerColors.get(particles[index].type) ?? DISC_BASE_COLOR);
      this.discs.setColorAt(index, color);
    }

    this.scene.add(this.discs);
    this.render();
  }

  /** Moves every disc to its particle's current position. */
  public render(): void {
    const particles = this.simulation.getParticles();
    for (let index = 0; index < particles.length; index += 1) {
      this.placement.makeTranslation(particles[index].x, particles[index].y, 0);
      this.discs.setMatrixAt(index, this.placement);
    }
    this.discs.instanceMatrix.needsUpdate = true;
  }

  /**
   * Sets the speed level as frames per generation.
   *
   * The renderer still steps once per frame; a higher value makes each step
   * smaller, so slower speeds stay smooth.
   *
   * @param frames - Number of frames per generation. Must be at least 1.
   * @throws {RangeError} If frames is less than 1.
   */
  public setFramesPerGeneration(frames: number): void {
    this.timeStep = resolveParticleTimeStep(frames);
  }

  /**
   * Starts the animation loop: each frame advances the simulation by one step
   * and draws it. The loop continues until {@link stop} is called.
   */
  public start(): void {
    const loop = (): void => {
      this.simulation.step(this.timeStep);
      this.render();
      this.renderer.render(this.scene, this.camera);
      this.frameId = requestAnimationFrame(loop);
    };

    this.frameId = requestAnimationFrame(loop);
  }

  /** Stops the animation loop started by {@link start}. */
  public stop(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  /**
   * Stops the animation loop, releases the GPU resources, and removes the
   * canvas element from the DOM.
   */
  public destroy(): void {
    this.stop();
    this.discs.geometry.dispose();
    (this.discs.material as THREE.Material).dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
