import Phaser from 'phaser';
import { makeTextures, drawWorld } from './art';
import { GameAudio } from './audio';
import { OBJECTIVES } from './progress';
import type { GameBridge } from './types';

const WORLD_WIDTH = 3840;
const WORLD_HEIGHT = 720;
const TARGETS = [
  { x: 360, y: 460, texture: 'clue' },
  { x: 730, y: 310, texture: 'neighbor' },
  { x: 1430, y: 440, texture: 'ball' },
  { x: 2360, y: 460, texture: 'snack' },
  { x: 3200, y: 330, texture: 'dog' },
  { x: 3670, y: 350, texture: 'clue' },
];

interface Hyena {
  sprite: Phaser.Physics.Arcade.Sprite;
  origin: number;
  direction: number;
  speed: number;
  state: 'patrol' | 'investigate' | 'chase';
  targetX: number;
  targetY: number;
  until: number;
}

export class RescueScene extends Phaser.Scene {
  private bridge: GameBridge;
  private audio = new GameAudio();
  private player!: Phaser.Physics.Arcade.Sprite;
  private dog!: Phaser.Physics.Arcade.Sprite;
  private target!: Phaser.GameObjects.Image;
  private marker!: Phaser.GameObjects.Arc;
  private beam!: Phaser.GameObjects.Graphics;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private hyenas: Hyena[] = [];
  private bushes = [{ x: 1130, y: 492 }, { x: 2020, y: 500 }, { x: 3000, y: 490 }, { x: 3430, y: 495 }];
  private stage = 0;
  private hearts = 3;
  private stamina = 100;
  private flashlight = true;
  private distractions = 3;
  private facing = new Phaser.Math.Vector2(1, 0);
  private invulnerableUntil = 0;
  private hudAt = 0;
  private barkAt = 0;
  private lastWarning = 0;
  private finished = false;
  private dizzyRemaining = 0;

  constructor(bridge: GameBridge) {
    super('rescue');
    this.bridge = bridge;
  }

  create() {
    this.audio.muted = this.bridge.muted;
    makeTextures(this);
    drawWorld(this);
    this.physics.world.setBounds(0, 190, WORLD_WIDTH, WORLD_HEIGHT - 200);
    this.obstacles = this.physics.add.staticGroup();
    this.makeScenery();
    this.stage = this.bridge.startStage;
    this.dizzyRemaining = this.stage === 0 ? 14000 : 0;
    const spawn = this.stage === 0 ? { x: 140, y: 450 } : { x: TARGETS[this.stage - 1].x + 45, y: TARGETS[this.stage - 1].y };
    this.player = this.physics.add.sprite(spawn.x, spawn.y, 'uri').setDepth(10).setCollideWorldBounds(true);
    this.player.body!.setSize(25, 22).setOffset(11, 34);
    this.physics.add.collider(this.player, this.obstacles);
    this.dog = this.physics.add.sprite(0, 0, 'dog').setDepth(9).setVisible(false).setActive(false);
    this.dog.body!.enable = false;
    this.target = this.add.image(0, 0, 'clue').setDepth(5);
    this.marker = this.add.circle(0, 0, 24, 0xffd778, 0.13).setStrokeStyle(2, 0xffd778, 0.9).setDepth(4);
    this.tweens.add({ targets: this.marker, scale: 1.25, alpha: 0.45, duration: 750, yoyo: true, repeat: -1 });
    this.beam = this.add.graphics().setDepth(8);
    this.createHyena(1540, 315, 62);
    this.createHyena(2200, 380, 85);
    this.createHyena(2680, 330, 72);
    this.createHyena(3360, 430, 80);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setBackgroundColor('#203b49');
    this.showTarget();
    this.bridge.onDialogue('אורי', this.stage ? 'אוקיי, חזרנו לתוכנית. קרמבו, אני בדרך!' : 'קרמבו?! איפה אתה?! היין האדום והתרופות היו רעיון גרוע...');
    if (this.stage === 0) {
      this.time.delayedCall(5000, () => {
        if (this.stage === 0) this.bridge.onDialogue('אורי', 'הרופא אמר בלי יין. השכנה אמרה ימינה. נדמה לי שהשיח אמר שמאלה.');
      });
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.audio.destroy());
  }

  private makeScenery() {
    const g = this.add.graphics().setDepth(2);
    const cars = [
      { x: 560, y: 540, color: 0x7f9da3 }, { x: 1820, y: 275, color: 0xd68368 },
      { x: 2180, y: 535, color: 0xd3c6a9 }, { x: 2730, y: 265, color: 0x849f95 },
      { x: 3480, y: 545, color: 0xb47c6a },
    ];
    cars.forEach(({ x, y, color }) => {
      g.fillStyle(0x10232d, 0.4).fillRoundedRect(x - 59, y - 22, 126, 54, 14);
      g.fillStyle(color).fillRoundedRect(x - 60, y - 28, 120, 50, 13);
      g.fillStyle(0x344c56).fillRoundedRect(x - 32, y - 24, 62, 42, 8);
      g.fillStyle(0x8db1af, 0.7).fillRoundedRect(x - 27, y - 19, 24, 32, 4).fillRoundedRect(x + 3, y - 19, 22, 32, 4);
      g.fillStyle(0xffdf96).fillRect(x + 54, y - 20, 5, 9).fillRect(x + 54, y + 7, 5, 9);
      this.addObstacle(x, y, 120, 50);
    });
    this.bushes.forEach(({ x, y }) => {
      g.fillStyle(0x1d3d37, 0.5).fillEllipse(x, y + 15, 110, 30);
      g.fillStyle(0x3e775e).fillCircle(x - 30, y, 26).fillCircle(x, y - 8, 31).fillCircle(x + 30, y, 25);
      g.fillStyle(0x65a17b).fillCircle(x - 12, y - 14, 14).fillCircle(x + 24, y - 7, 11);
    });
    g.fillStyle(0xd6aa65).fillRoundedRect(3600, 245, 12, 125, 3).fillRoundedRect(3750, 245, 12, 125, 3);
    g.lineStyle(6, 0xe9c786).lineBetween(3606, 245, 3756, 245);
    g.fillStyle(0xffda83, 0.12).fillCircle(3678, 340, 82);
    g.fillStyle(0xf6d391).fillRoundedRect(155, 275, 116, 35, 5);
    g.fillStyle(0x3a625d).fillRoundedRect(162, 282, 102, 21, 3);
    this.add.text(213, 293, 'מודיעין', { fontFamily: 'Arial', fontSize: '15px', color: '#f8eaca' }).setOrigin(0.5).setDepth(3);
    this.add.text(1220, 200, 'PARK', { fontFamily: 'Arial', fontSize: '17px', color: '#d3dcbe', fontStyle: 'bold' }).setDepth(3);
    this.add.text(2420, 200, 'P', { fontFamily: 'Arial', fontSize: '20px', color: '#d3dcbe', fontStyle: 'bold' }).setDepth(3);
  }

  private addObstacle(x: number, y: number, width: number, height: number) {
    const zone = this.add.zone(x, y, width, height);
    this.physics.add.existing(zone, true);
    this.obstacles.add(zone);
  }

  private createHyena(x: number, y: number, speed: number) {
    const sprite = this.physics.add.sprite(x, y, 'hyena').setDepth(9).setCollideWorldBounds(true);
    sprite.body!.setSize(38, 24).setOffset(10, 20);
    this.physics.add.collider(sprite, this.obstacles);
    this.hyenas.push({ sprite, origin: x, direction: Math.random() > 0.5 ? 1 : -1, speed, state: 'patrol', targetX: x, targetY: y, until: 0 });
  }

  private showTarget() {
    const target = TARGETS[this.stage];
    this.target.setPosition(target.x, target.y).setTexture(target.texture).setVisible(this.stage !== 5);
    this.marker.setPosition(target.x, target.y).setVisible(true);
    if (this.stage === 4) this.target.setVisible(false);
  }

  private interact() {
    const target = TARGETS[this.stage];
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, target.x, target.y) > 85) {
      this.bridge.onDialogue('אורי', 'צריך להתקרב קצת. העיניים שלי לא מה שהיו פעם.');
      return;
    }
    if (this.stage === 5) {
      if (Phaser.Math.Distance.Between(this.dog.x, this.dog.y, target.x, target.y) > 140) {
        this.bridge.onDialogue('אורי', 'רגע, קרמבו צריך להגיע גם. זו לא תחרות ריצה!');
        return;
      }
      this.finished = true;
      this.audio.play('win');
      this.bridge.onVictory();
      return;
    }
    if (this.stage === 4 && this.bridge.input.held.has('shift')) {
      this.bridge.onDialogue('אורי', 'בשקט... הוא ייבהל אם ארוץ אליו.');
      return;
    }
    const previous = this.stage;
    this.audio.play(previous === 4 ? 'bark' : 'clue');
    this.bridge.onDialogue(previous === 1 ? 'השכנה' : previous === 4 ? 'קרמבו' : 'אורי', previous === 4 ? 'הב! הב! (מצאתי אותך, אבא!)' : OBJECTIVES[previous].dialogue);
    this.stage++;
    if (this.stage === 5) {
      this.dog.setPosition(target.x, target.y + 35).setVisible(true).setActive(true);
      this.dog.body!.enable = true;
      this.physics.add.collider(this.dog, this.obstacles);
    } else {
      this.bridge.onCheckpoint(this.stage);
    }
    this.showTarget();
  }

  private throwDistraction(time: number) {
    if (this.distractions <= 0) {
      this.bridge.onDialogue('אורי', 'נגמרו לי הרשרשנים. הגיע הזמן להיות בשקט.');
      return;
    }
    this.distractions--;
    const x = Phaser.Math.Clamp(this.player.x + this.facing.x * 240, 40, WORLD_WIDTH - 40);
    const y = Phaser.Math.Clamp(this.player.y + this.facing.y * 240, 210, 680);
    this.audio.play('throw');
    const ring = this.add.circle(x, y, 12).setStrokeStyle(3, 0xffd778).setDepth(12);
    this.tweens.add({ targets: ring, scale: 5, alpha: 0, duration: 1200, onComplete: () => ring.destroy() });
    this.hyenas.forEach((hyena) => {
      if (Phaser.Math.Distance.Between(hyena.sprite.x, hyena.sprite.y, x, y) < 510) {
        hyena.state = 'investigate';
        hyena.targetX = x;
        hyena.targetY = y;
        hyena.until = time + 4000;
      }
    });
    this.bridge.onDialogue('אורי', 'לך תבדוק את זה. זה בטח משהו ממש טעים.');
  }

  update(time: number, delta: number) {
    if (this.finished) return;
    const input = this.bridge.input;
    this.audio.muted = this.bridge.muted;
    const x = Number(input.held.has('arrowright') || input.held.has('d')) - Number(input.held.has('arrowleft') || input.held.has('a'));
    const y = Number(input.held.has('arrowdown') || input.held.has('s')) - Number(input.held.has('arrowup') || input.held.has('w'));
    const moving = x !== 0 || y !== 0;
    const running = moving && input.held.has('shift') && this.stamina > 1;
    this.dizzyRemaining = Math.max(0, this.dizzyRemaining - delta);
    const dizzy = this.dizzyRemaining > 0;
    const velocity = new Phaser.Math.Vector2(x, y).normalize();
    if (moving) this.facing.copy(velocity);
    this.player.setVelocity(velocity.x * (running ? 225 : 135), velocity.y * (running ? 225 : 135));
    this.player.setFlipX(this.facing.x < 0);
    this.player.setAngle((moving ? Math.sin(time / (running ? 75 : 125)) * 4 : 0) + (dizzy ? Math.sin(time / 330) * 8 : 0));
    this.stamina = Phaser.Math.Clamp(this.stamina + (running ? -24 : 15) * delta / 1000, 0, 100);
    if (input.interact) { input.interact = false; this.interact(); }
    if (input.flashlight) { input.flashlight = false; this.flashlight = !this.flashlight; }
    if (input.distract) { input.distract = false; this.throwDistraction(time); }
    const hidden = !running && this.bushes.some((bush) => Phaser.Math.Distance.Between(this.player.x, this.player.y, bush.x, bush.y) < 52);
    this.beam.clear();
    if (this.flashlight) {
      const angle = Math.atan2(this.facing.y, this.facing.x) + (dizzy ? Math.sin(time / 500) * 0.12 : 0);
      this.beam.fillStyle(0xffe7a9, 0.12).slice(this.player.x, this.player.y, 210, angle - 0.36, angle + 0.36, false).fillPath();
      this.beam.fillStyle(0xfff0c1, 0.06).fillCircle(this.player.x, this.player.y, 70);
    }
    let alert = false;
    this.hyenas.forEach((hyena) => {
      const distance = Phaser.Math.Distance.Between(hyena.sprite.x, hyena.sprite.y, this.player.x, this.player.y);
      const detection = hidden ? 45 : running ? 255 : this.flashlight ? 180 : 105;
      if (distance < detection && (hyena.state !== 'investigate' || distance < 65)) {
        if (hyena.state !== 'chase' && time - this.lastWarning > 3000) {
          this.lastWarning = time;
          this.audio.play('alert');
          this.bridge.onDialogue('צבוע', 'רגע... זה ריח של אבא בלחץ?');
        }
        hyena.state = 'chase';
        hyena.until = time + 2200;
      }
      if (hyena.state === 'chase') {
        alert = true;
        hyena.targetX = this.player.x;
        hyena.targetY = this.player.y;
        if (distance > detection * 1.5 && time > hyena.until) hyena.state = 'patrol';
      }
      if (hyena.state === 'investigate' && (time > hyena.until || Phaser.Math.Distance.Between(hyena.sprite.x, hyena.sprite.y, hyena.targetX, hyena.targetY) < 25)) hyena.state = 'patrol';
      if (hyena.state === 'patrol') {
        if (hyena.sprite.x > hyena.origin + 150 || hyena.sprite.x < hyena.origin - 150 || (hyena.sprite.body as Phaser.Physics.Arcade.Body).blocked.left || (hyena.sprite.body as Phaser.Physics.Arcade.Body).blocked.right) hyena.direction *= -1;
        hyena.sprite.setVelocity(hyena.direction * hyena.speed * 0.55, 0);
      } else {
        const direction = new Phaser.Math.Vector2(hyena.targetX - hyena.sprite.x, hyena.targetY - hyena.sprite.y).normalize();
        hyena.sprite.setVelocity(direction.x * hyena.speed * (hyena.state === 'chase' ? 1.35 : 0.85), direction.y * hyena.speed * (hyena.state === 'chase' ? 1.35 : 0.85));
      }
      hyena.sprite.setFlipX(hyena.sprite.body!.velocity.x < 0);
      hyena.sprite.setAngle(Math.sin(time / 160) * 3);
      const dogDistance = this.stage === 5 ? Phaser.Math.Distance.Between(hyena.sprite.x, hyena.sprite.y, this.dog.x, this.dog.y) : Infinity;
      if ((distance < 34 || dogDistance < 32) && time > this.invulnerableUntil) this.hit(time);
    });
    if (this.stage === 5) {
      const dogDistance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.dog.x, this.dog.y);
      if (dogDistance > 48) {
        const direction = new Phaser.Math.Vector2(this.player.x - this.dog.x, this.player.y - this.dog.y).normalize();
        this.dog.setVelocity(direction.x * 155, direction.y * 155).setFlipX(direction.x < 0);
      } else this.dog.setVelocity(0);
      if (time > this.barkAt) { this.barkAt = time + 9500; this.audio.play('bark'); }
    }
    this.player.setAlpha(time < this.invulnerableUntil && Math.floor(time / 120) % 2 ? 0.45 : 1);
    const currentTarget = TARGETS[this.stage];
    const nearby = Phaser.Math.Distance.Between(this.player.x, this.player.y, currentTarget.x, currentTarget.y) < 85;
    if (time > this.hudAt) {
      this.hudAt = time + 120;
      this.bridge.onHud({ stage: this.stage, stamina: this.stamina, hearts: this.hearts, flashlight: this.flashlight, distractions: this.distractions, hidden, alert, dizzy, prompt: nearby ? (this.stage === 5 ? 'לצאת יחד הביתה' : this.stage === 4 ? 'לקרוא לקרמבו בשקט' : 'לבדוק מקרוב') : '' });
    }
  }

  private hit(time: number) {
    this.hearts--;
    this.audio.play('hurt');
    this.invulnerableUntil = time + 3500;
    this.bridge.onDialogue('אורי', 'איי! הצבוע הזה ממש לא מכבד מרחב אישי.');
    if (this.hearts <= 0) {
      this.finished = true;
      this.bridge.onFailure();
      return;
    }
    const checkpoint = this.stage === 0 ? { x: 140, y: 450 } : TARGETS[Math.min(this.stage - 1, 3)];
    this.player.setPosition(checkpoint.x + 45, checkpoint.y).setVelocity(0);
    if (this.stage === 5) this.dog.setPosition(this.player.x - 45, this.player.y);
    this.hyenas.forEach((hyena) => { hyena.state = 'patrol'; hyena.sprite.setPosition(hyena.origin, 340); });
  }
}