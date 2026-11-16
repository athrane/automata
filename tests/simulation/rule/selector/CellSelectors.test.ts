import {
  EmptyCellSelector,
  OtherPlayerCellSelector,
  OwnCellSelector,
  SpecificPlayerCellSelector,
} from "../../../../src/simulation/rule/selector";

/** The player the selectors are evaluated for. */
const ACTING_PLAYER = 1;

/** A player other than the acting one. */
const OTHER_PLAYER = 2;

describe("OwnCellSelector", () => {
  it("selects a cell held by the acting player", () => {
    expect(OwnCellSelector.create().selects(ACTING_PLAYER, ACTING_PLAYER)).toBe(true);
  });

  it("does not select a cell held by another player", () => {
    expect(OwnCellSelector.create().selects(OTHER_PLAYER, ACTING_PLAYER)).toBe(false);
  });

  it("does not select an empty cell", () => {
    expect(OwnCellSelector.create().selects(null, ACTING_PLAYER)).toBe(false);
  });
});

describe("OtherPlayerCellSelector", () => {
  it("selects a cell held by another player", () => {
    expect(OtherPlayerCellSelector.create().selects(OTHER_PLAYER, ACTING_PLAYER)).toBe(true);
  });

  it("does not select a cell held by the acting player", () => {
    expect(OtherPlayerCellSelector.create().selects(ACTING_PLAYER, ACTING_PLAYER)).toBe(false);
  });

  it("does not select an empty cell", () => {
    expect(OtherPlayerCellSelector.create().selects(null, ACTING_PLAYER)).toBe(false);
  });
});

describe("EmptyCellSelector", () => {
  it("selects an empty cell", () => {
    expect(EmptyCellSelector.create().selects(null, ACTING_PLAYER)).toBe(true);
  });

  it("does not select a cell held by the acting player", () => {
    expect(EmptyCellSelector.create().selects(ACTING_PLAYER, ACTING_PLAYER)).toBe(false);
  });

  it("does not select a cell held by another player", () => {
    expect(EmptyCellSelector.create().selects(OTHER_PLAYER, ACTING_PLAYER)).toBe(false);
  });
});

describe("SpecificPlayerCellSelector", () => {
  it("selects a cell held by the named player when another player acts", () => {
    expect(SpecificPlayerCellSelector.create(OTHER_PLAYER).selects(OTHER_PLAYER, ACTING_PLAYER)).toBe(true);
  });

  it("selects a cell held by the named player when that player acts", () => {
    expect(SpecificPlayerCellSelector.create(OTHER_PLAYER).selects(OTHER_PLAYER, OTHER_PLAYER)).toBe(true);
  });

  it("does not select a cell held by a different player", () => {
    expect(SpecificPlayerCellSelector.create(OTHER_PLAYER).selects(ACTING_PLAYER, ACTING_PLAYER)).toBe(false);
  });

  it("does not select an empty cell", () => {
    expect(SpecificPlayerCellSelector.create(OTHER_PLAYER).selects(null, ACTING_PLAYER)).toBe(false);
  });

  describe("create", () => {
    it("throws RangeError when the id is zero", () => {
      expect(() => SpecificPlayerCellSelector.create(0)).toThrow(RangeError);
    });

    it("throws RangeError when the id is negative", () => {
      expect(() => SpecificPlayerCellSelector.create(-1)).toThrow(RangeError);
    });

    it("throws RangeError when the id is not an integer", () => {
      expect(() => SpecificPlayerCellSelector.create(1.5)).toThrow(RangeError);
    });
  });
});
