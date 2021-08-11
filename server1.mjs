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
            try {
                let fullFileName = path.join(WEB, fileName);
                const fileContent = await fs.readFile(fullFileName);
                response = createResponse(200, "OK", null, fileContent);
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
    })
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
