import { describe, expect, it } from 'vitest';
import {
  getActiveBrowserGamepad,
  getBrowserGamepadSnapshot,
  getBrowserGamepadDebugState,
  isBrowserGamepadConfirmPressed,
} from './gamepad';

function createNavigatorLike(gamepads: Array<Gamepad | null>) {
  return {
    getGamepads() {
      return gamepads;
    },
  };
}

function createGamepad(overrides?: Partial<Gamepad>): Gamepad {
  const buttons = Array.from({ length: 17 }, () => ({
    pressed: false,
    touched: false,
    value: 0,
  }));

  return {
    axes: [0, 0, 0, 0],
    buttons,
    connected: true,
    id: 'Xbox Wireless Controller',
    index: 0,
    mapping: 'standard',
    timestamp: 0,
    vibrationActuator: null,
    hapticActuators: [],
    pose: undefined,
    hand: '',
    displayId: 0,
    ...overrides,
  } as Gamepad;
}

describe('gamepad helpers', () => {
  it('selects the first connected browser gamepad', () => {
    const secondPad = createGamepad({ index: 1 });
    const navigatorLike = createNavigatorLike([null, secondPad]);

    expect(getActiveBrowserGamepad(navigatorLike)).toBe(secondPad);
  });

  it('reports raw slots when no controller is visible', () => {
    const debug = getBrowserGamepadDebugState(createNavigatorLike([null, null]), true);

    expect(debug.connected).toBe(false);
    expect(debug.slotCount).toBe(2);
    expect(debug.visiblePadCount).toBe(0);
    expect(debug.rawSlots).toEqual(['slot 0: null', 'slot 1: null']);
  });

  it('maps stick, d-pad, and face buttons into gameplay actions', () => {
    const pad = createGamepad({
      axes: [0.72, 0.61, 0, 0],
      buttons: Array.from({ length: 17 }, (_, index) => ({
        pressed: index === 0 || index === 2 || index === 9,
        touched: false,
        value: index === 0 || index === 2 || index === 9 ? 1 : 0,
      })),
    });

    const snapshot = getBrowserGamepadSnapshot(createNavigatorLike([pad]));

    expect(snapshot).toEqual({
      axisX: 0.72,
      left: false,
      right: true,
      run: true,
      down: true,
      jump: true,
      start: true,
      restart: false,
      pause: true,
    });
  });

  it('maps Y to restart', () => {
    const pad = createGamepad({
      buttons: Array.from({ length: 17 }, (_, index) => ({
        pressed: index === 3,
        touched: false,
        value: index === 3 ? 1 : 0,
      })),
    });

    const snapshot = getBrowserGamepadSnapshot(createNavigatorLike([pad]));

    expect(snapshot?.restart).toBe(true);
    expect(snapshot?.jump).toBe(false);
  });

  it('includes slot visibility in the debug snapshot for a connected pad', () => {
    const pad = createGamepad({ index: 1, mapping: '' });
    const debug = getBrowserGamepadDebugState(createNavigatorLike([null, pad]), true);

    expect(debug.connected).toBe(true);
    expect(debug.slotCount).toBe(2);
    expect(debug.visiblePadCount).toBe(1);
    expect(debug.rawSlots).toEqual([
      'slot 0: null',
      'slot 1: (unmapped) Xbox Wireless Controller',
    ]);
    expect(debug.mapping).toBe('(unmapped)');
  });

  it('records connect and disconnect events in the debug snapshot', () => {
    const pad = createGamepad();
    const connectEvent = new Event('gamepadconnected');
    const disconnectEvent = new Event('gamepaddisconnected');

    Object.defineProperty(connectEvent, 'gamepad', {
      value: pad,
    });
    Object.defineProperty(disconnectEvent, 'gamepad', {
      value: pad,
    });

    window.dispatchEvent(connectEvent);
    window.dispatchEvent(disconnectEvent);

    const debug = getBrowserGamepadDebugState(createNavigatorLike([pad]), true);

    expect(debug.eventLog[0]).toContain('disconnected #0 standard Xbox Wireless Controller');
    expect(debug.eventLog[1]).toContain('connected #0 standard Xbox Wireless Controller');
  });

  it('treats A as confirm on menus', () => {
    const pad = createGamepad({
      buttons: Array.from({ length: 17 }, (_, index) => ({
        pressed: index === 0,
        touched: false,
        value: index === 0 ? 1 : 0,
      })),
    });

    expect(isBrowserGamepadConfirmPressed(createNavigatorLike([pad]))).toBe(true);
  });
});
