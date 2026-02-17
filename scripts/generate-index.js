/* study-app/scripts/generate-index.js */
const fs = require('fs');
const path = require('path');

const contentDir = path.join(__dirname, '../content');
const outputFile = path.join(__dirname, '../content.json');

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
    const targetDir = path.join(contentDir, subjectKey, type);
    
    if (!fs.existsSync(targetDir)) {
        // Videos sind optional, daher nur Warnung bei Scripts/Audio
        if (type !== 'videos') console.warn(`⚠️  Ordner nicht gefunden: ${targetDir}`);
        return;
    }

    const files = fs.readdirSync(targetDir);
    let count = 0;

    files.forEach(file => {
        if (file.startsWith('.')) return;
        
        // Dateiendungen prüfen
        if (type === 'scripts' && !file.endsWith('.md')) return;
        if (type === 'audio' && !['.mp3', '.m4a', '.wav'].some(ext => file.endsWith(ext))) return;
        if (type === 'videos' && !['.mp4', '.webm', '.mov'].some(ext => file.endsWith(ext))) return; // NEU

        const filePath = path.join('content', subjectKey, type, file);
        const id = file.replace(/\.[^/.]+$/, ""); 
        
        let entry = db.find(e => e.id === id && e.subjectKey === subjectKey);
        
        if (!entry) {
            entry = {
                id: id,
                title: id.replace(/_/g, ' '),
                subject: subjects[subjectKey],
                subjectKey: subjectKey,
                added: fs.statSync(path.join(targetDir, file)).mtime,
                files: {}
            };
            db.push(entry);
        }
        
        // Zuweisung basierend auf Typ
        if (type === 'scripts') entry.files.script = filePath;
        if (type === 'audio') entry.files.audio = filePath;
        if (type === 'videos') entry.files.video = filePath; // NEU
        
        count++;
    });
    console.log(`✅ ${subjectKey}/${type}: ${count} Dateien gefunden.`);
}

Object.keys(subjects).forEach(sub => {
    scanDirectory(sub, 'scripts');
    scanDirectory(sub, 'audio');
    scanDirectory(sub, 'videos'); // NEU
});

db.sort((a, b) => {
    if (a.id < b.id) return 1; 
    if (a.id > b.id) return -1;
    return 0;
});

fs.writeFileSync(outputFile, JSON.stringify(db, null, 2));
console.log(`🎉 FERTIG: content.json mit ${db.length} Einträgen erstellt.`);