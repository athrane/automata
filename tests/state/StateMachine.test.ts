import { StateMachine } from '../../src/state/StateMachine';
import type { GameState } from '../../src/state/GameState';

describe('StateMachine', () => {
  describe('create', () => {
    it('starts in title-screen state by default', () => {
      // Arrange / Act
      const machine = StateMachine.create();

      // Assert
      expect(machine.currentState).toBe('title-screen');
    });

    it('starts in the provided initial state', () => {
      // Arrange / Act
      const machine = StateMachine.create('game-configuration');

      // Assert
      expect(machine.currentState).toBe('game-configuration');
    });
  });

  describe('transition', () => {
    it('transitions from title-screen to game-configuration', () => {
      // Arrange
      const machine = StateMachine.create('title-screen');

      // Act
      machine.transition('game-configuration');

      // Assert
      expect(machine.currentState).toBe('game-configuration');
    });

    it('transitions from game-configuration to game', () => {
      // Arrange
      const machine = StateMachine.create('game-configuration');

      // Act
      machine.transition('game');

      // Assert
      expect(machine.currentState).toBe('game');
    });

    it('transitions from game to game-over', () => {
      // Arrange
      const machine = StateMachine.create('game');

      // Act
      machine.transition('game-over');

      // Assert
      expect(machine.currentState).toBe('game-over');
    });

    it('transitions from game-over to title-screen', () => {
      // Arrange
      const machine = StateMachine.create('game-over');

      // Act
      machine.transition('title-screen');

      // Assert
      expect(machine.currentState).toBe('title-screen');
    });

    it('throws when transitioning to an invalid state', () => {
      // Arrange
      const machine = StateMachine.create('title-screen');

      // Act / Assert
      expect(() => machine.transition('game-over')).toThrow(
        "Invalid state transition from 'title-screen' to 'game-over'",
      );
    });

    it('does not change state when an invalid transition is attempted', () => {
      // Arrange
      const machine = StateMachine.create('title-screen');

      // Act
      try {
        machine.transition('game');
      } catch {
        // expected
      }

      // Assert
      expect(machine.currentState).toBe('title-screen');
    });
  });

  describe('canTransitionTo', () => {
    it('returns true for a valid transition', () => {
      // Arrange
      const machine = StateMachine.create('title-screen');

      // Act
      const result = machine.canTransitionTo('game-configuration');

      // Assert
      expect(result).toBe(true);
    });

    it('returns false for an invalid transition', () => {
      // Arrange
      const machine = StateMachine.create('title-screen');

      // Act
      const result = machine.canTransitionTo('game-over');

      // Assert
      expect(result).toBe(false);
    });

    it('returns false when target equals current state', () => {
      // Arrange
      const machine = StateMachine.create('game');

      // Act
      const result: boolean = machine.canTransitionTo('game' as GameState);

      // Assert
      expect(result).toBe(false);
    });
  });
});
