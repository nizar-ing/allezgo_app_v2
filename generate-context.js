import fs from 'fs';
import path from 'path';

const outputFile = path.resolve('frontend_context.md');
const excludeFolders = ['node_modules', 'dist', '.git', '.vscode', 'public'];
const includeExtensions = ['.js', '.jsx', '.json', '.css', '.md'];

// Clean slate
if (fs.existsSync(outputFile)) {
    fs.unlinkSync(outputFile);
}

const header = `# AllezGo Frontend Context\n\nAutomated context generation of the AllezGo React architecture.\nGenerated on: ${new Date().toLocaleString()}\n\n`;
fs.writeFileSync(outputFile, header, 'utf8');

let count = 0;

function processDirectory(directory) {
    if (!fs.existsSync(directory)) return;

    const items = fs.readdirSync(directory);
    for (const item of items) {
        const fullPath = path.join(directory, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!excludeFolders.includes(item)) {
                processDirectory(fullPath);
            }
        } else {
            const ext = path.extname(item).toLowerCase();
            // Only process allowed extensions and skip the output file itself
            if (includeExtensions.includes(ext) && fullPath !== outputFile) {
                let lang = ext.substring(1);
                if (lang === 'js' || lang === 'jsx') lang = 'jsx';

                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    // Format path to be relative and use forward slashes for readability
                    const relativePath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
                    const block = `File: ${relativePath}\n\`\`\`${lang}\n${content}\n\`\`\`\n\n`;

                    fs.appendFileSync(outputFile, block, 'utf8');
                    count++;
                } catch (err) {
                    console.warn(`⚠️ Could not read ${item}`);
                }
            }
        }
    }
}

// 1. Grab package.json first
const pkgPath = path.resolve('package.json');
if (fs.existsSync(pkgPath)) {
    const content = fs.readFileSync(pkgPath, 'utf8');
    fs.appendFileSync(outputFile, `File: package.json\n\`\`\`json\n${content}\n\`\`\`\n\n`, 'utf8');
    count++;
}

// 2. Scan the src directory
const srcPath = path.resolve('src');
if (fs.existsSync(srcPath)) {
    console.log("🔍 Scanning 'src' directory...");
    processDirectory(srcPath);
} else {
    console.error("❌ ERROR: Could not find 'src' folder.");
}

console.log(`=====================================================`);
console.log(`✅ SUCCESS! Compiled ${count} files into frontend_context.md`);
console.log(`=====================================================`);