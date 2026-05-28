import Phaser from "../../lib/phaser.js";
import { CUSTOM_EVENTS } from "../../components/events/event-bus-component.js";
import { ColliderComponent } from "../../components/collider/collider-component.js";
import { HealthComponent } from "../../components/health/health-component.js";

const BOSS_TOTAL_HP = 50;

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

    this.healthBarBg = this.scene.add.rectangle(this.scale.width / 2, 10, 200, 16, 0x333333).setDepth(10);
    this.healthBar = this.scene.add.rectangle(this.scale.width / 2, 10, 200, 16, 0xff0000).setDepth(10);
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

    if (ratio <= 0.5 && this.phase < 2) { 
      this.phase = 2; 
      this.shipSprite.setTint(0xff8800); 
    }

    const speed = 100;
    const topY = 80;

    if (this.phase === 2) {
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
    this.x += (speed + 50) * this.moveDir * (dt / 1000);
    if (this.x > this.scene.scale.width - 60) this.moveDir = -1;
    if (this.x < 60) this.moveDir = 1;

    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      this._fireBurst();
      this.shootTimer = 1000;
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

    const chargeSpeed = 450;
    this.x += (dx / dist) * chargeSpeed * (dt / 1000);
    this.y += (dy / dist) * chargeSpeed * (dt / 1000);
  }

  _fireBurst() {
    const angles = [-20, -10, 0, 10, 20];
    for (const angle of angles) {
      const rad = Phaser.Math.DegToRad(90 + angle);
      const bullet = this.scene.physics.add.sprite(this.x, this.y + 40, "bullet").setScale(1.2);
      bullet.body.velocity.x = Math.cos(rad) * 220;
      bullet.body.velocity.y = Math.sin(rad) * 220;
      bullet.setDepth(5);
      this.scene.time.delayedCall(3000, () => bullet.destroy());
    }
  }

  _fireHardPattern() {
    const totalBullets = 12;
    for (let i = 0; i < totalBullets; i++) {
      const angle = (360 / totalBullets) * i;
      const rad = Phaser.Math.DegToRad(angle);
      const bullet = this.scene.physics.add.sprite(this.x, this.y, "bullet").setScale(1).setTint(0xff8800);
      bullet.body.velocity.x = Math.cos(rad) * 280;
      bullet.body.velocity.y = Math.sin(rad) * 280;
      bullet.setDepth(5);
      this.scene.time.delayedCall(3000, () => bullet.destroy());
    }
  }

  _die() {
    this.setActive(false);
    this.setVisible(false);
    if (this.healthBar) { this.healthBar.destroy(); this.healthBar = null; }
    if (this.healthBarBg) { this.healthBarBg.destroy(); this.healthBarBg = null; }
    if (this.eventBusComponent) {
      this.eventBusComponent.emit(CUSTOM_EVENTS.ENEMY_DESTROYED, { constructor: { name: "BossEnemy" } });
      this.eventBusComponent.emit(CUSTOM_EVENTS.BOSS_KILLED);
    }
  }
}
