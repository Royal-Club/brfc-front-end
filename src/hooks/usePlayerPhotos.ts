import { useMemo } from "react";
import { useGetPlayersQuery } from "../state/features/player/playerSlice";
import { toAbsolutePlayerPhotoUrl } from "../utils/playerPhotoUtils";

/**
 * The statistics endpoints return ids and names but no photos, so views that
 * want a face have to join against the player list. This shares that join.
 */
const usePlayerPhotos = (): Record<number, string | undefined> => {
    const { data } = useGetPlayersQuery();

    return useMemo(() => {
        const map: Record<number, string | undefined> = {};
        data?.content?.forEach((player) => {
            const url = toAbsolutePlayerPhotoUrl(player.photoUrl);
            if (url) map[player.id] = url;
        });
        return map;
    }, [data]);
};

export default usePlayerPhotos;
