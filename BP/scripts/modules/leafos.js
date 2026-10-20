import { world, system, EquipmentSlot, EntityComponentTypes } from '@minecraft/server';

world.afterEvents.entitySpawn.subscribe((data) => {
    const entity = data.entity;

    if (entity.typeId == "vp:leafos") {
        let leafos = entity;
        if (entity.nameTag == "Leafos") {
            leafos.runCommand('tag @e remove true_leafos');
            leafos.addTag('true_leafos');
            leafos.runCommand('kill @e[family=leafos, tag=!true_leafos]');

        } else {
            if (entity.hasTag("newGarden")) {
                entity.runCommand('summon vp:leafos ~~~ ~~ vp:cry "Leafos"');

            } else {
                entity.runCommand('summon vp:leafos "Leafos"');
            }
            leafos.remove();
        }

    }
});

world.beforeEvents.playerInteractWithEntity.subscribe((data) => {
    const player = data.player;
    const target = data.target;

    if (target.getComponent("type_family")) {
        if (target.getComponent("type_family").hasTypeFamily("leafos")) {
            data.cancel = true;

            system.run(() => {
                target.triggerEvent("vp:disable");
                target.clearVelocity;
            });

            if (target.getProperty("vp:crying").valueOf()) {
                system.run(() => {
                    target.runCommand("dialogue change @s vp:leafos_intro " + player.name);
                });

            } else if (target.hasTag("has_journal")) {

            }
            else if (target.hasTag("has_shovel")) {

            } else {
                const num = Math.floor(Math.random() * 91)
                system.run(() => {
                    target.runCommand("dialogue change @s vp:leafos_" + num + " " + player.name);
                });
            }

            if (player.getGameMode() == "Creative") {
                system.run(() => {
                });
            }


            system.run(() => {
                target.runCommand("dialogue open @s " + player.name);
            });
        }
    }
});

export function getLeafos(garden, tpToGarden = false) {
    const leafos = [...world.getDimension("overworld").getEntities({ type: "vp:leafos", tags: ["true_leafos"] }), ...world.getDimension("nether").getEntities({ type: "vp:leafos", tags: ["true_leafos"] }), ...world.getDimension("the_end").getEntities({ type: "vp:leafos", tags: ["true_leafos"] })][0];
    if (leafos) {
        leafos.runCommand('kill @e[family=leafos, tag=!true_leafos]');
        if (tpToGarden) {
            if (!leafos.hasTag("garden" + garden.id)) {
                leafos.teleport(garden.location);
            }
        }
        return leafos;
    } else {
        return garden.dimension.spawnEntity("vp:leafos", garden.location);
    }
}



