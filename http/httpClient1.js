const http = require("http");
// let requestStream = http.request(
//     {
//         hostname: "eloquentjavascript.net",
//         path: "/20_node.html",
//         method: "GET",
//         headers: {Accept: "text/html"}
//     }, response => {
//         console.log("Server responded with status code",
//               response.statusCode);
//     }
// );
// requestStream.end();



let requestStream = http.request(
    {
        hostname: "localhost",
        port: 8000,
        path: "/",
        method: "GET",
        headers: {Accept: "text/html"}
    }, response => {
        console.log("Server responded with status code",
              response.statusCode);

            response.on("data", chunk => {
                process.stdout.write(chunk.toString())
        });
    }
);
requestStream.end();
