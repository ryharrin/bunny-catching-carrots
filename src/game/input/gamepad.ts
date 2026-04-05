import type { GamepadSnapshot } from './bindings';

interface BrowserNavigatorLike {
  getGamepads?: () => ArrayLike<Gamepad | null> | null;
}

interface BrowserWindowLike {
  addEventListener?: (
    type: 'gamepadconnected' | 'gamepaddisconnected',
    listener: (event: Event) => void,
  ) => void;
}

const GAMEPAD_AXIS_DEAD_ZONE = 0.28;
const GAMEPAD_DOWN_AXIS_DEAD_ZONE = 0.4;
const CONFIRM_BUTTONS = [0];
const RUN_BUTTONS = [2];
const RESTART_BUTTONS = [3];
const START_BUTTONS = [9];
const MAX_EVENT_LOG = 8;
const gamepadEventLog: string[] = [];
let gamepadEventListenersInstalled = false;

export interface GamepadDebugState {
  connected: boolean;
  pageFocused: boolean;
  slotCount: number;
  visiblePadCount: number;
  rawSlots: string[];
  eventLog: string[];
  index: number | null;
  id: string | null;
  mapping: string | null;
  axisX: number;
  axisY: number;
  buttons: {
    a: boolean;
    b: boolean;
    x: boolean;
    y: boolean;
    start: boolean;
    dpadUp: boolean;
    dpadDown: boolean;
    dpadLeft: boolean;
    dpadRight: boolean;
  };
}

function getNavigatorLike(): BrowserNavigatorLike | null {
  if (typeof navigator === 'undefined') {
    return null;
  }

  return navigator;
}

function getWindowLike(): BrowserWindowLike | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window;
}

function pageHasFocus(): boolean {
  if (typeof document === 'undefined') {
    return true;
  }

  return document.hasFocus();
}

function pushEventLog(message: string): void {
  const timestamp = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  gamepadEventLog.unshift(`${timestamp} ${message}`);
  gamepadEventLog.splice(MAX_EVENT_LOG);
}

function formatPadSummary(pad: Gamepad): string {
  return `#${pad.index} ${pad.mapping || '(unmapped)'} ${pad.id}`;
}

function installGamepadEventListeners(windowLike: BrowserWindowLike | null = getWindowLike()): void {
  if (gamepadEventListenersInstalled || !windowLike?.addEventListener) {
    return;
  }

  windowLike.addEventListener('gamepadconnected', (event) => {
    const gamepadEvent = event as GamepadEvent;
    pushEventLog(`connected ${formatPadSummary(gamepadEvent.gamepad)}`);
  });

  windowLike.addEventListener('gamepaddisconnected', (event) => {
    const gamepadEvent = event as GamepadEvent;
    pushEventLog(`disconnected ${formatPadSummary(gamepadEvent.gamepad)}`);
  });

  gamepadEventListenersInstalled = true;
}

function buttonPressed(gamepad: Gamepad, indexes: number[]): boolean {
  return indexes.some((index) => Boolean(gamepad.buttons[index]?.pressed));
}

function getAxis(gamepad: Gamepad, index: number): number {
  return gamepad.axes[index] ?? 0;
}

function normalizeAxis(axis: number): number {
  if (Math.abs(axis) < GAMEPAD_AXIS_DEAD_ZONE) {
    return 0;
  }

  return Math.max(-1, Math.min(1, axis));
}

export function getActiveBrowserGamepad(
  navigatorLike: BrowserNavigatorLike | null = getNavigatorLike(),
): Gamepad | null {
  installGamepadEventListeners();
  const pads = navigatorLike?.getGamepads?.();

  if (!pads) {
    return null;
  }

  for (const pad of Array.from(pads)) {
    if (pad && pad.connected !== false) {
      return pad;
    }
  }

  return null;
}

export function getBrowserGamepadSnapshot(
  navigatorLike: BrowserNavigatorLike | null = getNavigatorLike(),
): GamepadSnapshot | null {
  const pad = getActiveBrowserGamepad(navigatorLike);

  if (!pad) {
    return null;
  }

  const axisX = normalizeAxis(getAxis(pad, 0));
  const axisY = getAxis(pad, 1);

  return {
    axisX,
    left: buttonPressed(pad, [14]) || axisX <= -GAMEPAD_AXIS_DEAD_ZONE,
    right: buttonPressed(pad, [15]) || axisX >= GAMEPAD_AXIS_DEAD_ZONE,
    run: buttonPressed(pad, RUN_BUTTONS),
    down: buttonPressed(pad, [13]) || axisY >= GAMEPAD_DOWN_AXIS_DEAD_ZONE,
    jump: buttonPressed(pad, CONFIRM_BUTTONS),
    start: buttonPressed(pad, START_BUTTONS),
    restart: buttonPressed(pad, RESTART_BUTTONS),
    pause: buttonPressed(pad, START_BUTTONS),
  };
}

export function isBrowserGamepadConfirmPressed(
  navigatorLike: BrowserNavigatorLike | null = getNavigatorLike(),
): boolean {
  const pad = getActiveBrowserGamepad(navigatorLike);

  if (!pad) {
    return false;
  }

  return buttonPressed(pad, [...CONFIRM_BUTTONS, ...START_BUTTONS]);
}

export function getBrowserGamepadDebugState(
  navigatorLike: BrowserNavigatorLike | null = getNavigatorLike(),
  focused = pageHasFocus(),
): GamepadDebugState {
  installGamepadEventListeners();
  const pads = Array.from(navigatorLike?.getGamepads?.() ?? []);
  const pad = getActiveBrowserGamepad(navigatorLike);
  const rawSlots =
    pads.length > 0
      ? pads.map((entry, index) =>
          entry ? `slot ${index}: ${entry.mapping || '(unmapped)'} ${entry.id}` : `slot ${index}: null`,
        )
      : ['no slots returned'];
  const visiblePadCount = pads.filter((entry) => Boolean(entry)).length;

  if (!pad) {
    return {
      connected: false,
      pageFocused: focused,
      slotCount: pads.length,
      visiblePadCount,
      rawSlots,
      eventLog: [...gamepadEventLog],
      index: null,
      id: null,
      mapping: null,
      axisX: 0,
      axisY: 0,
      buttons: {
        a: false,
        b: false,
        x: false,
        y: false,
        start: false,
        dpadUp: false,
        dpadDown: false,
        dpadLeft: false,
        dpadRight: false,
      },
    };
  }

  return {
    connected: true,
    pageFocused: focused,
    slotCount: pads.length,
    visiblePadCount,
    rawSlots,
    eventLog: [...gamepadEventLog],
    index: pad.index,
    id: pad.id,
    mapping: pad.mapping || '(unmapped)',
    axisX: getAxis(pad, 0),
    axisY: getAxis(pad, 1),
    buttons: {
      a: buttonPressed(pad, [0]),
      b: buttonPressed(pad, [1]),
      x: buttonPressed(pad, [2]),
      y: buttonPressed(pad, [3]),
      start: buttonPressed(pad, [9]),
      dpadUp: buttonPressed(pad, [12]),
      dpadDown: buttonPressed(pad, [13]),
      dpadLeft: buttonPressed(pad, [14]),
      dpadRight: buttonPressed(pad, [15]),
    },
  };
}
