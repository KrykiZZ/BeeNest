import { CreepRole, Roles } from "roles";
import { Carrier } from "roles/carrier";
import { Harvester } from "roles/harvester";
import { ErrorMapper } from "utils/ErrorMapper";
import { Traveler } from "utils/Traveler/Traveler";

declare global {
    /*
      Example types, expand on these or remove them and add your own.
      Note: Values, properties defined here do no fully *exist* by this type definiton alone.
            You must also give them an implemention if you would like to use them. (ex. actually setting a `role` property in a Creeps memory)

      Types added in this `global` block are in an ambient, global context. This is needed because `main.ts` is a module file (uses import or export).
      Interfaces matching on name from @types/screeps will be merged. This is how you can extend the 'built-in' interfaces from @types/screeps.
    */
    // Memory extension samples

    interface Memory {
        uuid: number;
        log: any;
    }

    interface RoomMemory {
        avoid?: number
    }

    interface CreepMemory {
        homeRoomName: string,
        targetRoomName: string,
        role: CreepRole;
        task: string,
        _trav?: {},
        _travel?: {}
    }

    interface HarvesterMemory extends CreepMemory {
        sourceId: string
    }

    interface CarrierMemory extends CreepMemory {
        harvesterId: string,
        sourceId: string
    }

    interface BuilderMemory extends CreepMemory {
        targetId?: string,
    }

    // Syntax for adding proprties to `global` (ex "global.log")
    namespace NodeJS {
        interface Global {
            log: any;
        }
    }
}

function getNearestSpawn(targetRoom: Room) : StructureSpawn {
    let rooms = Object.values(Game.rooms).filter(x => x.find(FIND_MY_SPAWNS).length != 0);
    rooms = _.sortBy(rooms, x => Game.map.getRoomLinearDistance(x.name, targetRoom.name))

    return rooms[0].find(FIND_MY_SPAWNS)[0]
}

Creep.prototype.travelTo = function(destination: RoomPosition|{pos: RoomPosition}, options?: TravelToOptions) {
    return Traveler.travelTo(this, destination, options);
};

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
    console.log(`Current game tick is ${Game.time}`);

    if (Object.keys(Game.creeps).indexOf("test-builder") == -1) {
        Game.spawns["Spawn1"].spawnCreep(Harvester.body, `test-builder`, {
            memory: <BuilderMemory> ({
                role: CreepRole.Builder,
                task: "idle",
                homeRoomName: Game.spawns["Spawn1"].room.name,
                targetRoomName: Game.spawns["Spawn1"].room.name
            })
        });
    }

    // Automatically delete memory of missing creeps
    for (const name in Memory.creeps) {
        if (!(name in Game.creeps)) {
            delete Memory.creeps[name];
        }
    }

    for(const roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        const sources = room.find(FIND_SOURCES_ACTIVE);

        for(const sourceIdx in sources) {
            const source = sources[sourceIdx];

            // Harvester
            let harvester = Object.values(Game.creeps).find(x => x.memory.role == CreepRole.Harvester && (x.memory as HarvesterMemory).sourceId == source.id);
            if (!harvester) {
                const spawn = getNearestSpawn(room);
                if (spawn.spawning)
                    continue;

                const result = spawn.spawnCreep(Harvester.body, `H4S${source.id}`, {
                    memory: <HarvesterMemory> ({
                        role: CreepRole.Harvester,
                        task: "idle",
                        sourceId: source.id,
                        homeRoomName: spawn.room.name,
                        targetRoomName: source.room.name
                    })
                });

                console.log(`Spawning HARVESTER for SOURCE ${source.id}: ${result == OK ? "SUCCESS" : `FAILED [${result}]`}.`);
                if (result == OK)
                    harvester = Object.values(Game.creeps).find(x => x.memory.role == CreepRole.Harvester && (x.memory as HarvesterMemory).sourceId == source.id);
            }

            if (!harvester)
                continue;

            // Carrier
            const carrier = Object.values(Game.creeps).find(x => x.memory.role == CreepRole.Carrier && (x.memory as CarrierMemory).sourceId == source.id);
            if (!carrier) {
                const spawn = getNearestSpawn(room);
                if (spawn.spawning)
                    continue;

                const result = spawn.spawnCreep(Carrier.body, `C4S${source.id}`, {
                    memory: <CarrierMemory> ({
                        role: CreepRole.Carrier,
                        task: "idle",
                        homeRoomName: spawn.room.name,
                        targetRoomName: harvester?.memory.targetRoomName,
                        sourceId: source.id,
                        harvesterId: harvester.id
                    })
                });

                console.log(`Spawning CARRIER for SOURCE ${source.id}: ${result == OK ? "SUCCESS" : `FAILED [${result}]`}.`);
            }
            else (carrier.memory as CarrierMemory).harvesterId = harvester.id;
        }
    }

    for(const creepName in Game.creeps) {
        const creep = Game.creeps[creepName];
        Roles[creep.memory.role].run(creep);

        creep.say(creep.memory.task);
    }

    // let requiredWorkers: { [type: CreepRole]: number } = { [CreepRole.Harvester]: 5 }
    // let workers: { [type: CreepRole]: Creep[] } = {}

    // for (const name in Game.creeps) {
    //     const creep = Game.creeps[name];
    //     if (workers[creep.memory.role] === undefined)
    //         workers[creep.memory.role] = [creep];
    //     else workers[creep.memory.role].push(creep);
    // }

    // console.log(`Currently available Creeps:`)
    // for (const record in workers) {
    //     console.log(`${record} (${workers[record].length}/${requiredWorkers[record]}):`)
    //     for (const worker in workers[record]) {
    //         console.log(`${workers[record][worker].name}: ${workers[record][worker].memory.task}`);
    //     }
    // }

    // for (const role in requiredWorkers) {
    //     const required = requiredWorkers[role];
    //     const current = workers[role] === undefined ? 0 : workers[role].length;

    //     if (current >= required)
    //         continue;

    //     for (let i = 0; i < required - current; i++) {
    //         if (Game.spawns["Spawn1"].spawning)
    //             continue;

    //         const name = `${role}#${uuid()}`;
    //         const result = Game.spawns["Spawn1"].spawnCreep(Roles[role].body, name, {
    //             memory: Roles[role].createMemory(Game.spawns["Spawn1"].room)
    //         });

    //         if (result != OK)
    //             console.log(`Attempt to spawn ${role} with name ${name} failed: ${result}`);
    //         else console.log(`Attempt to spawn ${role} with name ${name} success.`);
    //     }
    // }

    // for (const name in Game.creeps) {
    //     const creep = Game.creeps[name];
    //     Roles[creep.memory.role].run(creep);
    // }
});
