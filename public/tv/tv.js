const socket = new WebSocket('tv');

let players = {};

function createBoard(data) {
    const board_div = document.getElementById("board");
    if (board_div.children[0])
	board_div.children[0].remove();

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
	case "host":
	    // TODO: remove "waiting for host"
	    break;
	case "name":
	    players[msg["hash"]] = [msg["name"], 0];
	    break;
	case "categories":
	    createBoard(msg);
	    break;
	default:
	    console.error(`Unknown message type ${msg["type"]}`);
	    return;
    }
}

socket.addEventListener('open', () => console.debug('connected'));
socket.addEventListener('message', listener);
socket.addEventListener('close', (event) => console.warn(`closed: ${event.code} ${event.reason}`));
socket.addEventListener('error', () => console.log('connection error'));
