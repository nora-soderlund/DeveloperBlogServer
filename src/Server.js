import http from "http";
import { URL } from "url";
import fs from "fs";

import config from "./../config.json" assert { type: "json" };

export default class Server {
    static #routes = [];
    static #server = http.createServer((request, response) => this.#onRequest(request, response));

    static types = {
        ".html": "text/html",
        ".ico": "image/vnd.microsoft.icon",
        ".css": "text/css",
        ".js": "text/javascript",
        ".png": "image/png",
        ".json": "application/json"
    };

    static async #onRequest(request, response) {
        try {
            request.server = {};

            request.server.url = new URL(request.url, `http://${request.headers.host}`);

            let route = this.#routes.find((route) => route.method == request.method && route.path == request.server.url.pathname);

            if(!route) {
                if(request.server.url.pathname.includes('.')) {
                    const index = request.server.url.pathname.lastIndexOf('.');
                    const extension = request.server.url.pathname.substring(index);

                    const mime = this.types[extension] ?? "application/octet-stream";

                    const file = `./build/${request.server.url.pathname}`;

                    if(!fs.existsSync(file)) {
                        response.writeHead(400, "File Not Found", config.cors);

                        return response.end();
                    }

                    response.writeHead(200, "OK", { ...config.cors, "Content-Type": mime });

                    return response.end(fs.readFileSync(file, "utf-8"));
                }

                response.writeHead(200, "OK", { ...config.cors, "Content-Type": "text/html" });

                let matches = null;

                route = this.#routes.find((route) => {
                    if(route.method != "META")
                        return false;

                    matches = new RegExp(route.path, "g").exec(request.server.url.pathname);

                    if(matches)
                        return true;

                    return false;
                });

                let content = fs.readFileSync("./build/index.html", "utf-8");

                let meta = {
                    url: request.server.url.href,

                    title: "Nora Söderlund's Developer Blog",
                    description: "Articles written based of real life platform uses.",

                    type: "website",
                    type_published_time: new Date().toISOString()
                };
               
                if(route) {
                    const routeMeta = await route.onRequest(request, response, matches);

                    if(routeMeta)
                        meta = { ...meta, ...routeMeta };
                }

                if(meta.title != "Nora Söderlund's Developer Blog")
                    meta.title += " - Nora Söderlund's Developer Blog";

                Object.entries(meta).forEach(([key, value]) => {
                    content = content.replaceAll("${" + key + "}", value);
                });

                return response.end(content);
            }

            response.writeHead(200, "OK", config.cors);

            const result = await route.onRequest(request, response);

            response.write(JSON.stringify(result));

            return response.end();
        }
        catch(error) {
            console.error(error);

            response.writeHead(400, "Internal Server Error", config.cors);
            response.end();
        }
    };

    static register(method, path, onRequest) {
        this.#routes.push({ method, path, onRequest });
    };

    static listen(port) {
        this.#server.listen(port);
    };
};
