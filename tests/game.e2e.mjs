import { chromium, expect } from '@playwright/test';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--disable-background-timer-throttling'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

async function moveScene(x, y, dog = false) {
  await page.locator('.game-canvas').evaluate((host, position) => {
    const key = Object.keys(host).find((name) => name.startsWith('__reactFiber'));
    const scene = host[key].return.memoizedState.next.memoizedState.current.scene.getScene('rescue');
    scene.invulnerableUntil = Number.MAX_SAFE_INTEGER;
    scene.player.setPosition(position.x, position.y).setVelocity(0);
    if (position.dog) scene.dog.setPosition(position.x - 25, position.y);
  }, { x, y, dog });
}

try {
  await page.goto('http://127.0.0.1:5173/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'התחל משחק' }).click();
  await expect(page.getByText('אורי שתה יין אדום', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'יוצאים לחפש' }).click();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByText('אורי קצת מסוחרר')).toBeVisible();
  await page.waitForTimeout(600);
  await page.keyboard.down('d');
  await page.waitForFunction(() => {
    const host = document.querySelector('.game-canvas');
    const key = Object.keys(host).find((name) => name.startsWith('__reactFiber'));
    return host[key].return.memoizedState.next.memoizedState.current.scene.getScene('rescue').player.x >= 290;
  }, null, { timeout: 20000 });
  await page.keyboard.up('d');
  await page.keyboard.press('e');
  await expect(page.locator('.game-heading h2')).toHaveText('דברו עם השכנה');
  await page.keyboard.press('f');
  await page.keyboard.press('Space');
  await expect(page.locator('.control-strip')).toContainText('פנס כבוי');
  await expect(page.locator('.compact-stat').last()).toContainText('7 / 8');
  await page.keyboard.press('Escape');
  await expect(page.getByText('המשחק בהשהיה')).toBeVisible();
  await page.getByRole('button', { name: 'איך משחקים?' }).click();
  await page.getByRole('button', { name: 'הבנתי, חזרה למשחק' }).click();
  await expect(page.getByText('המשחק בהשהיה')).toBeVisible();
  await page.getByRole('button', { name: 'ממשיכים' }).click();
  await expect(page.locator('.game-heading h2')).toHaveText('דברו עם השכנה');
  await page.locator('.game-canvas').evaluate((host) => {
    const key = Object.keys(host).find((name) => name.startsWith('__reactFiber'));
    const scene = host[key].return.memoizedState.next.memoizedState.current.scene.getScene('rescue');
    scene.hearts = 1;
    scene.invulnerableUntil = 0;
    scene.hyenas[0].sprite.setPosition(scene.player.x, scene.player.y);
  });
  await expect(page.getByText('הצבועים ניצחו בסיבוב הזה')).toBeVisible();
  await page.getByRole('button', { name: 'נסו שוב מהמחסום' }).click();
  await expect(page.locator('.game-heading h2')).toHaveText('דברו עם השכנה');

  for (const [x, y, next] of [[730, 310, 'מצאו את הצעצוע של קרמבו'], [1430, 440, 'בדקו את שקית החטיפים'], [2360, 460, 'מצאו את קרמבו'], [3430, 495, 'לוו את קרמבו הביתה']]) {
    if (next === 'לוו את קרמבו הביתה') {
      await expect(page.locator('.mission')).toContainText('האירו עליהם עם הפנס');
      await page.locator('.game-canvas').evaluate((host) => {
        const key = Object.keys(host).find((name) => name.startsWith('__reactFiber'));
        const scene = host[key].return.memoizedState.next.memoizedState.current.scene.getScene('rescue');
        scene.player.setPosition(3250, 495).setVelocity(0);
        scene.facing.set(1, 0);
        scene.flashlight = false;
      });
      await page.waitForTimeout(150);
      expect(await page.locator('.game-canvas').evaluate((host) => {
        const key = Object.keys(host).find((name) => name.startsWith('__reactFiber'));
        return host[key].return.memoizedState.next.memoizedState.current.scene.getScene('rescue').target.visible;
      })).toBe(false);
      await page.locator('.game-canvas').evaluate((host) => {
        const key = Object.keys(host).find((name) => name.startsWith('__reactFiber'));
        host[key].return.memoizedState.next.memoizedState.current.scene.getScene('rescue').flashlight = true;
      });
      await expect.poll(() => page.locator('.game-canvas').evaluate((host) => {
        const key = Object.keys(host).find((name) => name.startsWith('__reactFiber'));
        return host[key].return.memoizedState.next.memoizedState.current.scene.getScene('rescue').target.visible;
      })).toBe(true);
    }
    await moveScene(x, y);
    await page.keyboard.press('e');
    await expect(page.locator('.game-heading h2')).toHaveText(next);
  }
  await moveScene(110, 230);
  await page.keyboard.press('e');
  await expect(page.getByText('קרמבו נמצא!!!')).toHaveCount(0);
  await moveScene(110, 230, true);
  await page.keyboard.press('e');
  await expect(page.getByText('קרמבו נמצא!!!')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('find-krembo-save-v1'))).toBeNull();
  await page.getByRole('button', { name: 'משחק חדש' }).click();
  await expect(page.locator('.game-heading h2')).toHaveText('חפשו רמז ליד הבית');
  await moveScene(420, 540);
  await page.keyboard.down('d');
  await page.waitForTimeout(1800);
  await page.keyboard.up('d');
  const playerX = await page.locator('.game-canvas').evaluate((host) => {
    const key = Object.keys(host).find((name) => name.startsWith('__reactFiber'));
    return host[key].return.memoizedState.next.memoizedState.current.scene.getScene('rescue').player.x;
  });
  expect(playerX).toBeLessThan(500);
  await page.screenshot({ path: join(tmpdir(), 'krembo-desktop.png') });

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'למעלה' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: join(tmpdir(), 'krembo-mobile.png') });

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const mobile = await mobileContext.newPage();
  await mobile.goto('http://127.0.0.1:5173/');
  await mobile.getByRole('button', { name: 'התחל משחק' }).tap();
  await mobile.getByRole('button', { name: 'יוצאים לחפש' }).tap();
  const right = mobile.getByRole('button', { name: 'ימינה' });
  await expect(right).toBeVisible();
  await right.scrollIntoViewIfNeeded();
  const bounds = await right.boundingBox();
  const frameBounds = await mobile.locator('.game-frame').boundingBox();
  expect(bounds.y).toBeGreaterThanOrEqual(frameBounds.y + frameBounds.height);
  const touch = await mobileContext.newCDPSession(mobile);
  const playerPosition = () => mobile.locator('.game-canvas').evaluate((host) => {
    const key = Object.keys(host).find((name) => name.startsWith('__reactFiber'));
    return host[key].return.memoizedState.next.memoizedState.current.scene.getScene('rescue').player.x;
  });
  const startX = await playerPosition();
  const scrollY = await mobile.evaluate(() => window.scrollY);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }] });
  await mobile.waitForTimeout(1200);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const endX = await playerPosition();
  expect(endX).toBeGreaterThan(startX + 30);
  await mobile.waitForTimeout(300);
  expect(await playerPosition()).toBeCloseTo(endX, 0);
  expect(await mobile.evaluate(() => ({ selection: window.getSelection().toString(), scroll: window.scrollY }))).toEqual({ selection: '', scroll: scrollY });
  expect(await right.evaluate((button) => getComputedStyle(button).userSelect)).toBe('none');
  expect(await right.evaluate((button) => button.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })))).toBe(false);
  await mobile.getByRole('button', { name: 'פנס' }).tap();
  await expect(mobile.locator('.control-strip')).toContainText('פנס כבוי');
  await mobile.getByRole('button', { name: 'הסחת דעת' }).tap();
  await expect(mobile.locator('.compact-stat').last()).toContainText('7 / 8');
  await mobile.getByRole('button', { name: 'השהיה' }).tap();
  await expect(mobile.getByText('המשחק בהשהיה')).toBeVisible();
  await mobile.getByRole('button', { name: 'ממשיכים' }).tap();

  await mobile.locator('.game-canvas').evaluate((host) => {
    const key = Object.keys(host).find((name) => name.startsWith('__reactFiber'));
    host[key].return.memoizedState.next.memoizedState.current.scene.getScene('rescue').player.setPosition(360, 460).setVelocity(0);
  });
  const mobilePrompt = mobile.getByRole('button', { name: 'לבדוק מקרוב' }).filter({ has: mobile.locator('svg') });
  await expect(mobile.locator('.touch-prompt')).toBeVisible();
  await expect(mobile.locator('.keyboard-prompt')).toBeHidden();
  await expect(mobilePrompt).toHaveCount(2);
  await mobile.screenshot({ path: join(tmpdir(), 'krembo-touch-prompt.png') });
  await mobile.locator('.touch-prompt').tap();
  await expect(mobile.locator('.game-heading h2')).toHaveText('דברו עם השכנה');
  await mobile.locator('.game-canvas').evaluate((host) => {
    const key = Object.keys(host).find((name) => name.startsWith('__reactFiber'));
    host[key].return.memoizedState.next.memoizedState.current.scene.getScene('rescue').player.setPosition(730, 310).setVelocity(0);
  });
  await expect(mobile.locator('.touch-interact')).toHaveAttribute('aria-label', 'לבדוק מקרוב');
  await mobile.locator('.touch-interact').tap();
  await expect(mobile.locator('.game-heading h2')).toHaveText('מצאו את הצעצוע של קרמבו');
  await mobileContext.close();
  expect(errors).toEqual([]);
  console.log('Gameplay, collision, controls, pause/help, checkpoints, victory, restart and mobile touch controls passed. Objective positions were set directly after the first clue.');
} finally {
  await browser.close();
}