// Tamazight letters with their keyboard shortcut (base letter followed by "="),
// plus an optional two-letter digraph (e.g. "gh") that is also replaced.
// Grouped as they appear on screen: each group is one row of uppercase + one row of lowercase keys.
const LETTER_GROUPS = [
    [
        { upper: 'Č', lower: 'č', base: 'c', digraph: 'tc' },
        { upper: 'Ḍ', lower: 'ḍ', base: 'd' },
        { upper: 'Ǧ', lower: 'ǧ', base: 'g' },
        { upper: 'Ḥ', lower: 'ḥ', base: 'h' },
        { upper: 'Ṛ', lower: 'ṛ', base: 'r' },
    ],
    [
        { upper: 'Ṣ', lower: 'ṣ', base: 's' },
        { upper: 'Ṭ', lower: 'ṭ', base: 't' },
        { upper: 'Ẓ', lower: 'ẓ', base: 'z' },
        { upper: 'Γ', lower: 'ɣ', base: 'y', digraph: 'gh' },
        { upper: 'Ɛ', lower: 'ɛ', base: 'e' },
    ],
];

// Plain letters that are only typed through a digraph; they have no key or "=" shortcut.
const DIGRAPH_LETTERS = [
    { upper: 'X', lower: 'x', digraph: 'kh' },
];

const CASES = ['upper', 'lower'];
const TOAST_DURATION_MS = 1500;

// Only rewrite text the user is typing, not pasted or dropped text (e.g. pasting "enough").
const TYPING_INPUT_TYPES = new Set(['insertText', 'insertCompositionText']);

function capitalize(text) {
    return text[0].toUpperCase() + text.slice(1);
}

// Shortcuts shown to the user for a letter in the given case, e.g. ["y=", "gh"].
function shortcutsFor(letter, letterCase) {
    const upper = letterCase === 'upper';
    const keys = [(upper ? letter.base.toUpperCase() : letter.base) + '='];
    if (letter.digraph) {
        keys.push(upper ? capitalize(letter.digraph) : letter.digraph);
    }
    return keys;
}

// Register a digraph in lowercase ("gh"), capitalized ("Gh") and all caps ("GH").
function addDigraph(letter) {
    SHORTCUTS[letter.digraph] = letter.lower;
    SHORTCUTS[capitalize(letter.digraph)] = letter.upper;
    SHORTCUTS[letter.digraph.toUpperCase()] = letter.upper;
}

const SHORTCUTS = {};
for (const letter of LETTER_GROUPS.flat()) {
    for (const letterCase of CASES) {
        SHORTCUTS[(letterCase === 'upper' ? letter.base.toUpperCase() : letter.base) + '='] = letter[letterCase];
    }
    if (letter.digraph) addDigraph(letter);
}
DIGRAPH_LETTERS.forEach(addDigraph);

const textarea = document.getElementById('text');
const toast = document.getElementById('toast');

function insertText(value) {
    textarea.focus();
    textarea.setRangeText(value, textarea.selectionStart, textarea.selectionEnd, 'end');
}

// Delete all text in a way the user can undo with Ctrl+Z (assigning .value wipes the undo history).
function clearText() {
    textarea.focus();
    textarea.select();
    if (!document.execCommand('delete')) {
        textarea.value = '';
    }
}

// Replace a shortcut like "c=" or "gh" with its letter right after it is typed.
function applyShortcut() {
    const end = textarea.selectionStart;
    if (end !== textarea.selectionEnd || end < 2) return;
    const letter = SHORTCUTS[textarea.value.slice(end - 2, end)];
    if (letter) {
        textarea.setRangeText(letter, end - 2, end, 'end');
    }
}

let toastTimer;
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), TOAST_DURATION_MS);
}

// Copy the whole text to the clipboard. Returns whether anything was copied.
async function copyText() {
    if (!textarea.value) return false;
    try {
        await navigator.clipboard.writeText(textarea.value);
        return true;
    } catch {
        // Fallback for browsers without the async clipboard API (e.g. file://).
        textarea.select();
        return document.execCommand('copy');
    }
}

function buildKeyboard() {
    const keyboard = document.getElementById('keyboard');
    for (const group of LETTER_GROUPS) {
        for (const letterCase of CASES) {
            for (const letter of group) {
                const char = letter[letterCase];
                const key = document.createElement('button');
                key.type = 'button';
                key.className = 'key';
                key.textContent = char;
                key.addEventListener('click', () => insertText(char));
                keyboard.appendChild(key);
            }
        }
    }
}

function buildShortcutTables() {
    const container = document.getElementById('shortcuts');
    for (const group of LETTER_GROUPS) {
        for (const letterCase of ['lower', 'upper']) {
            const rows = group.map((letter) =>
                `<tr><td>${letter[letterCase]}</td><td>${shortcutsFor(letter, letterCase).join(' / ')}</td></tr>`);
            container.insertAdjacentHTML('beforeend',
                `<table><thead><tr><th>Asekkil</th><th>Asanef</th></tr></thead><tbody>${rows.join('')}</tbody></table>`);
        }
    }
}

textarea.addEventListener('input', (event) => {
    if (TYPING_INPUT_TYPES.has(event.inputType)) applyShortcut();
});

document.getElementById('copy-btn').addEventListener('click', async () => {
    if (await copyText()) showToast('Yettwazdeɣ');
});

document.getElementById('cut-btn').addEventListener('click', async () => {
    if (await copyText()) {
        clearText();
        showToast('Yettwankeḍ');
    } else {
        textarea.focus();
    }
});

document.getElementById('clear-btn').addEventListener('click', clearText);

buildKeyboard();
buildShortcutTables();
