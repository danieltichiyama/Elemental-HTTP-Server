"use strict";

const http = require("http");
const fs = require("fs");
const querystring = require("querystring");

const PORT = 8080;

const server = http.createServer((req, res) => {
  console.log(req);

  console.log(req.method);
  console.log(req.url);
  console.log(req.headers);

  let body = "";

  req.on("data", chunk => {
    body += chunk;
  });

  req.on("end", () => {
    if (req.method === "GET") {
      //need fs code to find the file or disqualify it's existence
      res.writeHead(200, {
        "content-type": "text/plain",
        "content-length": 2
      });

      res.write("OK");
      res.end();
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server Running on PORT: ${PORT}`);
});
