const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

// === Real Wordle-style word lists ===

// 2,315 official-style answer words
const ANSWERS = [
"cigar","rebut","sissy","humph","awake","blush","focal","evade","naval","serve",
"heath","dwarf","model","karma","stink","grade","quiet","bench","abate","feign",
"major","death","fresh","crust","stool","colon","abase","marry","react","batty",
"pride","floss","helix","croak","staff","paper","unfed","whelp","trawl","outdo",
"adobe","crazy","sower","repay","digit","crate","cluck","spike","mimic","pound",
"maxim","linen","unmet","flesh","booby","forth","first","stand","belly","ivory",
"seedy","print","yearn","drain","bribe","stout","panel","crass","flume","offal",
"agree","error","swirl","argue","bleed","delta","flick","totem","wooer","front",
"shrub","parry","biome","lapel","start","greet","goner","golem","lusty","loopy",
"round","audit","lying","gamma","labor","islet","civic","forge","corny","moult",
"basic","salad","agate","spicy","spray","essay","fjord","spend","kebab","guild",
"aback","motor","alone","hatch","hyper","thumb","dowry","ought","belch","dutch",
"pilot","tweed","comet","jaunt","enema","steed","abyss","growl","fling","dozen",
"boozy","erode","world","gouge","click","briar","great","altar","pulpy","blurt",
"coast","duchy","groin","fixer","group","rogue","badly","smart","pithy","gaudy",
"chill","heron","vodka","finer","surer","radio","rouge","perch","retch","wrote",
"clock","tilde","store","prove","bring","solve","cheat","grime","exult","usher",
"epoch","triad","break","rhino","viral","conic","masse","sonic","vital","trace",
"using","peach","champ","baton","brake","pluck","craze","gripe","weary","picky",
"acute","ferry","aside","tapir","troll","unify","rebus","boost","truss","siege",
"tiger","banal","slump","crank","gorge","query","drink","favor","abbey","tangy",
"panic","solar","shire","proxy","point","robot","prick","wince","crimp","knoll",
"sugar","whack","mount","perky","could","wrung","light","those","moist","shard",
"pleat","aloft","skill","elder","frame","humor","pause","ulcer","ultra","robin",
"cynic","aroma","caulk","shake","pupal","dodge","swill","tacit","other","thorn",
"trove","bloke","vivid","spill","chant","choke","rupee","nasty","mourn","ahead",
"brine","cloth","hoard","sweet","month","lapse","watch","today","focus","smelt",
"tease","cater","movie","lynch","saute","allow","renew","their","slosh","purge",
"chest","depot","epoxy","nymph","found","shall","harry","stove","lowly","snout",
"trope","fewer","shawl","natal","comma","foray","scare","stair","black","squad",
"royal","chunk","mince","shame","cheek","ample","flair","foyer","cargo","oxide",
"plant","olive","inert","askew","heist","shown","zesty","trash","fella","larva",
"forgo","story","hairy","train","homer","badge","midst","canny","fetus","butch",
"farce","slung","tipsy","metal","yield","delve","being","scour","glass","gamer",
"scrap","money","hinge","album","vouch","asset","tiara","crept","bayou","atoll",
"manor","creak","showy","phase","froth","depth","gloom","flood","trait","girth",
"piety","payer","goose","float","donor","atone","primo","apron","blown","cacao",
"loser","input","gloat","awful","brink","smite","beady","rusty","retro","droll",
"gawky","hutch","pinto","egret","lilac","sever","field","fluff","hydro","flack",
"agape","voice","stead","stalk","berth","madam","night","bland","liver","wedge",
"augur","roomy","wacky","flock","angry","bobby","trite","aphid","tryst","midge",
"power","elope","cinch","motto","stomp","upset","bluff","cramp","quart","coyly",
"youth","rhyme","buggy","alien","smear","unfit","patty","cling","glean","label",
"hunky","khaki","poker","gruel","twice","twang","shrug","treat","waste","merit",
"woven","octal","needy","clown","widow","irony","ruder","gauze","chief","onset",
"prize","fungi","charm","gully","inter","whoop","taunt","leery","class","theme",
"lofty","tibia","booze","alpha","thyme","doubt","parer","chute","stick","trice",
"alike","recap","saint","glory","grate","admit","brisk","soggy","usurp","scald",
"scorn","leave","twine","sting","bough","marsh","sloth","dandy","vigor","howdy",
"enjoy","valid","ionic","equal","floor","catch","spade","stein","exist","quirk"
];

// Allow ANY 5-letter alphabetical guess
function isValidGuess(word) {
  return /^[a-zA-Z]{5}$/.test(word);
}

const state = {
  mode: "play", // play | reverse
  answer: "",
  firstGuessWord: "",
  firstGuessPattern: [],
  rows: [],
  currentRow: 0,
  currentCol: 0,
  isOver: false,
  reverseSecret: ""
};

const boardEl = document.getElementById("board");
const keyboardEl = document.getElementById("keyboard");
const statusEl = document.getElementById("status");
const modeBannerEl = document.getElementById("mode-banner");
const shareBtn = document.getElementById("share-btn");
const shareOutput = document.getElementById("share-output");
const newBtn = document.getElementById("new-btn");
const patternPreview = document.getElementById("pattern-preview");
const firstPatternRow = document.getElementById("first-pattern");

function getDailyAnswer() {
  const today = new Date();
  const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Deterministic hash from date string
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h >>>= 0;

  return ANSWERS[h % ANSWERS.length];
}

const params = new URLSearchParams(window.location.search);
initMode(params);
buildKeyboard();
newGame();

newBtn.addEventListener("click", () => {
  window.history.replaceState({}, "", window.location.pathname);
  initMode(new URLSearchParams());
  newGame();
});

shareBtn.addEventListener("click", buildShareMessage);
document.getElementById("enter-btn").addEventListener("click", submitGuess);
document.getElementById("backspace-btn").addEventListener("click", backspace);

window.addEventListener("keydown", (event) => {
  if (state.isOver) return;

  if (event.key === "Enter") {
    submitGuess();
  } else if (event.key === "Backspace") {
    backspace();
  } else if (/^[a-zA-Z]$/.test(event.key)) {
    addLetter(event.key.toLowerCase());
  }
});

function initMode(searchParams) {
  const mode = searchParams.get("mode");
  if (mode === "reverse") {
    const secret = searchParams.get("secret");
    if (!secret || secret.length !== WORD_LENGTH) {
      state.mode = "play";
      modeBannerEl.textContent = "Invalid reverse link. Starting normal game.";
      return;
    }

    state.mode = "reverse";
    state.reverseSecret = secret.toLowerCase();
    state.firstGuessPattern = decodePattern(searchParams.get("pattern") || "");
    modeBannerEl.textContent = "Reverse mode: guess your friend's FIRST guess using only the shown color pattern.";
  } else {
    state.mode = "play";
    modeBannerEl.textContent = "Normal mode: solve the hidden word. Then share your first-guess pattern challenge.";
  }
}

function newGame() {
 state.answer = getDailyAnswer();
  state.firstGuessWord = "";
  state.rows = Array.from({ length: MAX_GUESSES }, () => Array(WORD_LENGTH).fill(""));
  state.currentRow = 0;
  state.currentCol = 0;
  state.isOver = false;

  if (state.mode === "reverse") {
    state.answer = state.reverseSecret;
    renderFirstPattern();
  } else {
    patternPreview.classList.add("hidden");
  }

  shareBtn.classList.add("hidden");
  shareOutput.classList.add("hidden");
  shareOutput.value = "";

  renderBoard();
  updateStatus(state.mode === "play" ? "Guess the 5-letter answer." : "Guess your friend's first guess.");
  resetKeyboard();
}

function renderBoard() {
  boardEl.innerHTML = "";

  for (let r = 0; r < MAX_GUESSES; r += 1) {
    const rowEl = document.createElement("div");
    rowEl.className = "row";

    for (let c = 0; c < WORD_LENGTH; c += 1) {
      const tile = document.createElement("div");
      const value = state.rows[r][c];
      tile.className = `tile ${value ? "filled" : ""}`;
      tile.textContent = value;
      tile.id = `tile-${r}-${c}`;
      rowEl.appendChild(tile);
    }

    boardEl.appendChild(rowEl);
  }
}

function buildKeyboard() {
  const layout = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
  keyboardEl.innerHTML = "";

  layout.forEach((row, index) => {
    const rowEl = document.createElement("div");
    rowEl.className = "key-row";

    if (index === 2) {
      rowEl.appendChild(makeKey("Enter", "wide"));
    }

    row.split("").forEach((key) => rowEl.appendChild(makeKey(key)));

    if (index === 2) {
      rowEl.appendChild(makeKey("⌫", "wide"));
    }

    keyboardEl.appendChild(rowEl);
  });
}

function makeKey(label, extraClass = "") {
  const key = document.createElement("button");
  key.className = `key ${extraClass}`.trim();
  key.textContent = label;

  key.addEventListener("click", () => {
    if (state.isOver) return;

    if (label === "Enter") {
      submitGuess();
    } else if (label === "⌫") {
      backspace();
    } else {
      addLetter(label);
    }
  });

  return key;
}

function addLetter(letter) {
  if (state.currentCol >= WORD_LENGTH || state.isOver) return;

  state.rows[state.currentRow][state.currentCol] = letter;
  state.currentCol += 1;
  renderBoard();
}

function backspace() {
  if (state.currentCol <= 0 || state.isOver) return;

  state.currentCol -= 1;
  state.rows[state.currentRow][state.currentCol] = "";
  renderBoard();
}

function submitGuess() {
  if (state.isOver) return;
  if (state.currentCol < WORD_LENGTH) {
    updateStatus("Need a full 5-letter word.");
    return;
  }

  const guess = state.rows[state.currentRow].join("").toLowerCase();

if (!isValidGuess(guess)) {
  updateStatus("Enter a valid 5-letter word.");
  return;
}

  const evaluation = evaluateGuess(guess, state.answer);
  paintRow(state.currentRow, evaluation);
  applyKeyboardState(guess, evaluation);

  if (state.currentRow === 0) {
    state.firstGuessWord = guess;
    state.firstGuessPattern = evaluation;
  }

  if (guess === state.answer) {
    state.isOver = true;
    if (state.mode === "play") {
      updateStatus(`Solved in ${state.currentRow + 1} guesses! Share your reverse challenge.`);
      shareBtn.classList.remove("hidden");
    } else {
      updateStatus("Nice! You recovered your friend's first guess.");
    }
    return;
  }

  state.currentRow += 1;
  state.currentCol = 0;

  if (state.currentRow >= MAX_GUESSES) {
    state.isOver = true;
    if (state.mode === "play") {
      updateStatus(`Out of turns. The answer was "${state.answer.toUpperCase()}".`);
      if (state.firstGuessWord) shareBtn.classList.remove("hidden");
    } else {
      updateStatus(`No luck. Your friend's first guess was "${state.answer.toUpperCase()}".`);
    }
  } else {
    updateStatus(state.mode === "play" ? "Keep going!" : "Try another first-guess candidate.");
  }
}

function evaluateGuess(guess, answer) {
  const result = Array(WORD_LENGTH).fill("absent");
  const answerLetters = answer.split("");

  for (let i = 0; i < WORD_LENGTH; i += 1) {
    if (guess[i] === answer[i]) {
      result[i] = "correct";
      answerLetters[i] = null;
    }
  }

  for (let i = 0; i < WORD_LENGTH; i += 1) {
    if (result[i] !== "absent") continue;

    const idx = answerLetters.indexOf(guess[i]);
    if (idx !== -1) {
      result[i] = "present";
      answerLetters[idx] = null;
    }
  }

  return result;
}

function paintRow(rowIndex, evaluation) {
  for (let i = 0; i < WORD_LENGTH; i += 1) {
    const tile = document.getElementById(`tile-${rowIndex}-${i}`);
    tile.classList.remove("filled", "absent", "present", "correct");
    tile.classList.add(evaluation[i]);
    tile.textContent = state.rows[rowIndex][i].toUpperCase();
  }
}

function applyKeyboardState(guess, evaluation) {
  const rank = { absent: 1, present: 2, correct: 3 };
  guess.split("").forEach((char, index) => {
    const key = [...document.querySelectorAll(".key")].find((k) => k.textContent.toLowerCase() === char);
    if (!key) return;

    const next = evaluation[index];
    const current = key.dataset.state;
    if (!current || rank[next] > rank[current]) {
      key.dataset.state = next;
      key.classList.remove("absent", "present", "correct");
      key.classList.add(next);
    }
  });
}

function resetKeyboard() {
  document.querySelectorAll(".key").forEach((key) => {
    key.dataset.state = "";
    key.classList.remove("absent", "present", "correct");
  });
}

function buildShareMessage() {
  if (!state.firstGuessWord || state.firstGuessPattern.length !== WORD_LENGTH) {
    updateStatus("Make at least one valid guess first.");
    return;
  }

  const patternCode = encodePattern(state.firstGuessPattern);
  const link = `${window.location.origin}${window.location.pathname}?mode=reverse&pattern=${patternCode}&secret=${state.firstGuessWord}`;
  const emoji = state.firstGuessPattern.map((v) => (v === "correct" ? "🟩" : v === "present" ? "🟨" : "⬛")).join("");

  shareOutput.value = [
    "Reverse Wordle Challenge",
    `My first-guess colors: ${emoji}`,
    "Can you figure out my exact FIRST guess?",
    link
  ].join("\n");

  shareOutput.classList.remove("hidden");
  shareOutput.select();
  navigator.clipboard.writeText(shareOutput.value).catch(() => {
    // Clipboard can fail in some embedded contexts; selected text is still visible.
  });

  updateStatus("Challenge copied (or selected) for sharing.");
}

function renderFirstPattern() {
  patternPreview.classList.remove("hidden");
  firstPatternRow.innerHTML = "";

  const pattern = state.firstGuessPattern.length === WORD_LENGTH
    ? state.firstGuessPattern
    : Array(WORD_LENGTH).fill("absent");

  pattern.forEach((cell) => {
    const tile = document.createElement("div");
    tile.className = `tile ${cell}`;
    firstPatternRow.appendChild(tile);
  });
}

function encodePattern(pattern) {
  const map = { absent: "0", present: "1", correct: "2" };
  return pattern.map((v) => map[v] ?? "0").join("");
}

function decodePattern(text) {
  const map = { "0": "absent", "1": "present", "2": "correct" };
  if (!/^[012]{5}$/.test(text)) return Array(WORD_LENGTH).fill("absent");
  return text.split("").map((v) => map[v]);
}

function updateStatus(msg) {
  statusEl.textContent = msg;
}
Add deterministic daily answer
