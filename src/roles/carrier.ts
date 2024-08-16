import { CreepRole, IRole } from "roles";

export const Carrier : IRole = {
    type: CreepRole.Carrier,
    body: [MOVE, MOVE, MOVE, CARRY, CARRY, CARRY],

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
                creep.moveTo(harvesters[0]);

            const resources = room.find(FIND_DROPPED_RESOURCES, {
                filter: x => x.resourceType == RESOURCE_ENERGY
            });

            if (resources.length > 0)
                creep.pickup(resources[0]);
        }
    },
}
