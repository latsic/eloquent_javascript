
let grepArgs = process.argv.slice(2);
console.log("grepArgs: ", grepArgs);

const {stat} = require("mz/fs");
const {readFile} = require("mz/fs");
const fs = require("fs");
const {sep} = require("path");

function getFilesInDir(dir){

    let files = [];
    if(!fs.statSync(dir).isDirectory()){
        console.log("not a directory");
        return files;
    }
    fs.readdirSync(dir).forEach(file => {

        let subFile = dir + sep + file;

        if(fs.statSync(subFile).isDirectory()){

            let filesInDir = getFilesInDir(subFile);
            files = files.concat(filesInDir);
        }
        else{
            console.log(subFile);
            files.push(subFile);
        }
    });
    return files;
}

async function checkInputFiles(files){

    console.log("functionCall: ", "checkInputFiles");

    let validFiles = [];

    return new Promise((resolve, reject) => {

        let counter = 0;
        for(let file of files){
            stat(file)
                .then((stats) => {

                    if(stats.isDirectory()){
                        console.log(`the file ${file} is a directory`);
                        let subFiles = getFilesInDir(file);
                        validFiles = validFiles.concat(subFiles);
                        console.log("validFilesInDir", file, validFiles);
                    }
                    else{
                        validFiles.push(file);
                    }
                    if(++counter == files.length) resolve(validFiles);
                })
                .catch(error => {
                    if (error.code != "ENOENT") reject(error);
                    console.log(`The file ${file} does not exist`);
                    if(++counter == files.length) resolve(validFiles);
                }
            );
        }
    });
}

async function getFiles(grepArgs){

    console.log("functionCall: ", "checkInput");

    if(grepArgs.length <= 1){
        console.log("Insufficient arguments");
    }
    let files = grepArgs.slice(1);
    return await checkInputFiles(files);
}

function fileIsMatch(regEx, file){

    return new Promise((resolve, reject) => {

        readFile(file, "utf8")
            .then(text => {
                resolve(new RegExp(regEx).test(text));
            })
            .catch(error => {
                reject(error);
            });
    });
}

getFiles(grepArgs).then(files => {
    for(let file of files){
        console.log("valid file: ", file);
        
        fileIsMatch(grepArgs[0], file)
            .then(isMatch => {
                if(isMatch){
                    console.log(`The file ${file} matches '${grepArgs[0]}'`);
                }
            })
    }
}).catch(error => {
    console.log("error: ", error);
});

