import {
    system,
    world,
    ItemStack
} from '@minecraft/server'

// console.warn('Hello, thank you very much for participating in the mod alpha! If you find any errors, bugs or have any ideas for the mod, please contact me on my discord account: lunardev0668.')
// console.warn('204')

import { moveRelative } from './functions.js'

world.afterEvents.dataDrivenEntityTrigger.subscribe((data) => {
    const entity = data.entity;
    if (entity && entity.isValid) {
        const dimension = entity?.dimension;
        const location = entity.location;
        const eventId = data.eventId;
        if (eventId.match('minecraft:entity_born') && entity.getComponent("type_family").hasTypeFamily("pinata")) {

            const parents = entity.dimension.getEntities({ families: [entity.typeId.split(":")[1]], excludeFamilies: ["egg"], location: entity.location, closest: 2 });

            if (parents[0].getProperty('vp:wildcard_1').valueOf() || parents[1].getProperty('vp:wildcard_1').valueOf()) {
                entity.setProperty('vp:wildcard_1', true);
            }

            if (parents[0].getProperty('vp:wildcard_2').valueOf() || parents[1].getProperty('vp:wildcard_2').valueOf()) {
                entity.setProperty('vp:wildcard_2', true);
            }

            if (parents[0].getProperty('vp:wildcard_3').valueOf() || parents[1].getProperty('vp:wildcard_3').valueOf()) {
                entity.setProperty('vp:wildcard_3', true);
            }

            parents[0].triggerEvent('vp:non_breedable');
            parents[1].triggerEvent('vp:non_breedable');

            const player = entity.dimension.getPlayers({ closest: 1 })[0];
            world.scoreboard.getObjective(entity.typeId.split(":")[1] + "_romanced").addScore(player.scoreboardIdentity, 1);

        } else if (eventId.match('vp:non_breedable')) {
            entity.runCommand('scoreboard players reset @s love_req1')
        } else if (eventId.match('minecraft:ageable_grow_up') && entity.getComponent("type_family").hasTypeFamily("pinata")) {
            system.runTimeout(() => {
                entity.triggerEvent("vp:hatch_cocoon");
            }, 200)
        }
    }
});
