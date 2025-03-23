import http from "http";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5000;

export function startServer() {
    const server = http.createServer();

    server.listen(PORT, () => {
        console.log("server is running");
    });
}