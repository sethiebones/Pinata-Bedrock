import { world, system } from '@minecraft/server';
import { addVector3, damageHeldItem } from './functions.js'

function wateringCanEntity(entity) {
    if (entity.typeId == "vp:freebie_watering_can_entity") {
        system.runTimeout(() => {
            const interval = system.runInterval(() => {
                if (entity.getProperty("vp:pour_duration") == 0) {
                    entity.runCommand("tag @e[tag=pouring,c=1] remove pouring");
                    entity.remove();
                    system.clearRun(interval);
                } else {
                    entity.setProperty("vp:pour_duration", entity.getProperty("vp:pour_duration") - 1);

                    entity.runCommand("event entity @e[r=0.5] vp:watered");
                }
            }, 14);
        }, 5);
    }

}
world.afterEvents.entityLoad.subscribe(({ entity }) => {
    wateringCanEntity(entity);
});
world.afterEvents.entitySpawn.subscribe(({ entity }) => {
    wateringCanEntity(entity);
});

world.afterEvents.dataDrivenEntityTrigger.subscribe(({ eventId, entity }) => {
    if (eventId == "vp:watered" && entity.getComponent("type_family").hasTypeFamily("pinata")) {
        entity.addTag("watered_cooldown");
        system.runTimeout(() => {
            entity.removeTag("watered_cooldown");
        }, 200);
    }
})

world.beforeEvents.playerInteractWithEntity.subscribe(({ itemStack, player, target, cancel }) => {
    if (itemStack !== undefined && itemStack.typeId === 'vp:freebie_watering_can' && itemStack.getComponent('durability').damage < 10) {
        // if (itemStack.getComponent('durability').damage > 9) {
        //     cancel = true;
        // } else 
        if (!player.hasTag("pouring") && target.typeId != "vp:freebie_watering_can_entity" && target.typeId != "vp:cursor") {
            system.run(() => {
                target.dimension.spawnEntity("vp:freebie_watering_can_entity", target.location);
                player.addTag("pouring");
                damageHeldItem(player, 1);
                target.triggerEvent("vp:disable"); system.runTimeout(() => {
                    target.triggerEvent("vp:enable")
                }, 20);

            });
        } else if (player.hasTag("pouring") && target.typeId == "vp:freebie_watering_can_entity") {
            system.run(() => {
                target.setProperty("vp:pour_duration", target.getProperty("vp:pour_duration") + 1);
                damageHeldItem(player, 1);
            });
        }
    }

    // if (target.getComponent("type_family")) {
    //     const families = target.getComponent("type_family");
    //     if (itemStack !== undefined) {
    //         if (itemStack.typeId === 'vp:freebie_watering_can') {
    //             if (!((families.hasTypeFamily('plant') || families.hasTypeFamily('pinata')) && item.getComponent('durability').damage < 10)) {
    //                 data.cancel = true;
    //             }
    //         }
    //     }
    // }
});

world.beforeEvents.playerInteractWithBlock.subscribe(({ itemStack, player, block, blockFace, faceLocation, isFirstEvent }) => {

    if (itemStack !== undefined && isFirstEvent) {
        if (itemStack.typeId === 'vp:freebie_watering_can') {
            let testBlock;

            switch (blockFace) {
                case "Up":
                    testBlock = block.above()
                    break;
                case "Down":
                    testBlock = block.below()
                    break;
                case "East":
                    testBlock = block.east()
                    break;
                case "West":
                    testBlock = block.west()
                    break;
                case "North":
                    testBlock = block.north()
                    break;
                case "South":
                    testBlock = block.south()
                    break;

            }
            if (testBlock.typeId === 'minecraft:water' || block.isWaterlogged) {
                system.run(() => { player.runCommand('replaceitem entity @s slot.weapon.mainhand 0 vp:freebie_watering_can 1') });

            } else if (!player.hasTag("pouring") && itemStack.getComponent('durability').damage < 10) {
                system.run(() => {
                    const wateringCanEntity = block.dimension.spawnEntity("vp:freebie_watering_can_entity", addVector3(block.location, faceLocation.x, 1, -faceLocation.z + 1)).setRotation({ x: 0, y: player.getRotation().y - 90 });
                    damageHeldItem(player, 1);
                    player.addTag("pouring");
                });
            }

        }
    }
})
world.beforeEvents.itemUse.subscribe(({ itemStack, source, cancel }) => {

    if (itemStack.typeId === 'vp:freebie_watering_can' && !(itemStack.getComponent('durability').damage < 10)) {
        cancel = true;
    }
})

