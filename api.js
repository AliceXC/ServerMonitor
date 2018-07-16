const http = require('http');

const api = module.exports = {};
api.stop = stop;
api.monitor = monitor;
api.getLastStatus = getLastStatus;
api.getLastUp = getLastUp;
api.getLastDown = getLastDown;

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var request = new XMLHttpRequest();
var lastResult = "Waiting for server's response";
var interval;
// TODO store all time periods in string array
var lastUp = "--";
var lastDown = "--";

function monitor(url, pInterval){
    request.responseType = "text";
    interval = setInterval(()=> {
        request.open('GET', url);
        request.onreadystatechange = function () {
            if (this.readyState === 4) {
                // once receive the new status, update lastResult
                lastResult = JSON.stringify(JSON.parse(this.responseText)["status"]);
                let flag = lastResult.includes("READY");
                if(flag){
                    lastUp = getCurrentTime();
                }else{
                    lastDown = getCurrentTime();
                }
        }};
        request.send();
    }, pInterval);
}

function getLastStatus(){
    return JSON.stringify(lastResult); 
}

function getLastUp(){
    return JSON.stringify(lastUp);
}

function getLastDown(){
    return JSON.stringify(lastDown);
}

function stop (){
    clearInterval(interval);
    console.log("monitoring process has been stopped");
}

function getCurrentTime(){
    let str = "";
    let date = new Date();
    str = str.concat(setFormat(date.getHours()),":",setFormat(date.getMinutes()),":",setFormat(date.getSeconds()));
    return str;
}

function setFormat(n){
    if(n<10){
        return "0"+n;
    }else{
        return ""+n;
    }
}