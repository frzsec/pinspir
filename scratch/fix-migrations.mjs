import fs from 'fs';
import path from 'path';

const dir = 'c:/Users/FAIRUZ/Documents/jhic/finspire/src/db/migrations';
const meta = path.join(dir, 'meta');

// Remove 0002.json if it exists
if (fs.existsSync(path.join(meta, '0002_snapshot.json'))) {
  fs.unlinkSync(path.join(meta, '0002_snapshot.json'));
}

// Rename 0003_snapshot.json to 0002_snapshot.json
if (fs.existsSync(path.join(meta, '0003_snapshot.json'))) {
  fs.renameSync(path.join(meta, '0003_snapshot.json'), path.join(meta, '0002_snapshot.json'));
}

// Rename 0003_concerned_serpent_society.sql to 0002_remediation_better_auth.sql
const sql3 = path.join(dir, '0003_concerned_serpent_society.sql');
const sql2 = path.join(dir, '0002_remediation_better_auth.sql');
if (fs.existsSync(sql3)) {
  fs.renameSync(sql3, sql2);
}

// Fix journal
const journalFile = path.join(meta, '_journal.json');
const journal = JSON.parse(fs.readFileSync(journalFile, 'utf8'));

// Filter out idx 2 and 3, then add our new idx 2
journal.entries = journal.entries.filter(e => e.idx < 2);
journal.entries.push({
  idx: 2,
  version: "7",
  when: Date.now(),
  tag: "0002_remediation_better_auth",
  breakpoints: true
});

fs.writeFileSync(journalFile, JSON.stringify(journal, null, 2));
console.log('Fixed migrations!');
