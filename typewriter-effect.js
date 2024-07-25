/**
 * @callback done Callback to indicate the completion of a typewriter event
 * @callback doo A callback used to start a function
 * @callback cancel A callback used to cancel a typewriter action
 *
 * @callback typewriterAction
 * @prop {done} done
 * @returns {[doo, cancel]}
 */

class Typewriter {
  #target;
  #actionQueue;
  #currentActionCanceler = undefined;
  #isRunning = false;

  constructor(target) {
    /** @type {HTMLElement} */
    this.#target = target;
    /** @type {typewriterAction[]} */
    this.#actionQueue = [];
  }

  /**
   * @param {number} ms
   */
  wait(ms = 0) {
    let timeoutID;
    this.#actionQueue.push([
      (done) => (timeoutID = setTimeout(() => done(), ms)),
      () => clearTimeout(timeoutID),
    ]);

    return this;
  }

  /**
   * @param {string[]} strings the string to push
   * @param {number} msPerString the miliseconds between each char push
   */
  pushStrings(strings, msPerString = 0) {
    strings = strings.slice(0);

    const pushStr = () => (this.#target.innerText += strings.shift());

    let intervalID;

    this.#actionQueue.push([
      (done) => {
        pushStr(); // first string has no delay

        intervalID = setInterval(() => {
          // stop if done
          if (!strings.length) {
            clearInterval(intervalID);
            done();
            return;
          }

          // else push another string
          pushStr();
        }, msPerString);
      },
      () => clearInterval(intervalID),
    ]);

    return this;
  }

  /**
   *
   * @param {string} string
   * @param {number} msPerChar
   */
  pushText(string, msPerChar = 0) {
    return this.pushStrings(string.split(""), msPerChar);
  }

  /**
   * Triggers the function, then moves onto the next action
   * @param {() => void} func
   */
  trigger(func) {
    let cancel = false;

    this.#actionQueue.push([
      (done) => {
        if (cancel) return;
        func();
        done();
      },
      () => (cancel = true),
    ]);

    return this;
  }

  /**
   * @param {number} chars the number of chars to pop
   * @param {number} msPerChar the miliseconds wait between char pops
   */
  popChar(chars, msPerChar = 0) {
    const text = () => this.#target.innerText;

    const popChar = () =>
      (this.#target.innerText = text().substring(0, text().length - 1));

    let intervalID;

    this.#actionQueue.push([
      (done) => {
        let remaining = Math.min(chars, text().length);
        popChar(); // first char has no delay
        remaining--;

        intervalID = setInterval(() => {
          // stop if done
          if (remaining <= 0) {
            clearInterval(intervalID);
            done();
            return;
          }

          // else pop another char
          popChar();
          remaining--;
        }, msPerChar);
      },
      () => clearInterval(intervalID),
    ]);

    return this;
  }

  /**
   * @param {number} msPerChar
   */
  clear(msPerChar = 0) {
    const text = () => this.#target.innerText;

    const popChar = () =>
      (this.#target.innerText = text().substring(0, text().length - 1));

    let intervalID;

    this.#actionQueue.push([
      (done) => {
        popChar(); // first char has no delay

        intervalID = setInterval(() => {
          // stop if done
          if (text().length <= 0) {
            clearInterval(intervalID);
            done();
            return;
          }

          // else pop another char
          popChar();
        }, msPerChar);
      },
      () => clearInterval(intervalID),
    ]);

    return this;
  }

  /**
   * Runs all the actions in the action queue
   */
  run() {
    const runn = () => {
      // Cancel the current action (if possible)
      this.#currentActionCanceler?.();

      // Return if there are no more actions left
      let action = this.#actionQueue.shift();
      if (!action) {
        this.#isRunning = false;
        return;
      }

      let [doo, cancel] = action;
      this.#currentActionCanceler = cancel;
      doo(runn);
    };

    if (!this.#isRunning) {
      this.#isRunning = true;
      runn();
    }
    return this;
  }

  /**
   * Cancels the current action queue
   */
  cancel(clearQueue = true) {
    this.#currentActionCanceler?.();
    this.#isRunning = false;
    if (clearQueue) this.#actionQueue = [];
    return this;
  }
}
