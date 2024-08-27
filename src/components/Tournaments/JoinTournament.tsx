import React from "react";
import { useParams } from "react-router-dom";

export default function JoinTournament() {
    const { id = "" } = useParams();
    // tournament - participant - history api call to get all the players //need to change
    // tournament-participant to add perticipentts to the tournament
    return <div>NextTournament {id}</div>;
}
