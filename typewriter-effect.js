/**
 * @callback done Callback to indicate the completion of a typewriter event
 * @callback cancel A callback used to cancel a typewriter action
 *
 * @callback typewriterAction
 * @prop {done} done
 * @returns {cancel}
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
    this.#actionQueue.push((done) => {
      let timeoutID = setTimeout(() => done(), ms);
      return () => clearTimeout(timeoutID);
    });

    return this;
  }

  /**
   * @param {string[]} strings the string to push
   * @param {number} msPerString the miliseconds between each char push
   */
  pushStrings(strings, msPerString = 0) {
    strings = strings.slice(0);

    const pushStr = () => (this.#target.innerText += strings.shift());

    this.#actionQueue.push((done) => {
      pushStr(); // first string has no delay

      let intervalID = setInterval(() => {
        // stop if done
        if (!strings.length) return done();

        // else push another string
        pushStr();
      }, msPerString);

      // Cancel action
      return () => clearInterval(intervalID);
    });

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
   * Calls func then waits for the completion of func aka a call to done()
   * @param {typewriterAction} func
   */
  waitFor(func) {
    this.#actionQueue.push((done) => func(done));
    return this;
  }

  /**
   * Triggers the function, then moves onto the next action
   * @param {() => void} func
   */
  trigger(func) {
    this.#actionQueue.push((done) => {
      func;
      return done();
    });
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

    this.#actionQueue.push((done) => {
      let remaining = Math.min(chars, text().length);
      popChar(); // first char has no delay
      remaining--;

      let intervalID = setInterval(() => {
        // stop if done
        if (remaining <= 0) return done();

        // else pop another char
        popChar();
        remaining--;
      }, msPerChar);

      // Cancel action
      return () => clearInterval(intervalID);
    });

    return this;
  }

  /**
   * @param {number} msPerChar
   */
  clear(msPerChar = 0) {
    const text = () => this.#target.innerText;

    const popChar = () =>
      (this.#target.innerText = text().substring(0, text().length - 1));

    this.#actionQueue.push((done) => {
      popChar(); // first char has no delay

      let intervalID = setInterval(() => {
        // stop if done
        if (text().length <= 0) return done();

        // else pop another char
        popChar();
      }, msPerChar);

      // Cancel action
      return () => clearInterval(intervalID);
    });

    return this;
  }

  /**
   * Runs all the actions in the action queue
   */
  run() {
    const runn = () => {
      this.#currentActionCanceler = this.#actionQueue.shift()?.(() => {
        this.#currentActionCanceler();
        this.#isRunning = true;
        if (this.#actionQueue.length) runn();
        else this.#isRunning = false;
      });
    };

    if (!this.#isRunning) runn();
    
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
