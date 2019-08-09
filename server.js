"use strict";

const http = require("http");
const fs = require("fs");
const querystring = require("querystring");
const serverName = "super-duper-awesome-server/nawt";

const PORT = 8080;

const server = http.createServer((req, res) => {
  // console.log(req);

  console.log("method", req.method);
  console.log(req.url);
  console.log(req.headers);

  let body = "";

  req.on("data", chunk => {
    body += chunk;
  });

  req.on("end", () => {
    if (req.method === "HEAD" || req.method === "GET") {
      fs.readdir("./public", (err, files) => {
        let date = new Date();
        if (err) {
          res.writeHead(500, "Server Error: Cannot find directory", {
            "Content-type": "text/plain",
            Date: date.toUTCString(),
            "Content-length": err.toString().length,
            Server: serverName
          });
          res.write(err.toString());
          res.end();
        } else {
          if (req.url === "/") {
            req.url = "/index.html";
          }
          fs.readFile(`./public${req.url}`, (err, data) => {
            let date = new Date();
            if (err) {
              fs.readFile("./public/404.html", (err, data) => {
                res.writeHead(404, "ERROR: Requested file not found", {
                  "Content-type": "text/plain",
                  Date: date.toUTCString(),
                  Server: serverName
                });

                res.write(data);
                res.end();
              });
            } else {
              let contentType = "text/html";
              if (req.url.endsWith(".css")) {
                contentType = "text/css";
              }
              res.writeHead(200, "OK", {
                "Content-type": contentType,
                Date: date.toUTCString(),
                "Content-length": data.toString().length,
                Server: serverName
              });

              res.write(data);
              res.end();
            }
          });
        }
      });
    } // get requests for files, all cases;
  }); // runs when req finishes loading;
});

server.listen(PORT, () => {
  console.log(`Server Running on PORT: ${PORT}`);
});
