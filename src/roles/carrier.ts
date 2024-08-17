import { CreepRole, IRole } from "roles";
import { Traveler } from "utils/Traveler/Traveler";

export const Carrier : IRole = {
    type: CreepRole.Carrier,
    body: [MOVE, MOVE, WORK, CARRY, CARRY],

    run: function (creep: Creep): void {
        const memory = creep.memory as CarrierMemory;
        if (creep.memory.task == "idle") {
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
                creep.memory.task = "collecting";
        }
        else if (creep.memory.task == "collecting") {
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                creep.memory.task = "storing";
                return;
            }

            const room = Game.rooms[creep.memory.targetRoomName];
            const harvesters = room.find(FIND_MY_CREEPS, {
                filter: x => x.id == memory.harvesterId
            });

            if (harvesters.length > 0)
                creep.travelTo(harvesters[0]);

            const resources = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 2, {
                filter: x => x.resourceType == RESOURCE_ENERGY
            });

            if (resources.length > 0)
                creep.pickup(resources[0]);

            const tombstones = creep.pos.findInRange(FIND_TOMBSTONES, 2);
            if (tombstones.length > 0)
                creep.withdraw(tombstones[0], RESOURCE_ENERGY);
        }
        else if (creep.memory.task == "storing") {
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
                creep.memory.task = "collecting";
                return;
            }
            const room = Game.rooms[creep.memory.targetRoomName];
            let targets = room.find(FIND_MY_STRUCTURES, {
                filter: x => (
                    x instanceof StructureExtension ||
                    x instanceof StructureSpawn ||
                    x instanceof StructureTower ||
                    x instanceof StructureContainer) &&
                    x.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });

            if (targets.length > 0) {
                targets = _.sortBy(targets, x => creep.pos.getRangeTo(x))
                if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    creep.travelTo(targets[0]);
            }
            else {
                const poorBuilders = creep.room.find(FIND_MY_CREEPS, {
                    filter: x => x.memory.role == CreepRole.Builder && x.memory.task == "collecting"
                });

                if (poorBuilders.length > 0) {
                    const target = _.sortBy(poorBuilders, x => creep.pos.getRangeTo(x))[0];
                    if (creep.pos.getRangeTo(target) > 1)
                        creep.travelTo(target);
                    else creep.drop(RESOURCE_ENERGY);
                }

                if (creep.upgradeController(room.controller!) == ERR_NOT_IN_RANGE)
                    creep.travelTo(room.controller!);
            }
        }
    },
}
