import type Phaser from 'phaser';

const MAX_GAMEPAD_SLOTS = 4;

export function getActivePad(
  plugin: Phaser.Input.Gamepad.GamepadPlugin | null | undefined,
): Phaser.Input.Gamepad.Gamepad | null {
  if (!plugin) {
    return null;
  }

  const connectedPads = plugin.getAll();

  if (connectedPads.length > 0) {
    return connectedPads[0] ?? null;
  }

  const slotCount = Math.max(MAX_GAMEPAD_SLOTS, plugin.total);

  for (let index = 0; index < slotCount; index += 1) {
    const pad = plugin.getPad(index);

    if (pad) {
      return pad;
    }
  }

  return null;
}
