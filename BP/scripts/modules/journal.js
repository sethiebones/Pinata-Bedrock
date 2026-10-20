import { world } from '@minecraft/server';


world.afterEvents.playerInteractWithEntity.subscribe((data) => {
    const item = data.itemStack;
    const source = data.player;
    const target = data.target;
    const families = target.getComponent("type_family");

    if (item !== undefined && item.typeId === 'vp:journal') {
        const type = target.typeId.replace("vp:", "").charAt(0).toUpperCase() + target.typeId.replace("vp:", "").slice(1);

        if (families && families.hasTypeFamily("pinata")) {
            if (families.hasTypeFamily("wild")) {
                source.sendMessage({ translate: `accessibility.${type}.visit.req` });
                source.sendMessage({ translate: `accessibility.${type}.resident.req` });
            }
            if (families.hasTypeFamily("resident")) {
                source.sendMessage({ translate: `accessibility.${type}.romance.req` });
                source.sendMessage("Candiosity: " + target.getProperty("vp:candiosity"));
                source.sendMessage("Fights Won: " + world.scoreboard.getObjective("fights_won").getScore(target));
                source.sendMessage("Fights Fought: " + world.scoreboard.getObjective("fights_fought").getScore(target));
            }
        }

    }
});

world.afterEvents.playerInteractWithBlock.subscribe((data) => {
    const item = data.itemStack;
    const source = data.player;
    const block = data.block;
    if (item !== undefined) {
        if (item.typeId === 'vp:journal') {
        }
    }
})

const pinatas = [
    "bispotti",
    "bunnycomb",
    "custacean",
    "mousemallow",
    "parmadillo",
    "pengum",
    "sparrowmint",
    "whirlm"
]
