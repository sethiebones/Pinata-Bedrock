import { system, world } from "@minecraft/server";

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function projectile(entity, start, end, dimension = "overworld") {
  const projectile = world.getDimension(dimension).spawnEntity(entity, start);

  moveAbsolute(projectile, end, 20, 0.5);
}

export function addVector3(vector3, addX, addY, addZ) {
  return { x: vector3.x + addX, y: vector3.y + addY, z: vector3.z + addZ };
}

export function highestLocation(dimension, location, options) {
  return dimension.getBlockBelow(
    { x: location.x, y: 320, z: location.z },
    options,
  );
}

export function doThis(
  callback,
  tryInterval = 1,
  maxTries = 0,
  concludingCallback = undefined,
) {
  /**
   * Tries a function until it is succesfully executed/
   * @param {function} callback The function to be executed. Must be formatted as
   * if(!//condition//){
   * return false;
   * } else {
   * //code to execute//
   * return true;
   * }
   * @param {number} tryInterval The time between tries.
   * @param {number} maxTries The maximum number of tries before failing. 0 is assumed to be no maximum.
   */
  let flag = false;

  let tries = 1;

  const interval = system.runInterval(() => {
    if (flag == false && callback() && (maxTries == 0 || tries <= maxTries)) {
      flag = true;
    }

    if (flag || (maxTries != 0 && tries > maxTries)) {
      system.clearRun(interval);
      concludingCallback && concludingCallback();
      return flag;
    }

    tries++;
  }, tryInterval);
}

export function missile(
  entity,
  start,
  end,
  number = 1,
  spacing = 0,
  delay = 0,
  dimension = "overworld",
) {
  system.runTimeout(() => {
    projectile(entity, start, end, dimension);
    for (let i = 1; i < number; i++) {
      system.runTimeout(() => {
        projectile(entity, start, end, dimension);
      }, i * spacing);
    }
  }, delay);
}

export function moveRelative(
  target,
  distanceX,
  distanceY,
  distanceZ,
  resolution,
  delay = 1,
  delayOffset = 0,
) {
  let stepX = distanceX / resolution;
  let stepY = distanceY / resolution;
  let stepZ = distanceZ / resolution;

  let tickDelay = delayOffset + delay;

  for (let i = 0; i < resolution; i++) {
    tickDelay += delay;
    system.runTimeout(() => {
      target.teleport({
        x: target.location.x + stepX,
        y: target.location.y + stepY,
        z: target.location.z + stepZ,
      });
    }, tickDelay);
  }
  return tickDelay;
}

export function tryMoveRelative(
  target,
  distanceX,
  distanceY,
  distanceZ,
  resolution,
  delay = 1,
  delayOffset = 0,
) {
  let stepX = distanceX / resolution;
  let stepY = distanceY / resolution;
  let stepZ = distanceZ / resolution;

  let tickDelay = delayOffset + delay;

  for (let i = 0; i < resolution; i++) {
    tickDelay += delay;
    system.runTimeout(() => {
      target.tryTeleport({
        x: target.location.x + stepX,
        y: target.location.y + stepY,
        z: target.location.z + stepZ,
      });
    }, tickDelay);
  }
  return tickDelay;
}

export function moveAbsolute(
  target,
  dest,
  resolution,
  delay = 1,
  delayOffset = 0,
) {
  const destX = dest.x;
  const destY = dest.y;
  const destZ = dest.z;
  let distanceX = destX - target.location.x;
  let distanceY = destY - target.location.y;
  let distanceZ = destZ - target.location.z;
  return moveRelative(
    target,
    distanceX,
    distanceY,
    distanceZ,
    resolution,
    delay,
    delayOffset,
  );
}

export function damageHeldItem(player, amount) {
  const equippable = player.getComponent("minecraft:equippable");
  const mainHandSlot = equippable.getEquipmentSlot("Mainhand");
  const itemStack = mainHandSlot.getItem();

  if (itemStack) {
    const durability = itemStack.getComponent("minecraft:durability");
    if (durability) {
      // Apply damage (ensure it doesn't exceed max durability)
      durability.damage = Math.min(
        durability.damage + amount,
        durability.maxDurability,
      );

      // If durability reached max, the item should break (clear the slot)
      if (durability.damage >= durability.maxDurability) {
        mainHandSlot.setItem(undefined);
      } else {
        mainHandSlot.setItem(itemStack);
      }
    }
  }
}
export function decrementHeldItem(player, amount = 1) {
  let success = false;
  const equippable = player.getComponent("minecraft:equippable");
  const mainHandSlot = equippable.getEquipmentSlot("Mainhand");
  const itemStack = mainHandSlot.getItem();

  if (itemStack) {
    const newAmount = itemStack.amount - amount;
    if (newAmount > 0) {
      // Decrement stack by amount (ensure it doesn't exceed current quantity)
      itemStack.amount = newAmount;
      success = true;

      mainHandSlot.setItem(itemStack);
    } else if (newAmount == 0) {
      // If amount is greater than quantity the slot should be cleared
      mainHandSlot.setItem(undefined);
      success = true;
    }
  }

  return success;
}
