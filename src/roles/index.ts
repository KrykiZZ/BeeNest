import { Carrier } from "./carrier"
import { Harvester } from "./harvester"

export interface IRole {
    type: CreepRole,
    body: BodyPartConstant[],
    run: (creep: Creep) => void,
}

export const enum CreepRole {
    Harvester = 0,
    Carrier = 1,
}

export const Roles: {
    [ key in CreepRole ]: IRole
} = {
    [CreepRole.Harvester]: Harvester,
    [CreepRole.Carrier]: Carrier,
}
