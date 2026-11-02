// Global Phaser from CDN
import Config from './config.js';

export default class Game {
  constructor() {
    new Phaser.Game(Config);
  }

  resize() {
    let canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
    }
  }
}

//event windows on load
window.onload = () => {
    const game = new Game();
    game.resize();
    window.addEventListener('resize', game.resize, false);
}