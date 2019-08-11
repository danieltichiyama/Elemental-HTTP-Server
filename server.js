"use strict";

const http = require("http");
const fs = require("fs");
const querystring = require("querystring");
const serverName = "super-duper-awesome-server/nawt";

const PORT = 8080;

const server = http.createServer((req, res) => {
  let body = "";

  req.on("data", chunk => {
    body += chunk;
  });

  req.on("end", () => {
    if (req.method === "HEAD" || req.method === "GET") {
      getHandler(req, res);
    }

    if (req.method === "POST") {
      postHandler(res, body);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server Running on PORT: ${PORT}`);
});

function getHandler(req, res) {
  fs.readdir("./public", (err, files) => {
    if (err) {
      throwError(res, 500, "Server Error: Cannot find directory", err);
    } else {
      if (req.url === "/") {
        req.url = "/index.html";
      }
      fs.readFile(`./public${req.url}`, (err, data) => {
        let date = new Date();
        if (err) {
          fs.readFile("./public/404.html", (err, data) => {
            throwError(res, 404, "Error: Requested file not found", data);
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
}

function postHandler(res, body) {
  let parsed = querystring.parse(body);
  let path = `./public/${parsed.elementName.toLowerCase()}.html`;
  let postedData = `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>The Elements - ${capitalizer(parsed.elementName)}</title>
      <link rel="stylesheet" href="/css/styles.css" />
    </head>
    <body>
      <h1>${capitalizer(parsed.elementName)}</h1>
      <h2>${parsed.elementSymbol}</h2>
      <h3>Atomic number ${parsed.elementAtomicNumber}</h3>
      <p>
        ${parsed.elementDescription}
      </p>
      <p><a href="/">back</a></p>
    </body>
  </html>`;

  fs.access(path, fs.F_OK, err => {
    if (err) {
      fs.appendFile(path, postedData, err => {
        if (err) {
          return throwError(
            res,
            500,
            "Server Error: Server could not create file",
            err
          );
        } else {
          let date = new Date();
          let contentBody = `{"success":true}`;

          res.writeHead(200, "OK", {
            "Content-type": "application/json",
            Date: date.toUTCString(),
            "Content-length": contentBody.length,
            Server: serverName
          });
          res.write(contentBody);

          fs.readFile("./public/index.html", (err, data) => {
            if (err) {
              throwError(res, 400, "Error: /index.html not found", err);
            } else {
              let endOfOL = data.toString().split("</ol>");

              endOfOL[0] = endOfOL[0].concat(`<li>
              <a href="/${parsed.elementName.toLowerCase()}.html">${capitalizer(
                parsed.elementName
              )}</a>
            </li>`);

              let newBody = endOfOL.join("</ol>");

              fs.writeFile("./public/index.html", newBody, err => {
                if (err) {
                  throwError(
                    500,
                    "Server Error: Could not change index.html file",
                    err
                  );
                }
              });
            }
          });

          res.end();
        }
      });
    } else {
      throwError(res, 400, "Error: File already exists");
    }
  });
}

let throwError = function(res, code, msg, err = null) {
  let date = new Date();
  res.writeHead(code, msg, {
    "Content-type": "text/plain",
    Date: date.toUTCString(),
    "Content-length": 0,
    Server: serverName
  });

  if (err) {
    res.setHeader("Content-length", err.toString().length);
    res.write(err);
  }
  res.end();
};

let capitalizer = function(string) {
  let firstLetter = string[0];
  string = string.slice(1);
  firstLetter = firstLetter.toUpperCase();
  string = firstLetter.concat(string);
  return string;
};
