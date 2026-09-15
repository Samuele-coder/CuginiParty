"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

global.window = {};
require(path.join(root, "js", "indovina-chi-characters.js"));

const characters = window.GUESS_WHO_CHARACTERS;
const questions = window.GUESS_WHO_QUESTIONS;
const sql = read("guess_who_online.sql");
const html = read("games/indovina-chi.html");
const gameJs = read("js/indovina-chi.js");
const appJs = read("js/app.js");
const adminJs = read("admin/admin.js");

assert.equal(characters.length, 24, "Il roster deve contenere 24 personaggi");
assert.equal(new Set(characters.map(character => character.id)).size, 24, "Gli ID devono essere unici");
assert.equal(new Set(characters.map(character => character.name)).size, 24, "I nomi devono essere unici");

for (const question of questions) {
    assert.ok(characters.every(character => Object.hasOwn(character, question.attribute)), `Attributo mancante: ${question.attribute}`);
    assert.ok(sql.includes(`when '${question.id}'`), `Domanda non validata nel database: ${question.id}`);
}

for (const key of ["glasses", "beard", "moustache", "earrings", "smile", "freckles"]) {
    assert.equal(characters.filter(character => character[key]).length, 12, `${key} deve dividere il roster 12/12`);
}
for (const hairColor of ["black", "brown", "blond", "red", "gray", "none"]) {
    assert.equal(characters.filter(character => character.hairColor === hairColor).length, 4, `Colore capelli sbilanciato: ${hairColor}`);
}

const sqlCharacterRows = new Map();
for (const match of sql.matchAll(/^\('([^']+)','([^']+)','(\{.*\})'\)[,;]?$/gm)) {
    sqlCharacterRows.set(match[1], { name: match[2], attributes: JSON.parse(match[3]) });
}
assert.equal(sqlCharacterRows.size, 24, "La migration deve inserire tutti i personaggi");
for (const character of characters) {
    const row = sqlCharacterRows.get(character.id);
    assert.ok(row, `Personaggio assente dalla migration: ${character.id}`);
    assert.equal(row.name, character.name);
    for (const key of ["hairColor", "hairLength", "curly", "glasses", "hat", "beard", "moustache", "earrings", "smile", "freckles"]) {
        assert.deepEqual(row.attributes[key], character[key], `Mismatch ${character.id}.${key}`);
    }
}

const htmlIds = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(htmlIds).size, htmlIds.length, "Gli ID HTML devono essere unici");
const declaredIds = gameJs.match(/const ids = \[([\s\S]*?)\];/)[1];
for (const match of declaredIds.matchAll(/"([^"]+)"/g)) assert.ok(htmlIds.includes(match[1]), `ID DOM assente: ${match[1]}`);

for (const match of html.matchAll(/(?:src|href)="(\.\.\/[^"?#]+)[^\"]*"/g)) {
    assert.ok(fs.existsSync(path.resolve(root, "games", match[1])), `File referenziato assente: ${match[1]}`);
}

assert.ok(appJs.indexOf('"polizia-ladri", "indovina-chi"') >= 0, "Indovina Chi deve seguire Polizia e Ladri nell'ordine Home");
assert.match(adminJs, /id: "indovina-chi"[\s\S]*?multiplayer: true, rooms: true/);
assert.match(adminJs, /if \(path\) changes\.path = path;/, "Un path batch vuoto non deve sovrascrivere il valore");
assert.match(sql, /alter table public\.guess_who_secrets enable row level security;/);
assert.match(sql, /revoke all on public\.guess_who_rooms,public\.guess_who_players,public\.guess_who_player_sessions,public\.guess_who_secrets/);
assert.match(sql, /if r\.status='finished' then[\s\S]*?v_opponent_secret/, "Il secret avversario può essere letto solo a partita finita");

console.log("PASS guess-who-static: roster, attributi, DOM, file, catalogo, Admin e privacy");
