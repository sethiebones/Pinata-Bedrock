import { world, system } from '@minecraft/server';

world.afterEvents.dataDrivenEntityTrigger.subscribe((data) => {
    const entity = data.entity;
    const eventId = data.eventId;

    if (entity.isValid && entity.getComponent("type_family") && entity.getComponent("type_family").hasTypeFamily("pinata") && eventId == "minecraft:entity_born") {
        const player = entity.dimension.getPlayers({ closest: 1, location: entity.location })[0];

        entity.addTag("player_" + player.name);

        updateLabel(entity, player);
    } else if (eventId == 'vp:update_label') {
        let owner;

        entity.getTags().forEach(tag => {
            if (tag.split("player_")[1]) {
                world.getPlayers().forEach(player => {
                    if (player.name == tag.split("player_")[1]) {
                        owner = player;
                    }

                });
            }
        });

        updateLabel(entity, owner);

    }
});

function updateLabel(pinata, owner) {
    let background_back;
    let background_front;
    let logo_back;
    let logo_front;
    let border_back;
    let border_front;

    if (owner) {
        world.scoreboard.getObjective("label_background_front").getScore(owner) ?? world.scoreboard.getObjective("label_background_front").setScore(owner, 0);
        world.scoreboard.getObjective("label_background_back").getScore(owner) ?? world.scoreboard.getObjective("label_background_back").setScore(owner, 0);
        world.scoreboard.getObjective("label_border_front").getScore(owner) ?? world.scoreboard.getObjective("label_border_front").setScore(owner, 0);
        world.scoreboard.getObjective("label_border_back").getScore(owner) ?? world.scoreboard.getObjective("label_border_back").setScore(owner, 0);
        world.scoreboard.getObjective("label_logo_front").getScore(owner) ?? world.scoreboard.getObjective("label_logo_front").setScore(owner, 0);
        world.scoreboard.getObjective("label_logo_back").getScore(owner) ?? world.scoreboard.getObjective("label_logo_back").setScore(owner, 0);

        background_back = world.scoreboard.getObjective("label_background_back").getScore(owner);
        background_front = world.scoreboard.getObjective("label_background_front").getScore(owner);
        logo_back = world.scoreboard.getObjective("label_logo_back").getScore(owner);
        logo_front = world.scoreboard.getObjective("label_logo_front").getScore(owner);
        border_back = world.scoreboard.getObjective("label_border_back").getScore(owner);
        border_front = world.scoreboard.getObjective("label_border_front").getScore(owner);
    } else {
        background_back = 0;
        background_front = 0;
        logo_back = 0;
        logo_front = 0;
        border_back = 0;
        border_front = 0;

    }
    pinata.setProperty("vp:label_background_back", background_back);
    pinata.setProperty("vp:label_background_front", background_front);
    pinata.setProperty("vp:label_logo_back", logo_back);
    pinata.setProperty("vp:label_logo_front", logo_front);
    pinata.setProperty("vp:label_border_back", border_back);
    pinata.setProperty("vp:label_border_front", border_front);
}