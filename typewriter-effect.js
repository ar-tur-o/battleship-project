class Typewriter {
  #target;
  #actionQueue;
  #currentActionCanceler = undefined;

  constructor(target) {
    /** @type {HTMLElement} */
    this.#target = target;
    /**
     * @callback done Called when then the function is done executing
     * @callback cancel Called when the user wants to cancel the operation
     * @type {((done) => cancel)[]}
     */
    this.#actionQueue = [];
  }

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
   * @returns
   */
  pushText(string, msPerChar = 0) {
    return this.pushStrings(string.split(""), msPerChar);
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
    return this.popChar(999_999_999, msPerChar);
  }

  /**
   * Runs all the actions in the action queue
   */
  run() {
    this.#currentActionCanceler = this.#actionQueue.shift()?.(() => {
      this.#currentActionCanceler();
      this.run();
    });
  }

  /**
   * Cancels the current action queue
   */
  cancel(clearQueue = true) {
    this.#currentActionCanceler?.();
    if (clearQueue) this.#actionQueue = [];
    return this;
  }
}
