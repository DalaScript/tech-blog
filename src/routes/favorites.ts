import { IncomingMessage, ServerResponse } from "http";
import { parse } from "path";
import { getUserFromRequest } from "../middleware/auth";
import { handleApiError } from "../utils/error";
import { toggleFavorite, getFavorites } from "../services/favorite";

export async function handleFavoriteRoutes(
    req: IncomingMessage,
    res: ServerResponse
) {
    const parsedUrl = new URL(
        req.url || "",
        `http://${req.headers.host || "localhost"}`
    );
    const path = parsedUrl.pathname;

    const user = await getUserFromRequest(req);
    if(!user) {
        handleApiError(res, "Unauthorized", 401, "Unauthorized");
        return true;
    }

    if(req.method === "GET" && path === "/favorites") {
        try {
            const favorites = await getFavorites(user.id);
            res.writeHead(200, { "content-type": "application/json" });
            res.end(JSON.stringify(favorites));
            return true;
        }catch(err) {
            console.error(err);
            handleApiError(res, `${err}`, 500, "Failed to fetch favorites");
            return true;
        }
    }

    if(req.method === "POST" && path.startsWith("/favorites/")) {
        const postId = parseInt(path.split("/")[2]);
        if(isNaN(postId)) {
            handleApiError(res, "Invalid post ID", 400, "Invalid post ID");
            return true;
        }

        try {
            const result = await toggleFavorite(user.id, postId);
            res.writeHead(200, { "content-type": "application/json" });
            res.end(JSON.stringify(result));
            return true;
        }catch(err) {
            handleApiError(res, `${err}`, 500, "Failed to toggle favorite");
            return true;
        }
    }

    return false;
}