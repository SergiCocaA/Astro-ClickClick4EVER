import Phaser from "../../lib/phaser.js";
import { CUSTOM_EVENTS } from "../../components/events/event-bus-component.js";
import { ColliderComponent } from "../../components/collider/collider-component.js";
import { HealthComponent } from "../../components/health/health-component.js";

const BOSS_TOTAL_HP = 150;

export class BossEnemy extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y, []);
    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);
    this.body.setSize(80, 80);
    this.body.setOffset(-40, -40);
    this.setDepth(5);

    this.shipSprite = scene.add.sprite(0, 0, "fighter").setScale(2.5);
    this.add(this.shipSprite);

    this.healthComponent = new HealthComponent(BOSS_TOTAL_HP);
    this.colliderComponent = new ColliderComponent(this.healthComponent);
    this.eventBusComponent = null;
    this.phase = 1;
    this.chargeTarget = null;
    this.teleportTimer = 0;
    this.shootTimer = 0;
    this.moveDir = 1;
    this.active = false;
    this.visible = false;
    this.healthBar = null;
    this.healthBarBg = null;

    this.bullets = this.scene.physics.add.group();

    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
  }

  init(eventBusComponent, _extra = null) {
    this.eventBusComponent = eventBusComponent;
  }

  reset() {
    this.healthComponent = new HealthComponent(BOSS_TOTAL_HP);
    this.colliderComponent = new ColliderComponent(this.healthComponent);
    this.phase = 1;
    this.moveDir = 1;
    this.shootTimer = 0;
    this.chargeTarget = null;
    this.teleportTimer = 0;
    this.setPosition(this.scene.scale.width / 2, -60);
    this.setActive(true);
    this.setVisible(true);
    this.setAlpha(1);
    this.shipSprite.setTint(0xffffff);
    this.bullets.clear(true, true);

    this.healthBarBg = this.scene.add.rectangle(this.scene.scale.width / 2, 10, 200, 16, 0x333333).setDepth(10);
    this.healthBar = this.scene.add.rectangle(this.scene.scale.width / 2, 10, 200, 16, 0xff0000).setDepth(10);
  }

  get shipAssetKey() {
    return "fighter";
  }

  get shipDestroyedAnimationKey() {
    return "explosion";
  }

  update(ts, dt) {
    if (!this.active) return;

    if (this.healthComponent.isDead) {
      this._die();
      return;
    }

    const hp = this.healthComponent.life;
    const ratio = hp / BOSS_TOTAL_HP;

    if (this.healthBar) this.healthBar.setScale(ratio, 1);

    if (ratio <= 0.6 && this.phase < 2) { 
      this.phase = 2; 
      this.shipSprite.setTint(0xff8800); 
    }
    if (ratio <= 0.3 && this.phase < 3) {
      this.phase = 3;
      this.shipSprite.setTint(0xff0000);
    }

    const speed = this.phase === 3 ? 180 : 120;
    const topY = 80;

    if (this.phase === 3) {
      this._phase3(dt, speed);
    } else if (this.phase === 2) {
      this._phase2(dt, speed);
    } else {
      this._phase1(dt, speed, topY);
    }
  }

  _phase1(dt, speed, topY) {
    if (this.y < topY) {
      this.y += speed * (dt / 1000);
      return;
    }
    this.x += (speed + 80) * this.moveDir * (dt / 1000);
    if (this.x > this.scene.scale.width - 60) this.moveDir = -1;
    if (this.x < 60) this.moveDir = 1;

    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      this._fireBurst();
      this.shootTimer = 800;
    }
  }

  _phase2(dt, speed) {
    if (!this.chargeTarget) {
      this.chargeTarget = {
        x: Phaser.Math.Between(50, this.scene.scale.width - 50),
        y: Phaser.Math.Between(100, this.scene.scale.height - 100),
      };
    }

    const dx = this.chargeTarget.x - this.x;
    const dy = this.chargeTarget.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 15) {
      this.chargeTarget = null;
      this._fireHardPattern();
      return;
    }

    const chargeSpeed = 500;
    this.x += (dx / dist) * chargeSpeed * (dt / 1000);
    this.y += (dy / dist) * chargeSpeed * (dt / 1000);
  }

  _phase3(dt, speed) {
    this.teleportTimer += dt;
    const angle = this.teleportTimer / 500;
    const radius = 100;
    const centerX = this.scene.scale.width / 2;
    const centerY = 150;

    this.x = centerX + Math.cos(angle) * radius;
    this.y = centerY + Math.sin(angle) * (radius / 2);

    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      this._fireSpiralPattern();
      this.shootTimer = 400;
    }
  }

  _fireBurst() {
    const angles = [-30, -15, 0, 15, 30];
    for (const angle of angles) {
      const rad = Phaser.Math.DegToRad(90 + angle);
      const bullet = this.bullets.create(this.x, this.y + 40, "bullet").setScale(1.3);
      bullet.body.velocity.x = Math.cos(rad) * 250;
      bullet.body.velocity.y = Math.sin(rad) * 250;
      bullet.setDepth(5);
      this.scene.time.delayedCall(3000, () => bullet.destroy());
    }
  }

  _fireHardPattern() {
    const totalBullets = 16;
    for (let i = 0; i < totalBullets; i++) {
      const angle = (360 / totalBullets) * i;
      const rad = Phaser.Math.DegToRad(angle);
      const bullet = this.bullets.create(this.x, this.y, "bullet").setScale(1.2).setTint(0xff8800);
      bullet.body.velocity.x = Math.cos(rad) * 320;
      bullet.body.velocity.y = Math.sin(rad) * 320;
      bullet.setDepth(5);
      this.scene.time.delayedCall(3000, () => bullet.destroy());
    }
  }

  _fireSpiralPattern() {
    const baseAngle = (this.teleportTimer / 100) % 360;
    const bulletsCount = 4;
    for (let i = 0; i < bulletsCount; i++) {
      const angle = baseAngle + (i * 90);
      const rad = Phaser.Math.DegToRad(angle);
      const bullet = this.bullets.create(this.x, this.y, "bullet").setScale(1).setTint(0xff00ff);
      bullet.body.velocity.x = Math.cos(rad) * 350;
      bullet.body.velocity.y = Math.sin(rad) * 350;
      bullet.setDepth(5);
      this.scene.time.delayedCall(3000, () => bullet.destroy());
    }
  }

  _die() {
    this.setActive(false);
    this.setVisible(false);
    this.bullets.clear(true, true);
    if (this.healthBar) { this.healthBar.destroy(); this.healthBar = null; }
    if (this.healthBarBg) { this.healthBarBg.destroy(); this.healthBarBg = null; }
    if (this.eventBusComponent) {
      this.eventBusComponent.emit(CUSTOM_EVENTS.ENEMY_DESTROYED, { constructor: { name: "BossEnemy" } });
      this.eventBusComponent.emit(CUSTOM_EVENTS.BOSS_KILLED);
    }
  }
}
