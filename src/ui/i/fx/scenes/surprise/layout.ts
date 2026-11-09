/** Where a surprise scene's panels hang, and the ink colour its drawings share. */
export const INK = '#0b0a10';
/** The establishing panel, high on the page. */
export const TOP = { y: 27, w: 'min(90vw, 600px)', h: 'min(36vh, 330px)' };
/** The action panel below it. */
export const BOT = { y: 63, w: 'min(80vw, 480px)', h: 'min(30vh, 270px)' };
/** One tall panel instead of two. */
export const TALL = { y: 44, w: 'min(88vw, 540px)', h: 'min(64vh, 580px)' };
/** Two small panels side by side under TOP. */
export const LEFT = { x: 28, y: 63, w: 'min(44vw, 290px)', h: 'min(28vh, 250px)' };
export const RIGHT = { x: 72, y: 63, w: 'min(44vw, 290px)', h: 'min(28vh, 250px)' };
