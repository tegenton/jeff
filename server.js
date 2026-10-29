const { createServer } = require('node:http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const hostname = 'localhost';
const port = 8080;
const pub = path.resolve(__dirname, 'public');
const mimes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
};

function hash(str) {
    // TODO
    return Math.random();
}

let host, tv;
let players = {};

function player_listener(event) {
    let msg;
    try {
	msg = JSON.parse(event.data);
    } catch (error) {
	console.error(`Could not parse json from ${event.data}`);
	return;
    }
    switch (msg["type"]) {
	case "name":
	    if (tv)
		tv.send(JSON.stringify(msg));
	    break;
	default:
	    console.error(`Unknown message type ${msg["type"]}`);
	    return;
    }
    if (host)
	host.send(JSON.stringify(msg));
}

function host_listener(event) {
}

function serve(res, resolved) {
    fs.stat(resolved, (err, stat) => {
	if (err || !stat.isFile()) {
	    if (stat && stat.isDirectory()) {
		serve(res, resolved + '/index.html');
	    } else {
		res.writeHead(404);
		res.end('File not found');
	    }
	} else {
	    const ext = path.extname(resolved).toLowerCase();
	    const mime = mimes[ext] || 'application/octet-stream';

	    res.setHeader("Content-Type", mime);
	    res.writeHead(200);

	    const stream = fs.createReadStream(resolved);
	    stream.pipe(res);

	    stream.on('error', () => {
		res.writeHead(500);
		res.end('Server error');
	    });
	}
    });

}

function listener(req, res) {
    let requested = req.url === '/' ? '/index.html' : req.url;
    requested = requested.split('?')[0];
    const resolved = path.resolve(pub, '.' + requested);
    if (!resolved.startsWith(pub)) {
	res.writeHead(403);
	res.end('Forbidden');
	return;
    }

    serve(res, resolved);
}

const server = createServer(listener);
server.listen(port, () => {
    console.log(`listening on http://${hostname}:${port}/`);
});
const wserver = new WebSocketServer({server: server});
wserver.on('close', () => {console.log("closed");});
wserver.on('connection', (ws, req) => {
    switch (req.url) {
	case '/host':
	    if (host) {
		ws.close();
		return;
	    }

	    host = ws;
	    host.addEventListener('message', host_listener);
	    if (players && Object.keys(players).length > 0) {
		for (const player of Object.keys(players)) {
		    host.send(JSON.stringify({"type": "player", "hash": player}));
		    players[player].send(JSON.stringify({"type": "name"}));
		}
		if (tv) {
		    host.send(JSON.stringify({"type": "tv"}));
		    tv.send(JSON.stringify({"type": "host"}));
		}
	    }
	    return;
	case '/tv':
	    if (tv) {
		ws.close();
		return;
	    }

	    tv = ws;
	    tv.addEventListener('close', () => {tv = null;});
	    for (const player of Object.keys(players)) {
		console.log(player);
		players[player].send(JSON.stringify({"type": "name"}));
	    }
	    if (host) {
		host.send(JSON.stringify({"type": "tv"}));
		tv.send(JSON.stringify({"type": "host"}));
	    }
	    //tv.send(JSON.stringify({"type": "categories", "categories": ["a", "b", "c", "d", "e"], "double": true}));
	    return;
	case '/player':
	    let player_hash = hash(ws);
	    players[player_hash] = ws;
	    ws.addEventListener('message', player_listener);
	    ws.send(JSON.stringify({"type": "hash", "hash": player_hash}));
	    return;
	default:
	    console.err(`requested: ${req.url}`);
	    ws.send('Unknown request');
	    return;
    }
});
wserver.on('error', () => {console.log("errord");});
wserver.on('listening', () => {console.log("ws listening");});

