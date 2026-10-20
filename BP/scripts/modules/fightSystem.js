import { system, world } from "@minecraft/server";

import { clamp, projectile, missile } from "./functions.js";

world.afterEvents.dataDrivenEntityTrigger.subscribe((data) => {
  const eventId = data.eventId;
  const entity = data.entity;
  if (
    eventId == "vp:angry" &&
    !entity.getProperty("vp:sick").valueOf() &&
    !entity.getProperty("vp:fighting").valueOf() &&
    !entity.getComponent("leashable").isLeashed
  ) {
    //entity.dimension.spawnParticle("minecraft:villager_angry", entity.location);

    let i = 0;
    let interval = system.runInterval(
      () => {
        if (entity.hasTag("searching_for_fight") && i < 4) {
          // 4 is based off th 10 second angry time and th maximum interval time 40 + 10 = 50 ticks; 10 sec * 20 ticks/sec / 50 ticks = 4
          entity.runCommand(
            "damage @e[family=pinata,has_property={vp:fighting=false, vp:sick=false}, r=5, rm=0.00000001, c=1] 0 entity_attack entity @s",
          );
        } else {
          entity.removeTag("searching_for_fight");
          system.clearRun(interval);
        }

        i++;
      },
      40 + Math.random() * 10,
    ); //randomness prevents a pinata from entering multiple fights when vp:angry is called on all pinata
  }
});

world.afterEvents.entityLoad.subscribe(({ entity }) => {
  world.scoreboard.getObjective("fights_won").addScore(entity, 0);
  world.scoreboard.getObjective("fights_fought").addScore(entity, 0);
});

world.afterEvents.entityHurt.subscribe((data) => {
  const defender = data.hurtEntity;
  const attacker = data.damageSource.damagingEntity;

  if (
    defender &&
    attacker &&
    defender.isValid &&
    attacker.isValid &&
    defender.getComponent("type_family") &&
    attacker.getComponent("type_family") &&
    defender.getComponent("type_family").hasTypeFamily("pinata") &&
    attacker.getComponent("type_family").hasTypeFamily("pinata") &&
    attacker != defender &&
    !defender.getProperty("vp:sick").valueOf() &&
    !attacker.getProperty("vp:sick").valueOf() &&
    !defender.getProperty("vp:fighting").valueOf() &&
    !attacker.getProperty("vp:fighting").valueOf()
  ) {
    if (
      attacker.hasTag("searching_for_fight") &&
      !(
        attacker.getProperty("vp:hunting") &&
        attacker.getProperty("vp:hunting").valueOf()
      )
    ) {
      attacker.triggerEvent("vp:fighting");
      attacker.removeTag("searching_for_fight");
      attacker.addTag("prefight");

      defender.triggerEvent("vp:fighting");
      defender.removeTag("searching_for_fight");
      defender.addTag("prefight");

      let defenderName = defender.nameTag;
      let attackerName = attacker.nameTag;

      if (!defenderName) {
        defenderName = defender.typeId.split(":")[1];
        defenderName =
          defenderName.charAt(0).toUpperCase() + defenderName.slice(1);
      }
      if (!attackerName) {
        attackerName = attacker.typeId.split(":")[1];
        attackerName =
          attackerName.charAt(0).toUpperCase() + attackerName.slice(1);
      }

      defender.runCommand(
        "execute as @e[family=garden, c=1] run say " +
          attackerName +
          " and " +
          defenderName +
          " are fighting!",
      );

      system.runTimeout(() => {
        attacker.removeTag("prefight");
        defender.removeTag("prefight");
        let interval = system.runInterval(() => {
          if (attacker && defender && attacker.isValid && defender.isValid) {
            attacker.setProperty("vp:attacking", false);
            defender.setProperty("vp:attacking", false);
            attacker.setProperty("vp:dodging", false);
            defender.setProperty("vp:dodging", false);

            if (
              defender.getProperty("vp:sick").valueOf() ||
              attacker.getProperty("vp:sick").valueOf() ||
              defender == attacker ||
              defender.getProperty("vp:calmed").valueOf() ||
              attacker.getProperty("vp:calmed").valueOf()
            ) {
              if (defender.getProperty("vp:sick").valueOf()) {
                attacker.runCommand(
                  "execute as @e[family=garden, c=1] run say " +
                    attackerName +
                    " won!",
                );
                attacker.triggerEvent("vp:heal");

                defender.triggerEvent("vp:sick");
                system.run(() => {
                  defender.triggerEvent("vp:healable");
                });

                world.scoreboard
                  .getObjective("fights_won")
                  .addScore(attacker, 1);
                world.scoreboard
                  .getObjective("fights_fought")
                  .addScore(attacker, 1);
                world.scoreboard
                  .getObjective("fights_fought")
                  .addScore(defender, 1);
              } else if (attacker.getProperty("vp:sick").valueOf()) {
                defender.runCommand(
                  "execute as @e[family=garden, c=1] run say " +
                    defenderName +
                    " won!",
                );
                defender.triggerEvent("vp:heal");

                attacker.triggerEvent("vp:sick");
                system.run(() => {
                  attacker.triggerEvent("vp:healable");
                });

                world.scoreboard
                  .getObjective("fights_fought")
                  .addScore(attacker, 1);
                world.scoreboard
                  .getObjective("fights_won")
                  .addScore(defender, 1);
                world.scoreboard
                  .getObjective("fights_fought")
                  .addScore(defender, 1);
              } else if (defender == attacker) {
                defender.runCommand(
                  "execute as @e[family=garden, c=1] run say " +
                    defenderName +
                    " stop fighting yourself!",
                );
              } else {
                defender.runCommand(
                  "execute as @e[family=garden, c=1] run say Fight stopped unexpectedly",
                );
              }

              attacker.triggerEvent("vp:stop_fighting");
              defender.triggerEvent("vp:stop_fighting");

              system.clearRun(interval);
            } else {
              defender.lookAt(attacker.location);
              attacker.lookAt(defender.location);
              system.runTimeout(() => {
                const attackerWins = world.scoreboard
                  .getObjective("fights_won")
                  .getScore(attacker);
                const attackerFights = world.scoreboard
                  .getObjective("fights_fought")
                  .getScore(attacker);
                const defenderWins = world.scoreboard
                  .getObjective("fights_won")
                  .getScore(defender);
                const defenderFights = world.scoreboard
                  .getObjective("fights_fought")
                  .getScore(defender);

                if (
                  Math.random() <=
                  clamp(0.5 + 0.01 * (attackerWins - defenderWins), 0, 0.99)
                ) {
                  //defender.runCommand("say hit " + attackerName);
                  attacker.setProperty("vp:attacking", true);

                  missile(
                    "vp:whirlm_missile",
                    {
                      x: attacker.location.x,
                      y: attacker.location.y + 1,
                      z: attacker.location.z,
                    },
                    defender.location,
                    2,
                    5,
                    25,
                    attacker.dimension.id,
                  );

                  if (
                    Math.random() <
                    clamp(
                      0.25 + 0.01 * (defenderFights - attackerFights),
                      0,
                      0.99,
                    )
                  ) {
                    system.runTimeout(() => {
                      defender.setProperty("vp:dodging", true);
                    }, 30);
                  } else {
                    system.runTimeout(() => {
                      defender.applyDamage(1, {
                        cause: "entityAttack",
                        damagingEntity: attacker,
                      });
                    }, 40);
                  }
                } else {
                  //attacker.runCommand("say hit " + defenderName);
                  defender.setProperty("vp:attacking", true);

                  missile(
                    "vp:whirlm_missile",
                    {
                      x: defender.location.x,
                      y: defender.location.y + 1,
                      z: defender.location.z,
                    },
                    attacker.location,
                    2,
                    5,
                    25,
                    defender.dimension.id,
                  );

                  if (
                    Math.random() <
                    clamp(
                      0.25 + 0.01 * (attackerFights - defenderFights),
                      0,
                      0.99,
                    )
                  ) {
                    system.runTimeout(() => {
                      attacker.setProperty("vp:dodging", true);
                    }, 30);
                  } else {
                    system.runTimeout(() => {
                      attacker.applyDamage(1, {
                        cause: "entityAttack",
                        damagingEntity: defender,
                      });
                    }, 40);
                  }
                }
              }, 2);
            }
          }
        }, 80);
      }, 60);
    } else if (
      attacker.getProperty("vp:hunting") &&
      attacker.getProperty("vp:hunting").valueOf()
    ) {
      system.runTimeout(() => {
        attacker.triggerEvent("vp:disable");
        attacker.clearVelocity();
        defender.triggerEvent("vp:disable");
        defender.clearVelocity();
      }, 10);

      defender.runCommand("say is being hunted!");

      system.runTimeout(() => {
        attacker.lookAt(defender.location);
        defender.lookAt(attacker.location);
        attacker.setProperty("vp:attacking", true);
        missile(
          "vp:whirlm_missile",
          {
            x: attacker.location.x,
            y: attacker.location.y + 1,
            z: attacker.location.z,
          },
          defender.location,
          2,
          5,
          45,
          attacker.dimension.id,
        );
      }, 40);
      system.runTimeout(() => {
        defender.triggerEvent("vp:bust");
        attacker.setProperty("vp:attacking", false);
        attacker.triggerEvent("vp:enable");
      }, 100);
    }
  } else if (
    defender &&
    attacker &&
    defender.isValid &&
    attacker.isValid &&
    defender.getComponent("type_family") &&
    attacker.getComponent("type_family") &&
    defender.getComponent("type_family").hasTypeFamily("plant") &&
    attacker.getComponent("type_family").hasTypeFamily("pinata") &&
    attacker != defender &&
    !attacker.getProperty("vp:sick").valueOf() &&
    !attacker.getProperty("vp:fighting").valueOf()
  ) {
    //system.runTimeout(() => {
    attacker.triggerEvent("vp:disable");
    attacker.clearVelocity();
    //}, 10)

    system.runTimeout(() => {
      attacker.lookAt(defender.location);
      attacker.setProperty("vp:attacking", true);
      missile(
        "vp:whirlm_missile",
        {
          x: attacker.location.x,
          y: attacker.location.y + 1,
          z: attacker.location.z,
        },
        defender.location,
        2,
        5,
        45,
        attacker.dimension.id,
      );
    }, 40);
    system.runTimeout(() => {
      defender.triggerEvent("vp:plant_collected");
      attacker.setProperty("vp:attacking", false);
      attacker.triggerEvent("vp:enable");
    }, 100);
  }
});
