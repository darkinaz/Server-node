import * as fs from "fs/promises";
import * as path from "path";
import { Server } from "net";


const PORT = 3000;
const WEB = "web";

const server = new Server(socket => {
    socket.setEncoding("utf-8");
    let allData = "";
    socket.on("data", async data => {
        allData += data;
        const lines = allData.split("\r\n");
        if (lines.findIndex(l => l === "") >= 0) {
            // console.log(allData);
            let fileName = lines[0].split(" ")[1];
            console.log(fileName);
            let response;
            if (fileName === "/end") {
                response = createResponse(
                    200,
                    "OK",
                    {
                        "Content-Type": "text/html"
                    },
                    `<html><body><h1>Server is going down. Bye bye.</h1></body></html>\r\n`
                );
                socket.write(response, () => {
                    socket.end(undefined, undefined, () => {
                        server.close();
                    });
                });
                return;
            }
            try {
                const fullFileName = path.join(WEB, fileName);
                const fileStats = await fs.stat(fullFileName);
                if (fileStats.isDirectory()) {
                    let html = "<html>";
                    html += "<body>";
                    const dirFiles = await fs.readdir(fullFileName);
                    let hrefFile = fileName;
                    if (!hrefFile.endsWith("/")) {
                        hrefFile += "/";
                    }
                    if (fileName !== "/") {
                        html += `<a href="${hrefFile + ".."}">.. - up dir</a><br>\r\n`;
                    }
                    for (const dirFile of dirFiles) {
                        html += `<a href="${hrefFile + dirFile}">${dirFile}</a><br>\r\n`;
                    }
                    html += "</body>";
                    html += "</html>";
                    response = createResponse(
                        200,
                        "OK",
                        {
                            "Content-Type": "text/html"
                        },
                        html
                    );
                } else {
                    const fileContent = await fs.readFile(fullFileName, {
                        encoding: "utf-8"
                    });
                    response = createResponse(200, "OK", null, fileContent);
                }
            } catch (err) {
                if (err instanceof TypeError) {
                    throw err;
                }
                response = createResponse(
                    404,
                    "Not Found",
                    {
                        "Content-Type": "text/html"
                    },
                    `<html><body><h1>${fileName} not found</h1></body></html>\r\n`
                );
            }
            console.log(response);
            socket.write(response, () => {
                socket.end();
            });
        }
    });
});

function createResponse(status, msg, headers, content) {
    // if (arguments.length < 4) {
    //     content = headers;
    //     headers = undefined;
    // }
    if (typeof status !== "number") {
        throw new TypeError("status must be number");
    }
    if (typeof msg !== "string") {
        throw new TypeError("msg must be string");
    }
    if (headers && typeof headers !== "object") {
        throw new TypeError("headers must be object");
    }
    if (content && typeof content !== "string") {
        throw new TypeError("content must be string");
    }
    let res = `HTTP/1.1 ${status} ${msg}\r\n`;
    if (headers) {
        for (const header in headers) {
            res += `${header}: ${headers[header]}\r\n`;
        }
    }
    res += "\r\n";
    if (content) {
        res += content;
    }
    res += "\r\n";
    return res;
}

server.listen(PORT);
console.log(`Server started on port: ${PORT}`);
