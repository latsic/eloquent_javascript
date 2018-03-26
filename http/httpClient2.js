 const http = require("http");
try{

    let requestStream = httprequest(
        {
            hostname: "localhost",
            port: 8000,
            method: "POST",
            myValue: "SomeTestValue",
            headers: {Accept: "text/html"}
        },
        response => {
            console.log("aha");
            response.on("data", chunk => {
                process.stdout.write(chunk.toString())
            });
        }
    );
    requestStream.write("Hello Server");
    requestStream.end(" ending this\n");
}
catch(e){
    console.log("Request Error: ", e);
}