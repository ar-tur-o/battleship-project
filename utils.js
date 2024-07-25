/**
 * Generates an array of size n, with all the elements generated with func
 * @param {number} size
 * @param {(i: number} func
 * @returns {any[]}
 */
function genArray(size, func) {
  const create = (arr, i) => (i < size ? create(arr, arr.push(func(i))) : arr);
  return create([], 0);
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function isInBounds(xy, size) {
  let [x, y] = xy;
  return 0 <= x && x <= size && 0 <= y && y <= size;
}

/**
 * converts an x y pair to a battleship coord
 * @param {number} x The column index
 * @param {number} y The row index
 * @returns {string} A battleship coordinate in the form /[A-Z][0-9]/ ex. G3
 */
function xyToBattleship(x, y) {
  return LETTERS[y] + x.toString();
}

/**
 * @param {string} coord A battleship coordinate in the form /[A-Z][0-9]/ ex. G3
 */
function battleshipToXy(coord) {
  const reject = Promise.reject.bind(Promise);
  const resolve = Promise.resolve.bind(Promise);

  if (coord.length !== 2)
    return reject(
      RangeError(
        `The input must be exactly 2 characters (letters) long! (${coord})`
      )
    );

  let [rowChar, colChar] = coord.split("");

  let x = parseInt(colChar);
  let y = LETTERS.split("").indexOf(rowChar);

  if (isNaN(x))
    return reject(TypeError(`"${colChar}" is not a digit (0-9)! (${coord})`));
  if (y === -1)
    return reject(TypeError(`"${rowChar}" is not a letter (A-Z)! (${coord})`));

  return resolve([x, y]);
}
