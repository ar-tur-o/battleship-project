const view = {
  writer: new Typewriter(document.getElementById("messageArea")),
  messageArea: document.getElementById("messageArea"),
  lastMessage: "__",
  duplicateMessageCount: 0,
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
      wr.cancel().popChar(3, 75).wait(500).clear(25).pushText(message, 75);
    else
      addendums[
        Math.min(this.duplicateMessageCount - 1, addendums.length - 1)
      ]();

    wr.run();
  },
  displayHit: (coord) =>
    document.getElementById(coord)?.setAttribute("class", "hit"),
  displayMiss: (coord) =>
    document.getElementById(coord)?.setAttribute("class", "miss"),
};

const model = {
  boardSize: 7,
  shipsSunk: 0,

  ships: genShips(7, [5, 4, 3, 3, 2]),

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
            .popChar(1)
            .wait(500)
            .clear(25)
            .pushText("You sank one of my ships ", 75)
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

        if (hit && model.shipsSunk === model.ships.length)
          view.displayMessage(
            `You sank all my ships in ${this.guesses.size} guesses!`
          );
      })
      // display any errors that may happen
      .catch((reason) => alert(reason.toString()));
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

  console.log(JSON.stringify(out, null, 2));

  return out;
}

window.onload = () => {
  let guessInput = document.getElementById("guessInput");
  let fireButton = document.getElementById("fireButton");

  const guessVal = () => guessInput.value;
  const clearInput = () => (guessInput.value = "");

  fireButton.onclick = (ev) => {
    controller.processGuess(guessVal());
    clearInput();
    // ev.preventDefault();
    return false;
  };

  guessInput.onkeydown = (ev) => {
    if (ev.key !== "Enter") return;

    controller.processGuess(guessVal());
    clearInput();
    // ev.preventDefault();

    return false;
  };

  guessInput.focus();
};
