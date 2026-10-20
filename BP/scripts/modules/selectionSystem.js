import { system, world, ItemStack } from "@minecraft/server";

import { doThis, addVector3 } from "./functions.js";
import { manageShovel } from "./shovel.js";

const cursorWhitelist = [
  "minecraft:air",
  "minecraft:snow_layer",
  "minecraft:grass",
  "minecraft:double_grass",
];
system.run(() => {
  const entities = [
    ...world.getDimension("overworld").getEntities({
      type: "vp:cursor",
    }),
    ...world.getDimension("nether").getEntities({
      type: "vp:cursor",
    }),
    ...world.getDimension("the_end").getEntities({
      type: "vp:cursor",
    }),
  ];

  //resets all cursors on reload
  entities.forEach((entity, index) => {
    entity.remove();
  });

  world.getAllPlayers().forEach((player, index) => {
    const newCursor = player.dimension.spawnEntity(
      "vp:cursor",
      player.location,
    );
    newCursor.addTag(player.name);
  });

  //manages cursor states and locations
  const manageCursors = system.runInterval(() => {
    const cursors = [
      ...world.getDimension("overworld").getEntities({
        type: "vp:cursor",
      }),
      ...world.getDimension("nether").getEntities({
        type: "vp:cursor",
      }),
      ...world.getDimension("the_end").getEntities({
        type: "vp:cursor",
      }),
    ];

    cursors.forEach((cursor, index) => {
      if (!cursor.hasTag("temp_cursor")) {
        const player = world.getPlayers({ name: cursor.getTags()[0] })[0];
        if (player) {
          //manage location
          if (
            (!cursor.hasTag("carrying") &&
              player.getEntitiesFromViewDirection({
                maxDistance: 5,
                excludeTypes: ["player", "vp:cursor"],
                excludeFamilies: ["unselectable"],
              })[0]) ||
            (player.getBlockFromViewDirection({ maxDistance: 5 }) &&
              player.dimension.getEntities({
                location: player.getBlockFromViewDirection({ maxDistance: 5 })
                  .block.location,
                excludeTypes: ["player", "vp:cursor"],
                excludeFamilies: ["unselectable"],
                maxDistance: 1,
                closest: 1,
              })[0])
          ) {
            let hoveredEntity =
              player.getEntitiesFromViewDirection({
                maxDistance: 5,
                excludeTypes: ["player", "vp:cursor"],
                excludeFamilies: ["unselectable"],
              })[0] &&
              player.getEntitiesFromViewDirection({
                maxDistance: 5,
                excludeTypes: ["player", "vp:cursor"],
                excludeFamilies: ["unselectable"],
              })[0].entity;
            hoveredEntity =
              hoveredEntity ||
              player.dimension.getEntities({
                location: player.getBlockFromViewDirection({ maxDistance: 5 })
                  .block.location,
                excludeTypes: ["player", "vp:cursor"],
                excludeFamilies: ["unselectable"],
                maxDistance: 1,
                closest: 1,
              })[0];

            cursor.teleport({
              x: hoveredEntity.location.x,
              y:
                hoveredEntity.dimension.getBlockBelow(hoveredEntity.location)
                  .location.y + 1,
              z: hoveredEntity.location.z,
            });
            cursor.triggerEvent("vp:collision");

            if (
              hoveredEntity.hasComponent("type_family") &&
              (hoveredEntity
                .getComponent("type_family")
                .hasTypeFamily("pinata") ||
                hoveredEntity
                  .getComponent("type_family")
                  .hasTypeFamily("character"))
            ) {
              //hoveredEntity.triggerEvent("vp:disable");
              hoveredEntity.addTag("hover_" + player.name);
              system.runTimeout(() => {
                //hoveredEntity.triggerEvent("vp:enable");
                if (
                  player.getEntitiesFromViewDirection({
                    maxDistance: 5,
                    excludeTypes: ["player", "vp:cursor"],
                    excludeFamilies: ["unselectable"],
                  })[0] ||
                  (player.getBlockFromViewDirection({ maxDistance: 5 }) &&
                    player.dimension.getEntities({
                      location: player.getBlockFromViewDirection({
                        maxDistance: 5,
                      }).block.location,
                      excludeTypes: ["player", "vp:cursor"],
                      excludeFamilies: ["unselectable"],
                      maxDistance: 1,
                      closest: 1,
                    })[0])
                ) {
                  let newHoveredEntity =
                    player.getEntitiesFromViewDirection({
                      maxDistance: 5,
                      excludeTypes: ["player", "vp:cursor"],
                      excludeFamilies: ["unselectable"],
                    })[0] &&
                    player.getEntitiesFromViewDirection({
                      maxDistance: 5,
                      excludeTypes: ["player", "vp:cursor"],
                      excludeFamilies: ["unselectable"],
                    })[0].entity;
                  newHoveredEntity =
                    newHoveredEntity ||
                    player.dimension.getEntities({
                      location: player.getBlockFromViewDirection({
                        maxDistance: 5,
                      }).block.location,
                      excludeTypes: ["player", "vp:cursor"],
                      excludeFamilies: ["unselectable"],
                      maxDistance: 1,
                      closest: 1,
                    })[0];
                  if (!(hoveredEntity == newHoveredEntity)) {
                    hoveredEntity.removeTag("hover_" + player.name);
                  }
                } else if (hoveredEntity.isValid) {
                  hoveredEntity.removeTag("hover_" + player.name);
                }
              }, 1);
            }

            cursor.removeTag("at_player");
          } else if (
            cursor.getProperty("vp:cursor_state") == "inner" ||
            cursor.hasTag("carrying")
          ) {
            const view = player.getBlockFromViewDirection({
              maxDistance: 5,
              includePassableBlocks: false,
            });
            if (view) {
              cursor.teleport(
                addVector3(
                  view.block.location,
                  view.faceLocation.x,
                  view.faceLocation.y * (view.block.face == "Up") + 1,
                  view.faceLocation.z,
                ),
              );
            } else {
              cursor.teleport(
                addVector3(
                  player.location,
                  player.getViewDirection().x * 3,
                  0,
                  player.getViewDirection().z * 3,
                ),
              );
            }
            cursor.triggerEvent("vp:collision");

            cursor.removeTag("at_player");
          } else {
            const ridenEntity =
              player.getComponent("minecraft:riding")?.entityRidingOn;

            if (ridenEntity) {
              cursor.teleport(addVector3(ridenEntity.location, 0, -0.025, 0));
            } else {
              cursor.teleport(
                addVector3(
                  player.location,
                  0,
                  2 * (player.getViewDirection().y < -0.95),
                  0,
                ),
              );
              cursor.addTag("at_player");
            }

            cursor.triggerEvent("vp:no_collision");
          }

          //manage color
          if (
            cursor.hasTag("in_garden") &&
            !cursor.getProperty("vp:in_garden")
          ) {
            cursor.triggerEvent("vp:in_garden");
          } else if (
            !cursor.hasTag("in_garden") &&
            cursor.getProperty("vp:in_garden")
          ) {
            cursor.triggerEvent("vp:out_garden");
          }

          manageShovel(player, cursor);
        }
      }
    });
  }, 1);
});

world.afterEvents.playerJoin.subscribe((data) => {
  const player = world.getEntity(data.playerId);
  //resets player's cursors on player join
  doThis(
    () => {
      const entities = [
        ...world.getDimension("overworld").getEntities({
          type: "vp:cursor",
          tags: [player.name],
        }),
        ...world.getDimension("nether").getEntities({
          type: "vp:cursor",
          tags: [player.name],
        }),
        ...world.getDimension("the_end").getEntities({
          type: "vp:cursor",
          tags: [player.name],
        }),
        ...world.getDimension("overworld").getEntities({
          type: "vp:cursor",
          tags: ["temp_cursor_" + player.name],
        }),
        ...world.getDimension("nether").getEntities({
          type: "vp:cursor",
          tags: ["temp_cursor_" + player.name],
        }),
        ...world.getDimension("the_end").getEntities({
          type: "vp:cursor",
          tags: ["temp_cursor_" + player.name],
        }),
      ];

      if (entities.length == 0) {
        return false;
      } else {
        entities.forEach((entity, index) => {
          entity.remove();
        });

        return true;
      }
    },
    10,
    20,
    //tentatively waits for max tries or a success before creating a new cursor
    () => {
      const newCursor = player.dimension.spawnEntity(
        "vp:cursor",
        player.location,
      );
      newCursor.addTag(player.name);
    },
  );
});
world.beforeEvents.playerLeave.subscribe(({ player }) => {
  //delete a players cursors upon exit
  //does not handle the final player

  const entities = [
    ...world.getDimension("overworld").getEntities({
      type: "vp:cursor",
      tags: [player.name],
    }),
    ...world.getDimension("nether").getEntities({
      type: "vp:cursor",
      tags: [player.name],
    }),
    ...world.getDimension("the_end").getEntities({
      type: "vp:cursor",
      tags: [player.name],
    }),
    ...world.getDimension("overworld").getEntities({
      type: "vp:cursor",
      tags: ["temp_cursor_" + player.name],
    }),
    ...world.getDimension("nether").getEntities({
      type: "vp:cursor",
      tags: ["temp_cursor_" + player.name],
    }),
    ...world.getDimension("the_end").getEntities({
      type: "vp:cursor",
      tags: ["temp_cursor_" + player.name],
    }),
  ];

  entities.forEach((entity, index) => {
    system.run(() => {
      entity.remove();
      console.warn(entity.nameTag + " removed");
    });
  });
});

world.afterEvents.dataDrivenEntityTrigger.subscribe((data) => {
  const entity = data.entity;
  if (entity.isValid) {
    const dimension = entity?.dimension;
    const location = entity.location;
    const eventId = data.eventId;
    if (eventId.match("vp:arrive")) {
      system.runTimeout(() => {
        entity.triggerEvent("vp:enable");
      }, 80);
    }
  }
});

world.afterEvents.playerInteractWithEntity.subscribe((data) => {
  const player = data.player;
  const cursor = player.dimension.getEntities({
    type: "vp:cursor",
    tags: [player.name],
  })[0];
  const entity = data.target;
  const location = addVector3(cursor.location, 0, 1, 0);
  const dimension = player.dimension;
  const item = data.beforeItemStack;

  if (entity) {
    if (!cursor.hasTag("carrying")) {
      if (player.isSneaking) {
        if (entity.getComponent("type_family")) {
          if (
            entity.getComponent("type_family").hasTypeFamily("pinata") &&
            !entity.getComponent("type_family").hasTypeFamily("egg") &&
            !entity.getComponent("leashable").isLeashed
          ) {
            if (
              cursor.getProperty("vp:cursor_state") == "default" &&
              entity.getComponent("type_family").hasTypeFamily("resident")
            ) {
              cursor.triggerEvent("vp:inner");
              dimension.playSound("vp.cursor_in", cursor.location);

              world.scoreboard
                .getObjective("selections")
                .addScore(player.scoreboardIdentity, 1);
              entity.addTag(
                player.name +
                  world.scoreboard
                    .getObjective("selections")
                    .getScore(player.scoreboardIdentity),
              );

              entity.triggerEvent("vp:disable");
              entity.clearVelocity();

              const tempCursor = dimension.spawnEntity(
                "vp:cursor",
                entity.location,
              );
              tempCursor.triggerEvent("vp:outer");
              tempCursor.addTag("temp_cursor");
              tempCursor.addTag("temp_cursor_" + player.name);
              entity.runCommand(
                "ride @s start_riding @e[tag=temp_cursor_" +
                  player.name +
                  ",c=1]",
              );
            } else if (cursor.getProperty("vp:cursor_state") == "inner") {
              const selectEntity = dimension.getEntities({
                tags: [
                  player.name +
                    world.scoreboard
                      .getObjective("selections")
                      .getScore(player.scoreboardIdentity),
                ],
              })[0];
              selectEntity.triggerEvent("vp:enable");

              if (selectEntity && entity != selectEntity) {
                cursor.triggerEvent("vp:default");
                dimension.playSound("vp.cursor_out", cursor.location);

                if (
                  entity.getComponent("type_family") &&
                  entity.getComponent("type_family").hasTypeFamily("plant")
                ) {
                  selectEntity.triggerEvent("vp:attack_distance");
                  selectEntity.applyDamage(1, {
                    cause: "entityAttack",
                    damagingEntity: entity,
                  });
                  selectEntity.clearVelocity();
                }

                if (
                  entity.getComponent("type_family") &&
                  entity.getComponent("type_family").hasTypeFamily("pinata")
                ) {
                  entity.triggerEvent("vp:disable");
                  entity.clearVelocity();

                  const destination = dimension.spawnEntity(
                    "vp:destination",
                    entity.location,
                  );

                  selectEntity.triggerEvent("vp:direct");
                  selectEntity.applyDamage(1, {
                    cause: "entityAttack",
                    damagingEntity: destination,
                  });
                  selectEntity.clearVelocity();

                  const senseArrive = system.runInterval(() => {
                    if (!destination.isValid) {
                      if (
                        entity.typeId == selectEntity.typeId &&
                        entity.getProperty("vp:breedable") &&
                        selectEntity.getProperty("vp:breedable")
                      ) {
                        const baby = entity.dimension.spawnEntity(
                          entity.typeId,
                          entity.location,
                          { spawnEvent: "minecraft:entity_born" },
                        );
                      }
                      entity.triggerEvent("vp:enable");
                      selectEntity.removeTag("directed");
                      system.clearRun(senseArrive);
                    } else {
                      destination.teleport(entity.location);
                    }
                  }, 20);

                  const tempCursor = dimension.getEntities({
                    tags: ["temp_cursor_" + player.name],
                  })[0];
                  tempCursor.remove();
                }
              }
            }
          } else if (
            entity.getComponent("type_family").hasTypeFamily("carryable") &&
            cursor.getProperty("vp:cursor_state") == "default"
          ) {
            cursor.addTag("carrying");
            const carryItem = system.runInterval(() => {
              if (
                entity.isValid &&
                cursor.hasTag("carrying") &&
                entity.getComponent("type_family").hasTypeFamily("carryable")
              ) {
                entity.teleport(addVector3(cursor.location, 0, 0.5, 0));
              } else {
                system.clearRun(carryItem);
                if (cursor.hasTag("carrying")) {
                  cursor.removeTag("carrying");
                }
              }
            }, 1);
          }
        }
      }
    } else if (entity == cursor) {
      cursor.removeTag("carrying");
    }

    if (entity == cursor && cursor.getProperty("vp:cursor_state") == "inner") {
      cursor.triggerEvent("vp:default");
      dimension.playSound("vp.cursor_out", cursor.location);
      const selectEntity = dimension.getEntities({
        tags: [
          player.name +
            world.scoreboard
              .getObjective("selections")
              .getScore(player.scoreboardIdentity),
        ],
      })[0];
      const destination = dimension.spawnEntity("vp:destination", location);

      selectEntity.triggerEvent("vp:enable");
      selectEntity.triggerEvent("vp:direct");
      selectEntity.applyDamage(1, {
        cause: "entityAttack",
        damagingEntity: destination,
      });
      selectEntity.clearVelocity();

      const tempCursor = dimension.getEntities({
        tags: ["temp_cursor_" + player.name],
      })[0];
      tempCursor.remove();
    }
  }
});

// world.afterEvents.playerButtonInput.subscribe((data) => {
//     const button = data.button;
//     const newState = data.newButtonState;
//     const player = data.player;
//     const cursor = player.dimension.getEntities({
//         type: "vp:cursor",
//         tags: [player.name]
//     })[0];

//     const location = { x: cursor.location.x, y: cursor.location.y + 1, z: cursor.location.z };
//     const dimension = player.dimension;

//     const entity = dimension.getEntities({ tags: ["hover_" + player.name] })[0];
//     if (button == "Sneak" && newState == "Pressed") {
//         if (entity && cursor.getProperty("vp:cursor_state") == "default") {
//             cursor.triggerEvent("vp:inner");
//             world.scoreboard.getObjective("selections").addScore(player.scoreboardIdentity, 1);
//             entity.addTag(player.name + world.scoreboard.getObjective("selections").getScore(player.scoreboardIdentity));
//             entity.triggerEvent("vp:disable");
//             entity.clearVelocity();
//             const tempCursor = dimension.spawnEntity("vp:cursor", entity.location);
//             tempCursor.triggerEvent("vp:outer");
//             tempCursor.addTag("temp_cursor");
//             tempCursor.addTag("temp_cursor_" + player.name);
//             entity.runCommand("ride @s start_riding @e[tag=temp_cursor_" + player.name + ",c=1]");

//         } else if (cursor.getProperty("vp:cursor_state") == "inner") {
//             if (entity) {
//                 cursor.triggerEvent("vp:default");

//                 const selectEntity = dimension.getEntities({ tags: [player.name + world.scoreboard.getObjective("selections").getScore(player.scoreboardIdentity)] })[0];
//                 selectEntity.triggerEvent("vp:enable");

//                 if (entity.getComponent("type_family") && entity.getComponent("type_family").hasTypeFamily("plant")) {
//                     selectEntity.triggerEvent("vp:attack_distance");
//                     selectEntity.applyDamage(1, { cause: "entityAttack", damagingEntity: entity });
//                     selectEntity.clearVelocity();
//                 }

//                 if (entity.getComponent("type_family") && entity.getComponent("type_family").hasTypeFamily("pinata")) {
//                     entity.triggerEvent("vp:disable");
//                     entity.clearVelocity();

//                     const destination = dimension.spawnEntity("vp:destination", entity.location);

//                     selectEntity.triggerEvent("vp:direct");
//                     selectEntity.applyDamage(1, { cause: "entityAttack", damagingEntity: destination });
//                     selectEntity.clearVelocity();

//                     const senseArrive = system.runInterval(() => {
//                         if (!destination.isValid) {
//                             if (entity.typeId == selectEntity.typeId && entity.getProperty("vp:breedable") && selectEntity.getProperty("vp:breedable")) {
//                                 world.sendMessage("romance");
//                                 const baby = entity.dimension.spawnEntity(entity.typeId, entity.location, { spawnEvent: "minecraft:entity_born" });
//                             }
//                             entity.triggerEvent("vp:enable");
//                             system.clearRun(senseArrive);

//                         } else {
//                             destination.teleport(entity.location);
//                         }
//                     }, 20)
//                 }

//             } else {
//                 world.sendMessage("direct");
//                 cursor.triggerEvent("vp:default");
//                 const selectEntity = dimension.getEntities({ tags: [player.name + world.scoreboard.getObjective("selections").getScore(player.scoreboardIdentity)] })[0];
//                 const destination = dimension.spawnEntity("vp:destination", location);

//                 selectEntity.triggerEvent("vp:enable");
//                 selectEntity.triggerEvent("vp:direct");
//                 selectEntity.applyDamage(1, { cause: "entityAttack", damagingEntity: destination });
//                 selectEntity.clearVelocity();
//             }

//             const tempCursor = dimension.getEntities({ tags: ["temp_cursor_" + player.name] })[0];
//             tempCursor.remove();
//         }
//     }

// });
