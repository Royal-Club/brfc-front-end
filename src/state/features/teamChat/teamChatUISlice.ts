import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../store";

interface TeamChatUIState {
    /** Whether the dock panel is expanded rather than collapsed to its launcher. */
    dockOpen: boolean;
    /**
     * The room the dock is showing, when the player is in more than one.
     *
     * <p>Null means "whichever is newest", which is what the dock falls back to - pinning a team id
     * that has since been purged would leave the dock pointing at nothing.
     */
    activeTeamId: number | null;
}

const initialState: TeamChatUIState = {
    dockOpen: false,
    activeTeamId: null,
};

/**
 * Dock state, in the store rather than in the component.
 *
 * <p>The full-page view and the dock are two views of one conversation, and the player moves
 * between them: expanding navigates away from the dock, and minimising has to bring it back open.
 * Component state cannot survive that, because the page that would set it is not the component that
 * would read it. It is deliberately not persisted - which room you had open is a fact about this
 * visit, not a preference, and restoring a panel over the dashboard on next login would be a
 * surprise rather than a convenience.
 */
const teamChatUISlice = createSlice({
    name: "teamChatUI",
    initialState,
    reducers: {
        setDockOpen: (state, action: PayloadAction<boolean>) => {
            state.dockOpen = action.payload;
        },
        setDockRoom: (state, action: PayloadAction<number | null>) => {
            state.activeTeamId = action.payload;
        },
    },
});

export const { setDockOpen, setDockRoom } = teamChatUISlice.actions;

export const selectDockOpen = (state: RootState) => state.teamChatUI.dockOpen;
export const selectDockTeamId = (state: RootState) => state.teamChatUI.activeTeamId;

export default teamChatUISlice.reducer;
