// Copyright (c) 2025 Robert Kooima

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

class Metronome {
  constructor() {

    this.body = document.querySelector('body');

    this.digitElement = [];
    this.digitElement[2] = document.querySelector('.digit2');
    this.digitElement[1] = document.querySelector('.digit1');
    this.digitElement[0] = document.querySelector('.digit0');

    document.querySelectorAll('.tick').forEach((element) => {
      element.addEventListener('click', () => this.clickTick(element));
    })

    document.querySelectorAll('.sig').forEach((element) => {
      element.addEventListener('click', () => this.clickSig(element));
    })

    document.querySelectorAll('.num').forEach((element) => {
      element.addEventListener('click', () => this.clickNum(element));
    })

    document.querySelectorAll('.fun').forEach((element) => {
      element.addEventListener('click', () => this.clickFun(element));
    })

    document.querySelectorAll('.tap').forEach((element) => {
      element.addEventListener('click', (event) => this.clickTap(event));
    })

    this.bpm = 120;
    this.read = false;
    this.interval = 0;
    this.sentinel = null;
    this.timeStamp = 0;
    this.timeQueue = [];

    this.audioContext = new AudioContext();

    fetch('wood-block-low.wav')
      .then(response => response.arrayBuffer())
      .then(buffer => this.audioContext.decodeAudioData(buffer))
      .then(buffer => { this.audioBufferLow = buffer });
    fetch('wood-block-high.wav')
      .then(response => response.arrayBuffer())
      .then(buffer => this.audioContext.decodeAudioData(buffer))
      .then(buffer => { this.audioBufferHigh = buffer });

    this.loadState();
  }

  updateInterval() {
    var divisions = document.querySelector('.bar.selected').getAttribute('divisions');
    var timeout = 60000 / this.bpm / divisions;
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = setInterval(() => {
      this.stepTick();
      this.playTick();
    }, timeout);
  }

  stepTick() {
    var lastElement = document.querySelector('.bar.selected > .tick.current');
    var nextElement = lastElement.nextElementSibling ?? lastElement.parentNode.firstElementChild;

    lastElement.classList.toggle('current');
    nextElement.classList.toggle('current');
    lastElement.classList.toggle('idle');
    nextElement.classList.toggle('idle');
  }

  playTick() {
    var classList = document.querySelector('.bar.selected > .tick.current').classList;
    var buffer = null;

    if (classList.contains('low')) {
      buffer = this.audioBufferLow;
    }
    if (classList.contains('high')) {
      buffer = this.audioBufferHigh;
    }
    if (buffer) {
      var source = this.audioContext.createBufferSource()
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.start();
    }
  }

  clickTick(element) {
    if (element.classList.contains('off')) {
      element.classList.replace('off', 'low')
    } else if (element.classList.contains('low')) {
      element.classList.replace('low', 'high')
    } else if (element.classList.contains('high')) {
      element.classList.replace('high', 'off')
    }
    this.storeState();
  }

  clickSig(element) {
    document.querySelectorAll('.bar > .tick').forEach((tick) => {
      if (tick.parentElement.firstElementChild === tick) {
        tick.classList.replace('idle', 'current');
      } else {
        tick.classList.replace('current', 'idle');
      }
    });

    document.querySelectorAll('.bar').forEach((bar) => {
      if (bar.getAttribute('name') === element.getAttribute('name')) {
        bar.classList.replace('unselected', 'selected');
      } else {
        bar.classList.replace('selected', 'unselected');
      }
    });
    if (this.interval) {
      this.updateInterval();
      this.playTick();
    }
    this.storeState();
  }

  clickTap(event) {
    var delta = event.timeStamp - this.timeStamp;
    this.timeStamp = event.timeStamp;

    if (delta > 2000) {
      this.timeQueue = [];
    } else {
      this.timeQueue.push(delta);
    }
    if (this.timeQueue.length > 6) {
      this.timeQueue.shift();
    }
    if (this.timeQueue.length > 0) {
      var average =
        this.timeQueue.reduce((a, x) => a + x, 0) / this.timeQueue.length;
      this.setBpm(Math.round(60000 / average));
    }
  }

  clickPlay() {
    if (this.interval) {
      this.audioContext.suspend().then(() => {
        clearInterval(this.interval);
        this.interval = 0;
        this.unlockScreen();
      });
    } else {
      this.audioContext.resume().then(() => {
        this.updateInterval();
        this.playTick();
        this.lockScreen();
      });
    }
  }

  clearDigits() {
    this.digitElement[2].classList.replace('unselected', 'selected');
    this.digitElement[1].classList.replace('unselected', 'selected');
    this.digitElement[0].classList.replace('unselected', 'selected');

    this.digitElement[2].textContent = "";
    this.digitElement[1].textContent = "";
    this.digitElement[0].textContent = "";
  }

  setBpm(bpm) {
    bpm = Math.max(1, bpm);
    if (this.bpm != bpm) {
      this.bpm = bpm;
      if (this.interval) {
        this.updateInterval();
      }
    }

    this.digitElement[2].classList.replace('selected', 'unselected');
    this.digitElement[1].classList.replace('selected', 'unselected');
    this.digitElement[0].classList.replace('selected', 'unselected');

    var value = this.bpm.toString();

    this.digitElement[2].textContent = value.charAt(value.length - 3);
    this.digitElement[1].textContent = value.charAt(value.length - 2);
    this.digitElement[0].textContent = value.charAt(value.length - 1);
  }

  clickEnter() {
    var digit2 = parseInt(this.digitElement[2].textContent);
    var digit1 = parseInt(this.digitElement[1].textContent);
    var digit0 = parseInt(this.digitElement[0].textContent);

    digit2 = isNaN(digit2) ? 0 : digit2;
    digit1 = isNaN(digit1) ? 0 : digit1;
    digit0 = isNaN(digit0) ? 0 : digit0;

    this.setBpm(digit2 * 100 + digit1 * 10 + digit0);
    this.read = false;
  }

  clickNum(element) {
    if (this.read == false) {
      this.clearDigits();
      this.read = true;
    }
    if (this.read) {
      this.digitElement[2].textContent = this.digitElement[1].textContent;
      this.digitElement[1].textContent = this.digitElement[0].textContent;
      this.digitElement[0].textContent = element.getAttribute('name');
    }
  }

  clickFun(element) {
    var name = element.getAttribute('name');
    if (name == 'play') {
      this.clickPlay();
    } else if (name == 'P') {
      this.clickEnter();
    } else if (name == 'S') {
      this.setBpm(this.bpm);
    } else if (name == 'A') {
      this.setBpm(this.bpm + 10);
    } else if (name == 'B') {
      this.setBpm(this.bpm + 1);
    } else if (name == 'C') {
      this.setBpm(this.bpm - 1);
    } else if (name == 'D') {
      this.setBpm(this.bpm - 10);
    }
    this.storeState();
  }

  lockScreen() {
    navigator.wakeLock.request("screen").then(lock => {
      this.sentinel = lock;
      document.querySelector('.play')?.classList.add('locked');

      this.sentinel.onrelease = function () {
        this.sentinel = null;
        document.querySelector('.play')?.classList.remove('locked');
      };
    });
  }

  unlockScreen() {
    this.sentinel?.release();
  }

  loadState() {
    this.stateFromString(document.cookie.match(/METRO=[a-z0-9_]*/)?.pop() ?? '');
  }

  storeState() {
    document.cookie = `METRO=${this.stringFromState()}`
  }

  stateFromString(string) {
    function apply(element, fun) {
      const key = element.getAttribute('id');
      if (key) {
        const match = string.match(new RegExp(`${key}(\\d+)`));
        if (match?.length > 0) {
          fun(match.pop());
        }
      }
    }

    document.querySelectorAll('.digit').forEach((element) => {
      apply(element, value => element.textContent = value);
    });
    document.querySelectorAll('.tick').forEach((element) => {
      apply(element, value => {
        if (value == 0) {
          element.classList.add('off');
          element.classList.remove('low');
          element.classList.remove('high');
        } else if (value == 1) {
          element.classList.remove('off');
          element.classList.add('low');
          element.classList.remove('high');
        } else if (value == 2) {
          element.classList.remove('off');
          element.classList.remove('low');
          element.classList.add('high');
        }
      });
    });
    document.querySelectorAll('.bar').forEach((element) => {
      apply(element, value => {
        if (value == 0) {
          element.classList.add('unselected');
          element.classList.remove('selected');
        } else {
          element.classList.remove('unselected');
          element.classList.add('selected');
        }
      });
    });
    this.clickEnter();
  }

  stringFromState() {
    function digitValue(element) {
      return element.textContent || '0';
    }
    function tickValue(element) {
      return element.classList.contains('high') ? '2' :
        (element.classList.contains('low') ? '1' : '0');
    }
    function barValue(element) {
      return element.classList.contains('selected') ? '1' : '0';
    }

    var string = '';
    document.querySelectorAll('.digit').forEach((element) => {
      string += `${element.getAttribute('id')}${digitValue(element)}`
    });
    document.querySelectorAll('.tick').forEach((element) => {
      string += `${element.getAttribute('id')}${tickValue(element)}`
    });
    document.querySelectorAll('.bar').forEach((element) => {
      string += `${element.getAttribute('id')}${barValue(element)}`
    });
    return string;
  }
}

var metronome = new Metronome();
