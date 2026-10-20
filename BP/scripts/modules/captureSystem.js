import {
    world,
    system,
    ItemStack
} from '@minecraft/server'

// //better visualization ;) quite useful really
// //region
// //endregion

// //region trap
// world.beforeEvents.worldInitialize.subscribe((data) => {
//     data.blockComponentRegistry.registerCustomComponent("vp:trap", {
//         onPlayerInteract(e) {
//             const player = e.player;
//             const inventory = player.getComponent('inventory').container;
//             const item_stack = inventory.getItem(player.selectedSlotIndex);
//             const block = e.block;
//             const location = block.location;
//             const x = location.x + 0.5;
//             const y = location.y + 0.1;
//             const z = location.z + 0.5;
//             const entities = block.dimension.getEntities({ location: location, maxDistance: 1 });
//             const delay = 1;

//             baits.forEach(baitType => {
//                 for (const entity of entities) {
//                     if (entity.typeId == 'vp:bait' && entity.matches({ families: [`${baitType}`] })) {
//                         entity.runCommandAsync(`loot spawn ~~~ loot "baits/${baitType}"`)
//                         system.runTimeout(() => {
//                             entity.triggerEvent('vp:despawn')
//                         }, delay)
//                     }
//                 }
//             })

//             baits.forEach(baitType => {
//                 if (item_stack?.typeId == `vp:${baitType}`) {

//                     let baitFound = false;
//                     for (const entity of entities) {
//                         if (entity.typeId === "vp:bait") {
//                             baitFound = true;
//                             break;
//                         }
//                     }

//                     if (!baitFound) {
//                         if (player.getGameMode() !== "creative") {
//                             if (inventory.getItem(player.selectedSlotIndex).amount > 1) {
//                                 item_stack.amount -= 1;
//                                 inventory.setItem(player.selectedSlotIndex, item_stack);
//                             } else {
//                                 inventory.setItem(player.selectedSlotIndex, undefined);
//                             }
//                         } else {
//                             system.runTimeout(() => {
//                                 player.runCommandAsync('tag @e[r=1, c=1, type=vp:bait] add creative_trap')
//                             }, delay)
//                         }

//                         trap.forEach(trapType => {
//                             player.runCommandAsync(`execute if block ~~~ ${trapType} run summon vp:bait ~~~ 90 0 vp:${baitType}`)
//                         })
//                     }
//                 }
//                 if (item_stack?.typeId == `minecraft:${baitType}`) {

//                     let baitFound = false;
//                     for (const entity of entities) {
//                         if (entity.typeId === "vp:bait") {
//                             baitFound = true;
//                             break;
//                         }
//                     }

//                     if (!baitFound) {
//                         if (player.getGameMode() !== "creative") {
//                             if (inventory.getItem(player.selectedSlotIndex).amount > 1) {
//                                 item_stack.amount -= 1;
//                                 inventory.setItem(player.selectedSlotIndex, item_stack);
//                             } else {
//                                 inventory.setItem(player.selectedSlotIndex, undefined);
//                             }
//                         } else {
//                             system.runTimeout(() => {
//                                 player.runCommandAsync('tag @e[r=1, c=1, type=vp:bait] add creative_trap')
//                             }, delay)
//                         }

//                         trap.forEach(trapType => {
//                             player.runCommandAsync(`execute if block ~~~ ${trapType} run summon vp:bait ~~~ 90 0 vp:${baitType}`)
//                         })
//                     }
//                 }
//             })

//             if (player.isSneaking) {
//                 block.setType("vp:begginer_trap_closed")
//             }
//         }
//     });
// })

// world.afterEvents.dataDrivenEntityTrigger.subscribe((data) => {
//     const entity = data.entity;
//     const event = data.eventId;

//     const location = entity?.location;
//     const dimension = entity?.dimension;

//     const delay = 1;

//     if (event.match('vp:detect_block')) {
//         trap.forEach(trapType => {
//             if (dimension.getBlock(location).typeId !== trapType) {
//                 baits.forEach(bait => {
//                     if (entity.typeId == 'vp:bait' && entity.matches({ families: [`${bait}`] })) {
//                         entity.runCommandAsync(`loot spawn ~~~ loot "baits/${bait}"`)
//                         system.runTimeout(() => {
//                             entity.triggerEvent('vp:despawn')
//                         }, delay)
//                     }
//                 })
//             }
//         })
//     }

// })

// world.afterEvents.dataDrivenEntityTrigger.subscribe((data) => {
//     const entity = data.entity;
//     const event = data.eventId;

//     const location = entity.location;
//     const dimension = entity.dimension;

//     const delay = 1;

//     if (event.match('vp:capture_pinata')) {
//         const entities = dimension.getEntities({ location: location, maxDistance: 1 });

//         for (const nearbyEntity of entities) {
//             if (nearbyEntity.matches({ families: ["pinata", "wild"] })) {
//                 const id = `pinata` + nearbyEntity.id
//                 trap.forEach(trapType => {
//                     if (dimension.getBlock(location).typeId === trapType) {
//                         if (entity.hasTag("creative_trap")) {
//                             entity.runCommandAsync('playsound random.door_close @p[r=10] ~~~');
//                             trap.forEach(trapType => {
//                                 entity.runCommandAsync(`fill ~~~ ~~~ air replace ${trapType}`);
//                             });
//                             entity.runCommandAsync(`structure save ${id} ~~~ ~~~ true disk false`);
//                             entity.runCommandAsync(`summon vp:failed_trap`);
//                             entity.runCommandAsync(`event entity @e[r=2, c=1, family=wild] vp:trap`);
//                             system.runTimeout(() => {
//                                 entity.remove();
//                             }, delay);
//                         } else {
//                             if (Math.random() < 0.4) {
//                                 entity.runCommandAsync('playsound random.door_close @p[r=10] ~~~');
//                                 trap.forEach(trapType => {
//                                     entity.runCommandAsync(`fill ~~~ ~~~ air replace ${trapType}`);
//                                 });
//                                 entity.runCommandAsync(`structure save ${id} ~~~ ~~~ true disk false`);
//                                 entity.runCommandAsync(`summon vp:failed_trap`);
//                                 entity.runCommandAsync(`event entity @e[r=2, c=1, family=wild] vp:trap`);
//                                 system.runTimeout(() => {
//                                     entity.remove();
//                                 }, delay);
//                             } else {
//                                 entity.runCommandAsync(`playsound random.break @p[r=10] ~~~`);
//                                 trap.forEach(trapType => {
//                                     entity.runCommandAsync(`fill ~~~ ~~~ air replace ${trapType}`);
//                                 });
//                                 entity.runCommandAsync(`particle minecraft:critical_hit_emitter ~~1~`);
//                                 entity.runCommandAsync(`summon vp:failed_trap`);
//                                 system.runTimeout(() => {
//                                     entity.remove();
//                                 }, delay);
//                             }
//                         }
//                     }
//                 });
//             }
//         }
//     } else if (event.match('vp:trap')) {
//         const entities = dimension.getEntities({ location: location, maxDistance: 1 });
//         for (const nearbyEntity of entities) {
//             if (nearbyEntity.matches({ families: ["pinata", "wild"] })) {
//                 const id = `pinata` + nearbyEntity.id
//                 const name = entity.typeId.replace("vp:", "");
//                 let trap = new ItemStack("vp:begginer_trap_closed", 1);
//                 trap.nameTag = `trapped ${name}`;
//                 trap.setLore([`${id}`]);
//                 dimension.spawnItem(trap, location);
//                 nearbyEntity.remove();
//             }
//         }
//     }

// })

// //loads trap saved structure
// world.afterEvents.itemUseOn.subscribe((data) => {
//     const item = data.itemStack;
//     const lore = item.getLore();
//     if (item.typeId === 'vp:begginer_trap_closed') {
//         if (lore.length > 0) {
//             const player = data.source;
//             const location = {
//                 x: data.block.x,
//                 y: data.block.y,
//                 z: data.block.z
//             };
//             const y1 = location.y + 1
//             player.runCommandAsync(`structure load ${lore} ${location.x} ${y1} ${location.z} 0_degrees none true false`)
//             player.runCommandAsync(`structure delete ${lore}`)
//         }
//     }
// })

// const trap = [
//     "vp:begginer_trap"
// ]

// const baits = [
//     "apple",
//     "buttercup_seed",
//     "buttercup_petals",
//     "chili"
// ]

// //endregion

//region //net
world.afterEvents.playerInteractWithEntity.subscribe((data) => {
    const item = data.beforeItemStack;
    const entity = data.target;
    const player = data.player;
    if (item?.typeId !== undefined && !player.isSneaking) {
        if (entity.matches({ families: ["net"] })) {
            if (item.typeId === 'vp:net_level1') {
                if (entity.matches({ families: ["level0"] })) {
                    let durability = item.getComponent("minecraft:durability");
                    let damage = 1;

                    const id = entity.id;
                    const iD = `pinata` + id;


                    if (player.getGameMode() === "creative") {
                        entity.removeTag("hover_" + player.name);
                        entity.runCommand(`event entity @s vp:net`)
                    } else {
                        if (Math.random() < 0.6) {
                            entity.removeTag("hover_" + player.name);
                            entity.runCommand(`event entity @s vp:net`)
                        } else {
                            entity.runCommand(`playsound block.scaffolding.hit @p[r=10] ~~~`)
                            entity.runCommand(`particle minecraft:critical_hit_emitter ~~1~`)
                            durability.damage = (durability.damage + damage)
                            if (durability.damage >= durability.maxDurability) {
                                player.getComponent("minecraft:inventory").container.setItem(player.selectedSlotIndex)
                            } else {
                                player.getComponent("minecraft:inventory").container.setItem(player.selectedSlotIndex, item)
                            }
                        }
                    }


                    player.addTag("trap_action");

                    system.runTimeout(() => {

                        player.removeTag("trap_action");

                    }, 100)
                }
            }
        } else if (item.typeId == 'vp:crate') {
            //if (entity.hasTag(player.nameTag)) {
            if ((entity.getComponent("type_family").hasTypeFamily("pinata") && entity.getComponent("type_family").hasTypeFamily("resident")) || entity.getComponent("type_family").hasTypeFamily("plant") || entity.getComponent("type_family").hasTypeFamily("candy")) {
                const lore = item.getLore();
                if (lore != undefined) {
                    const type = entity.typeId.replace("vp:", "").charAt(0).toUpperCase() + entity.typeId.replace("vp:", "").slice(1);
                    const name = entity.nameTag.replace(" ", "_") || type;
                    const id = entity.id;
                    const iD = `${name}_${id}`;
                    const location = entity.location;
                    const dimension = entity.dimension;

                    let crate = new ItemStack("vp:crate", 1);
                    crate.setLore(item.getLore());
                    crate.nameTag = item.nameTag;

                    if (lore.length < 4) {
                        entity.removeTag("hover_" + player.name);

                        entity.runCommand('playsound step.cloth @p[r=10] ~~~')
                        entity.runCommand(`tp @s ~~1000~`)
                        entity.runCommand(`structure save ${iD} ~~~ ~~~ true disk false`)

                        crate.nameTag = `${type}`;
                        crate.setLore(crate.getLore().concat([iD]))

                        entity.remove()
                    }

                    player.getComponent("minecraft:inventory").container.addItem(crate);
                }
            }
            //}
        }
    }


})

world.afterEvents.dataDrivenEntityTrigger.subscribe((data) => {
    const entity = data.entity;
    const eventId = data.eventId;
    if (eventId.match('vp:net')) {
        const name = entity.typeId.replace("vp:", "").charAt(0).toUpperCase() + entity.typeId.replace("vp:", "").slice(1);
        const id = entity.id;
        const iD = `pinata` + id;
        const location = entity.location;
        const dimension = entity.dimension;


        entity.runCommand('playsound step.cloth @p[r=10] ~~~')
        entity.runCommand(`tp @s ~~1000~`)
        entity.runCommand(`structure save ${iD} ~~~ ~~~ true disk false`)

        let net = new ItemStack("vp:net_full", 1)
        net.nameTag = `${name}`
        net.setLore([`${iD}`]);
        dimension.spawnItem(net, location);
        entity.remove();
    } else if (eventId.match('vp:crate')) {
    }

})
world.beforeEvents.playerInteractWithBlock.subscribe((data) => {
    const item = data.itemStack;
    if (item != undefined) {
        const lore = item.getLore();
        if (item.typeId == 'vp:net_full') {

            if (lore != undefined) {
                const player = data.player;
                const location = {
                    x: data.block.x,
                    y: data.block.y,
                    z: data.block.z
                };
                const y1 = location.y + 1;
                system.run(() => {
                    player.runCommand(`structure load ${lore} ${location.x} ${y1} ${location.z} 0_degrees none true false`)
                    player.runCommand(`structure delete ${lore}`)
                    player.getComponent("minecraft:inventory").container.setItem(player.selectedSlotIndex)
                })
            }
        } else if (item.typeId == 'vp:crate') {

            if (lore.length) {
                const player = data.player;
                const location = {
                    x: data.block.x,
                    y: data.block.y,
                    z: data.block.z
                };
                const y1 = location.y + 1;
                if (player.isSneaking) {
                    system.run(() => {
                        lore.forEach((pinata) => {
                            system.run(() => {
                                player.runCommand(`structure load ${pinata} ${location.x} ${y1 + 1} ${location.z} 0_degrees none true false`)
                                player.runCommand(`structure delete ${pinata}`)
                            });
                        })
                    });

                } else {
                    data.cancel = true;
                    const pinata = lore.pop();
                    system.run(() => {
                        player.runCommand(`structure load ${pinata} ${location.x} ${y1 + 1} ${location.z} 0_degrees none true false`)
                        player.runCommand(`structure delete ${pinata}`)
                    });
                    system.run(() => {
                        const newCrate = new ItemStack("vp:crate", 1);
                        newCrate.setLore(lore);
                        player.getComponent("minecraft:inventory").container.setItem(player.selectedSlotIndex, newCrate);
                    })


                }
            }
        }
    }
})
//endregion

// //comentaries are cool, you can hide lil secrets in the code for the curious people, does it take space? idk lmao