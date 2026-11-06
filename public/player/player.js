const socket = new WebSocket('player');

let hash, name;
let score = 0;
let wager = false;

function submit() {
    if (wager) {
	//socket.send(JSON.stringify({"type": "final", "hash": hash, "guess": guess, "wager": wager}));
    } else {
	const form = document.getElementById('form');
	name = form.children[0].value;
	socket.send(JSON.stringify({"type": "name", "hash": hash, "name": name}));
    }
}

function listener(event) {
    let msg;
    try {
	msg = JSON.parse(event.data);
    } catch (error) {
	console.error(`Could not parse json from ${event.data}`);
	return;
    }
    switch (msg["type"]) {
	case "hash":
	    hash = msg["hash"];
	    return;
	case "name":
	    socket.send(JSON.stringify({"type": "name", "hash": hash, "name": name}));
	    return
	default:
	    console.error(`Unknown message type ${msg["type"]}`);
	    return;
    }
}

socket.addEventListener('open', () => {
    if (document.getElementById('waiting'))
	document.getElementById('waiting').remove();
    console.log('connected');
    let form = document.getElementById('form');
    let text = document.createElement('input');
    let button = document.createElement('button');
    button.innerText = "Submit Name"
    form.appendChild(text);
    form.appendChild(button);
});
socket.addEventListener('message', listener);
socket.addEventListener('close', (event) => console.warn(`closed: ${event.code} ${event.reason}`));
socket.addEventListener('error', () => console.log('connection error'));
