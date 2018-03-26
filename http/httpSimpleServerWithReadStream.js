const {createServer} = require("http");
createServer((request, response) => {
    console.log("got request");
    let headers = request.headers;
    console.log(headers);

    response.writeHead(200, {"Content-Type": "text/plain"});

    

    //response.write(`
    //    <h1>Hello!<h1>
    //    <p>You asked for <code>${request.url}</code></p>
    //`);
    request.on(
        "data",
        chunk => {
            console.log("got chunk", chunk.toString());
            response.write(chunk.toString().toUpperCase())
        }
    );
    request.on("end", () => response.end());
}).listen(8000);