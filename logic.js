// --- 1. CONFIGURATION & DICTIONARY ---
const dictionary = {
    html: ['div','span','h1','h2','h3','p','a','button','input','img','ul','li','article','aside','body','br','canvas','code','footer','form','head','header','html','iframe','label','link','main','nav','ol','script','section','select','style','table','textarea','title','tr','td','ul','main','strong','em','hr'],
    css: ['color','background','margin','padding','display','flex','grid','border','border-radius','box-shadow','cursor','font-family','font-size','height','width','opacity','position','top','left','right','bottom','z-index','transition','overflow','justify-content','align-items'],
    js: ['console.log','document','window','function','const','let','var','if','else','for','forEach','map','fetch','addEventListener','setTimeout','setInterval','JSON.stringify','JSON.parse','alert','Math.random','Math.floor','querySelector','getElementById']
};

// Default Files Configuration
const defaultFiles = {
    "index.html": { 
        content: `<!DOCTYPE html>\n<html>\n<head>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Craby Editor Ready</h1>\n</body>\n</html>`, 
        type: "html" 
    },
    "style.css": { content: "h1 { color: #ffb400; text-align: center; }", type: "css" }
};

let files = JSON.parse(JSON.stringify(defaultFiles)); // कॉपी तयार करणे

const sBox = document.createElement('div');
sBox.id = 'suggestion-box';
document.body.appendChild(sBox);

let showLineNumbers = false; 
let lineNumberFontSize = 14; 
let selectedIndex = 0; 

// --- 2. RESET SETTINGS (NEW FEATURE) ---

function resetAllSettings() {
    if(confirm("सर्व सेटिंग्ज आणि फाइल्स रीसेट करायच्या आहेत का?")) {
        // १. फाइल्स डिफॉल्ट करा
        files = JSON.parse(JSON.stringify(defaultFiles));
        
        // २. सर्व एडिटर्स क्लोज करा
        document.getElementById('editor-grid').innerHTML = '';
        
        // ३. डिफॉल्ट व्हॅल्यूज सेट करा
        showLineNumbers = false;
        lineNumberFontSize = 14;
        
        // ४. टॉस्कबार आणि UI रिफ्रेश करा
        updateTaskbar();
        addFileToUI("index.html", "html", files["index.html"].content);
        addFileToUI("style.css", "css", files["style.css"].content);
        
        // ५. चेकबॉक्स किंवा इतर UI असल्यास ते अपडेट करा (उदा. Show Line Numbers)
        const lnToggle = document.getElementById('line-number-toggle');
        if(lnToggle) lnToggle.checked = false;

        alert("सेटिंग्ज रिसेट झाल्या आहेत!");
    }
}

// --- 3. BEAUTIFY & FORMATTING ---
// (जसा होता तसाच - कोणताही बदल नाही)
function beautifyCode() {
    document.querySelectorAll('textarea').forEach(tx => {
        let code = tx.value;
        tx.value = formatCode(code);
        const fileName = tx.id.replace('file-', '').replace('-code', '');
        updateFileContent(fileName, tx.value);
        updateLineNumbers(tx.id.replace('-code', ''));
    });
}

function formatCode(code) {
    let tab = "  ", indent = "", result = "";
    code = code.replace(/>\s*</g, ">\n<").replace(/{/g, "{\n").replace(/}/g, "\n}\n").replace(/;/g, ";\n");
    let lines = code.split("\n");
    lines.forEach(line => {
        line = line.trim();
        if(line === "") return;
        if(line.startsWith("}") || line.startsWith("</")) indent = indent.substring(tab.length);
        result += indent + line + "\n";
        if(line.endsWith("{") || line.match(/^<[^\/!][^>]*>$/)) indent += tab;
    });
    return result.trim();
}

// --- 4. FILE MANAGEMENT ---

function updateTaskbar() {
    const taskbar = document.getElementById('shutter-file-list'); 
    if(!taskbar) return;
    taskbar.innerHTML = ''; 
    Object.keys(files).forEach(fileName => {
        const fileItem = document.createElement('div');
        fileItem.className = 'shutter-item';
        fileItem.innerHTML = `<i class="fas fa-file-code"></i> <span>${fileName}</span>`;
        fileItem.onclick = () => addFileToUI(fileName, files[fileName].type, files[fileName].content);
        taskbar.appendChild(fileItem);
    });
}

function addFileToUI(name, type, content = "") {
    const wrapper = document.getElementById('editor-grid');
    if(!wrapper) return;
    const safeId = "file-" + name.replace(/[^a-z0-9]/gi, '-');
    if(document.getElementById(`box-${safeId}`)) {
        document.getElementById(`box-${safeId}`).style.display = 'flex';
        return;
    }
    const newBox = document.createElement('div');
    newBox.className = 'window-frame';
    newBox.id = `box-${safeId}`;
    newBox.innerHTML = `
        <div class="window-header">
            <span class="window-title">${name.toUpperCase()} <i class="fas fa-code"></i></span>
            <div class="window-controls">
                <i class="fas fa-minus" onclick="minimizeBox('${safeId}')"></i>
                <i class="fas fa-expand" onclick="expandBox('${safeId}')"></i>
                <i class="fas fa-trash" onclick="deleteFile('${name}')"></i>
            </div>
        </div>
        <div class="window-body editor-container" style="display: flex; position: relative; background: #0b1619; overflow: hidden;">
            <div class="line-numbers" id="${safeId}-lines" style="display:${showLineNumbers ? 'block' : 'none'}; text-align: right; padding: 10px 5px; border-right: 1.5px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.3); background: transparent; overflow: hidden; white-space: nowrap;">1.</div>
            <textarea id="${safeId}-code" spellcheck="false" data-lang="${type}" 
                style="flex: 1; padding: 10px; border: none; outline: none; background: transparent; color: #e0e0e0; resize: none; white-space: pre; overflow: auto; line-height: 1.5;"
                oninput="updateFileContent('${name}', this.value); updateLineNumbers('${safeId}')"
                onscroll="syncScroll('${safeId}')">${content}</textarea>
        </div>
    `;
    wrapper.appendChild(newBox);
    attachInputListeners(document.getElementById(`${safeId}-code`));
    updateLineNumbers(safeId);
}

// --- 5. SUGGESTION SYSTEM (Updated with Enter/Top Select) ---

function attachInputListeners(txt) {
    txt.addEventListener('keydown', (e) => {
        const items = document.querySelectorAll('.suggestion-item');
        if (sBox.style.display === 'block' && items.length > 0) {
            if (e.key === 'Enter') {
                e.preventDefault();
                items[selectedIndex].click();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = (selectedIndex + 1) % items.length;
                updateHighlight(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = (selectedIndex - 1 + items.length) % items.length;
                updateHighlight(items);
            }
        }
    });

    txt.addEventListener('input', (e) => {
        const pos = txt.selectionStart;
        const char = e.data;
        const pairs = { '{': '}', '(': ')', '[': ']', '"': '"', "'": "'" };
        if (pairs[char]) {
            txt.value = txt.value.substring(0, pos) + pairs[char] + txt.value.substring(pos);
            txt.selectionStart = txt.selectionEnd = pos;
        } 
        showSuggestions(txt);
    });
}

function updateHighlight(items) {
    items.forEach((item, index) => {
        if (index === selectedIndex) {
            item.style.backgroundColor = '#3e4451';
            item.classList.add('active-suggestion');
        } else {
            item.style.backgroundColor = '';
            item.classList.remove('active-suggestion');
        }
    });
}

function showSuggestions(txt) {
    const pos = txt.selectionStart;
    const word = txt.value.substring(0, pos).split(/[\s<>{}:;()]/).pop().toLowerCase();
    if (word.length < 1) { sBox.style.display = 'none'; return; }

    const lang = txt.getAttribute('data-lang');
    const matches = (dictionary[lang] || []).filter(w => w.startsWith(word));

    if (matches.length > 0) {
        const rect = txt.getBoundingClientRect();
        sBox.style.top = `${rect.top + 30}px`; 
        sBox.style.left = `${rect.left + 20}px`;
        sBox.style.display = 'block';
        selectedIndex = 0; // नेहमी पहिला आयटम सिलेक्टेड

        sBox.innerHTML = matches.map((m, index) => {
            let label = (m === 'h1 class') ? 'h1 class=""' : m;
            let activeStyle = (index === 0) ? 'style="background-color: #3e4451;"' : '';
            return `<div class="suggestion-item" ${activeStyle} onclick="insertWord('${m}', '${txt.id}')">${label}</div>`;
        }).join('');
    } else { sBox.style.display = 'none'; }
}

function insertWord(word, id) {
    const txt = document.getElementById(id);
    const pos = txt.selectionStart;
    const lang = txt.getAttribute('data-lang');
    const before = txt.value.substring(0, pos).replace(/[\w.-]+$/, "");
    const after = txt.value.substring(pos);

    let finalInsert = word;
    let offset = word.length;

    if (lang === 'html') {
        if (word === 'h1') { finalInsert = `<h1></h1>`; offset = 4; }
        else if (word === 'h1 class') { finalInsert = `<h1 class=""></h1>`; offset = 10; }
        else if (!word.includes('<')) { finalInsert = `<${word}></${word}>`; offset = word.length + 2; }
    }

    txt.value = before + finalInsert + after;
    txt.selectionStart = txt.selectionEnd = before.length + offset;
    sBox.style.display = 'none';
    txt.focus();
    updateFileContent(id.replace('file-','').replace('-code',''), txt.value);
}

// --- 6. CORE UTILITIES ---

function updateLineNumbers(safeId) {
    const tx = document.getElementById(`${safeId}-code`);
    const lineBox = document.getElementById(`${safeId}-lines`);
    if(!tx || !lineBox) return;
    const lines = tx.value.split('\n').length;
    lineBox.innerHTML = Array.from({length: lines}, (_, i) => (i + 1) + '.').join('<br>');
    lineBox.style.fontSize = lineNumberFontSize + "px";
}

function updateFileContent(name, val) { if(files[name]) files[name].content = val; }
function syncScroll(safeId) {
    const tx = document.getElementById(`${safeId}-code`);
    const lb = document.getElementById(`${safeId}-lines`);
    if(tx && lb) lb.scrollTop = tx.scrollTop;
}

// --- 7. INITIALIZATION ---

window.onload = () => {
    updateTaskbar();
    // Default Editors Open
    addFileToUI("index.html", "html", files["index.html"].content);
    addFileToUI("style.css", "css", files["style.css"].content);
};

function minimizeBox(id) { document.getElementById(`box-${id}`).style.display='none'; }
function expandBox(id) { document.getElementById(`box-${id}`).classList.toggle('fullscreen'); }
