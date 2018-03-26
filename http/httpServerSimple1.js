const {createServer} = require("http");
let server = createServer((request, response) => {
    console.log("requestMethod: ", request.method);
    console.log("requestPORT: ", request.port);
    console.log("requestHostName: ", request.hostname);
    console.log("requestUrl: ", request.url);
    console.log("got request");
    //console.log(request);
    console.log(request.headers);
    console.log("💥");
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(`
        <h1>Hello!<h1>
        <p>You asked for <code>${request.url}</code></p>
        <h2>kjkj<h2>
    `)
    response.end();
});
server.listen(8000);