import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system, world } from "@minecraft/server";

system.beforeEvents.startup.subscribe(({ customCommandRegistry }) => {
    // Register an enum for teleport locations
    customCommandRegistry.registerEnum("vp:pinata_types", ["wild", "resident"]);

    // Register the custom command
    customCommandRegistry.registerCommand(
        {
            name: "vp:pinatapeople",
            description: "Summon all pinata",
            permissionLevel: CommandPermissionLevel.Any,
            mandatoryParameters: [
                {
                    // Use the enum, by setting the name to the enum name
                    name: "vp:pinata_types",
                    type: CustomCommandParamType.Enum,
                },
            ],
        },
        (origin, pinataTypeString) => {
            // // Only run if executed by an entity
            if (!origin.sourceEntity) return;

            // Handle teleportation based on the location string
            if (pinataTypeString === "wild") {
                system.run(() => {
                    pinatas.forEach(pinata => {
                        origin.sourceEntity.runCommand(`summon vp:${pinata}`)
                        origin.sourceEntity.runCommand('spreadplayers ~2 ~2 2 3 @e[family=pinata, r=3]');
                    })
                });
            } else if (pinataTypeString === "resident") {
                system.run(() => {
                    pinatas.forEach(pinata => {
                        origin.sourceEntity.runCommand(`summon vp:${pinata}`)

                    })
                    origin.sourceEntity.runCommand('event entity @e[family=pinata, r=5] vp:resident');
                    origin.sourceEntity.runCommand('spreadplayers ~2 ~2 2 3 @e[family=pinata, r=3]');
                });
            }
        }
    );

    // Register an enum for teleport locations
    customCommandRegistry.registerEnum("vp:crate_action", ["send"],);

    // Register the custom command
    customCommandRegistry.registerCommand(
        {
            name: "vp:crate",
            description: "Crate Actions",
            permissionLevel: CommandPermissionLevel.Any,
            mandatoryParameters: [
                {
                    // Use the enum, by setting the name to the enum name
                    name: "vp:crate_action",
                    type: CustomCommandParamType.Enum,
                },
                {
                    name: "vp:crate_recipient",
                    type: CustomCommandParamType.PlayerSelector
                }
            ],
        },
        (origin, crateActionString, crateRecipient) => {
            // // Only run if executed by an entity
            if (!origin.sourceEntity) return;

            // Handle teleportation based on the location string
            if (crateActionString === "send") {
                system.run(() => {
                    const heldItem = origin.sourceEntity.getComponent("minecraft:inventory").container.getItem(origin.sourceEntity.selectedSlotIndex);
                    if (heldItem && heldItem.typeId == "vp:crate") {
                        if (crateRecipient.length == 1) {
                            if (crateRecipient[0].getComponent("minecraft:inventory").container.firstEmptySlot()) {
                                origin.sourceEntity.getComponent("minecraft:inventory").container.moveItem(origin.sourceEntity.selectedSlotIndex, crateRecipient[0].getComponent("minecraft:inventory").container.firstEmptySlot(), crateRecipient[0].getComponent("minecraft:inventory").container);
                            } else {
                                return {
                                    status: CustomCommandStatus.Failure,
                                    message: "The recipient's inventory is full. Please try again later."
                                }

                            }
                        } else {
                            if (crateRecipient.length > 1) {
                                return {
                                    status: CustomCommandStatus.Failure,
                                    message: "Too many players selected."
                                }
                            } else if (crateRecipient.length < 1) {
                                return {
                                    status: CustomCommandStatus.Failure,
                                    message: "No players selected."
                                }

                            }

                        }
                    } else {
                        return {
                            status: CustomCommandStatus.Failure,
                            message: "You must hold the desired crate in your hand."
                        }

                    }
                });
            }
        }
    );
});

const pinatas = [
    "whirlm"
]


// import {
//     world,
//     system
// } from '@minecraft/server'

// world.beforeEvents.chatSend.subscribe((eventData) => {
//     const player = eventData.sender;
//     switch (eventData.message) {
//         case '!help':
//             eventData.cancel = true;
//             player.sendMessage({ translate: 'accessibility.pinata_help1' });
//             player.sendMessage({ translate: 'accessibility.pinata_help2' });
//             break;
//         default: break;
//     }
// });

// world.beforeEvents.chatSend.subscribe((eventData) => {
//     const player = eventData.sender;
//     const { x, y, z } = player.getViewDirection();
//     switch (eventData.message) {
//         case '!a':
//             eventData.cancel = true;

//             if (Math.abs(x) > Math.abs(z)) {
//                 if (x > 0) {
//                     player.sendMessage(`east`);
//                 } else {
//                     player.sendMessage(`west`);
//                 }
//             } else {
//                 if (z > 0) {
//                     player.sendMessage(`south`);
//                 } else {
//                     player.sendMessage(`north`);
//                 }
//             }
//             break;
//         default: break;
//     }
// });

// //set wildcard
// world.afterEvents.itemUse.subscribe((data) => {
//     const player = data.source;
//     const location = player.location
//     const item = data.itemStack;
//     const pinatas = player.dimension.getEntities({ location: location, maxDistance: 2 })
//     if (player.getGameMode() === "creative") {
//         if (item.nameTag === 'wildcard 1') {
//             for (const pinata of pinatas) {
//                 if (pinata.matches({ families: ["pinata"] })) {
//                     pinata.setProperty("vp:wildcard1", 1)
//                 }
//             }
//         }
//         if (item.nameTag === 'wildcard 2') {
//             for (const pinata of pinatas) {
//                 if (pinata.matches({ families: ["pinata"] })) {
//                     pinata.setProperty("vp:wildcard2", 1)
//                 }
//             }
//         }
//         if (item.nameTag === 'wildcard 3') {
//             for (const pinata of pinatas) {
//                 if (pinata.matches({ families: ["pinata"] })) {
//                     pinata.setProperty("vp:wildcard3", 1)
//                 }
//             }
//         }
//     }
// })

