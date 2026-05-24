/** Configuration options for the SimulationRenderer. */
export class GuiOptions {
  /** Canvas pixel width. */
  readonly width: number;

  /** Canvas pixel height. */
  readonly height: number;

  /** DOM node that receives the rendered <canvas> element. */
  readonly container: HTMLElement;

  /** Mapping from player id to a Three.js hex colour integer (e.g. 0xff0000 for red). */
  readonly playerColors: Map<number, number>;

  private constructor(
    width: number,
    height: number,
    container: HTMLElement,
    playerColors: Map<number, number>,
  ) {
    this.width = width;
    this.height = height;
    this.container = container;
    this.playerColors = playerColors;
  }

  /**
   * Creates a {@link GuiOptions} instance.
   *
   * @param width - Canvas pixel width.
   * @param height - Canvas pixel height.
   * @param container - DOM node that receives the rendered canvas element.
   * @param playerColors - Mapping from player id to a Three.js hex colour integer.
   * @returns A validated GuiOptions instance.
   * @throws {RangeError} If width or height is not positive.
   */
  public static create(
    width: number,
    height: number,
    container: HTMLElement,
    playerColors: Map<number, number>,
  ): GuiOptions {
    if (width <= 0) {
      throw new RangeError("width must be a positive number");
    }
    if (height <= 0) {
      throw new RangeError("height must be a positive number");
    }

    return new GuiOptions(width, height, container, playerColors);
  }
}
