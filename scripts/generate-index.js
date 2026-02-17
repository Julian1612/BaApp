/* study-app/scripts/generate-index.js */
const fs = require('fs');
const path = require('path');

// Wir gehen vom 'scripts' Ordner einen Schritt hoch in 'content'
const contentDir = path.join(__dirname, '../content');
const outputFile = path.join(__dirname, '../content.json');

// WICHTIG: Diese Keys müssen exakt so heissen wie deine Ordner!
const subjects = {
    'itm_grundlagen': 'ITM Grundlagen',
    'organisation_projekte': 'Org. & Projekte'
};

let db = [];

console.log(`🔍 Suche nach Inhalten in: ${contentDir}`);

if (!fs.existsSync(contentDir)) {
    console.error(`❌ FEHLER: Der Ordner ${contentDir} existiert nicht!`);
    process.exit(1);
}

function scanDirectory(subjectKey, type) {
    // Baut den Pfad: content/itm_grundlagen/scripts
    const targetDir = path.join(contentDir, subjectKey, type);
    
    // Debug-Info
    if (!fs.existsSync(targetDir)) {
        console.warn(`⚠️  Ordner nicht gefunden: ${targetDir}`);
        return;
    }

    const files = fs.readdirSync(targetDir);
    let count = 0;

    files.forEach(file => {
        if (file.startsWith('.')) return; // Ignoriere .DS_Store
        
        // Prüfe Endung, um Müll-Dateien zu vermeiden
        if (type === 'scripts' && !file.endsWith('.md')) return;
        if (type === 'audio' && !['.mp3', '.m4a', '.wav'].some(ext => file.endsWith(ext))) return;

        const filePath = path.join('content', subjectKey, type, file);
        const id = file.replace(/\.[^/.]+$/, ""); // "E01.md" -> "E01"
        
        let entry = db.find(e => e.id === id && e.subjectKey === subjectKey);
        
        if (!entry) {
            entry = {
                id: id,
                title: id.replace(/_/g, ' '), // "E01_Titel" -> "E01 Titel"
                subject: subjects[subjectKey],
                subjectKey: subjectKey,
                // Wir nutzen mtime (Last Modified), damit Updates erkannt werden
                added: fs.statSync(path.join(targetDir, file)).mtime,
                files: {}
            };
            db.push(entry);
        }
        
        if (type === 'scripts') entry.files.script = filePath;
        if (type === 'audio') entry.files.audio = filePath;
        count++;
    });
    console.log(`✅ ${subjectKey}/${type}: ${count} Dateien gefunden.`);
}

// Scannen
Object.keys(subjects).forEach(sub => {
    scanDirectory(sub, 'scripts');
    scanDirectory(sub, 'audio');
});

// Sortieren: Neueste Episoden (E02) zuerst, älteste (E01) unten
db.sort((a, b) => {
    if (a.id < b.id) return 1; 
    if (a.id > b.id) return -1;
    return 0;
});

fs.writeFileSync(outputFile, JSON.stringify(db, null, 2));
console.log(`🎉 FERTIG: content.json mit ${db.length} Einträgen erstellt.`);