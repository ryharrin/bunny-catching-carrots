import type { GamepadSnapshot } from './bindings';

interface BrowserHidLike {
  getDevices?: () => Promise<ArrayLike<WebHidDeviceLike>>;
  requestDevice?: (options: { filters: Array<Record<string, number>> }) => Promise<ArrayLike<WebHidDeviceLike>>;
  addEventListener?: (
    type: 'connect' | 'disconnect',
    listener: (event: WebHidConnectionEventLike) => void,
  ) => void;
}

interface WebHidConnectionEventLike extends Event {
  device: WebHidDeviceLike;
}

interface WebHidInputReportEventLike extends Event {
  data: DataView;
  device: WebHidDeviceLike;
  reportId: number;
}

interface WebHidCollectionLike {
  usage?: number;
  usagePage?: number;
}

interface WebHidDeviceLike {
  readonly opened?: boolean;
  readonly productId?: number;
  readonly productName?: string;
  readonly vendorId?: number;
  readonly collections?: WebHidCollectionLike[];
  open?: () => Promise<void>;
  addEventListener?: (type: 'inputreport', listener: (event: WebHidInputReportEventLike) => void) => void;
}

interface WebHidReportSignature {
  reportId: number;
  bytes: number[];
}

interface WebHidButtonMask {
  index: number;
  mask: number;
  value: number;
}

interface WebHidButtonMapping {
  reportId: number;
  bytesLength: number;
  masks: WebHidButtonMask[];
}

type WebHidCalibrationAction = 'jump' | 'run' | 'restart' | 'pause' | 'left' | 'right' | 'down';

interface WebHidCalibrationStep {
  action: WebHidCalibrationAction;
  label: string;
}

interface WebHidCalibrationState {
  active: boolean;
  stage: 'idle' | 'waiting_for_press' | 'waiting_for_release' | 'complete';
  stepIndex: number;
  pressedReport: WebHidReportSignature | null;
  mappings: Partial<Record<WebHidCalibrationAction, WebHidButtonMapping>>;
}

export interface WebHidDebugState {
  supported: boolean;
  requestPending: boolean;
  permissionCount: number;
  connected: boolean;
  opened: boolean;
  productName: string | null;
  vendorId: number | null;
  productId: number | null;
  collectionSummary: string[];
  lastReportId: number | null;
  lastReportHex: string | null;
  calibrationStatus: string;
  calibratedActions: string[];
  eventLog: string[];
  error: string | null;
  snapshot: GamepadSnapshot | null;
}

const CALIBRATION_STEPS: WebHidCalibrationStep[] = [
  { action: 'jump', label: 'A / Jump' },
  { action: 'run', label: 'X / Sprint' },
  { action: 'restart', label: 'Y / Restart' },
  { action: 'pause', label: 'Start / Pause' },
  { action: 'left', label: 'D-pad Left / Move Left' },
  { action: 'right', label: 'D-pad Right / Move Right' },
  { action: 'down', label: 'D-pad Down / Slide' },
];

const MAX_EVENT_LOG = 10;
const STORAGE_KEY_PREFIX = 'bunny-catching-carrots:webhid:';
const webHidEventLog: string[] = [];
let webHidListenersInstalled = false;
let knownDeviceRefreshPromise: Promise<void> | null = null;
let requestPending = false;
let activeDevice: WebHidDeviceLike | null = null;
let activeReport: WebHidReportSignature | null = null;
let activeSnapshot: GamepadSnapshot | null = null;
let activeDeviceKey: string | null = null;
let lastReportHex: string | null = null;
let lastReportId: number | null = null;
let lastError: string | null = null;
let permissionCount = 0;
const connectedDeviceKeys = new Set<string>();
let calibrationState: WebHidCalibrationState = {
  active: false,
  stage: 'idle',
  stepIndex: 0,
  pressedReport: null,
  mappings: {},
};

function getNavigatorLike(): Navigator | null {
  if (typeof navigator === 'undefined') {
    return null;
  }

  return navigator;
}

function getHidLike(navigatorLike: Navigator | null = getNavigatorLike()): BrowserHidLike | null {
  return (navigatorLike as Navigator & { hid?: BrowserHidLike } | null)?.hid ?? null;
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

function padHex(value: number): string {
  return value.toString(16).padStart(2, '0');
}

function deviceKey(device: WebHidDeviceLike): string {
  return `${device.vendorId ?? 0}:${device.productId ?? 0}:${device.productName ?? 'unknown'}`;
}

function pushEventLog(message: string): void {
  const timestamp = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  webHidEventLog.unshift(`${timestamp} ${message}`);
  webHidEventLog.splice(MAX_EVENT_LOG);
}

function getCollectionSummary(device: WebHidDeviceLike): string[] {
  const collections = device.collections ?? [];

  if (collections.length === 0) {
    return ['no HID collections reported'];
  }

  return collections.map((collection, index) => {
    const usagePage = collection.usagePage ?? 0;
    const usage = collection.usage ?? 0;
    return `collection ${index}: usagePage 0x${usagePage.toString(16)} usage 0x${usage.toString(16)}`;
  });
}

function isLikelyGameController(device: WebHidDeviceLike): boolean {
  if ((device.productName ?? '').toLowerCase().includes('controller')) {
    return true;
  }

  return (device.collections ?? []).some((collection) => {
    return collection.usagePage === 0x01 && (collection.usage === 0x04 || collection.usage === 0x05);
  });
}

function formatReport(bytes: number[]): string {
  if (bytes.length === 0) {
    return '(empty report)';
  }

  return bytes.map((value) => padHex(value)).join(' ');
}

function cloneReport(reportId: number, bytes: Uint8Array): WebHidReportSignature {
  return {
    reportId,
    bytes: Array.from(bytes),
  };
}

function buildButtonMapping(
  pressed: WebHidReportSignature,
  released: WebHidReportSignature,
): WebHidButtonMapping | null {
  if (pressed.reportId !== released.reportId) {
    return null;
  }

  const bytesLength = Math.max(pressed.bytes.length, released.bytes.length);
  const masks: WebHidButtonMask[] = [];

  for (let index = 0; index < bytesLength; index += 1) {
    const pressedByte = pressed.bytes[index] ?? 0;
    const releasedByte = released.bytes[index] ?? 0;
    const mask = pressedByte ^ releasedByte;

    if (mask === 0) {
      continue;
    }

    masks.push({
      index,
      mask,
      value: pressedByte & mask,
    });
  }

  if (masks.length === 0) {
    return null;
  }

  return {
    reportId: pressed.reportId,
    bytesLength,
    masks,
  };
}

function isMappingActive(mapping: WebHidButtonMapping | undefined, report: WebHidReportSignature | null): boolean {
  if (!mapping || !report || report.reportId !== mapping.reportId) {
    return false;
  }

  return mapping.masks.every((mask) => {
    const currentByte = report.bytes[mask.index] ?? 0;
    return (currentByte & mask.mask) === mask.value;
  });
}

function calibrationLabel(state: WebHidCalibrationState): string {
  if (state.stage === 'complete') {
    return 'ready';
  }

  if (!state.active) {
    return Object.keys(state.mappings).length > 0 ? 'saved calibration loaded' : 'not calibrated';
  }

  const currentStep = CALIBRATION_STEPS[state.stepIndex];

  if (!currentStep) {
    return 'ready';
  }

  if (state.stage === 'waiting_for_release') {
    return `release ${currentStep.label}`;
  }

  return `press ${currentStep.label}`;
}

function saveCalibration(device: WebHidDeviceLike, state: WebHidCalibrationState): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(
    `${STORAGE_KEY_PREFIX}${deviceKey(device)}`,
    JSON.stringify({
      mappings: state.mappings,
    }),
  );
}

function loadCalibration(device: WebHidDeviceLike): Partial<Record<WebHidCalibrationAction, WebHidButtonMapping>> {
  const storage = getStorage();

  if (!storage) {
    return {};
  }

  const raw = storage.getItem(`${STORAGE_KEY_PREFIX}${deviceKey(device)}`);

  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as { mappings?: Partial<Record<WebHidCalibrationAction, WebHidButtonMapping>> };
    return parsed.mappings ?? {};
  } catch {
    return {};
  }
}

function clearCalibration(device: WebHidDeviceLike | null = activeDevice): void {
  if (!device) {
    calibrationState = {
      active: false,
      stage: 'idle',
      stepIndex: 0,
      pressedReport: null,
      mappings: {},
    };
    activeSnapshot = null;
    return;
  }

  const storage = getStorage();
  storage?.removeItem(`${STORAGE_KEY_PREFIX}${deviceKey(device)}`);
  calibrationState = {
    active: false,
    stage: 'idle',
    stepIndex: 0,
    pressedReport: null,
    mappings: {},
  };
  activeSnapshot = createSnapshotFromCalibration();
  pushEventLog('cleared WebHID calibration');
}

function createSnapshotFromCalibration(report: WebHidReportSignature | null = activeReport): GamepadSnapshot | null {
  if (!report) {
    return null;
  }

  const mappings = calibrationState.mappings;
  const left = isMappingActive(mappings.left, report);
  const right = isMappingActive(mappings.right, report);

  return {
    axisX: right ? 1 : left ? -1 : 0,
    left,
    right,
    run: isMappingActive(mappings.run, report),
    down: isMappingActive(mappings.down, report),
    jump: isMappingActive(mappings.jump, report),
    start: false,
    restart: isMappingActive(mappings.restart, report),
    pause: isMappingActive(mappings.pause, report),
  };
}

function applyCalibrationReport(report: WebHidReportSignature): void {
  if (!calibrationState.active) {
    activeSnapshot = createSnapshotFromCalibration(report);
    return;
  }

  const currentStep = CALIBRATION_STEPS[calibrationState.stepIndex];

  if (!currentStep) {
    calibrationState.active = false;
    calibrationState.stage = 'complete';
    activeSnapshot = createSnapshotFromCalibration(report);
    return;
  }

  if (calibrationState.stage === 'waiting_for_press') {
    calibrationState.pressedReport = report;
    calibrationState.stage = 'waiting_for_release';
    pushEventLog(`captured ${currentStep.label} press`);
    activeSnapshot = createSnapshotFromCalibration(report);
    return;
  }

  if (calibrationState.stage !== 'waiting_for_release' || !calibrationState.pressedReport) {
    activeSnapshot = createSnapshotFromCalibration(report);
    return;
  }

  const mapping = buildButtonMapping(calibrationState.pressedReport, report);

  if (!mapping) {
    pushEventLog(`no bit change found for ${currentStep.label}; try again`);
    calibrationState.stage = 'waiting_for_press';
    calibrationState.pressedReport = null;
    activeSnapshot = createSnapshotFromCalibration(report);
    return;
  }

  calibrationState.mappings[currentStep.action] = mapping;
  calibrationState.stepIndex += 1;
  calibrationState.pressedReport = null;

  if (calibrationState.stepIndex >= CALIBRATION_STEPS.length) {
    calibrationState.active = false;
    calibrationState.stage = 'complete';
    if (activeDevice) {
      saveCalibration(activeDevice, calibrationState);
    }
    pushEventLog('WebHID calibration complete');
  } else {
    calibrationState.stage = 'waiting_for_press';
    pushEventLog(`saved ${currentStep.label}; next ${CALIBRATION_STEPS[calibrationState.stepIndex].label}`);
  }

  activeSnapshot = createSnapshotFromCalibration(report);
}

function handleInputReport(event: WebHidInputReportEventLike): void {
  if (activeDeviceKey && deviceKey(event.device) !== activeDeviceKey) {
    return;
  }

  const bytes = new Uint8Array(event.data.buffer, event.data.byteOffset, event.data.byteLength);
  const report = cloneReport(event.reportId, bytes);
  activeReport = report;
  lastReportId = report.reportId;
  lastReportHex = formatReport(report.bytes);
  applyCalibrationReport(report);
}

async function activateDevice(device: WebHidDeviceLike): Promise<void> {
  activeDevice = device;
  activeDeviceKey = deviceKey(device);
  lastError = null;

  if (!connectedDeviceKeys.has(activeDeviceKey)) {
    device.addEventListener?.('inputreport', handleInputReport);
    connectedDeviceKeys.add(activeDeviceKey);
  }

  if (!device.opened) {
    await device.open?.();
    pushEventLog(`opened WebHID ${device.productName ?? 'device'}`);
  }

  const storedMappings = loadCalibration(device);
  calibrationState = {
    active: false,
    stage: Object.keys(storedMappings).length > 0 ? 'complete' : 'idle',
    stepIndex: Object.keys(storedMappings).length > 0 ? CALIBRATION_STEPS.length : 0,
    pressedReport: null,
    mappings: storedMappings,
  };
  activeSnapshot = createSnapshotFromCalibration();
}

function installWebHidListeners(hidLike: BrowserHidLike | null = getHidLike()): void {
  if (webHidListenersInstalled || !hidLike?.addEventListener) {
    return;
  }

  hidLike.addEventListener('connect', (event) => {
    pushEventLog(`WebHID connected ${event.device.productName ?? 'device'}`);
    void refreshKnownWebHidDevices(hidLike);
  });

  hidLike.addEventListener('disconnect', (event) => {
    pushEventLog(`WebHID disconnected ${event.device.productName ?? 'device'}`);
    if (activeDeviceKey === deviceKey(event.device)) {
      activeDevice = null;
      activeDeviceKey = null;
      activeReport = null;
      activeSnapshot = null;
      lastReportHex = null;
      lastReportId = null;
    }
    connectedDeviceKeys.delete(deviceKey(event.device));
  });

  webHidListenersInstalled = true;
}

async function refreshKnownWebHidDevices(hidLike: BrowserHidLike | null = getHidLike()): Promise<void> {
  const getDevices = hidLike?.getDevices;

  if (!getDevices) {
    return;
  }

  if (knownDeviceRefreshPromise) {
    return knownDeviceRefreshPromise;
  }

  knownDeviceRefreshPromise = (async () => {
    try {
      const devices = Array.from(await getDevices());
      permissionCount = devices.length;
      const preferredDevice = devices.find((device) => isLikelyGameController(device)) ?? devices[0] ?? null;

      if (!preferredDevice) {
        return;
      }

      await activateDevice(preferredDevice);
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unable to inspect WebHID devices';
    } finally {
      knownDeviceRefreshPromise = null;
    }
  })();

  return knownDeviceRefreshPromise;
}

export function isWebHidSupported(navigatorLike: Navigator | null = getNavigatorLike()): boolean {
  return Boolean(getHidLike(navigatorLike));
}

export async function requestWebHidController(): Promise<void> {
  const hidLike = getHidLike();
  installWebHidListeners(hidLike);

  if (!hidLike?.requestDevice) {
    lastError = 'WebHID is not available in this browser';
    return;
  }

  requestPending = true;
  lastError = null;

  try {
    const devices = Array.from(await hidLike.requestDevice({ filters: [] }));
    permissionCount = Math.max(permissionCount, devices.length);
    const preferredDevice = devices.find((device) => isLikelyGameController(device)) ?? devices[0] ?? null;

    if (!preferredDevice) {
      pushEventLog('WebHID picker closed without selecting a device');
      return;
    }

    pushEventLog(`selected WebHID ${preferredDevice.productName ?? 'device'}`);
    await activateDevice(preferredDevice);
  } catch (error) {
    lastError = error instanceof Error ? error.message : 'WebHID request failed';
    pushEventLog(`WebHID request failed: ${lastError}`);
  } finally {
    requestPending = false;
  }
}

export function beginWebHidCalibration(): void {
  if (!activeDevice) {
    lastError = 'Connect a WebHID device before calibrating';
    return;
  }

  calibrationState = {
    active: true,
    stage: 'waiting_for_press',
    stepIndex: 0,
    pressedReport: null,
    mappings: {},
  };
  activeSnapshot = null;
  pushEventLog(`starting WebHID calibration: ${CALIBRATION_STEPS[0].label}`);
}

export function resetWebHidCalibration(): void {
  clearCalibration();
}

export function getWebHidSnapshot(): GamepadSnapshot | null {
  installWebHidListeners();
  void refreshKnownWebHidDevices();
  return activeSnapshot;
}

export function isWebHidConfirmPressed(): boolean {
  return Boolean(getWebHidSnapshot()?.jump);
}

export function getWebHidDebugState(): WebHidDebugState {
  installWebHidListeners();
  void refreshKnownWebHidDevices();

  return {
    supported: isWebHidSupported(),
    requestPending,
    permissionCount,
    connected: Boolean(activeDevice),
    opened: Boolean(activeDevice?.opened),
    productName: activeDevice?.productName ?? null,
    vendorId: activeDevice?.vendorId ?? null,
    productId: activeDevice?.productId ?? null,
    collectionSummary: activeDevice ? getCollectionSummary(activeDevice) : [],
    lastReportId,
    lastReportHex,
    calibrationStatus: calibrationLabel(calibrationState),
    calibratedActions: Object.keys(calibrationState.mappings).sort(),
    eventLog: [...webHidEventLog],
    error: lastError,
    snapshot: activeSnapshot,
  };
}
