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
    this.digitElement = [];
    this.digitElement[2] = document.getElementById('digit2');
    this.digitElement[1] = document.getElementById('digit1');
    this.digitElement[0] = document.getElementById('digit0');

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

    document.addEventListener('keydown', (event) => this.keyDown(event));

    this.bpm = 120;
    this.read = false;
    this.history = '';
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

  clearDigits() {
    this.digitElement[2].classList.add('selected');
    this.digitElement[1].classList.add('selected');
    this.digitElement[0].classList.add('selected');

    this.digitElement[2].textContent = "";
    this.digitElement[1].textContent = "";
    this.digitElement[0].textContent = "";
  }

  setBpm(bpm) {
    bpm = Math.max(bpm, 1);
    bpm = Math.min(bpm, 999);

    if (this.bpm != bpm) {
      this.bpm = bpm;
      if (this.interval) {
        this.updateInterval();
      }
    }

    this.digitElement[2].classList.remove('selected');
    this.digitElement[1].classList.remove('selected');
    this.digitElement[0].classList.remove('selected');

    var value = this.bpm.toString();

    this.digitElement[2].textContent = value.charAt(value.length - 3);
    this.digitElement[1].textContent = value.charAt(value.length - 2);
    this.digitElement[0].textContent = value.charAt(value.length - 1);

    this.read = false;
  }

  setSignature(signature) {
    document.querySelectorAll('.bar > .tick').forEach((tick) => {
      if (tick.parentElement.firstElementChild === tick) {
        tick.classList.add('current');
      } else {
        tick.classList.remove('current');
      }
    });

    document.querySelectorAll('.bar').forEach((bar) => {
      if (bar.getAttribute('signature') === signature) {
        bar.classList.add('selected');
      } else {
        bar.classList.remove('selected');
      }
    });
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

  toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.querySelector('body')?.requestFullscreen();
    }
  }

  stepTick() {
    var lastElement = document.querySelector('.bar.selected > .tick.current');
    var nextElement = lastElement.nextElementSibling ?? lastElement.parentNode.firstElementChild;

    lastElement.classList.remove('current');
    nextElement.classList.add('current');
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
    this.setSignature(element.getAttribute('signature'));
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

  clickEnter() {
    var digit2 = parseInt(this.digitElement[2].textContent);
    var digit1 = parseInt(this.digitElement[1].textContent);
    var digit0 = parseInt(this.digitElement[0].textContent);

    digit2 = isNaN(digit2) ? 0 : digit2;
    digit1 = isNaN(digit1) ? 0 : digit1;
    digit0 = isNaN(digit0) ? 0 : digit0;

    this.setBpm(digit2 * 100 + digit1 * 10 + digit0);
  }

  clickCancel() {
    this.setBpm(this.bpm);
  }

  clickNum(element) {
    if (this.read == false) {
      this.clearDigits();
      this.read = true;
      this.history = '';
    }
    if (this.read) {
      this.digitElement[2].textContent = this.digitElement[1].textContent;
      this.digitElement[1].textContent = this.digitElement[0].textContent;
      this.digitElement[0].textContent = element.getAttribute('id');

      this.history = (this.history + element.getAttribute('id')).slice(-8);

      if (this.history.endsWith('9761616')) {
        this.setSignature('16/16');
      }
      if (this.history.endsWith('9761234')) {
        this.toggleFullscreen();
      }
    }
  }

  clickFun(element) {
    var id = element.getAttribute('id');
    if (id == 'play') {
      this.clickPlay();
    } else if (id == 'P') {
      this.clickEnter();
    } else if (id == 'S') {
      this.clickCancel();
    } else if (id == 'A') {
      this.setBpm(this.bpm + 10);
    } else if (id == 'B') {
      this.setBpm(this.bpm + 1);
    } else if (id == 'C') {
      this.setBpm(this.bpm - 1);
    } else if (id == 'D') {
      this.setBpm(this.bpm - 10);
    }
    this.storeState();
  }


  keyDown(event) {
    switch (event.key) {
      case '0': return this.clickNum(document.getElementById('0'));
      case '1': return this.clickNum(document.getElementById('1'));
      case '2': return this.clickNum(document.getElementById('2'));
      case '3': return this.clickNum(document.getElementById('3'));
      case '4': return this.clickNum(document.getElementById('4'));
      case '5': return this.clickNum(document.getElementById('5'));
      case '6': return this.clickNum(document.getElementById('6'));
      case '7': return this.clickNum(document.getElementById('7'));
      case '8': return this.clickNum(document.getElementById('8'));
      case '9': return this.clickNum(document.getElementById('9'));
      case ' ': return this.clickPlay();
      case 'Enter': return this.clickEnter();
      case 'Escape': return this.clickCancel();
      case 'Control': return this.clickTap(event);
    }
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
    this.stateFromString(document.cookie.match(/rlk_metronome=([^;]*)/)?.pop() ?? '');
  }

  storeState() {
    document.cookie = `rlk_metronome=${this.stringFromState()}`
  }

  stateFromString(string) {
    var cookie = JSON.parse(string);

    if (!isNaN(parseInt(cookie.bpm))) {
      this.setBpm(parseInt(cookie.bpm))
    }

    if (cookie.bar.length > 0) {
      this.setSignature(cookie.bar);
    }

    document.querySelectorAll('.bar').forEach(bar => {
      var ticks = cookie.ticks[bar.getAttribute('signature')];
      if (ticks && ticks.length > 0) {
        Array.from(bar.children).forEach((tick, index) => {
          tick.classList.remove('off');
          tick.classList.remove('low');
          tick.classList.remove('high');

          if (ticks[index] == '2') {
            tick.classList.add('high');
          } else if (ticks[index] == '1') {
            tick.classList.add('low');
          } else {
            tick.classList.add('off');
          }
        });
      }
    });
  }

  stringFromState() {
    var bpm =
      (this.digitElement[2].textContent || '0') +
      (this.digitElement[1].textContent || '0') +
      (this.digitElement[0].textContent || '0');

    var bar = document.querySelector('.bar.selected').getAttribute('signature');

    var ticks = {};
    document.querySelectorAll('.bar').forEach((parent) => {
      var value = '';
      Array.from(parent.children).forEach((child) => {
        if (child.classList.contains('high')) {
          value += '2';
        } else if (child.classList.contains('low')) {
          value += '1';
        } else {
          value += '0';
        }
      });
      ticks[parent.getAttribute('signature')] = value;
    });

    return JSON.stringify({ bpm: bpm, bar: bar, ticks: ticks });
  }
}

var metronome = new Metronome();
