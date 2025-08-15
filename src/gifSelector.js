// Central place to pick a random celebration or upset GIF.
// Add your actual GIF files under `public/gifs/` and update the arrays below if needed.

// Your files are under public/gifs, so use /gifs/* URLs
const celebrateGifs = [
  '/gifs/goodGif1.gif',
  '/gifs/goodGif2.gif',
  '/gifs/goodGif3.gif',
];

// Note: repo currently has .jpg for oops 1 & 2, .gif for 3
const upsetGifs = [
  '/gifs/oopsGif1.jpg',
  '/gifs/oopsGif2.jpg',
  '/gifs/oopsGif3.gif',
];

function getRandomFrom(list) {
  if (!Array.isArray(list) || list.length === 0) return undefined;
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

export function getRandomCelebrateGif() {
  return getRandomFrom(celebrateGifs);
}

export function getRandomUpsetGif() {
  return getRandomFrom(upsetGifs);
}
