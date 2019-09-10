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

    if (req.method === "PUT") {
      putHandler(req, res, body);
    }

    if (req.method === "DELETE") {
      deleteHandler(req, res);
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
            if (err) {
              throwError(res, 404, "Error: Requested 404 page not found", err);
            }
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
      <p>${parsed.elementDescription}
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

          generateIndexBody(function(err, data) {
            if (err) {
              throwError(500, "Server Error: Cannot find directory", err);
            }
            fs.writeFile("./public/index.html", data, err => {
              if (err) {
                throwError(
                  500,
                  "Server Error: Could not change index.html file",
                  err
                );
              }
              res.writeHead(200, "OK", {
                "Content-type": "application/json",
                Date: date.toUTCString(),
                "Content-length": contentBody.length,
                Server: serverName
              });
              res.write(contentBody);
              res.end();
            });
          });
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

let generateIndexBody = function(cb) {
  fs.readdir("./public", (err, files) => {
    if (err) {
      return cb(err);
    }
    let filteredList = files.filter(function(element) {
      return ![".keep", "404.html", "index.html", "css"].includes(element);
    });
    let top = `<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <title>The Elements</title>
    <link rel="stylesheet" href="/css/styles.css">
    </head>
    <body>
    <h1>The Elements</h1>
    <h2>These are all the known elements.</h2>
    <h3>These are ${filteredList.length}</h3>
    <ol>`;

    let bottom = `
    </ol>
    </body>
    </html>`;

    for (let i = 0; i < filteredList.length; i++) {
      let name = filteredList[i].split(".");
      let listElements = `<li>
      <a href= "/${filteredList[i]}">${capitalizer(name[0])}</a>
      </li>`;
      top += listElements;
    }
    top += bottom;

    return cb(null, top);
  });
};

function putHandler(req, res, body) {
  let arrOfProperties = [
    "elementName",
    "elementSymbol",
    "elementAtomicNumber",
    "elementDescription"
  ];
  let parsed = querystring.parse(body);

  let parsedCopy = Object.assign({}, parsed);

  for (let i = 0; i < arrOfProperties.length; i++) {
    if (!parsedCopy.hasOwnProperty(arrOfProperties[i])) {
      return throwError(
        res,
        400,
        `Error: Form content missing, please include: ${arrOfProperties[i]}`
      );
    }
  }

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
      <p>${parsed.elementDescription}
      </p>
      <p><a href="/">back</a></p>
    </body>
  </html>`;

  fs.access(path, fs.F_OK, err => {
    if (err) {
      let body = `{"error":"resource ${parsed.elementName.toLowerCase()} does not exist}`;

      res.writeHead(500, "Server Error: File does not exist.", {
        "Content-type": "application/json",
        "Content-length": body.length
      });

      res.write(body);
      res.end();
    } else {
      fs.appendFile(path, postedData, err => {
        if (err) {
          return throwError(
            res,
            500,
            "Server Error: Server could not overwrite file",
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

          res.end();
        }
      }); //fs.access end
    }
  });
}

function deleteHandler(req, res) {
  let path = `./public${req.url}`;

  fs.unlink(path, err => {
    if (err) {
      throwError(res, 500, "Server error: specified path does not exist", err);
    }

    let date = new Date();
    let msg = `{"success":true}`;

    generateIndexBody(function(err, data) {
      if (err) {
        throwError(500, "Server Error: Cannot find directory", err);
      }
      fs.writeFile("./public/index.html", data, err => {
        if (err) {
          throwError(
            500,
            "Server Error: Could not change index.html file",
            err
          );
        }
        res.writeHead(200, "OK", {
          "Content-type": "application/json",
          "Content-length": msg.length,
          Date: date.toUTCString(),
          Server: serverName
        });

        res.write(msg);
        res.end();
      });
    });
  });
}
