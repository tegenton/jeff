const socket = new WebSocket('player');

let hash, name;
let score = 0;
let wager = false;
let picking = false;

function buzz() {
    socket.send(JSON.stringify({"type": "buzz", "hash": hash}))
}

function submit() {
    const form = document.getElementById('form');
    if (wager) {
	let wager = form.children[0].value;
	let guess = form.children[1].value;
	socket.send(JSON.stringify({"type": "final", "hash": hash, "guess": guess, "wager": wager}));
	form.style.display = "none";
    } else {
	name = form.children[1].value;
	socket.send(JSON.stringify({"type": "name", "hash": hash, "name": name}));
	form.style.display = "none";
    }
}

function createBoard(data) {
    const board_div = document.getElementById("board");

    const board = document.createElement('table');
    const head = document.createElement('thead');
    const body = document.createElement('tbody');

    board.appendChild(head);
    board.appendChild(body);

    let header = head.insertRow();
    Object.values(data['categories']).forEach(cat => {
	let th = document.createElement('th');
	th.textContent = cat;
	header.appendChild(th);
    });

    for (let i = 0; i < 5; i++) {
	let row = body.insertRow();
	let value = (i + 1) * 200;
	if (data["double"])
	    value *= 2;
	for (let j = 0; j < data['categories'].length; j++) {
	    let cell = row.insertCell();
	    cell.textContent = `$${value}`;
	    cell.onclick = () => {
		if (picking)
		    socket.send(JSON.stringify({"type": "pick", "cat": j, "val": i}))
		picking = false;
	    };
	}
    }

    board_div.appendChild(board);
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
	    break;
	case "name":
	    if (name)
		socket.send(JSON.stringify({"type": "name", "hash": hash, "name": name}));
	    break;
	case "categories":
	    createBoard(msg);
	    break;
	case "pick":
	    picking = true;
	    break;
	default:
	    console.error(`Unknown message type ${msg["type"]}`);
	    break;
    }
}

socket.addEventListener('open', () => {
    if (document.getElementById('waiting'))
	document.getElementById('waiting').remove();
    console.log('connected');
    let form = document.getElementById('form');
    form.style.display = "";
});
socket.addEventListener('message', listener);
socket.addEventListener('close', (event) => console.warn(`closed: ${event.code} ${event.reason}`));
socket.addEventListener('error', () => console.log('connection error'));
