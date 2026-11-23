export interface Objective {
  area: string;
  title: string;
  hint: string;
  dialogue: string;
}

export const OBJECTIVES: Objective[] = [
  { area: 'השכונה', title: 'חפשו רמז ליד הבית', hint: 'משהו קטן נשאר ליד השער', dialogue: 'רצועה בלי כלב. התחלה מבטיחה, אורי.' },
  { area: 'השכונה', title: 'דברו עם השכנה', hint: 'השכנה ראתה הכול. כרגיל.', dialogue: 'הוא רץ לפארק! או שזה היה שקית. קשה לדעת בשעה כזאת.' },
  { area: 'הפארק', title: 'מצאו את הצעצוע של קרמבו', hint: 'עקבו אחרי עקבות הכפות אל הפארק', dialogue: 'הכדור שלו! קרמבו בטוח היה פה.' },
  { area: 'החניון', title: 'בדקו את שקית החטיפים', hint: 'משהו מרשרש ליד החניון', dialogue: 'ביסלי על הרצפה? כן, זו בהחלט העבודה של קרמבו.' },
  { area: 'הגינה', title: 'מצאו את קרמבו', hint: 'בדקו את מקום המסתור בגינה', dialogue: 'קרמבו! אל תזוז. לא, באמת, אל תזוז!' },
  { area: 'הגינה', title: 'לוו את קרמבו הביתה', hint: 'הגיעו יחד לשער המואר', dialogue: 'בוא הביתה, גיבור. לא מספרים לאמא על הצבועים.' },
];

export const SAVE_KEY = 'find-krembo-save-v1';

export function readCheckpoint(value: string | null): number | null {
  if (!value) return null;
  try {
    const data: unknown = JSON.parse(value);
    if (typeof data !== 'object' || data === null || !('stage' in data)) return null;
    const stage = data.stage;
    return typeof stage === 'number' && Number.isInteger(stage) && stage >= 0 && stage < OBJECTIVES.length - 1 ? stage : null;
  } catch {
    return null;
  }
}