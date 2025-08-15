// Cute emojis to make the app more fun for Braylee!

const party = ['🎉','🎊','🥳','✨','🌟'];
const hearts = ['💖','💗','💞','💜','🩷'];
const cute = ['🦄','🧸','🦋','🌈','🐱'];
const encourage = ['💪','😊','👍','🌈','✨'];
const retry = ['🔁','🔄','↩️'];
const home = ['🏠','🏡'];
const nextArrow = ['➡️','👉'];
const check = ['✅','✔️'];

function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

export const emoji = {
  party: () => pick(party),
  heart: () => pick(hearts),
  cute: () => pick(cute),
  encourage: () => pick(encourage),
  retry: () => pick(retry),
  home: () => pick(home),
  next: () => pick(nextArrow),
  check: () => pick(check),
};

