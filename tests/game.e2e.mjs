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
  await page.getByRole('button', { name: 'יוצאים לחפש' }).click();
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForTimeout(600);
  await page.keyboard.down('d');
  await page.waitForTimeout(1500);
  await page.keyboard.up('d');
  await page.keyboard.press('e');
  await expect(page.locator('.game-heading h2')).toHaveText('דברו עם השכנה');
  await page.keyboard.press('f');
  await page.keyboard.press('Space');
  await expect(page.locator('.control-strip')).toContainText('פנס כבוי');
  await expect(page.locator('.compact-stat').last()).toContainText('2 / 3');
  await page.keyboard.press('Escape');
  await expect(page.getByText('המשחק בהשהיה')).toBeVisible();
  await page.getByRole('button', { name: 'איך משחקים?' }).click();
  await page.getByRole('button', { name: 'הבנתי, חזרה למשחק' }).click();
  await expect(page.getByText('המשחק בהשהיה')).toBeVisible();
  await page.getByRole('button', { name: 'ממשיכים' }).click();
  await expect(page.locator('.game-heading h2')).toHaveText('דברו עם השכנה');

  for (const [x, y, next] of [[730, 310, 'מצאו את הצעצוע של קרמבו'], [1430, 440, 'בדקו את שקית החטיפים'], [2360, 460, 'מצאו את קרמבו'], [3200, 330, 'לוו את קרמבו הביתה']]) {
    await moveScene(x, y);
    await page.keyboard.press('e');
    await expect(page.locator('.game-heading h2')).toHaveText(next);
  }
  await moveScene(3670, 350);
  await page.keyboard.press('e');
  await expect(page.getByText('קרמבו נמצא!!!')).toHaveCount(0);
  await moveScene(3670, 350, true);
  await page.keyboard.press('e');
  await expect(page.getByText('קרמבו נמצא!!!')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('find-krembo-save-v1'))).toBeNull();
  await page.getByRole('button', { name: 'משחק חדש' }).click();
  await expect(page.locator('.game-heading h2')).toHaveText('חפשו רמז ליד הבית');
  await page.screenshot({ path: join(tmpdir(), 'krembo-desktop.png') });

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'למעלה' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: join(tmpdir(), 'krembo-mobile.png') });
  expect(errors).toEqual([]);
  console.log('Gameplay, controls, pause/help, checkpoints, victory, restart and mobile layout passed. Objective positions were set directly after the first clue.');
} finally {
  await browser.close();
}