var PPS = 20; // pixels per square (in pixels)
var DRAWLOOP_INTERVAL = 20; // (in milliseconds)
var GAMELOOP_INTERVAL = 200; // (in milliseconds)

function Game(canvasElement, buttonElement) {
  this.canvas = canvasElement;
  this.context = canvasElement.getContext('2d');
  this.button = buttonElement;
  this.grid = document.createElement('canvas');

  this.map = new Map();
  this.mobile = ('ontouchstart' in window);
  this.started = false;
  this.alreadyVisited = [];

  this.drawGrid();
  this.initDOMEvents();

  this.drawloopInterval = setInterval(this.drawloop.bind(this), DRAWLOOP_INTERVAL);
  this.gameloopInterval = setInterval(this.gameloop.bind(this), GAMELOOP_INTERVAL);

  window.addEventListener('resize', this.drawGrid.bind(this));

  setTimeout(function() {
    document.querySelector('dialog').className = 'fadeout';
  }, 0);
}

Game.prototype = {

  drawGrid: function() {
    // fit canvas fullscreen
    this.grid.width  = this.canvas.width  = window.innerWidth;
    this.grid.height = this.canvas.height = window.innerHeight;

    var ctx = this.grid.getContext('2d');

    ctx.clearRect(0, 0, this.grid.width, this.grid.height);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';

    // draw vertical lines for grid
    for (var x = 0; x < Math.floor(this.canvas.width / PPS) + 1; x++) {
      ctx.moveTo(x * PPS, 0);
      ctx.lineTo(x * PPS, this.canvas.height);
    }

    // draw horizontal lines for grid
    for (var y = 0; y < Math.floor(this.canvas.height / PPS) + 1; y++) {
      ctx.moveTo(0, y * PPS);
      ctx.lineTo(this.canvas.width, y * PPS);
    }

    ctx.stroke();
  },


  drawloop: function() {

    // Convert pixels coords to 'x' and 'y' indexes on the grid
    var cursorX = this.cursor && Math.floor(this.cursor[0] / PPS);
    var cursorY = this.cursor && Math.floor(this.cursor[1] / PPS);

    // 1 - draw grid
    this.context.clearRect(0, 0, this.grid.width, this.grid.height);
    this.context.drawImage(this.grid, 0, 0);

    // 2 - draw square under cursor
    if (this.cursor && !this.mobile) {
      this.context.beginPath();
      this.context.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.context.rect(cursorX * PPS, cursorY * PPS, PPS, PPS);
      this.context.fill();
    }

    // 3 - manage additions and deletions
    this.context.beginPath();
    this.context.fillStyle = 'rgba(0, 0, 0, 1)';

    if (this.click && !this.alreadyVisited[cursorX + '-' + cursorY]) {
      // when mouse is down toggle each square only once
      this.alreadyVisited[cursorX + '-' + cursorY] = true;
      // toggle square (if dead become alive otherwise become dead)
      this.map[this.map.find(cursorX, cursorY) ? 'remove' : 'add'](cursorX, cursorY);
    }

    // 4 - draw squares in map
    this.map.loop(function(x, y) {
      this.context.rect(x * PPS, y * PPS, PPS, PPS);
    }.bind(this));

    this.context.fill();
  },


  gameloop: function() {
    if (!this.started) return;

    var adjacents = new Map();

    // for each cell alive get adjacent cells 'dead' or 'alive'
    this.map.loop(function(x, y) {
      var hasNeighboorAlive;

      // loop through all cardinal directions
      for (var dx = -1; dx < 2; dx++) {
        for (var dy = -1; dy < 2; dy++) {
          if (!(dx === 0 && dy === 0)) {
            // increment neighboor count of current cell
            adjacents.add(x + dx, y + dy, (adjacents.find(x + dx, y + dy) || 0) + 1);
            // remember if our cell has a neighboor 'alive'
            if (this.find(x + dx, y + dy)) hasNeighboorAlive = true;
          }
        }
      }

      // (edge case) if a cell is alone, there's no way to detect it with an adjacent cell
      if (!hasNeighboorAlive) adjacents.add(x, y, 1);
    });

    adjacents.loop(function(x, y, neighboors) {
      // each adjacent cell 'alive' with less than 2 or more than 3 neighboors 'alive' dies
      if (this.map.find(x, y) && [2, 3].indexOf(neighboors) === -1) this.map.remove(x, y);
      // each adjacent cell 'dead' with exactly 3 neighboors 'alive' lives
      if (!this.map.find(x, y) && neighboors === 3) this.map.add(x, y);
    }.bind(this));
  },

  destroy: function() {
    clearInterval(this.drawloopInterval);
    clearInterval(this.gameloopInterval);
    // TODO unbind DOM events
  },

  initDOMEvents: function() {
    var self = this;

      // toggle game (draw/start)
    this.button.addEventListener(this.mobile ? 'touchstart' : 'click', function() {
      self.started = !self.started;
      self.button.innerText = self.started ? 'Stop' : 'Start';
    });

    // set cursor
    document.addEventListener(this.mobile ? 'touchmove' : 'mousemove', function(event) {
      event.preventDefault();
      self.cursor = [
        event.changedTouches ? event.changedTouches[0].pageX : event.pageX,
        event.changedTouches ? event.changedTouches[0].pageY : event.pageY
      ];
    });

    // cancel cursor
    document.addEventListener(this.mobile ? 'touchcancel' : 'mouseout', function() {
      self.cursor = undefined;
    });

    // set click
    document.addEventListener(this.mobile ? 'touchstart' : 'mousedown', function() {
      self.click = true;
      self.cursor = [
        event.changedTouches ? event.changedTouches[0].pageX : event.pageX,
        event.changedTouches ? event.changedTouches[0].pageY : event.pageY
      ];
    });

    // cancel click
    document.addEventListener(this.mobile ? 'touchend' : 'mouseup', function() {
      setTimeout(function() {
        self.click = false;
        self.alreadyVisited = [];
      }, 50);
    });
  }
}


function Map() {
  this.map = [];
}

Map.prototype = {

  loop: function(fn) {
    // loop through all positions of the map "alive"
    for (var x = 0; x < this.map.length; x++) {
      if (!this.map[x]) continue;
      for (var y = 0; y < this.map[x].length; y++) {
        if (this.map[x][y]) fn.call(this, x, y, this.map[x][y]);
      }
    }
  },

  find: function(x, y) {
    return this.map[x] && this.map[x][y];
  },

  add: function(x, y, val) {
    if (!this.map[x]) this.map[x] = [];
    this.map[x][y] = (typeof val === 'undefined') ? true : val;
  },

  remove: function(x, y) {
    if (this.find(x, y)) delete this.map[x][y];
  }
}


// bind polyfill
if (typeof Function.prototype.bind !== 'function') {
  Function.prototype.bind = function(context) {
    var fn = this;
    return function() {
      return fn.apply(context, arguments);
    };
  };
}

// start game
new Game(document.querySelector('canvas'), document.querySelector('button'));
