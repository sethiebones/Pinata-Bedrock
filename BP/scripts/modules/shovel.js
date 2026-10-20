import { world, system } from "@minecraft/server";
import { addVector3, damageHeldItem, doThis } from "./functions.js";

const shovelCanBreak = ["minecraft:grass", "minecraft:leaf_litter"];
function placeShovel(player, location) {
  let shovel = player.dimension.getEntities({
    type: "vp:shovel_entity",
    tags: [player.nameTag],
  })[0];
  if (shovel) {
    shovel.teleport(location);
  } else {
    shovel = player.dimension.spawnEntity("vp:shovel_entity", location);
    shovel.addTag(player.nameTag);
  }

  return shovel;
}

export function manageShovel(player, cursor) {
  const heldItem = player
    .getComponent("minecraft:inventory")
    .container.getItem(player.selectedSlotIndex);
  let shovel = player.dimension.getEntities({
    type: "vp:shovel_entity",
    tags: [player.nameTag],
  })[0];

  if (
    heldItem &&
    heldItem.hasTag("vp:is_shovel") &&
    !cursor.hasTag("at_player") &&
    !cursor.hasTag("carrying")
  ) {
    shovel = placeShovel(player, cursor.location);
  } else {
    if (shovel && shovel.getProperty("vp:animation") == "idle") {
      shovel.remove();
    }
  }
}

world.beforeEvents.playerBreakBlock.subscribe((data) => {
  const block = data.block;
  const item = data.itemStack;
  const player = data.player;
  if (item?.amount > 0 && item.typeId == "vp:freebie_shovel") {
    if (!shovelCanBreak.includes(block.typeId)) data.cancel = true;
    system.run(() => {
      doThis(() => {
        let shovel = placeShovel(player, block.above().location);
        if (!(shovel.getProperty("vp:animation") == "idle")) {
          return false;
        } else {
          shovel.setProperty("vp:animation", "whack_soil");

          data.player.playSound("vp.shovel_patting");
          block.dimension.spawnParticle("vp:hard_soil_dust", {
            x: block.location.x + 0.5,
            y: block.location.y + 1,
            z: block.location.z + 0.5,
          });

          if (block.typeId == "vp:hard_soil") {
            block.dimension.setBlockType(block.location, "minecraft:dirt");
          }

          system.runTimeout(() => {
            shovel.setProperty("vp:animation", "idle");
          }, 10);

          return true;
        }
      });
    });
  }
});
world.afterEvents.entityHitEntity.subscribe(({ damagingEntity, hitEntity }) => {
  if (damagingEntity.isValid && damagingEntity.typeId == "minecraft:player") {
    const heldItem = damagingEntity
      .getComponent("minecraft:inventory")
      .container.getItem(damagingEntity.selectedSlotIndex);
    if (hitEntity.isValid && heldItem && heldItem.hasTag("vp:is_shovel")) {
      let shovel = placeShovel(damagingEntity, hitEntity.location);
      shovel.setProperty("vp:animation", "whack");
      system.runTimeout(() => {
        if (shovel.isValid) {
          shovel.setProperty("vp:animation", "idle");
        }
      }, 30);
    }
  }
});
world.afterEvents.playerInteractWithEntity.subscribe(
  ({ player, target, itemStack }) => {
    if (itemStack && itemStack.hasTag("vp:is_shovel")) {
      let shovel = placeShovel(player, target.location);
      shovel.setProperty("vp:animation", "tap");
      system.runTimeout(() => {
        shovel.setProperty("vp:animation", "idle");
      }, 20);
    }
  },
);

world.afterEvents.dataDrivenEntityTrigger.subscribe(
  ({ entity, eventId, getModifiers }) => {
    if (entity.typeId != "vp:shovel_entity") {
      if (eventId == "vp:whack") {
        system.runTimeout(() => {
          entity.triggerEvent("vp:whacked");
        }, 20);
      } else if (eventId == "vp:whack_egg") {
        system.runTimeout(() => {
          entity.triggerEvent("vp:whacked_egg");
        }, 20);
      } else if (eventId == "vp:whack_cocoon") {
        system.runTimeout(() => {
          entity.triggerEvent("vp:hatch_cocoon");
        }, 20);
      } else if (eventId == "vp:whack_prefight") {
        system.runTimeout(() => {
          entity.triggerEvent("vp:whacked_prefight");
        }, 20);
      } else if (eventId == "vp:tap") {
        system.runTimeout(() => {
          entity.triggerEvent("vp:angry");
        }, 10);
      }
    }
  },
);
