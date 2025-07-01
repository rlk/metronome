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

    document.querySelectorAll('.grid').forEach((element) => {
      element.addEventListener('click', () => this.clickGrid(element));
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

    this.bpm = 120;
    this.read = false;
    this.full = false;
    this.interval = 0;
    this.sentinel = null;

    this.audioContext = new AudioContext();

    fetch('wood-block-low.wav')
      .then(response => response.arrayBuffer())
      .then(buffer => this.audioContext.decodeAudioData(buffer))
      .then(buffer => { this.audioBuffer = buffer });

    this.loadState();
  }

  updateInterval() {
    var divisions = document.querySelector('.bar.selected').getAttribute('divisions');
    var timeout = 60000 / this.bpm / divisions;
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = setInterval(() => {
      this.stepGrid();
      this.playTick();
    }, timeout);
  }

  stepGrid() {
    var lastElement = document.querySelector('.bar.selected > .grid.current');
    var nextElement = lastElement.nextElementSibling ?? lastElement.parentNode.firstElementChild;

    lastElement.classList.toggle('current');
    nextElement.classList.toggle('current');
    lastElement.classList.toggle('idle');
    nextElement.classList.toggle('idle');
  }

  playTick() {
    if (document.querySelector('.bar.selected > .grid.current').classList.contains('selected')) {
      var source = this.audioContext.createBufferSource()
      source.buffer = this.audioBuffer;
      source.connect(this.audioContext.destination);
      source.start();
    }
  }

  clickGrid(element) {
    element.classList.toggle('selected');
    element.classList.toggle('unselected');
    this.storeState();
  }

  clickSig(element) {
    document.querySelector('.bar.selected > .grid.current').classList.replace('current', 'idle');
    document.querySelector('.bar.selected > .grid.idle').classList.replace('idle', 'current');

    document.querySelectorAll('.bar').forEach((bar) => {
      this.chooseClass(bar, bar.getAttribute('name') === element.getAttribute('name'), 'selected', 'unselected');
    });

    if (this.interval) {
      this.updateInterval();
      this.playTick();
    }
    this.storeState();
  }

  clickFull() {
    if (this.full) {
      document.exitFullscreen();
      this.full = false;
    } else {
      this.body.requestFullscreen();
      this.full = true;
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

  enterRead() {
    this.read = true
    this.digitElement[2].classList.replace('unselected', 'selected');
    this.digitElement[1].classList.replace('unselected', 'selected');
    this.digitElement[0].classList.replace('unselected', 'selected');

    this.digitElement[2].textContent = "";
    this.digitElement[1].textContent = "";
    this.digitElement[0].textContent = "";
  }

  leaveRead(bpm) {
    bpm = Math.max(1, bpm);
    if (this.bpm != bpm) {
      this.bpm = bpm;
      if (this.interval) {
        this.updateInterval();
      }
    }

    var value = this.bpm.toString();
    this.read = false;
    this.digitElement[2].classList.replace('selected', 'unselected');
    this.digitElement[1].classList.replace('selected', 'unselected');
    this.digitElement[0].classList.replace('selected', 'unselected');

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

    this.leaveRead(digit2 * 100 + digit1 * 10 + digit0);
  }

  clickNum(element) {
    if (this.read == false) {
      this.enterRead();
    }
    if (this.read) {
      this.digitElement[2].textContent = this.digitElement[1].textContent;
      this.digitElement[1].textContent = this.digitElement[0].textContent;
      this.digitElement[0].textContent = element.getAttribute('name');
    }
  }

  clickFun(element) {
    var name = element.getAttribute('name')
    if (name == 'play') {
      this.clickPlay();
    } else if (name == 'full') {
      this.clickFull();
    } else if (name == 'P') {
      this.clickEnter();
    } else if (name == 'S') {
      this.leaveRead(this.bpm);
    } else if (name == 'A') {
      this.leaveRead(this.bpm + 10);
    } else if (name == 'B') {
      this.leaveRead(this.bpm + 1);
    } else if (name == 'C') {
      this.leaveRead(this.bpm - 1);
    } else if (name == 'D') {
      this.leaveRead(this.bpm - 10);
    }
    this.storeState();
  }

  lockScreen() {
    navigator.wakeLock.request("screen").then(lock => {
      this.sentinel = lock;
      document.querySelector('.play')?.classList.add('locked');

      this.sentinel.onrelease = function() {
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

  applyState(string, element, apply) {
    const key = element.getAttribute('id');
    if (key) {
      const match = string.match(new RegExp(`${key}(\\d+)`));
      if (match?.length > 0) {
        apply(match.pop());
      }
    }
  }

  stateFromString(string) {
    document.querySelectorAll('.digit').forEach((element) => {
      this.applyState(string, element, value => element.textContent = value);
    });
    document.querySelectorAll('.option').forEach((element) => {
      this.applyState(string, element, value => {
        this.chooseClass(element, value & '1', 'selected', 'unselected');
        this.chooseClass(element, value & '2', 'current', 'idle');
      });
    });
    this.clickEnter();
  }

  stringFromState() {
    var string = '';
    document.querySelectorAll('.digit').forEach((element) => {
      const value = element.textContent || '0'
      string += `${element.getAttribute('id')}${value}`
    });
    document.querySelectorAll('.option').forEach((element) => {
      const value = (
        (element.classList.contains('selected') ? '1' : '0') |
        (element.classList.contains('current') ? '2' : '0'));
      string += `${element.getAttribute('id')}${value}`
    });
    return string;
  }

  chooseClass(element, condition, a, b) {
    if (condition) {
      element.classList.add(a);
      element.classList.remove(b);
    } else {
      element.classList.add(b);
      element.classList.remove(a);
    }
  }
}

var metronome = new Metronome();
