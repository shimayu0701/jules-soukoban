document.addEventListener("DOMContentLoaded", () => {
	const gameBoard = document.getElementById("game-board");
	const messageEl = document.getElementById("message");
	const resetButton = document.getElementById("reset-button");
	const backButton = document.getElementById("back-button");
	const verticalCoords = document.getElementById("vertical-coords");
	const horizontalCoords = document.getElementById("horizontal-coords");

	let lastState = null;

	// 0: 床, 1: 壁, 2: 箱, 3: ゴール, 4: プレイヤー
	// ご指定のマップに修正
	const initialMap = [
		[1, 1, 1, 1, 1, 1, 1, 1],
		[1, 3, 3, 0, 0, 0, 0, 1],
		[1, 3, 3, 2, 0, 2, 0, 1],
		[1, 2, 1, 2, 2, 2, 1, 1],
		[1, 3, 3, 2, 0, 2, 4, 1],
		[1, 3, 3, 0, 0, 0, 0, 1],
		[1, 1, 1, 1, 1, 1, 1, 1],
	];

	let gameMap;
	let playerPos;
	let goalCount;
	let gameOver = false;

	function init() {
		gameMap = initialMap.map((row) => [...row]);
		gameOver = false;
		messageEl.textContent = "";
		resetButton.style.display = "none";
		backButton.style.display = "none";
		lastState = null;

		goalCount = 0;
		for (let y = 0; y < gameMap.length; y++) {
			for (let x = 0; x < gameMap[y].length; x++) {
				if (initialMap[y][x] === 4) {
					playerPos = { y, x };
					// プレイヤーの初期位置も床やゴールの場合があるので、
					// gameMapのプレイヤー位置を上書きする前にgoalCountを計算
				}
				if (initialMap[y][x] === 3) {
					goalCount++;
				}
			}
		}
		// プレイヤーの初期位置がゴール上にある場合も考慮
		if (initialMap[playerPos.y][playerPos.x] === 3) {
			goalCount++;
		}
		setupCoords();
		render();
	}

	function setupCoords() {
		verticalCoords.innerHTML = "";
		horizontalCoords.innerHTML = "";

		const rows = gameMap.length;
		const cols = gameMap[0].length;

		verticalCoords.style.gridTemplateRows = `repeat(${rows}, 40px)`;
		horizontalCoords.style.gridTemplateColumns = `repeat(${cols}, 40px)`;

		const kanji = ["一", "二", "三", "四", "五", "六", "七"];
		for (let i = 0; i < rows; i++) {
			const coord = document.createElement("div");
			coord.textContent = i + 1;
			verticalCoords.appendChild(coord);
		}
		for (let i = 0; i < cols; i++) {
			const coord = document.createElement("div");
			coord.textContent = kanji[i];
			horizontalCoords.appendChild(coord);
		}
	}

	function render() {
		gameBoard.innerHTML = "";
		gameBoard.style.gridTemplateRows = `repeat(${gameMap.length}, 40px)`;
		gameBoard.style.gridTemplateColumns = `repeat(${gameMap[0].length}, 40px)`;

		for (let y = 0; y < gameMap.length; y++) {
			for (let x = 0; x < gameMap[y].length; x++) {
				const tile = document.createElement("div");
				tile.classList.add("tile");

				const tileType = gameMap[y][x];
				const isInitialGoal =
					initialMap[y][x] === 3 ||
					(initialMap[y][x] === 4 && initialMap[y][x] === 3);

				// ★描画ロジック修正
				// 背景を描画 (ゴール or 床)
				if (isInitialGoal) {
					tile.classList.add("goal");
				} else {
					tile.classList.add("floor");
				}

				// 中身を描画 (壁、箱、プレイヤー)
				switch (tileType) {
					case 1:
						tile.classList.add("wall");
						tile.classList.remove("floor", "goal"); // 壁は背景を上書き
						break;
					case 2:
						if (isInitialGoal) {
							tile.classList.add("box-on-goal");
							tile.classList.remove("goal"); // goalの円は不要
						} else {
							tile.classList.add("box");
						}
						break;
					case 4:
						tile.classList.add("player");
						break;
				}

				gameBoard.appendChild(tile);
			}
		}
	}

	function move(dy, dx) {
		if (gameOver) return;

		// Save current state before moving
		lastState = {
			map: gameMap.map((row) => [...row]),
			pos: { ...playerPos },
		};

		const { y, x } = playerPos;
		const nextY = y + dy;
		const nextX = x + dx;

		if (
			nextY < 0 ||
			nextY >= gameMap.length ||
			nextX < 0 ||
			nextX >= gameMap[0].length ||
			gameMap[nextY][nextX] === 1
		) {
			return; // 壁または範囲外なら移動不可
		}

		// 箱を動かす場合
		if (gameMap[nextY][nextX] === 2) {
			const nextNextY = nextY + dy;
			const nextNextX = nextX + dx;

			if (
				nextNextY < 0 ||
				nextNextY >= gameMap.length ||
				nextNextX < 0 ||
				nextNextX >= gameMap[0].length ||
				gameMap[nextNextY][nextNextX] === 1 ||
				gameMap[nextNextY][nextNextX] === 2
			) {
				return; // 箱の先が壁、他の箱、範囲外なら移動不可
			}
			gameMap[nextNextY][nextNextX] = 2; // 箱を移動
		}

		// ★移動ロジック修正
		// プレイヤーが元いた場所を、本来の地形（床かゴール）に戻す
		// initialMapでプレイヤーの初期位置も考慮する
		const originalTile = initialMap[y][x];
		gameMap[y][x] = originalTile === 3 || originalTile === 4 ? 3 : 0;

		// プレイヤーを移動
		gameMap[nextY][nextX] = 4;
		playerPos = { y: nextY, x: nextX };

		resetButton.style.display = "inline-block"; // Show reset button after first move
		backButton.style.display = "inline-block"; // Show back button after first move
		render();
		checkWin();
	}

	function checkWin() {
		let boxesOnGoals = 0;
		for (let y = 0; y < gameMap.length; y++) {
			for (let x = 0; x < gameMap[y].length; x++) {
				const isInitialGoal =
					initialMap[y][x] === 3 ||
					(initialMap[y][x] === 4 && initialMap[y][x] === 3);
				if (isInitialGoal && gameMap[y][x] === 2) {
					boxesOnGoals++;
				}
			}
		}

		// ゴールの総数を再計算
		let totalGoals = 0;
		for (let y = 0; y < initialMap.length; y++) {
			for (let x = 0; x < initialMap[y].length; x++) {
				if (
					initialMap[y][x] === 3 ||
					(initialMap[y][x] === 4 && initialMap[y][x] === 3)
				) {
					totalGoals++;
				}
			}
		}

		if (boxesOnGoals === totalGoals) {
			gameOver = true;
			messageEl.textContent = "クリア！おめでとうございます！";
			resetButton.style.display = "block";
		}
	}

	document.addEventListener("keydown", (e) => {
		switch (e.key) {
			case "ArrowUp":
				e.preventDefault();
				move(-1, 0);
				break;
			case "ArrowDown":
				e.preventDefault();
				move(1, 0);
				break;
			case "ArrowLeft":
				e.preventDefault();
				move(0, -1);
				break;
			case "ArrowRight":
				e.preventDefault();
				move(0, 1);
				break;
		}
	});

	// D-pad event listeners
	document
		.getElementById("dpad-up")
		.addEventListener("click", () => move(-1, 0));
	document
		.getElementById("dpad-down")
		.addEventListener("click", () => move(1, 0));
	document
		.getElementById("dpad-left")
		.addEventListener("click", () => move(0, -1));
	document
		.getElementById("dpad-right")
		.addEventListener("click", () => move(0, 1));

	resetButton.addEventListener("click", init);
	backButton.addEventListener("click", undoMove);

	function undoMove() {
		if (lastState) {
			gameMap = lastState.map;
			playerPos = lastState.pos;
			lastState = null; // Prevent multiple undos
			render();
		}
	}

	init();
});
