const view = {
  writer: new Typewriter(document.getElementById("messageArea")),
  messageArea: document.getElementById("messageArea"),
  lastMessage: "__",
  duplicateMessageCount: 0,
  /** @returns {Typewriter} */
  displayMessage: function (message) {
    message = message.toString();

    if (message === this.lastMessage) this.duplicateMessageCount++;
    else this.duplicateMessageCount = 0;

    this.lastMessage = message;

    let wr = this.writer;

    let addendums = [
      () => wr.wait(500).pushText(" again...", 75),
      () =>
        wr
          .wait(500)
          .pushText(" three times in a row??", 75)
          .wait(500)
          .pushStrings([" come", " on"], 500)
          .pushText("...", 200),
      () =>
        wr
          .wait(500)
          .pushText(` ${this.duplicateMessageCount} times? `, 75)
          .wait(500)
          .pushText("really?", 50),
    ];

    if (this.duplicateMessageCount === 0)
      wr.cancel().wait(200).clear(25).wait(200).pushText(message, 75);
    else
      addendums[
        Math.min(this.duplicateMessageCount - 1, addendums.length - 1)
      ]();

    return wr.run();
  },
  displayHit: (coord) =>
    document.getElementById(coord)?.setAttribute("class", "hit"),
  displayMiss: (coord) =>
    document.getElementById(coord)?.setAttribute("class", "miss"),
};

const model = {
  win: false,
  boardSize: 7,
  shipsSunk: 0,
  ships: [],

  /**
   * Hits any ship at the specified coordinate
   * @param {string} coord
   * @returns {boolean} True if a ship was hit, false if not sunk
   */
  fire: function (coord) {
    for (const ship of this.ships) {
      let index = ship.locations.indexOf(coord);
      if (index !== -1) {
        ship.hits[index] = "hit";

        view.displayHit(coord);

        if (this.isSunk(ship)) {
          this.shipsSunk++;

          view.lastMessage = "";
          view.writer
            .cancel()
            .wait(500)
            .clear(25)
            .pushText("You...", 75)
            .wait(200)
            .pushText(" sank one of my ships ", 75)
            .wait(500)
            .pushText(":,(", 400)
            .run();
        } else view.displayMessage("HIT!!");

        return true;
      }
    }

    view.displayMiss(coord);
    view.displayMessage("You missed...");

    return false;
  },

  isSunk(ship) {
    // If one coordinate is not hit (empty string), the ship is still alive
    return ship.hits.indexOf("") === -1;
  },
};

const controller = {
  guesses: new Set(),

  processGuess: function (guess) {
    // Parse the coord as xy pair
    battleshipToXy(guess.trim().toUpperCase())
      // Make sure it is a valid coord
      .then((xy) => {
        const reject = Promise.reject.bind(Promise);
        let coord = xyToBattleship(...xy);

        if (!isInBounds(xy, model.boardSize))
          return reject(
            RangeError(`The coordinate "${coord}" is out of bounds!`)
          );

        if (this.guesses.has(coord))
          return reject(ReferenceError(`You've already guessed "${coord}"!`));

        this.guesses.add(coord);

        return coord;
      })
      // pass the input to the model
      .then((coord) => {
        let hit = model.fire(coord);

        if (hit && model.shipsSunk === model.ships.length) this.winGame();
      })
      // display any errors that may happen
      .catch((reason) => alert(reason.toString()));
  },
  winGame: function () {
    view.writer
      .cancel()
      .trigger(() => (model.win = true))
      .clear(25)
      .wait(500)
      .pushText(`You sank all of my ships in ${this.guesses.size} guesses!`, 75)
      .wait(2000)
      .clear(25)
      .wait(500)
      .pushText("A new game will be initialized shortly...", 75)
      .wait(500)
      .clear(25)
      .trigger(() => init())
      .run();
  },
};

/**
 * Generates a list of non overlapping ships
 * @param {number} size size of the game
 * @param {number[]} ships the length of each ship to generate
 * @returns {{locations: string[], hits: string[]}[]}
 */
function genShips(size, ships) {
  // randomly generates a horizontal or vertical ship within the game's bounds
  /** @param {number} len */
  const genShipLocations = (len) => {
    // domian of Math.random(x) is 0 <= x < 1
    let x = Math.floor(Math.random() * (size - len));
    let y = Math.floor(Math.random() * size);
    let isHorizontal = Math.random() > 0.5;

    let locations = genArray(len, (i) => [x + i, y]);

    // Swap the xy if vertical
    locations = isHorizontal ? locations : locations.map((l) => [l[1], l[0]]);

    return locations.map((l) => xyToBattleship(...l));
  };

  // Checks to see if a ship overlaps a taken coord
  /** @param {string[]} shipLocations */
  const overlapsExisting = (shipLocations) =>
    shipLocations.find((l) => taken.has(l)) !== undefined;

  let taken = new Set();

  let out = genArray(ships.length, () => {
    let shipLen = ships.pop();
    let shipLocations = genShipLocations(shipLen);

    while (overlapsExisting(shipLocations))
      shipLocations = genShipLocations(shipLen);

    shipLocations.forEach((l) => taken.add(l));

    return {
      locations: shipLocations,
      hits: genArray(shipLen, () => ""),
    };
  });

  return out;
}

let handleCellClick;

window.onload = () => {
  let guessInput = document.getElementById("guessInput");
  let fireButton = document.getElementById("fireButton");

  const guessVal = () => guessInput.value;
  const clearInput = () => (guessInput.value = "");

  let lastClickedCell = "";

  handleCellClick = (cell) => {
    if (model.win) return;

    if (controller.guesses.has(cell)) return;

    guessInput.value = cell;
    guessInput.focus();

    // if (lastClickedCell === cell) controller.processGuess(guessVal());
    if (true) controller.processGuess(guessVal());

    lastClickedCell = cell;
  };

  fireButton.onclick = (ev) => {
    if (model.win) return;

    controller.processGuess(guessVal());
    clearInput();
    // ev.preventDefault();
    return false;
  };

  guessInput.onkeydown = (ev) => {
    if (model.win) return;

    if (ev.key !== "Enter") return;

    controller.processGuess(guessVal());
    clearInput();
    // ev.preventDefault();

    return false;
  };

  guessInput.focus();

  init();
};

function init() {
  // this resets all the cells classes
  const rows = document.querySelector("#player-defense-table")?.rows;
  if (!rows) {
    return;
  }
  Array.from(rows).forEach((row) => {
    const cells = Array.from(row.cells);
    cells.forEach((cell) => {
      cell.setAttribute("class", "");
    });
  });

  // Reset model data
  model.shipsSunk = 0;
  model.ships = genShips(7, [5, 4, 3, 3, 2]);
  model.win = false;

  // reset controller data
  controller.guesses = new Set();

  // Print welcome message
  view.writer
    .cancel()
    .clear(25)
    .pushText("Welcome to battleship, ", 25)
    .wait(200)
    .pushText("commander!", 25)
    .wait(1000)
    .clear(25)
    .wait(500)
    .pushText("Enter your attack's corrdinate in the texbox in the corner", 25)
    .wait(400)
    .pushText(", or,", 25)
    .wait(400)
    .pushText(" double click a cell to reveal it!", 25)

    .wait(2000)
    .clear(25)
    .wait(500)
    .pushText("Try to win with as little attacks as possible.", 25)
    .wait(500)
    .pushStrings([" Good", " Luck"], 500)
    .wait(300)
    .pushText(", commander!", 25)

    .wait(2000)
    .clear(25)

    .wait(30_000)
    .pushText("Are you just going to sit there, or what?", 25)
    .run();
}
