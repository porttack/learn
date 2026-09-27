// Picks messages and builds puzzle sets for the Caesar cipher generator.
// Same schema either way a puzzle gets used: a fixed worksheet's front
// matter (see _data/unplugged/cipher_*.yml) or a freshly generated set.
//
// DOM-free on purpose: tools/check_caesar_cipher.mjs imports this in Node.

import { encrypt, decrypt, allShifts, letterCounts, guessShiftFromFrequency, KEYSPACE } from "./cipher.js";

// 40+ original, school-appropriate lines: CS facts, jokes, and riddles (the
// riddle's question and answer are both part of the one encoded line, so
// decoding delivers the payoff). Letters and spaces only, all uppercase, so
// a shift never has to decide what to do with punctuation.
export const PHRASES = [
  "A BYTE IS EIGHT BITS",
  "THE FIRST COMPUTER BUG WAS A REAL MOTH",
  "WIFI DOES NOT ACTUALLY STAND FOR ANYTHING",
  "THE FIRST PROGRAMMER WAS ADA LOVELACE",
  "A KILOBYTE IS ABOUT ONE THOUSAND BYTES",
  "PYTHON WAS NAMED AFTER A COMEDY SHOW NOT THE SNAKE",
  "THE INTERNET IS NOT THE SAME THING AS THE WEB",
  "BINARY USES ONLY TWO DIGITS ZERO AND ONE",
  "A COMPILER TURNS CODE INTO MACHINE LANGUAGE",
  "THE FIRST EVER WEBSITE IS STILL ONLINE TODAY",
  "QWERTY KEYBOARDS WERE DESIGNED TO SLOW TYPISTS DOWN",
  "A PIXEL IS THE SMALLEST DOT ON YOUR SCREEN",
  "ROBOTS CAN BE PROGRAMMED TO LEARN FROM MISTAKES",
  "THE WORD ROBOT COMES FROM AN OLD WORD FOR FORCED LABOR",
  "COMPUTERS STORE EVERYTHING AS ZEROS AND ONES",
  "AN ALGORITHM IS JUST A SET OF STEPS TO SOLVE A PROBLEM",
  "THE FIRST COMPUTER MOUSE WAS CARVED OUT OF WOOD",
  "A GIGABYTE HOLDS ABOUT ONE BILLION BYTES",
  "MOST COMPUTER CHIPS ARE MADE STARTING FROM SAND",
  "EMAIL IS OLDER THAN THE WORLD WIDE WEB",
  "WHY DO PROGRAMMERS PREFER DARK MODE BECAUSE LIGHT ATTRACTS BUGS",
  "WHY DID THE ROBOT GO ON A DIET IT HAD TOO MANY BYTES",
  "HOW DO YOU COMFORT A JAVASCRIPT BUG YOU CONSOLE IT",
  "WHAT DID THE COMPUTER ORDER FOR LUNCH A BYTE TO EAT",
  "WHY WAS THE FUNCTION SAD NOBODY EVER CALLED IT",
  "WHAT IS A ROBOTS FAVORITE KIND OF MUSIC HEAVY METAL",
  "WHY DID THE LOOP NEVER FINISH IT DIDNT KNOW WHEN TO STOP",
  "WHY DID THE COMPUTER GO TO THE DOCTOR IT HAD A VIRUS",
  "WHAT DO YOU CALL A ROBOT WHO TAKES THE LONG WAY HOME A DETOUR BOT",
  "WHY DID THE ROBOT CROSS THE PLAYGROUND TO GET TO THE OTHER SLIDE",
  "WHAT HAS KEYS BUT CANNOT OPEN A SINGLE DOOR A KEYBOARD",
  "WHAT CAN TRAVEL AROUND THE WORLD WHILE STAYING IN ONE CORNER A STAMP",
  "WHAT GETS WETTER THE MORE IT DRIES OFF A TOWEL",
  "WHAT HAS A HEAD AND A TAIL BUT NO BODY AT ALL A COIN",
  "WHAT KIND OF ROOM HAS NO DOORS AND NO WINDOWS A MUSHROOM",
  "A GOOD PASSWORD IS LONG RANDOM AND NEVER REUSED",
  "THE FIRST VIDEO GAME EVER MADE WAS CALLED SPACEWAR",
  "A NETWORK IS JUST COMPUTERS TALKING TO EACH OTHER",
  "CODE THAT WORKS IS GOOD CODE THAT IS CLEAR IS BETTER",
  "DEBUGGING IS LIKE BEING A DETECTIVE IN A CASE YOU CAUSED",
  "THE CLOUD IS REALLY JUST SOMEONE ELSES COMPUTER",
  "A LOOP REPEATS STEPS SO YOU DO NOT WRITE THEM AGAIN",
  "AN ARRAY IS A LIST THAT KEEPS ITS ITEMS IN ORDER",
  "A VARIABLE IS A NAMED BOX THAT HOLDS A VALUE",
  "TESTING YOUR CODE EARLY SAVES YOU TIME LATER",
  "GOOD COMMENTS EXPLAIN WHY NOT JUST WHAT",
  "A ROV TEAM CHECKS EVERY WIRE BEFORE IT GETS WET",
  "A SENSOR TURNS THE REAL WORLD INTO NUMBERS A COMPUTER CAN USE",
  "SHARING YOUR PASSWORD IS LIKE SHARING YOUR TOOTHBRUSH",
  "MOST BUGS ARE FOUND BY READING YOUR OWN CODE OUT LOUD",
];

// A few longer original paragraphs for frequency analysis. Each one keeps
// English's usual letter mix (E is the most common letter in every one of
// these, checked by tools/check_caesar_cipher.mjs), which is what makes the
// "find the most common letter, guess it is E" trick work at all.
export const PARAGRAPHS = [
  "ROBOTS THAT EXPLORE THE OCEAN FACE A HARDER JOB THAN ROBOTS ON LAND THE WATER BLOCKS RADIO SIGNALS SO A ROV STAYS CONNECTED TO ITS PILOT WITH A LONG TETHER INSTEAD EVERY CAMERA EVERY THRUSTER AND EVERY SENSOR SENDS ITS DATA DOWN THAT SAME CABLE WHICH IS WHY ENGINEERS PLAN THE WIRING SO CAREFULLY BEFORE THE ROBOT EVER TOUCHES THE WATER",
  "EVERY PROGRAM YOU HAVE EVER USED STARTED AS AN IDEA INSIDE SOMEBODYS HEAD THE IDEA BECAME A PLAN THE PLAN BECAME LINES OF CODE AND THE CODE WAS TESTED AGAIN AND AGAIN UNTIL IT FINALLY WORKED MOST OF THAT EARLY WORK STAYS INVISIBLE TO THE PERSON WHO OPENS THE APP AND TAPS A BUTTON WITHOUT EVER THINKING ABOUT WHAT HAPPENS UNDERNEATH",
  "THE FIRST ELECTRONIC COMPUTERS FILLED WHOLE ROOMS AND NEEDED TEAMS OF PEOPLE JUST TO KEEP THEM RUNNING TODAY A COMPUTER THOUSANDS OF TIMES MORE POWERFUL FITS RIGHT IN YOUR POCKET AND RUNS FOR A FULL DAY ON ONE CHARGE ENGINEERS DID NOT MAKE COMPUTERS SMALLER BY ACCIDENT THEY SPENT DECADES FINDING WAYS TO PACK THE SAME WORK INTO LESS SPACE AND LESS POWER",
];

export const MODES = {
  key: { label: "Decode: key given" },
  crack: { label: "Decode: no key (crack it)" },
  frequency: { label: "Frequency analysis: long passage" },
};

// True only if exactly one of the 25 possible shifts turns cipherText back
// into some phrase from the bank -- the "crack it" puzzles only work as a
// puzzle if a student trying every shift lands on exactly one message that
// reads like real English.
export function isUnambiguous(cipherText, bank = PHRASES) {
  const hits = allShifts(cipherText).filter((s) => bank.includes(s.text));
  return hits.length === 1;
}

function pickUnambiguousPhrase(rng, key, used = new Set()) {
  for (let tries = 0; tries < 300; tries++) {
    const plain = rng.pick(PHRASES);
    if (used.has(plain)) continue;
    const cipher = encrypt(plain, key);
    if (isUnambiguous(cipher)) return { plain, cipher };
  }
  throw new Error(`Couldn't find an unambiguous phrase for key ${key}`);
}

export function generateSet(rng, { mode = "key", count = 5 } = {}) {
  if (mode === "frequency") {
    const passage = rng.pick(PARAGRAPHS);
    const key = rng.int(1, KEYSPACE);
    const cipher = encrypt(passage, key);
    const guess = guessShiftFromFrequency(cipher);
    return { mode, key, passage, cipher, counts: letterCounts(cipher), guess };
  }
  if (mode === "crack") {
    const key = rng.int(1, KEYSPACE);
    const { plain, cipher } = pickUnambiguousPhrase(rng, key);
    return { mode, key, plain, cipher };
  }
  // "key" mode: several messages, one shared key.
  const key = rng.int(1, KEYSPACE);
  const used = new Set();
  const items = [];
  for (let i = 0; i < count; i++) {
    let plain;
    do {
      plain = rng.pick(PHRASES);
    } while (used.has(plain) && used.size < PHRASES.length);
    used.add(plain);
    items.push({ plain, cipher: encrypt(plain, key) });
  }
  return { mode, key, items };
}
