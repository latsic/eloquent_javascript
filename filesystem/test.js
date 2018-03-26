let {readFile} = require("fs");
let filePath = "test.txt"
readFile(filePath, "utf8", (error, text) => {
    if(error) throw error;
    console.log(`The File ${filePath} contains: ${text}`);
});

let {writeFile} = require("fs");
writeFile("graffiti.txt", "NodeWasHere", err => {
    if (err) console.log(`Failed to write file: ${err}`);
    else console.log("File written.");
})

const mzfs = require("mz/fs");
mzfs.readFile("test.txt", "utf8")
  .then(text => console.log("The file (mz) contains:", text))
  .catch(error => console.log("mz error: ", error));