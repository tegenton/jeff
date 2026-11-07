const socket = new WebSocket('host');

let players = {};
let buzzed = [];
let bet;
let picker;
let board;

function validBoard(js) {
    // TODO: some more junk to make sure its cool
    return true;
    if (!("single" in js))
	return false;
    if (!("double" in js))
	return false;
    if (!("final" in js))
	return false;
    if (Object.keys(js["single"]).length != 6)
	return false;
    if (Object.keys(js["double"]).length != 6)
	return false;
    if (js["final"].length != 3)
	return false;
}

function renderBoard(b) {
    const table = document.createElement('table');
    const head = document.createElement('thead');
    table.appendChild(head);
    const body = document.createElement('tbody');
    table.appendChild(body);

    const header = head.insertRow();
    for (const cat of Object.keys(b)) {
	let th = document.createElement('th');
	th.textContent = cat;
	header.appendChild(th);
    }

    for (let i = 0; i < 5; i++) {
	let row = body.insertRow();
	for (let cat of Object.keys(b)) {
	    let cell = row.insertCell();
	    if (b[cat][i]["daily"])
		cell.textContent = "Daily Double";
	    else
		cell.textContent = `$${(i + 1) * 200}`;
	}
	row = body.insertRow();
	for (let cat of Object.keys(b)) {
	    let cell = row.insertCell();
	    cell.textContent = b[cat][i]["question"];
	}
	row = body.insertRow();
	for (let cat of Object.keys(b)) {
	    let cell = row.insertCell();
	    cell.textContent = b[cat][i]["answer"];
	}
    }
    return table;
}

function renderGame() {
    const board_div = document.getElementById("board");
    if (board_div.children[0])
	board_div.children[0].remove();
    
    const game = document.createElement('div');
    const fin = document.createElement('table');
    game.appendChild(renderBoard(board["single"]));
    game.appendChild(renderBoard(board["double"]));
    game.appendChild(fin);

    const head = document.createElement('thead');
    fin.appendChild(head);
    const body = document.createElement('tbody');
    fin.appendChild(body);

    let row = head.insertRow();
    row.insertCell().textcontent = board["final"]["category"];
    /*let th = document.createElement('th');
    th.textContent = board["final"]["category"];
    header.appendChild(th);*/

    row = body.insertRow();
    row.insertCell().textcontent = board["final"]["question"];
    row = body.insertRow();
    row.insertCell().textcontent = board["final"]["answer"];

    board_div.appendChild(game);
}

function submit() {
    let input = document.getElementById('boardjs');
    if (input.files.length) {
	let reader = new FileReader();
	reader.onload = (e) => {
	    let js = JSON.parse(e.target.result);
	    if (validBoard(js)) {
		board = js;
		renderGame();
		socket.send(JSON.stringify({"type": "categories", "categories": Object.keys(board["single"])}));
	    }
	}
	reader.readAsText(input.files[0]);
    }
}

function start() {
    console.log("starting");
    let rand = Math.floor(Math.random() * Object.keys(players).length);
    picker = Object.keys(players)[rand];
    nextQuestion();
}

function nextQuestion() {
    socket.send(JSON.stringify({"type": "pick", "hash": picker}));
}

function addPlayer(id) {
    const player_div = document.getElementById("players");
    let player = document.createElement("p");
    player.textContent = players[id][0];
    player_div.appendChild(player);
    const start_button = document.getElementById("start_button");
    start_button.style.display = "";
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
	case "tv":
	    // TODO: "waiting for tv" that gets removed when this happens
	    break;
	case "name":
	    players[msg["hash"]] = [msg["name"], 0];
	    addPlayer(msg["hash"]);
	    break;
	case "buzz":
	    buzzed.push(msg["hash"]);
	    if (buzzed[0] == msg["hash"]) {
		socket.send(JSON.stringify({"type": "buzz", "hash": msg["hash"], "daily": board[cat][val]["daily"]}))
	    }
	    break;
	case "bet":
	    if (buzzed[0] == msg["hash"] && board[cat][val]["daily"]) {
		bet = msg["bet"];
	    }
	    break;
	case "answer":
	    if (buzzed[0] == msg["hash"]) {
		if (msg["answer"] == board[cat][val]["answer"]) {
		    players[msg["hash"]][1] += bet;
		    picker = msg["hash"];
		    socket.send(JSON.stringify({"type": "score", "score": players[msg["hash"]][1]}));
		    nextQuestion();
		} else {
		    players[msg["hash"]][1] -= bet;
		    if (!board[cat][val]["daily"]) {
			buzzed.shift();
			socket.send(JSON.stringify({"type": "buzz", "hash": buzzed[0], "daily": board[cat][val]["daily"]}))
		    }
		    socket.send(JSON.stringify({"type": "score", "score": players[msg["hash"]][1]}));
		}
	    }
	case "final":
	    players[msg["hash"]].push(msg["guess"]);
	    players[msg["hash"]].push(msg["wager"]);
	    for (const player of Object.keys(players)) {
		if (players[player].length == 4) {
		    
		}
	    }
	default:
	    console.error(`Unknown message type ${msg["type"]}`);
	    return;
    }
}

socket.addEventListener('open', () => {
    if (document.getElementById('waiting'))
	document.getElementById('waiting').remove();
    console.log('connected');
});
socket.addEventListener('message', listener);
socket.addEventListener('close', (event) => console.warn(`closed: ${event.code} ${event.reason}`));
socket.addEventListener('error', () => console.log('connection error'));
