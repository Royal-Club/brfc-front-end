// types.ts or types.d.ts

// Player Type
export interface Player {
    playerId: number;
    playerName: string;
    // Add any other properties related to a player if needed
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
