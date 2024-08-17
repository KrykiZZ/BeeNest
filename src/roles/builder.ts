import { CreepRole, IRole } from "roles";

export const Builder : IRole = {
    type: CreepRole.Carrier,
    body: [MOVE, WORK, WORK, CARRY],

    run: function (creep: Creep): void {
        const room = Game.rooms[creep.memory.targetRoomName];
        const memory = creep.memory as BuilderMemory;

        if (creep.memory.task === "idle") {
            const targets = room.find(FIND_MY_CONSTRUCTION_SITES);
            if (targets.length != 0) {
                const target = _.sortBy(targets, x => creep.pos.getRangeTo(x))[0];
                memory.targetId = target.id;
                memory.task = "building";
            }
            else {
                const damaged = room.find(FIND_STRUCTURES, {
                    filter: x => x.hits < x.hitsMax - 500
                });

                if (damaged.length == 0)
                    return;

                const target = _.sortBy(damaged, x => creep.pos.getRangeTo(x))[0];
                memory.task = "repairing"
                memory.targetId = target.id;
            }
        }
        else if (memory.task == "building") {
            if (creep.store.energy === 0) {
                memory.task = "collecting";
                return;
            }

            const targets = room.find(FIND_MY_CONSTRUCTION_SITES, {
                filter: x => x.id == memory.targetId
            });

            if (targets.length == 0) {
                delete memory.targetId;
                memory.task = "idle";
                return;
            }

            if (creep.build(targets[0]) == ERR_NOT_IN_RANGE)
                creep.travelTo(targets[0]);
        }
        else if (memory.task == "repairing") {
            if (creep.store.energy === 0) {
                memory.task = "collecting";
                return;
            }

            const targets = room.find(FIND_STRUCTURES, {
                filter: x => x.id == memory.targetId
            });

            if (targets.length == 0) {
                delete memory.targetId;
                memory.task = "idle";
                return;
            }

            if (creep.repair(targets[0]) == ERR_NOT_IN_RANGE)
                creep.travelTo(targets[0]);
        }
        else if (memory.task === "collecting") {
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                memory.task = "building";
                return;
            }

            let storages = room.find(FIND_MY_STRUCTURES, {
                filter: x => x instanceof StructureContainer || x instanceof StructureStorage && x.store.energy > 0
            });

            if (storages.length != 0) {
                storages = _.sortBy(storages, x => creep.pos.getRangeTo(x));
                if (creep.withdraw(storages[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    creep.travelTo(storages[0]);
            }
            else {
                const dropped = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 2);
                if (dropped.length > 0)
                    creep.pickup(dropped[0]);
            }
        }
    },
}
