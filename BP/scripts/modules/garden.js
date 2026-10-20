import { world, system, ItemStack } from "@minecraft/server";

import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

import {
  clamp,
  moveAbsolute,
  moveRelative,
  addVector3,
  highestLocation,
} from "./functions.js";
import { getLeafos } from "./leafos.js";

///////
const colors = [
  { translate: `accessibility.white` },
  { translate: `accessibility.light_gray` },
  { translate: `accessibility.dark_gray` },
  { translate: `accessibility.black` },
  { translate: `accessibility.brown` },
  { translate: `accessibility.red` },
  { translate: `accessibility.orange` },
  { translate: `accessibility.yellow` },
  { translate: `accessibility.lime` },
  { translate: `accessibility.green` },
  { translate: `accessibility.cyan` },
  { translate: `accessibility.light_blue` },
  { translate: `accessibility.blue` },
  { translate: `accessibility.purple` },
  { translate: `accessibility.magenta` },
  { translate: `accessibility.pink` },
];

const backgrounds = [
  "textures/entity/label/backgrounds/label_background_zigzag_template",
];

const logos = [
  "textures/entity/label/label_empty",
  "textures/entity/label/logos/label_logo_vp_template",
];

const borders = [
  "textures/entity/label/label_empty",
  "textures/entity/label/borders/label_border_tris_template",
];

///////

const plants = [];

const weeds = [];

const pinatas = [];

const gardenScores = [...plants, ...weeds, ...pinatas];

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (initialSpawn) {
    if (!player.dimension.getEntities({ type: "vp:garden" }).length) {
      const garden = player.dimension.spawnEntity(
        "vp:new_garden",
        player.location,
      );
      player.teleport(
        highestLocation(
          player.dimension,
          addVector3(
            player.location,
            player.getViewDirection().x * -20,
            0,
            player.getViewDirection().z * -20,
          ),
          { includePassableBlocks: false },
        ),
      );
    }
  }
});

world.afterEvents.dataDrivenEntityTrigger.subscribe((data) => {
  const eventId = data.eventId;
  const entity = data.entity;
  if (eventId == "vp:detect") {
    const dimension = entity.dimension;
    const entityX = Math.ceil(entity.location.x);
    const entityY = entity.location.y;
    const entityZ = Math.ceil(entity.location.z);

    //detect blocks
    entity.runCommand("scoreboard players reset @s sand");
    entity.runCommand("scoreboard players reset @s water");
    entity.runCommand("scoreboard players reset @s snow");
    entity.runCommand("scoreboard players reset @s grass");
    entity.runCommand("scoreboard players reset @s soil");

    const areaRadius = entity.getProperty("vp:radius");
    const startX =
      entityX + entity.getProperty("vp:offset_x") / 2 - areaRadius - 1;
    const startZ =
      entityZ + entity.getProperty("vp:offset_z") / 2 - areaRadius - 1;

    entity.runCommand("tickingarea remove garden" + entity.id);
    system.runTimeout(() => {
      entity.runCommand(
        "tickingarea add ~-" +
          areaRadius +
          "~320~-" +
          areaRadius +
          " ~" +
          areaRadius +
          "~-64~" +
          areaRadius +
          " garden" +
          entity.id,
      );
    }, 5);
    system.runTimeout(() => {
      for (let x = startX; x <= startX + areaRadius * 2; x++) {
        for (let z = startZ; z <= startZ + areaRadius * 2; z++) {
          let y = 320;
          //let y = entityY + 10;
          let block = dimension.getBlockBelow({ x: x, y: y, z: z });

          if (block) {
            if (block.type.id == "minecraft:grass_block") {
              data.entity.runCommand("scoreboard players add @s grass 1");
            } else if (block.type.id == "minecraft:water") {
              data.entity.runCommand("scoreboard players add @s water 1");
            } else if (block.type.id == "minecraft:dirt") {
              data.entity.runCommand("scoreboard players add @s soil 1");
            } else if (block.type.id == "minecraft:snow") {
              data.entity.runCommand("scoreboard players add @s snow 1");
            } else if (block.type.id == "minecraft:sand") {
              data.entity.runCommand("scoreboard players add @s sand 1");
            }
          }
        }
      }

      entity.triggerEvent("vp:detect_entities");
    }, 10);
  } else if (eventId == "vp:detect_entities") {
    const overworld = world.getDimension("overworld");
    const stone1 = overworld.getEntities({
      tags: ["stone1", "garden" + entity.id],
    })[0];
    const areaRadius = entity.getProperty("vp:radius");
    const owner = world.getPlayers({ name: entity.getTags()[0] })[0];

    //reset scores
    for (const score of gardenScores) {
      entity.runCommand("scoreboard players reset @s " + score);
    }

    //recall pinatas out of the garden
    entity.runCommand(
      "tag @e[type=!vp:garden_stone, tag=garden" +
        entity.id +
        ", rm=" +
        areaRadius +
        "] remove in_garden",
    );
    entity.runCommand(
      "tag @e[type=!vp:garden_stone] remove garden" + entity.id,
    );

    overworld
      .getEntities({
        //ERROR: location not found on world load
        location: { x: stone1.location.x, y: -64, z: stone1.location.z },
        volume: { x: areaRadius * 2, y: 320, z: areaRadius * 2 },
      })
      .forEach((gardenEntity) => {
        if (gardenEntity.typeId != "vp:garden") {
          if (
            entity.hasTag("ban_" + gardenEntity.typeId.split(":")[1]) &&
            gardenEntity.getComponent("type_family").hasTypeFamily("wild") &&
            !gardenEntity.getProperty("vp:busted").valueOf()
          ) {
            gardenEntity.triggerEvent("vp:bust");
          } else {
            gardenEntity.addTag("garden" + entity.id);

            if (
              gardenEntity.getComponent("type_family") &&
              gardenEntity
                .getComponent("type_family")
                .hasTypeFamily("pinata") &&
              gardenEntity.getComponent("type_family").hasTypeFamily("wild") &&
              owner &&
              !world.scoreboard
                .getObjective(gardenEntity.typeId.replace("vp:", "") + "_visit")
                .getScore(owner)
            ) {
              gardenEntity.addTag("first_visitor");
              world.scoreboard
                .getObjective(gardenEntity.typeId.replace("vp:", "") + "_visit")
                .setScore(owner, 1);
              const leafos = getLeafos(entity, true);
              owner.runCommand(
                "dialogue open @e[type=vp:leafos, tag=true_leafos] @s " +
                  gardenEntity.typeId +
                  "_visit",
              );
            }
          }
          gardenEntity.addTag("in_garden");
        }
      });

    //count plants
    entity.runCommand(
      "event entity @e[family=plant, tag=garden" + entity.id + "] vp:count",
    );

    system.runTimeout(() => {
      for (const plant of plants) {
        entity.runCommand(
          "execute at @e[type=vp:" +
            plant +
            ",tag=garden" +
            entity.id +
            ", scores={growth=1}] run scoreboard players add @s " +
            plant +
            " 1",
        );
        entity.runCommand(
          "execute at @e[type=vp:" +
            plant +
            ",tag=garden" +
            entity.id +
            ", scores={growth=2}] run scoreboard players add @s " +
            plant +
            " 2",
        );
        entity.runCommand(
          "execute at @e[type=vp:" +
            plant +
            ",tag=garden" +
            entity.id +
            ", scores={growth=3}] run scoreboard players add @s " +
            plant +
            " 3",
        );
        entity.runCommand(
          "execute at @e[type=vp:" +
            plant +
            ",tag=garden" +
            entity.id +
            ", scores={growth=4}] run scoreboard players add @s " +
            plant +
            " 4",
        );
      }
      for (const weed of weeds) {
        entity.runCommand(
          "execute at @e[type=vp:" +
            weed +
            ",tag=garden" +
            entity.id +
            "] run scoreboard players add @s " +
            weed +
            " 1",
        );
      }
      for (const pinata of pinatas) {
        entity.runCommand(
          "execute at @e[type=vp:" +
            pinata +
            ",family=resident,tag=garden" +
            entity.id +
            "] run scoreboard players add @s " +
            pinata +
            " 1",
        );
      }
    }, 1);

    entity.runCommand(
      "execute as @e[family=pinata, family=wild, tag=garden" +
        entity.id +
        ", tag=visiting_garden, tag=!avoid_garden] run event entity @s vp:req_check",
    );
    entity.runCommand(
      "execute as @e[family=pinata,family=wild, tag=garden" +
        entity.id +
        ", tag=!residing, scores={req_met=1}] run event entity @s vp:reside",
    );
    entity.runCommand(
      "execute as @e[family=pinata, family=resident, tag=garden" +
        entity.id +
        "] run event entity @s vp:req_check",
    );
  } else if (eventId == "vp:reside") {
    entity.addTag("residing");
    entity.triggerEvent("vp:disable");
    system.runTimeout(() => {
      entity.triggerEvent("vp:resident");
      entity.triggerEvent("vp:enable");
      entity.removeTag("residing");
    }, 100);
  } else if (eventId.match("vp:resident")) {
    if (!entity.nameTag) {
      const player = entity.dimension.getPlayers({ closest: 1 })[0]; //change this to be the owner of the garden

      system.runTimeout(() => {
        world.scoreboard
          .getObjective(entity.typeId.split(":")[1] + "_resident")
          .addScore(player, 1);

        entity.nameTag =
          entity.typeId.split(":")[1].charAt(0).toUpperCase() +
          entity.typeId.split(":")[1].slice(1) +
          " " +
          world.scoreboard
            .getObjective(entity.typeId.split(":")[1] + "_resident")
            .getScore(player)
            .valueOf();
      }, 1);
    }
  } else if (eventId.match("vp:reconcile")) {
    entity.removeTag("avoid_garden");
  }
});

world.afterEvents.entitySpawn.subscribe((data) => {
  const entity = data.entity;

  if (data.entity.typeId == "vp:garden") {
    entity.runCommand("summon vp:garden_stone ~-8~10~-8");
    entity.runCommand(
      "execute positioned ~-8~10~-8 run tag @e[type=vp:garden_stone, r=0.5] add stone1",
    );
    entity.runCommand(
      "execute positioned ~-8~10~-8 run tag @e[type=vp:garden_stone, r=0.5] add garden" +
        entity.id,
    );
    entity.runCommand("summon vp:garden_stone ~-8~10~8");
    entity.runCommand(
      "execute positioned ~-8~10~8 run tag @e[type=vp:garden_stone, r=0.5] add stone2",
    );
    entity.runCommand(
      "execute positioned ~-8~10~8 run tag @e[type=vp:garden_stone, r=0.5] add garden" +
        entity.id,
    );
    entity.runCommand("summon vp:garden_stone ~8~10~8");
    entity.runCommand(
      "execute positioned ~8~10~8 run tag @e[type=vp:garden_stone, r=0.5] add stone3",
    );
    entity.runCommand(
      "execute positioned ~8~10~8 run tag @e[type=vp:garden_stone, r=0.5] add garden" +
        entity.id,
    );
    entity.runCommand("summon vp:garden_stone ~8~10~-8");
    entity.runCommand(
      "execute positioned ~8~10~-8 run tag @e[type=vp:garden_stone, r=0.5] add stone4",
    );
    entity.runCommand(
      "execute positioned ~8~10~-8 run tag @e[type=vp:garden_stone, r=0.5] add garden" +
        entity.id,
    );

    if (data.entity.typeId == "vp:garden" && data.cause == "Transformed") {
      for (let x = -8; x <= 8; x++) {
        for (let z = -8; z <= 8; z++) {
          const snow = entity.dimension.getBlockBelow(
            { x: entity.location.x + x, y: 320, z: entity.location.z + z },
            { includeTypes: ["snow_layer"] },
          );
          if (snow) {
            snow.setType("air");
          }
          const block = entity.dimension.getBlockBelow(
            { x: entity.location.x + x, y: 320, z: entity.location.z + z },
            { includeTypes: ["grass", "dirt", "sand", "snow"] },
          );
          block && block.setType("vp:hard_soil");
        }
      }

      let leafos =
        world.getDimension("overworld").getEntities({ type: "vp:leafos" })[0] ||
        world.getDimension("nether").getEntities({ type: "vp:leafos" })[0] ||
        world.getDimension("the_end").getEntities({ type: "vp:leafos" })[0];
      if (!leafos) {
        leafos = entity.dimension.spawnEntity(
          "vp:leafos",
          entity.dimension.getBlockBelow(
            {
              x: entity.location.x + 4 * entity.getViewDirection().x,
              y: 320,
              z: entity.location.z + 4 * entity.getViewDirection().z,
            },
            { includePassableBlocks: false },
          ).location,
        );
        leafos.addTag("newGarden");
      }
    }
  }
});

world.afterEvents.playerInteractWithEntity.subscribe((data) => {
  const { player, target } = data;
  if (target.typeId == "vp:garden") {
    let owner = target.getTags();

    if (!target.nameTag.length) {
      changeGardenName(target, player, () => {
        if (owner == "") {
          target.addTag(`${player.nameTag}`);
          owner = target.getTags();
        }

        if (owner == player.nameTag) {
          openGardenOptions(target, player);
        } else {
          player.sendMessage(`${target.nameTag} - ${owner}`);
        }
      });
    } else {
      if (owner == "") {
        target.addTag(`${player.nameTag}`);
        owner = target.getTags();
      }

      if (owner.includes(player.nameTag)) {
        openGardenOptions(target, player);
      } else {
        player.sendMessage(`${target.nameTag} - ${owner}`);
      }
    }
  }
});

function openGardenOptions(garden, player) {
  const gardenOptions = new ActionFormData()
    .title(garden.nameTag)
    .button(`accessibility.garden.gardenSettings`)
    .button(`accessibility.garden.detectBlocks`)
    .button(`accessibility.garden.banPinatas`)
    .button(`accessibility.garden.labelDesigner`);

  gardenOptions
    .show(player)
    .then((response) => {
      if (response.canceled) {
        if (player.hasTag("awaiting_garden_claiming")) {
          player.runCommand(
            "dialogue open @e[type=vp:leafos, tag=true_leafos] @s vp:leafos_shovel_intro",
          );
        }
      }

      let selection = response.selection;
      switch (selection) {
        case 0:
          gardenSettings(garden, player);
          break;
        case 1:
          garden.triggerEvent("vp:detect");
          break;
        case 2:
          banPinata(garden, player);
          break;
        case 3:
          designLabel(garden, player);
          break;
      }
    })
    .catch((e) => {
      console.error(e, e.stack);
    });
}

function gardenSettings(garden, player) {
  const gardenSettings = new ActionFormData()
    .button(`accessibility.garden.changeName`)
    .button(`accessibility.garden.changeSize`)
    .button(`accessibility.garden.moveGarden.sign`)
    .button(`accessibility.garden.moveGarden`)
    //.button(`accessibility.garden.centerAroundSign`)
    .button(`accessibility.garden.removeGarden`);
  gardenSettings.show(player).then((response) => {
    if (response.canceled) openGardenOptions(garden, player);
    switch (response.selection) {
      case 0:
        changeGardenName(garden, player);
        break;
      case 1:
        changeGardenSize(garden, player);
        break;
      case 2:
        moveGarden(garden, player, true);
        break;
      case 3:
        moveGarden(garden, player);
        break;
      case 4:
        removeGarden(garden);
        break;
    }
  });
}

function changeGardenName(garden, player, callback) {
  let defaultValue = garden.nameTag;
  if (!defaultValue) {
    defaultValue = player.nameTag + "'s Garden";
  }

  const gardenRename = new ModalFormData().textField(
    `accessibility.garden.changeName.field`,
    `accessibility.garden.changeName.field.placeholder`,
    { defaultValue: defaultValue },
  );
  gardenRename
    .show(player)
    .then((r2) => {
      if (r2.canceled) gardenSettings(garden, player);
      if (r2.formValues[0].length) {
        let name = r2.formValues[0];
        garden.nameTag = name;
        if (callback) callback();
      } else {
        changeGardenName(garden, player);
      }
    })
    .catch((e) => {
      console.error(e, e.stack);
    });
}

function changeGardenSize(garden, player) {
  let radiusOld = garden.getProperty("vp:radius");
  const changeGardenSize = new ModalFormData()
    .title(`accessibility.garden.changeSize`)
    .slider({ translate: `accessibility.garden.changeSize.radius` }, 0, 64, {
      defaultValue: radiusOld,
    });
  changeGardenSize
    .show(player)
    .then((response) => {
      if (response.canceled) gardenSettings(garden, player);
      let radius = response.formValues[0];
      garden.setProperty("vp:radius", radius);
      system.runTimeout(() => {
        moveGardenStones(garden, radius);
      }, 1);
    })
    .catch((e) => {
      console.error(e, e.stack);
    });
}

function moveGarden(garden, player, signOnly = false) {
  const originalLocation = garden.location;

  let interval = system.runInterval(() => {
    const reach = 3;
    const xOffset =
      Math.round((player.getViewDirection().x * reach) / 0.5) * 0.5;
    const zOffset =
      Math.round((player.getViewDirection().z * reach) / 0.5) * 0.5;

    let yOffset = 0;
    let teleported = false;
    do {
      if (
        garden.dimension.getBlock({
          x: clamp(
            Math.round(player.location.x / 0.5) * 0.5 + xOffset,
            originalLocation.x +
              garden.getProperty("vp:offset_x") / 2 -
              garden.getProperty("vp:radius") -
              1,
            originalLocation.x +
              garden.getProperty("vp:offset_x") / 2 +
              garden.getProperty("vp:radius") +
              1,
          ),
          y: player.location.y + yOffset,
          z: clamp(
            Math.round(player.location.z / 0.5) * 0.5 + zOffset,
            originalLocation.z +
              garden.getProperty("vp:offset_z") / 2 -
              garden.getProperty("vp:radius") -
              1,
            originalLocation.z +
              garden.getProperty("vp:offset_z") / 2 +
              garden.getProperty("vp:radius") +
              1,
          ),
        }).isAir
      ) {
        garden.teleport(
          {
            x: clamp(
              Math.round(player.location.x / 0.5) * 0.5 + xOffset,
              originalLocation.x +
                garden.getProperty("vp:offset_x") / 2 -
                garden.getProperty("vp:radius") -
                1,
              originalLocation.x +
                garden.getProperty("vp:offset_x") / 2 +
                garden.getProperty("vp:radius") +
                1,
            ),
            y: player.location.y + yOffset,
            z: clamp(
              Math.round(player.location.z / 0.5) * 0.5 + zOffset,
              originalLocation.z +
                garden.getProperty("vp:offset_z") / 2 -
                garden.getProperty("vp:radius") -
                1,
              originalLocation.z +
                garden.getProperty("vp:offset_z") / 2 +
                garden.getProperty("vp:radius") +
                1,
            ),
          },
          {
            rotation: { x: 0, y: player.getRotation().y + 180 },
          },
        );
        teleported = true;
      } else {
        yOffset += 1;
      }
    } while (!teleported);

    if (player.isSneaking) {
      system.clearRun(interval);
      if (signOnly) {
        garden.setProperty(
          "vp:offset_x",
          garden.getProperty("vp:offset_x") -
            (garden.location.x - Math.round(originalLocation.x / 0.5) * 0.5) *
              2,
        );
        garden.setProperty(
          "vp:offset_y",
          garden.getProperty("vp:offset_y") -
            (garden.location.y - Math.round(originalLocation.y / 0.5) * 0.5) *
              2,
        );
        garden.setProperty(
          "vp:offset_z",
          garden.getProperty("vp:offset_z") -
            (garden.location.z - Math.round(originalLocation.z / 0.5) * 0.5) *
              2,
        );
      } else {
        moveGardenStones(garden);
      }
    }
  }, 5);
}

function centerAroundSign(garden) {
  garden.setProperty("vp:offset_x", 0);
  garden.setProperty("vp:offset_y", 0);
  garden.setProperty("vp:offset_z", 0);
  system.runTimeout(() => {
    moveGardenStones(garden);
  }, 1);
}

function moveGardenStones(garden, radius) {
  const dimension = garden.dimension;

  if (radius == null) {
    radius = garden.getProperty("vp:radius");
  }

  const stone1 = dimension.getEntities({
    tags: ["stone1", "garden" + garden.id],
  })[0];
  const stone2 = dimension.getEntities({
    tags: ["stone2", "garden" + garden.id],
  })[0];
  const stone3 = dimension.getEntities({
    tags: ["stone3", "garden" + garden.id],
  })[0];
  const stone4 = dimension.getEntities({
    tags: ["stone4", "garden" + garden.id],
  })[0];

  const gardenX =
    Math.ceil(garden.location.x) + garden.getProperty("vp:offset_x") / 2;
  const gardenY =
    Math.ceil(garden.location.y) + garden.getProperty("vp:offset_y") / 2;
  const gardenZ =
    Math.ceil(garden.location.z) + garden.getProperty("vp:offset_z") / 2;

  moveAbsolute(
    stone1,
    { x: gardenX - radius - 1, y: stone1.location.y, z: gardenZ - radius - 1 },
    100,
    1,
    moveAbsolute(
      stone1,
      { x: stone1.location.x, y: gardenY + 10, z: stone1.location.z },
      100,
    ),
  );
  moveAbsolute(
    stone2,
    { x: gardenX - radius - 1, y: stone2.location.y, z: gardenZ + radius },
    100,
    1,
    moveAbsolute(
      stone2,
      { x: stone2.location.x, y: gardenY + 10, z: stone2.location.z },
      100,
    ),
  );
  moveAbsolute(
    stone3,
    { x: gardenX + radius, y: stone3.location.y, z: gardenZ + radius },
    100,
    1,
    moveAbsolute(
      stone3,
      { x: stone3.location.x, y: gardenY + 10, z: stone3.location.z },
      100,
    ),
  );
  const timeout = moveAbsolute(
    stone4,
    { x: gardenX + radius, y: stone4.location.y, z: gardenZ - radius - 1 },
    100,
    1,
    moveAbsolute(
      stone4,
      { x: stone4.location.x, y: gardenY + 10, z: stone4.location.z },
      100,
    ),
  );

  system.runTimeout(() => {
    garden.triggerEvent("vp:detect");
  }, timeout);
}

function removeGarden(garden) {
  //target.runCommand(`structure save ${id} ~~~ ~~~ true disk false`);

  let gardenSign = new ItemStack("vp:garden_sign", 1);
  garden.dimension.spawnItem(gardenSign, garden.location);
  system.run(() => {
    garden.runCommand("tickingarea remove garden" + garden.id);
    garden.runCommand(
      "event entity @e[type=vp:garden_stone, tag=garden" +
        garden.id +
        "] vp:die",
    );
    garden.remove();
  });
}

function banPinata(garden, player) {
  let banList = [];

  const gardenSettings = new ModalFormData();
  gardenSettings.title(`accessibility.garden.ban`);
  world.scoreboard.getObjective("whirlm_romanced").getScore(player) >= 7 &&
    gardenSettings.toggle(`accessibility.garden.ban.whirlm`, {
      defaultValue: garden.hasTag("ban_whirlm"),
    });
  world.scoreboard.getObjective("whirlm_romanced").getScore(player) >= 7 &&
    banList.push(["ban_whirlm"]);

  if (banList.length == 0) {
    gardenSettings.label(`accessibility.garden.ban.noPinata`);
  }

  gardenSettings
    .show(player)
    .then((response) => {
      if (response.canceled || !banList.length)
        openGardenOptions(garden, player);
      if (response.formValues) {
        for (let i = 0; i < response.formValues.length; i++) {
          response.formValues[i]
            ? garden.addTag(banList[i].toString())
            : garden.removeTag(banList[i].toString());
        }
      }
    })
    .catch((e) => {
      console.error(e, e.stack);
      return -1;
    });
}

function designLabel(garden, player) {
  world.scoreboard.getObjective("label_background_front").getScore(player) ??
    world.scoreboard.getObjective("label_background_front").setScore(player, 0);
  world.scoreboard.getObjective("label_background_back").getScore(player) ??
    world.scoreboard.getObjective("label_background_back").setScore(player, 0);
  world.scoreboard.getObjective("label_border_front").getScore(player) ??
    world.scoreboard.getObjective("label_border_front").setScore(player, 0);
  world.scoreboard.getObjective("label_border_back").getScore(player) ??
    world.scoreboard.getObjective("label_border_back").setScore(player, 0);
  world.scoreboard.getObjective("label_logo_front").getScore(player) ??
    world.scoreboard.getObjective("label_logo_front").setScore(player, 0);
  world.scoreboard.getObjective("label_logo_back").getScore(player) ??
    world.scoreboard.getObjective("label_logo_back").setScore(player, 0);

  const labelDesigner = new ActionFormData()
    .title(`accessibility.garden.label_designer`)
    .button(
      `accessibility.garden.label_designer.background`,
      backgrounds[
        Math.floor(
          world.scoreboard
            .getObjective("label_background_front")
            .getScore(player) / 16,
        )
      ],
    )
    .button(
      `accessibility.garden.label_designer.border`,
      borders[
        Math.floor(
          world.scoreboard.getObjective("label_border_front").getScore(player) /
            16,
        ) + 1
      ],
    )
    .button(
      `accessibility.garden.label_designer.logo`,
      logos[
        Math.floor(
          world.scoreboard.getObjective("label_logo_front").getScore(player) /
            16,
        ) + 1
      ],
    );

  labelDesigner
    .show(player)
    .then((response) => {
      if (response.canceled) openGardenOptions(garden, player);

      let selection = response.selection;
      switch (selection) {
        case 0:
          const backgroundsForm = new ActionFormData().title(
            `accessibility.garden.label_designer.backgroundsForm`,
          );

          backgrounds.forEach((background) => {
            backgroundsForm.button(
              `accessibility.garden.label_designer.background`,
              background,
            );
          });

          backgroundsForm.show(player).then((r) => {
            if (r.canceled) return;

            switch (r.selection) {
              case 0:
                const backgroundsColorForm = new ModalFormData()
                  .title(`accessibility.garden.label_designer.backgroundsForm`)
                  .dropdown(
                    `accessibility.garden.label_designer.background`,
                    colors,
                    {
                      defaultValueIndex:
                        world.scoreboard
                          .getObjective("label_background_back")
                          .getScore(player) % 16,
                    },
                  )
                  .dropdown(
                    `accessibility.garden.label_designer.background`,
                    colors,
                    {
                      defaultValueIndex:
                        world.scoreboard
                          .getObjective("label_background_front")
                          .getScore(player) % 16,
                    },
                  );

                backgroundsColorForm.show(player).then((r1) => {
                  world.scoreboard
                    .getObjective("label_background_back")
                    .setScore(player, r1.formValues[0]);
                  world.scoreboard
                    .getObjective("label_background_front")
                    .setScore(player, r1.formValues[1]);
                  garden.runCommand(
                    "event entity @e[family=pinata] vp:update_label",
                  );
                  designLabel(garden, player);
                });

                break;
            }
          });
          break;
        case 1:
          const bordersForm = new ActionFormData().title(
            `accessibility.garden.label_designer.bordersForm`,
          );

          borders.forEach((border) => {
            bordersForm.button(
              `accessibility.garden.label_designer.border`,
              border,
            );
          });

          bordersForm.show(player).then((r) => {
            if (r.canceled) return;

            switch (r.selection) {
              case 1:
                const bordersColorForm = new ModalFormData()
                  .title(`accessibility.garden.label_designer.bordersForm`)
                  .dropdown(
                    `accessibility.garden.label_designer.border`,
                    colors,
                    {
                      defaultValueIndex: Math.max(
                        0,
                        world.scoreboard
                          .getObjective("label_border_back")
                          .getScore(player) % 16,
                      ),
                    },
                  )
                  .dropdown(
                    `accessibility.garden.label_designer.border`,
                    colors,
                    {
                      defaultValueIndex: Math.max(
                        0,
                        world.scoreboard
                          .getObjective("label_border_front")
                          .getScore(player) % 16,
                      ),
                    },
                  );

                bordersColorForm.show(player).then((r1) => {
                  world.scoreboard
                    .getObjective("label_border_back")
                    .setScore(
                      player,
                      r1.formValues[0] + (r.selection - 1) * 16,
                    );
                  world.scoreboard
                    .getObjective("label_border_front")
                    .setScore(
                      player,
                      r1.formValues[1] + (r.selection - 1) * 16,
                    );
                  garden.runCommand(
                    "event entity @e[family=pinata] vp:update_label",
                  );
                  designLabel(garden, player);
                });

                break;
            }
          });
          break;
        case 2:
          const logosForm = new ActionFormData().title(
            `accessibility.garden.label_designer.logosForm`,
          );

          logos.forEach((logo) => {
            logosForm.button(`accessibility.garden.label_designer.logo`, logo);
          });

          logosForm.show(player).then((r) => {
            if (r.canceled) return;

            if (r.selection > 0) {
              const logosColorForm = new ModalFormData()
                .title(`accessibility.garden.label_designer.logosForm`)
                .dropdown(`accessibility.garden.label_designer.logo`, colors, {
                  defaultValueIndex: Math.max(
                    0,
                    world.scoreboard
                      .getObjective("label_logo_back")
                      .getScore(player) % 16,
                  ),
                })
                .dropdown(`accessibility.garden.label_designer.logo`, colors, {
                  defaultValueIndex: Math.max(
                    0,
                    world.scoreboard
                      .getObjective("label_logo_front")
                      .getScore(player) % 16,
                  ),
                });

              logosColorForm.show(player).then((r1) => {
                world.scoreboard
                  .getObjective("label_logo_back")
                  .setScore(player, r1.formValues[0] + (r.selection - 1) * 16);
                world.scoreboard
                  .getObjective("label_logo_front")
                  .setScore(player, r1.formValues[1] + (r.selection - 1) * 16);
                garden.runCommand(
                  "event entity @e[family=pinata] vp:update_label",
                );
                designLabel(garden, player);
              });
            } else {
              world.scoreboard
                .getObjective("label_logo_back")
                .setScore(player, -1);
              world.scoreboard
                .getObjective("label_logo_front")
                .setScore(player, -1);
              garden.runCommand(
                "event entity @e[family=pinata] vp:update_label",
              );
              designLabel(garden, player);
            }
          });
          break;
      }
    })
    .catch((e) => {
      console.error(e, e.stack);
      return -1;
    });
}
