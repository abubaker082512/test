import Preload from './base_scenes/Preload.js';
import Boot from './base_scenes/Boot.js';
import Game from './base_scenes/Game.js';

export default {
    type: Phaser.WEBGL,
    parent: "slot-game-phaser3",
    width: 1280,
    height: 720,
    physics : {
        default : 'arcade',
        arcade : {
            debug : false
        }
    },
    fps : {
        min: 30,
        target: 60
    },
    scene : [Preload, Boot, Game]
};