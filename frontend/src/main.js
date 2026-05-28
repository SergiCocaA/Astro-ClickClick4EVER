import Phaser from './lib/phaser.js';
import { BootScene } from './scenes/boot-scene.js';
import { MenuScene } from './scenes/menu-scene.js';
import { ShopScene } from './scenes/shop-scene.js';
import { BriefingScene } from './scenes/briefing-scene.js';
import { PreloadScene } from './scenes/preload-scene.js';
import { GameScene } from './scenes/game-scene.js';
import { LeaderboardScene } from './scenes/leaderboard-scene.js';
import { HelpScene } from './scenes/help-scene.js';

const game = new Phaser.Game({
  type: Phaser.CANVAS,
  roundPixels: true,
  pixelArt: true,
  scale: {
    parent: 'game-container',
    width: 450,
    height: 640,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    mode: Phaser.Scale.HEIGHT_CONTROLS_WIDTH,
  },
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0, x: 0 },
      debug: false,
    },
  },
});

game.scene.add('BootScene', BootScene);
game.scene.add('MenuScene', MenuScene);
game.scene.add('ShopScene', ShopScene);
game.scene.add('BriefingScene', BriefingScene);
game.scene.add('PreloadScene', PreloadScene);
game.scene.add('GameScene', GameScene);
game.scene.add('LeaderboardScene', LeaderboardScene);
game.scene.add('HelpScene', HelpScene);

let gameStarted = false;

window.__onLogin = (data) => {
  if (!gameStarted) {
    gameStarted = true;
    game.scene.start('BootScene', data);
  } else {
    const menu = game.scene.getScene('MenuScene');
    if (menu && menu.scene.isActive()) {
      menu.scene.restart(data);
    } else {
      game.scene.start('MenuScene', data);
    }
  }
};

// If login data already exists before game boot (e.g. fast connection)
if (window.__jugadorData) {
  window.__onLogin(window.__jugadorData);
}
