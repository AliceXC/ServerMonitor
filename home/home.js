// this interval is tied to setinterval (NOT the numerical value of the time interval)
var interval = null;

// check monitor state when enter the page
// if true, keep printing, otherwise do nothing
getMonitorState().then((ifMonitor)=>{
    if(ifMonitor){
        alert("Monitor is still running since your last leave.");
        // change to monitorView
        monitorView();

        // send request to the server to get the previous user set url and interval
        fetch("http://127.0.0.1:10101/server/lastInputs", 
            {"headers": {'Content-Type': 'application/json'},
            "method": "GET"
        })
        .then(resp => resp.json()) 
        .then((response) => {
            // keep checking on the server status
            interval = setInterval(() => {
                getServerStatus(); 
            }, response["interval"]);

            // display the last user inputs
            document.getElementById("interval").value = response["interval"];
            document.getElementById("url").value = response["url"];
        })
        .catch(error => {
            console.error(error);
        }); 
    }
}).catch(error => {
    console.error(error);
}); 

function validateInterval(){
    let pInterval = document.getElementById("interval").value;
    if(pInterval.length == 0){
        alert("Please enter the interval!");
        throw "empty interval";
        return false;
    }
    for(let i of pInterval){
        if(i.charCodeAt(0) < 48 || i.charCodeAt(0) >57){
          alert("Interval formatted incorrectly!");
          throw "interval input error";
          return false;
        }
    }
    return true;
}

function validateUrl(){
    let pUrl = document.getElementById("url").value;
    if(pUrl.length == 0){
        alert("Please enter the url!");
        throw "empty url";
        return false;
    }
    let pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    if (!pattern.test(pUrl)) {
        alert("Url is not valid");
        throw "invalid url";
        return false;
    } 
    return true;
}

function getInterval(){ 
    return document.getElementById("interval").value;
}

// TODO if the given url doesnt direct to server, alert ""
// check whether the url is valid -> server -> api
function getUrl(){
    return document.getElementById("url").value;
}

function start(){
    try{
        // 2018-10-18 TODO: if the client change the url or interval while monitoring, then we need to start a new monitor and stop the old one
        // return if the input is not valid
        if(!validateInterval() || !validateUrl()){
            return;
        }

        // change to monitorView
        monitorView();

        // if not monitoring, start; else, alert
        getMonitorState().then((ifMonitor)=>{
            if(!ifMonitor){
                let body = {
                    "interval": getInterval(),
                    "url": getUrl()
                };
                // start the monitor, and check on the server status by the given interval
                fetch("http://127.0.0.1:10101/server/start", {
                    "headers": {'Content-Type': 'application/json'}, 
                    "method": "POST", 
                    "body": JSON.stringify(body)
                })
                .then(() => {
                    // when the server is just started, it takes 1 second to get the 1st status
                    interval = setInterval(() => {
                        getServerStatus(); 
                    }, body["interval"]);
                    
                }).catch(error =>{ 
                    console.error(error);
                });
            }else{
                console.log("We are already monitoring the server.");
                alert("We are already monitoring the server!");
            }
        });
    }catch(error){
        console.error(error);
    }
    
}

function getServerStatus(){
    fetch("http://127.0.0.1:10101/server/lastStatus", 
        {
            "headers": {
                'Content-Type': 'application/json'
            },
            "method": "GET"
        }
    )
    .then(resp => resp.json())
    .then((response) => {
        // print status to the html page
        document.getElementById("SS-time").innerText = getCurrentTime();
        let text = response.replace(/"/g,'');
        document.getElementById("SS-status").innerText = text;
    })
    .catch(error => {
        console.error(error);
    }); 
}

function stop(){
    // change to stopView
    stopView();

    // if monitoring, stop; else, alert
    getMonitorState().then((ifMonitor)=>{
        console.log("ifMonitor: "+ifMonitor + "; typeof: " +typeof(ifMonitor));
        if(ifMonitor){
            // first stop checking on server status
            clearInterval(interval);
            // then stop monitoring the server
            fetch("http://127.0.0.1:10101/server/stop", {
                "headers": {'Content-Type': 'application/json'},
                "method": "POST" 
            }).catch(error => console.error(error));
            console.log("monitoring process has been stopped!");
        }else{
            console.log("There is nothing to stop.");
            alert("Currently there is no monitor process.");
        }
    }).catch(error => console.error(error));
}

function overview(){
    // change to overView
    overView();
    
    fetch("http://127.0.0.1:10101/server/overview",{
            "headers": {'Content-Type': 'application/json'},
            "method": "GET" 
        }).then(resp => resp.json()) 
        .then((response) => {
            // print status to the html page
            let text = response["lastUp"].replace(/"/g,"");
            document.getElementById("up-time").innerText = text;
            text = response["lastDown"].replace(/"/g,"");
            document.getElementById("down-time").innerText = text;
        })
        .catch(error => {
            console.error(error);
            failed();
        });
}

function getMonitorState(){
    return new Promise((fullfilled, failed) =>{
        fetch("http://127.0.0.1:10101/server/state",{
            "headers": {'Content-Type': 'application/json'},
            "method": "GET" 
        }).then(resp => resp.json()) 
        .then((response) => {
            fullfilled(response["state"]);
        })
        .catch(error => {
            console.error(error);
            failed();
        });
    });
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

function monitorView(){
    document.getElementById("start").style.visibility = "hidden";
    document.getElementById("stop").style.visibility = "visible";
    document.getElementById("overview").style.visibility = "hidden";
    document.getElementById("status-list").style.display = "block";
    document.getElementById("overview-period").style.display = "none";
}

function stopView(){
    document.getElementById("start").style.visibility = "visible";
    document.getElementById("stop").style.visibility = "hidden";
    document.getElementById("overview").style.visibility = "visible";
    document.getElementById("status-list").style.display = "none";
    document.getElementById("overview-period").style.display = "none";
}

function overView(){
    document.getElementById("start").style.visibility = "visible";
    document.getElementById("stop").style.visibility = "hidden";
    document.getElementById("overview").style.visibility = "visible";  
    document.getElementById("overview-period").style.display = "block";
    document.getElementById("status-list").style.display = "none";
}
