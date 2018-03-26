const {createServer} = require("http");
const {parse} = require("url");
const {resolve} = require("path");
const {sep} = require("path");
const {createReadStream, mkdirSync, createWriteStream,
       statSync, readFileSync, writeFileSync} = require("fs");
const {stat, readdir, unlink} = require("mz/fs");
const mime = require("mime");

let baseDirectory = process.cwd();
let baseDirectoryGet = baseDirectory;
const methods = Object.create(null);

if(process.argv.length >= 3){
    if(/.*\.\..*/.test(process.argv[2])){
        console.log("relative root directory may not contain parent path elements.")
    }
    else{
        baseDirectory += sep + process.argv[2];
    }
}

function copyFile(src, dest) {

    return new Promise((resolve, reject) => {

        let readStream = createReadStream(src);
    
        readStream.once("error", (err) => {
            console.log(err);
            reject(error);
        });
    
        readStream.once("end", () => {
            console.log('done copying');
            resolve();
        });
    
        readStream.pipe(createWriteStream(dest));
    });
}

function handleResponseInfo({body, status = 200, type = "text/plain"}, response){
    console.log("function call: ", "handleResponseInfo");
    //console.log("body: ", body);
    console.log("status: ", status);
    console.log("type: ", type);

    response.writeHead(status, {"Content-Type": type});
    if (body && body.pipe) body.pipe(response);
    else response.end(body);    
}

function logRequestInfo(request){
    console.log("function call: ", "logRequestInfo");
    console.log("requestUrl: ", request.url);
}

createServer((request, response) => {
    logRequestInfo(request);
    let handler = methods[request.method] || notAllowed;
    handler(request)
        .catch(error => {
            console.log("catch handler called");
            if(error.status != null) return error;
            return {body: String(error), status: 500};
        })
        .then(responseInfo => {handleResponseInfo(responseInfo, response)});
}).listen(8000);

async function notAllowed(request) {
    console.log("notAllowed called")
    return {
        status: 405,
        body: `Method ${request.method} not allowed.`
    };
}

function urlPath(url, baseDirectory){
    console.log("function call: ", "urlPath");
    console.log("baseDirectory: ", baseDirectory);
    let {pathname} = parse(url);
    let path = resolve(
        baseDirectory,
        decodeURIComponent(pathname).slice(1));

    console.log("path: ", path);

    if(path != baseDirectory && 
        !path.startsWith(baseDirectory + sep)){
        console.log("forbidden request");
        throw {status: 403, body: "Forbidden"};
    }
    return path;
}

methods.GET = async function(request){
    console.log("function call: ", "GET");
    let path = urlPath(request.url, baseDirectoryGet);
    let stats;
    try {
        stats = await stat(path);
    }
    catch(error){
        if (error.code != "ENOENT") throw error;
        else return {status: 404, body: "File not found"};
    }
    if(stats.isDirectory()){
        return {body: (await readdir(path)).join("\n")};
    }
    else{
        return {body: createReadStream(path),
                type: mime.getType(path)};
    }
}

methods.DELETE = async function(request){
    console.log("function call: ", "DELETE");
    let path = urlPath(request.url, baseDirectory);
    let stats;
    try{
        stats = await stat(path);
    }
    catch(error){
        if (error.code != "ENOENT") throw error;
        else return {status: 204};
    }
    if (stats.isDirectory()){
        return {status: 403, body: `Forbidden to delete ${path}`};
        //await rmdir(path)
    }
    else{
        await unlink(path);
    }
    return {status: 204};
}

function replaceStrInFile(filePath, from, to) {

    let fileContent = readFileSync(filePath, "utf8");
    fileContent = fileContent.replace(from, to);
    writeFileSync(filePath, fileContent);
   
}

methods.POST = async function(request){
    
    let path = urlPath(request.url, baseDirectory);

    let requestData = "";
    request.on("data", chunk => {
        requestData += chunk.toString();
    });
    let promises = [];
    let p1, p2, p3;

    let pageName = "";

    let p = new Promise((resolve, reject) => {

        request.on("end", () => {

            console.log("Post request data: ", requestData);

            if(/^restore$/.test(requestData)){
                p1 = copyFile(
                    "./template_page" + sep + "start.html",
                    "./user_pages" + sep + "start.html");
                p2 = copyFile(
                    "./template_page" + sep + "start.css",
                    "./user_pages" + sep + "start.css");
                p3 = copyFile(
                    "./template_page" + sep + "start.js",
                    "./user_pages" + sep + "start.js");
                

                promises.push(p1, p2, p3);
                resolve(promises);
            }
            else if(/^create=(.+)$/.test(requestData)){
                pageName = /^create=(.+)$/.exec(requestData)[1];

                let stats;
                let noStatsError = true;
                try {
                    stats = statSync(path);
                }
                catch(error){
                    noStatsError = false;
                    if (error.code == "ENOENT"){
                        p1 = copyFile(
                            "./template_page" + sep + "start.html",
                            "./user_pages" + sep + pageName + ".html");
                        p2 = copyFile(
                            "./template_page" + sep + "start.css",
                            "./user_pages" + sep + pageName + ".css");
                        p3 = copyFile(
                            "./template_page" + sep + "start.js",
                            "./user_pages" + sep + pageName + ".js");
        
                        promises.push(p1, p2, p3);
                        resolve(promises);
                    }
                    else{
                        throw error;
                    }                   
                }
                if(noStatsError)
                {
                    return {status: 409, body: `conflict, the page ${pageName} already exists`};
                }
            }
            else{
                return {status: 400, body: `bad request ${requestData}`}
            }
        });
    });
    await p;
    await Promise.all(promises);

    if(pageName){
        try
        {
            replaceStrInFile(
                "./user_pages" + sep + pageName + ".html", 
                "start.css",
                pageName + ".css");
            replaceStrInFile(
                "./user_pages" + sep + pageName + ".html", 
                "start.js",
                pageName + ".js");
        }
        catch(error){
            return {status: 500, body: error.toString()};
        }
    }

    console.log("Post path:", path);
    return {body: createReadStream(path),
            type: mime.getType(path)};
}

methods.MKCOL = async function(request){
    console.log("function call: ", "MKCOL");
    let path = urlPath(request.url, baseDirectory);
    let stats;
    let exists = true;
    try{
        stats = await stat(path);
    }
    catch(error){
        if (error.code != "ENOENT") throw error;
        exists = false;
    }
    if(exists){

        if(stats.isDirectory()){
            return {status: 204};
        }
        else{
            return {
                status: 409,
                body: `Resource ${request.url} exists but is a file`
            };
        }
    }
    else{
        
        mkdirSync(path);
        return {status: 204};
    }
}

function pipeStream(from, to){
    return new Promise((resolve, reject) => {
        from.on("error", reject);
        to.on("error", reject);
        to.on("finish", resolve);
        from.pipe(to);
    });
}

methods.PUT = async function(request){
    console.log("function call: ", "PUT");
    let path = urlPath(request.url, baseDirectory);
    await pipeStream(request, createWriteStream(path));
    return {status: 204};
}