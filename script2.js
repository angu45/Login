// --- 1. SHUTTER (LEFT SIDEBAR) ---
function toggleShutter() {
    const shutter = document.getElementById('shutter');
    const trigger = document.getElementById('shutter-trigger');
    if (!shutter) return;

    shutter.classList.toggle('open');
    const icon = trigger.querySelector('i');
    if (shutter.classList.contains('open')) {
        icon.className = 'fas fa-chevron-left';
        trigger.style.left = '300px'; 
    } else {
        icon.className = 'fas fa-chevron-right';
        trigger.style.left = '0';
    }
}

function updateShutterFileList(name, id) {
    const list = document.getElementById('shutter-file-list');
    if (!list) return;
    
    const item = document.createElement('div');
    item.className = 'shutter-item';
    item.innerHTML = `<i class="fas fa-file-code"></i> <span>${name}</span>`;
    
    item.onclick = () => { 
        if(typeof addFileToUI === "function") {
            const type = name.split('.').pop().toLowerCase();
            addFileToUI(name, type, files[name] ? files[name].content : "");
        }
        if(typeof toggleShutter === "function") toggleShutter(); 
    };
    list.appendChild(item);
}

function addNewFilePrompt() {
    const fileName = prompt("File Name (e.g. script.js):");
    
    if (fileName) {
        if (typeof files !== "undefined" && files[fileName]) {
            alert("This file already exists!");
            return;
        }

        const type = fileName.split('.').pop().toLowerCase();

        if (typeof files !== "undefined") {
            files[fileName] = { content: "", type: type };
        }

        if (typeof addFileToUI === "function") {
            addFileToUI(fileName, type, "");
        }

        if (typeof updateTaskbar === "function") {
            updateTaskbar();
        } else {
            const safeId = fileName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
            updateShutterFileList(fileName, safeId);
        }
    }
}



// --- 3. DOWNLOAD FUNCTION (FILE SELECTION) ---
function exportCode() {
    if (typeof files === "undefined" || Object.keys(files).length === 0) {
        alert("No files found to download.");
        return;
    }

    const fileList = Object.keys(files);
    let promptText = "Type the number of the file to download:\n\n";
    fileList.forEach((name, index) => {
        promptText += `${index + 1}. ${name}\n`;
    });

    const choice = prompt(promptText);
    const selectedIndex = parseInt(choice) - 1;

    if (fileList[selectedIndex]) {
        const fileName = fileList[selectedIndex];
        const content = files[fileName].content;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName; 
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
}

// --- 4. SETTINGS PANEL LOGIC ---
function saveSettings() {
    const settings = {
        theme: document.getElementById('theme-sel').value,
        fontSize: document.getElementById('font-size-range').value,
        fontFamily: document.getElementById('font-family-sel').value,
        visibility: {
            html: document.getElementById('chk-html').checked,
            css: document.getElementById('chk-css').checked,
            js: document.getElementById('chk-js').checked
        }
    };
    localStorage.setItem('craby_settings', JSON.stringify(settings));
}

function loadSettings() {
    const saved = localStorage.getItem('craby_settings');
    if (!saved) return;
    const settings = JSON.parse(saved);

    if(settings.theme) document.getElementById('theme-sel').value = settings.theme;
    if(settings.fontSize) {
        document.getElementById('font-size-range').value = settings.fontSize;
        document.getElementById('font-size-val').innerText = settings.fontSize + "px";
        updateFontSize(settings.fontSize);
    }
    if(settings.fontFamily) document.getElementById('font-family-sel').value = settings.fontFamily;
    if(settings.visibility) {
        document.getElementById('chk-html').checked = settings.visibility.html;
        document.getElementById('chk-css').checked = settings.visibility.css;
        document.getElementById('chk-js').checked = settings.visibility.js;
        updateVisibility();
    }
    if(typeof updateThemeAndFont === "function") updateThemeAndFont();
}

function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    if (!panel) return;
    if (panel.style.display === 'none' || !panel.classList.contains('open')) {
        panel.style.display = 'block';
        setTimeout(() => panel.classList.add('open'), 10);
    } else {
        panel.classList.remove('open');
        setTimeout(() => {
            panel.style.display = 'none';
            saveSettings();
        }, 300);
    }
}

function updateVisibility() {
    const htmlBox = document.querySelector('[id*="index-html"]')?.closest('.window-frame');
    const cssBox = document.querySelector('[id*="style-css"]')?.closest('.window-frame');
    const jsBox = document.querySelector('[id*="script-js"]')?.closest('.window-frame');

    if(htmlBox) htmlBox.style.display = document.getElementById('chk-html').checked ? 'flex' : 'none';
    if(cssBox) cssBox.style.display = document.getElementById('chk-css').checked ? 'flex' : 'none';
    if(jsBox) jsBox.style.display = document.getElementById('chk-js').checked ? 'flex' : 'none';
}

function updateFontSize(val) {
    document.getElementById('font-size-val').innerText = val + "px";
    document.querySelectorAll('textarea').forEach(tx => {
        tx.style.fontSize = val + "px";
    });
}

function resetAllSettings() {
    if(confirm("Reset all settings to default?")) {
        localStorage.removeItem('craby_settings');
        location.reload();
    }
}

function closePreview() {
    document.getElementById('preview-overlay').style.display = 'none';
}


function beautifyCode(){

const textareas=document.querySelectorAll('.editor-grid textarea');

if(typeof files==="undefined") return;

Object.keys(files).forEach(fileName=>{

let content=files[fileName].content;
const type=fileName.split('.').pop().toLowerCase();

if(!content) return;


/* ---------- HTML FORMAT ---------- */
if(type==="html"){

let indent=0;

content=content
.replace(/>\s*</g,"><")
.replace(/</g,"\n<")
.trim()
.split("\n")
.map(line=>{

line=line.trim();

if(line.match(/^<\/.+/)) indent--;

let formatted=" ".repeat(indent*2)+line;

if(line.match(/^<[^!\/].*[^\/]>$/)) indent++;

return formatted;

}).join("\n");

}


/* ---------- CSS FORMAT ---------- */
else if(type==="css"){

content=content
.replace(/\s*\{\s*/g," {\n  ")
.replace(/;\s*/g,";\n  ")
.replace(/\s*\}\s*/g,"\n}\n")
.replace(/\s*:\s*/g,": ")
.replace(/,\s*/g,", ")
.replace(/\n\s*\n/g,"\n")
.trim();

}


/* ---------- JS FORMAT ---------- */
else if(type==="js"){

content=content
.replace(/\{\s*/g," {\n  ")
.replace(/\}\s*/g,"\n}\n")
.replace(/;\s*/g,";\n")
.replace(/,\s*/g,", ")
.replace(/if\s*\(/g,"if (")
.replace(/for\s*\(/g,"for (")
.replace(/while\s*\(/g,"while (")
.replace(/\n\s*\n/g,"\n")
.trim();

}


/* Save formatted code */
files[fileName].content=content;


/* Update UI */
textareas.forEach(tx=>{

if(tx.getAttribute("data-filename")===fileName || tx.id.includes(type)){
tx.value=content;
}

});

});

}

function setPreviewSize(width) {
    const frame = document.getElementById('output-frame');
    if(frame) frame.style.width = width;
}

function enableExitWarning() {
    window.onbeforeunload = function (e) {
        return "Unsaved changes might be lost.";
    };
}

enableExitWarning();

window.addEventListener('DOMContentLoaded', () => {
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel && !document.getElementById('reset-btn')) {
        const resetBtn = document.createElement('button');
        resetBtn.id = 'reset-btn';
        resetBtn.className = 'add-btn';
        resetBtn.style.backgroundColor = '#ff4d4d';
        resetBtn.style.marginTop = '10px';
        resetBtn.innerHTML = '<i class="fas fa-undo"></i> RESET ALL SETTINGS';
        resetBtn.onclick = resetAllSettings;
        settingsPanel.appendChild(resetBtn);
    }
    loadSettings();
});
