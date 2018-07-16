const http = require('http');
const url = require("url");
const fs = require('fs');
var api = require('./api');
var state = false; // true: monitoring; false: not monitoring
var interval; // time interval
var serverUrl;

http.createServer((request, response) => {
    response.setHeader('Access-Control-Allow-Origin', '*');
	response.setHeader("Access-Control-Allow-Headers", "Content-Type");

    let urlParts = url.parse(request.url);
    let path = urlParts.pathname;

    handlePath(request, response, path);

}).listen(10101);

function handlePath(request, response, path) {
    
    switch(path) {
        case "/favicon.ico":
            serveFile("./testicon.ico", response);
            break;

        case  "/server/state":
            // tells if monitoring
            response.writeHead(200);
            let resp = {"state": state};
            response.write(JSON.stringify(resp));
            response.end();
            break;
        
        case "/server/lastInputs":
            response.writeHead(200);
            let body = {"url": serverUrl, "interval":interval};
            response.write(JSON.stringify(body));
            response.end();
            break;

        case "/server/lastStatus":
            try{
                response.writeHead(200);
                response.write(api.getLastStatus());
                response.end();
            }catch(error){
                console.error(error);
                response.writeHead(400);
                response.end();
            }

            break;

        case  "/server/start":
            // start monitoring
            // start doesnt return any status. it only tells api.monitor to work
            getBody(request).then((body)=>{
                // switch state to true: monitoring
                interval = body.interval;
                serverUrl = body.url;
                state = true;
                api.monitor(body.url, body.interval);
                response.writeHead(200);
                response.end();
            }).catch(error => {
                console.error(error);
            }); 
            break;

        case  "/server/stop":
            // stop monitoring.  
            api.stop();
            state = false;
            response.writeHead(200);
            response.end();
            break;

        case  "/server/overview":
            // send overview
            response.writeHead(200);
            let period ={"lastUp": api.getLastUp(), "lastDown": api.getLastDown()}; 
            response.write(JSON.stringify(period));
            response.end();
            break;

        default:
            response.writeHead(400);
            response.end();
            break;
    }
}

function serveFile(path, response) {
    if(!fs.existsSync(path)) {
        response.writeHead(400);
        response.end();
        return;
    }

    let file = fs.createReadStream(path);
    response.writeHead(200);
    file.pipe(response);
}

function getBody(request) {
	return new Promise((fulfill, fail) => {
		let data = "";
 
		request.on("data", chunk => {
            data += chunk;
		});
		request.on("error", error => {
			fail("failed");
		});
		request.on("end", () => {
			try {
				body = JSON.parse(data);
			} catch(e) {
				body = {};
            }
			fulfill(body);
		});
	});
}
