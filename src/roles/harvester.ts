import { CreepRole, IRole } from "roles";

export const Harvester : IRole = {
    type: CreepRole.Harvester,
    body: [MOVE, WORK, WORK, CARRY],

    run: function (creep: Creep): void {
        const memory = creep.memory as HarvesterMemory;
        if (creep.memory.task == "idle") {
            const carriers = creep.pos.findInRange(FIND_MY_CREEPS, 2, {
                filter: x => x.memory.role == CreepRole.Carrier && x.memory.task == "collecting" && (x.memory as CarrierMemory).harvesterId == creep.id
            });

            if (carriers.length > 0) {
                const carrier = carriers[0];
                const amount = carrier.store.getFreeCapacity(RESOURCE_ENERGY)
                creep.drop(RESOURCE_ENERGY, Math.min(creep.store.energy, amount))
            }

            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
                creep.memory.task = "harvesting";
        }
        else if (creep.memory.task == "harvesting") {
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                creep.memory.task = "idle";
                return;
            }

            const room = Game.rooms[creep.memory.targetRoomName];
            const source = room.find(FIND_SOURCES, {
                filter: x => x.id == memory.sourceId
            })[0];

            if (creep.harvest(source) == ERR_NOT_IN_RANGE)
                creep.travelTo(source);
        }
    },
}
