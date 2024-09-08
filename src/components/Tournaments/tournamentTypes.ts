// types.ts or types.d.ts

// Player Type
export interface Player {
    id?: number;
    playerId: number;
    playerName: string;
    playingPosition?: string;
    teamId?: number;
}

// Team Type
export interface Team {
    teamId: number;
    teamName: string;
    players: Player[];
}

// DropResult Type (from react-beautiful-dnd)
export interface DropResult {
    draggableId: string;
    type: string;
    source: DraggableLocation;
    reason: "DROP" | "CANCEL";
    destination?: DraggableLocation;
    combine?: {
        draggableId: string;
        droppableId: string;
    };
    mode: "FLUID" | "SNAP";
}

export interface DraggableLocation {
    droppableId: string;
    index: number;
}
