import { system, world, ItemStack } from "@minecraft/server";

// console.warn('Hello, thank you very much for participating in the mod alpha! If you find any errors, bugs or have any ideas for the mod, please contact me on my discord account: lunardev0668.')
// console.warn('204')

import "./modules/customComponents.js";
import "./modules/journal.js";
import "./modules/shovel.js";
import "./modules/watering_cans.js";
import "./modules/leafos.js";
import "./modules/captureSystem.js";
import "./modules/customCommands.js";
import "./modules/garden.js";
import "./modules/romanceSystem.js";
import "./modules/fightSystem.js";
import "./modules/selectionSystem.js";
import "./modules/cameraSystem.js";
import "./modules/labels.js";
import {
  moveRelative,
  addVector3,
  decrementHeldItem,
} from "./modules/functions.js";

//add scoreboards
world.afterEvents.worldLoad.subscribe(() => {
  const scoreboard = world.scoreboard;
  const addObjective = scoreboard.addObjective.bind(scoreboard);
  const getObjective = scoreboard.getObjective.bind(scoreboard);
  score.forEach((scoreType) => {
    if (!getObjective(scoreType)) {
      addObjective(scoreType, scoreType);
    }
  });
});
//set player scores so not to be null
world.afterEvents.playerJoin.subscribe((data) => {
  const player = world.getEntity(data.playerId);
  score.forEach((scoreType) => {
    world.scoreboard.getObjective(scoreType).addScore(player, 0);
  });
});

//resume script by fixing anything that may have broken
world.afterEvents.playerSpawn.subscribe((data) => {
  if (world.getAllPlayers().length.valueOf() <= 1) {
    const onOpenWorld = system.runInterval(() => {
      const entities = [
        ...world.getDimension("overworld").getEntities({
          families: ["pinata"],
          propertyOptions: [
            { propertyId: "vp:fighting", value: { equals: true } },
          ],
        }),
        ...world.getDimension("nether").getEntities({
          families: ["pinata"],
          propertyOptions: [
            { propertyId: "vp:fighting", value: { equals: true } },
          ],
        }),
        ...world.getDimension("the_end").getEntities({
          families: ["pinata"],
          propertyOptions: [
            { propertyId: "vp:fighting", value: { equals: true } },
          ],
        }),
      ];

      entities.forEach((entity1, index1) => {
        entity1
          .getEntitiesFromViewDirection({
            ignoreBlockCollision: true,
            includePassableBlocks: false,
            includeLiquidBlocks: false,
            families: ["pinata"],
            propertyOptions: [
              { propertyId: "vp:fighting", value: { equals: true } },
            ],
          })
          .forEach((entity2, index2) => {
            // entities.includes(entity2.entity) &&
            const entity2View = entity2.entity
              .getEntitiesFromViewDirection({
                ignoreBlockCollision: true,
                includePassableBlocks: false,
                includeLiquidBlocks: false,
                families: ["pinata"],
                propertyOptions: [
                  { propertyId: "vp:fighting", value: { equals: true } },
                ],
              })
              .map((raycast) => raycast.entity);
            if (entity2View.includes(entity1) || entity2View.length == 0) {
              entity1.triggerEvent("vp:stop_fighting");
              entity2.entity.triggerEvent("vp:stop_fighting");

              system.runTimeout(() => {
                entity1.addTag("searching_for_fight");
                entity2.entity.addTag("searching_for_fight");
                entity2.entity.applyDamage(1, {
                  cause: "entityAttack",
                  damagingEntity: entity1,
                });
              }, 20);

              entities.splice(index1, 1);
              entities.splice(entities.indexOf(entity2.entity), 1);
            }
          });
      });

      system.clearRun(onOpenWorld);
    }, 20);

    data.player.runCommand(
      "event entity @e[has_property={vp:busted=true}] vp:reconstitute",
    );
    data.player.runCommand("event entity @e[tag=residing] vp:reside");
  }
});

system.run(() => {
  const entities = [
    ...world.getDimension("overworld").getEntities({
      families: ["pinata"],
      propertyOptions: [{ propertyId: "vp:fighting", value: { equals: true } }],
    }),
    ...world.getDimension("nether").getEntities({
      families: ["pinata"],
      propertyOptions: [{ propertyId: "vp:fighting", value: { equals: true } }],
    }),
    ...world.getDimension("the_end").getEntities({
      families: ["pinata"],
      propertyOptions: [{ propertyId: "vp:fighting", value: { equals: true } }],
    }),
  ];

  entities.forEach((entity1, index1) => {
    entity1
      .getEntitiesFromViewDirection({
        ignoreBlockCollision: true,
        includePassableBlocks: false,
        includeLiquidBlocks: false,
        families: ["pinata"],
        propertyOptions: [
          { propertyId: "vp:fighting", value: { equals: true } },
        ],
      })
      .forEach((entity2, index2) => {
        // entities.includes(entity2.entity) &&
        const entity2View = entity2.entity
          .getEntitiesFromViewDirection({
            ignoreBlockCollision: true,
            includePassableBlocks: false,
            includeLiquidBlocks: false,
            families: ["pinata"],
            propertyOptions: [
              { propertyId: "vp:fighting", value: { equals: true } },
            ],
          })
          .map((raycast) => raycast.entity);
        if (entity2View.includes(entity1) || entity2View.length == 0) {
          entity1.triggerEvent("vp:stop_fighting");
          entity2.entity.triggerEvent("vp:stop_fighting");

          system.runTimeout(() => {
            entity1.addTag("searching_for_fight");
            entity2.entity.addTag("searching_for_fight");
            entity2.entity.applyDamage(1, {
              cause: "entityAttack",
              damagingEntity: entity1,
            });
          }, 20);

          entities.splice(index1, 1);
          entities.splice(entities.indexOf(entity2.entity), 1);
        }
      });
  });

  // data.player.runCommand("event entity @e[has_property={vp:busted=true}] vp:reconstitute");
  // data.player.runCommand("event entity @e[tag=residing] vp:reside");
});

//give items to players
// world.afterEvents.playerSpawn.subscribe((data) => {
//     const player = data.player;
//     player.runCommand('execute if entity @s[tag=!spawn] run give @s vp:garden_sign')
//     player.runCommand('execute if entity @s[tag=!spawn] run give @s vp:journal')
//     player.runCommand('tag @s add spawn')
// });
world.beforeEvents.playerInteractWithBlock.subscribe((data) => {
  if (
    data.player.isSneaking &&
    data.itemStack &&
    data.itemStack.hasTag("vp:candy")
  ) {
    data.cancel = true;
    system.run(() => {
      data.player.dimension
        .spawnEntity(
          data.itemStack.typeId + "_entity",
          addVector3(
            data.block.location,
            //I don't know why the discrepency, selectionSystem works normal for teleportation and getBlockFromViewDirection
            -data.faceLocation.x + 1 - (data.blockFace == "West"),
            data.faceLocation.y + (data.blockFace == "Up"),
            data.faceLocation.z + (data.blockFace == "South"),
          ),
        )
        .setRotation(data.player.getRotation());
      decrementHeldItem(data.player);
    });
  }
});

world.afterEvents.dataDrivenEntityTrigger.subscribe((data) => {
  const entity = data.entity;
  if (entity && entity.isValid) {
    const dimension = entity?.dimension;
    const location = entity.location;
    const eventId = data.eventId;
    if (eventId.match("vp:bust")) {
      if (entity.getComponent("type_family").hasTypeFamily("pinata")) {
        if (entity.getComponent("type_family").hasTypeFamily("egg")) {
          entity.triggerEvent("vp:die");
        } else {
          if (entity.getComponent("type_family").hasTypeFamily("resident")) {
            entity.addTag("avoid_garden");

            const candiosity = entity.getProperty("vp:candiosity");
            for (let i = 0; i < candiosity; i++) {
              const candy = dimension.spawnEntity(
                "vp:pinata_candy_entity",
                entity.location,
              );
              candy.applyImpulse({
                x: (Math.random() - 0.5) * 0.5,
                y: 0.1,
                z: (Math.random() - 0.5) * 0.5,
              });
            }

            const pinata = entity.typeId.split(":")[1];
            entity.runCommand("summon vp:" + pinata + "_life_candy_entity");
            entity.runCommand("say was busted");
          }

          entity.runCommand("playsound vp.cheer @p[r=20]");

          const garden = dimension.getEntities({
            families: ["garden"],
            location: entity.location,
            closest: 1,
          })[0];
          const gardenCenter = {
            x: garden.location.x + garden.getProperty("vp:offset_x") / 2,
            y: garden.location.y + garden.getProperty("vp:offset_y") / 2,
            z: garden.location.z + garden.getProperty("vp:offset_z") / 2,
          };
          const diffX = entity.location.x - gardenCenter.x;
          const diffY = entity.location.y - gardenCenter.y;
          const diffZ = entity.location.z - gardenCenter.z;

          let goX = 0;
          let goZ = 0;

          if (
            Math.abs(diffX) < garden.getProperty("vp:radius") &&
            Math.abs(diffZ) < garden.getProperty("vp:radius")
          )
            if (Math.abs(diffX) > Math.abs(diffZ)) {
              goX =
                (diffX / Math.abs(diffX)) *
                (garden.getProperty("vp:radius") + 10 - Math.abs(diffX));
              goZ = 0;
            } else {
              goX = 0;
              goZ =
                (diffZ / Math.abs(diffZ)) *
                (garden.getProperty("vp:radius") + 10 - Math.abs(diffZ));
            }

          entity.addEffect("slow_falling", 200, { showParticles: false });

          system.runTimeout(
            () => {
              entity.triggerEvent("vp:wild_texture");
              system.runTimeout(() => {
                entity.triggerEvent("vp:reconstitute");
                entity.triggerEvent("vp:wild");
              }, 80);
            },
            moveRelative(
              entity,
              goX,
              0,
              goZ,
              10,
              5,
              moveRelative(entity, 0, 10, 0, 10, 5),
            ),
          );
        }
      }
    } else if (eventId.match("vp:dizzy")) {
      system.runTimeout(() => {
        if (!entity.getProperty("vp:sick")) {
          entity.setProperty("vp:dizzy", false);
          entity.triggerEvent("vp:enable");
        }
      }, 80);
    } else if (eventId.match("vp:whacked_hanging")) {
      entity.applyImpulse({
        x: Math.random() - 0.5,
        y: 0,
        z: Math.random() - 0.5,
      });
    }
  }
});

const score = [
  //utility
  "ticks",
  "steps",
  "req_timer",
  "req_met",
  "fights_fought",
  "fights_won",
  "garden",
  "selections",
  "label_background_back",
  "label_background_front",
  "label_logo_back",
  "label_logo_front",
  "label_border_back",
  "label_border_front",
  //requirments
  "req1",
  "req2",
  "req3",
  "love_req1",
  "love_req2",
  "love_req3",
  "grass",
  "water",
  "snow",
  "sand",
  "soil",
  //Pinata "Awards"
  "whirlm_spotted",
  "whirlm_visit",
  "whirlm_resident",
  "whirlm_romanced",
];
