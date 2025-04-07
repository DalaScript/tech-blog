import { IncomingMessage, ServerResponse } from "http";
import { parseBody } from "../utils/parseBody";
import { registerUser, loginUser } from "../services/auth";
import { handleApiError } from "../utils/error";
import { getUserFromRequest } from "../middleware/auth";

export async function handleAuthRoutes(
    req: IncomingMessage,
    res: ServerResponse,
) {
    res.setHeader("Content-Type", "application/json");

    const parsedUrl = new URL(
        req.url || "",
        `http://${req.headers.host || "localhost"}`
    );
    const path = parsedUrl.pathname;
    if(req.method === "POST" && path === "/register") {
        try {
            const { name, email, password } = await parseBody(req);
            if(!name || !email || !password) {
                res.writeHead(400);
                res.end(
                    JSON.stringify({ 
                        error: "Missing required fields",
                        requiredFields: ["name", "email", "password"],
                    })
                );
                return;
            }
            const user = await registerUser(name, email, password);
            res.writeHead(201);
            res.end(
                JSON.stringify({
                    user: {...user, password: undefined },
                    message: "User registered successfully",
                })
            );
        }catch(err) {
            handleApiError(res, err, 401, "User registration failed");
        }
    }else if(req.method === "POST" && path === "/login") {
        try {
            const { email, password } = await parseBody(req);
            if(!email || !password) {
                res.writeHead(400);
                res.end(
                    JSON.stringify({ 
                        error: "Missing required fields",
                        requiredFields: ["email", "password"],
                    })
                );
                return;
            }
            const { token, user } = await loginUser(email, password);
            res.writeHead(200, {
                "Content-Type": "application/json",
                "set-cookie": `token=${token}; httpOnly; path=/; max-age=${
                    7 * 24 * 60 * 60
                }`,
            });
            res.end(
                JSON.stringify({
                    user: { ...user, password: undefined },
                    message: "Logged in successfully",
                })
            );
        }catch (err) {
            handleApiError(res, err, 401, "Login failed");
        }
    }else if(req.method === "POST" && path === "/logout") {
        res.writeHead(200, {
            "Set-Cookie": "token=; HttpOnly; Path=/; Max-Age=0",
            "Content-Type": "application/json",
        });
        res.end(JSON.stringify({ message: "Logged out successfully" }));
    }else if(req.method === "GET" && path === "/me") {
        try {
            const authorizedUser = await getUserFromRequest(req);

            if(!authorizedUser) {
                handleApiError(res, null, 401, "Unauthorized");
                return true;
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
                JSON.stringify({ user: { ...authorizedUser, password: undefined } })
            );
        }catch(error) {
            handleApiError(res, error, 401, "User not found");
        }
    }else {
        handleApiError(res, null, 404, "Route not found");
    }
}