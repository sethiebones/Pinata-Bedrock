import {
    world,
    system,
    Camera
} from '@minecraft/server'

world.afterEvents.dataDrivenEntityTrigger.subscribe(({ entity, eventId }) => {
    if (eventId == "vp:camera_queue") {

    }
});