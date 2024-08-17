import { Builder } from "./builder"
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
    Builder = 2,
}

export const Roles: {
    [ key in CreepRole ]: IRole
} = {
    [CreepRole.Harvester]: Harvester,
    [CreepRole.Carrier]: Carrier,
    [CreepRole.Builder]: Builder,
}
