const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Create uploads folder
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Store image data
const images = {};

// Configure multer for multiple images
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        const id = crypto.randomBytes(8).toString('hex');
        const ext = path.extname(file.originalname);
        cb(null, id + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only images allowed (jpg, png, gif, webp, bmp)'));
        }
    }
});

// Generate unique ID
function generateId() {
    return crypto.randomBytes(4).toString('hex');
}

// Homepage
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Multi Image URL Generator</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                font-family: 'Segoe UI', Roboto, sans-serif;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1.5rem;
            }
            .card {
                background: white;
                border-radius: 2rem;
                padding: 2rem;
                width: 100%;
                max-width: 600px;
                box-shadow: 0 30px 60px rgba(0,0,0,0.3);
            }
            .icon { font-size: 4rem; text-align: center; margin-bottom: 0.5rem; }
            h1 { font-size: 1.8rem; color: #0f172a; text-align: center; margin-bottom: 0.3rem; }
            .subtitle { color: #64748b; text-align: center; font-size: 0.9rem; margin-bottom: 1.5rem; }
            
            .upload-area {
                border: 3px dashed #cbd5e1;
                border-radius: 1.5rem;
                padding: 2.5rem 1.5rem;
                text-align: center;
                cursor: pointer;
                transition: 0.3s;
                margin-bottom: 1rem;
                background: #f8fafc;
            }
            .upload-area:hover, .upload-area.dragover {
                border-color: #3b82f6;
                background: #eff6ff;
            }
            .upload-icon { font-size: 3rem; }
            .upload-text { color: #64748b; margin-top: 0.5rem; }
            .upload-hint { color: #94a3b8; font-size: 0.8rem; margin-top: 0.3rem; }
            input[type="file"] { display: block; }
            
            .preview-container {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                margin-bottom: 1rem;
                max-height: 200px;
                overflow-y: auto;
            }
            .preview-item {
                position: relative;
                width: 80px;
                height: 80px;
                border-radius: 0.5rem;
                overflow: hidden;
                border: 2px solid #e2e8f0;
            }
            .preview-item img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .preview-item .remove {
                position: absolute;
                top: 2px;
                right: 2px;
                background: #dc2626;
                color: white;
                border: block;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .file-count {
                text-align: center;
                font-size: 0.85rem;
                color: #64748b;
                margin-bottom: 1rem;
                display: block;
            }
            
            .btn {
                width: 100%;
                padding: 1rem;
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 3rem;
                font-size: 1.1rem;
                font-weight: 600;
                cursor: pointer;
                font-family: inherit;
                transition: 0.3s;
                margin-bottom: 0.5rem;
            }
            .btn:hover { background: #2563eb; transform: translateY(-1px); }
            .btn:disabled { opacity: 0.6; cursor: not-allowed; }
            
            .results {
                margin-top: 1.5rem;
                max-height: 400px;
                overflow-y: auto;
            }
            .result-item {
                background: #f8fafc;
                border-radius: 1rem;
                padding: 1rem;
                margin-bottom: 0.8rem;
                display: flex;
                gap: 1rem;
                align-items: center;
                border: 1px solid #e2e8f0;
            }
            .result-item img {
                width: 60px;
                height: 60px;
                border-radius: 0.5rem;
                object-fit: cover;
            }
            .result-info {
                flex: 1;
                min-width: 0;
            }
            .result-name {
                font-size: 0.85rem;
                font-weight: 600;
                color: #0f172a;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .result-url {
                font-family: monospace;
                font-size: 0.75rem;
                color: #3b82f6;
                word-break: break-all;
                margin: 0.3rem 0;
            }
            .result-actions {
                display: flex;
                gap: 0.3rem;
            }
            .action-btn {
                padding: 0.3rem 0.6rem;
                border: none;
                border-radius: 0.4rem;
                font-size: 0.75rem;
                cursor: pointer;
                font-family: inherit;
                white-space: nowrap;
            }
            .copy-btn { background: #0f172a; color: white; }
            .open-btn { background: #3b82f6; color: white; text-decoration: none; }
            .copy-btn.copied { background: #059669; }
            
            .loading {
                text-align: center;
                padding: 2rem;
                display: none;
            }
            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #e2e8f0;
                border-top: 4px solid #3b82f6;
                border-radius: 50%;
                margin: 0 auto 1rem;
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .delete-all {
                width: 100%;
                padding: 0.5rem;
                background: #fee2e2;
                color: #dc2626;
                border: none;
                border-radius: 2rem;
                cursor: pointer;
                font-family: inherit;
                margin-top: 1rem;
                font-size: 0.85rem;
            }
            .delete-all:hover { background: #fecaca; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="icon">🖼️</div>
            <h1>Multi Image URL Generator</h1>
            <p class="subtitle">Upload multiple images & get permanent links</p>
            
            <div class="upload-area" id="uploadArea">
                <div class="upload-icon">📁</div>
                <div class="upload-text">Click or Drag & Drop Images Here</div>
                <div class="upload-hint">Supports: JPG, PNG, GIF, WebP • Max 10MB each</div>
                
            </div>
            <input type="file" id="fileInput" >
            <div class="file-count" id="fileCount"></div>
            <div class="preview-container" id="previewContainer"></div>
        
            <button class="btn" id="uploadBtn" onclick="uploadImages()" >
                🚀 Upload & Get Links
            </button>
            
            <div class="loading" id="loading">
                <div class="spinner"></div>
                <p>Uploading images...</p>
            </div>
            
            <div class="results" id="results"></div>
            <button class="delete-all" id="deleteAll" style="display:none;" onclick="deleteAll()">
                🗑 Clear All Results
            </button>
        </div>
        
        <script>
            let selectedFiles = [];
            let uploadedUrls = [];
            
            const uploadArea = document.getElementById('uploadArea');
            const fileInput = document.getElementById('fileInput');
            const previewContainer = document.getElementById('previewContainer');
            const fileCount = document.getElementById('fileCount');
            const uploadBtn = document.getElementById('uploadBtn');
            const results = document.getElementById('results');
            const loading = document.getElementById('loading');
            const deleteAllBtn = document.getElementById('deleteAll');
            
            // Click to select files
            uploadArea.addEventListener('click', () => fileInput.click());
            
            // File selected
            fileInput.addEventListener('change', (e) => {
                addFiles(e.target.files);
            });
            
            // Drag and drop
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                addFiles(e.dataTransfer.files);
            });
            
            function addFiles(files) {
                for (let file of files) {
                    if (file.type.startsWith('image/')) {
                        selectedFiles.push(file);
                    }
                }
                updatePreview();
            }
            
            function updatePreview() {
                previewContainer.innerHTML = '';
                
                if (selectedFiles.length === 0) {
                    fileCount.style.display = 'none';
                    uploadBtn.disabled = true;
                    return;
                }
                
                fileCount.style.display = 'block';
                fileCount.textContent = selectedFiles.length + ' image(s) selected';
                uploadBtn.disabled = false;
                
                selectedFiles.forEach((file, index) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const div = document.createElement('div');
                        div.className = 'preview-item';
                        div.innerHTML = 
                            '<img src="' + e.target.result + '">' +
                            '<button class="remove" onclick="removeFile(' + index + ')">×</button>';
                        previewContainer.appendChild(div);
                    };
                    reader.readAsDataURL(file);
                });
            }
            
            window.removeFile = function(index) {
                selectedFiles.splice(index, 1);
                updatePreview();
            };
            
            async function uploadImages() {
                if (selectedFiles.length === 0) return;
                
                const formData = new FormData();
                selectedFiles.forEach(file => {
                    formData.append('images', file);
                });
                
                uploadBtn.disabled = true;
                uploadBtn.textContent = '⏳ Uploading...';
                loading.style.display = 'block';
                results.innerHTML = '';
                
                try {
                    const response = await fetch('/upload', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        uploadedUrls = data.images;
                        displayResults(data.images);
                        selectedFiles = [];
                        fileInput.value = '';
                        updatePreview();
                        deleteAllBtn.style.display = 'block';
                    } else {
                        alert('Upload failed: ' + (data.error || 'Unknown error'));
                    }
                } catch (err) {
                    alert('Connection error: ' + err.message);
                } finally {
                    uploadBtn.disabled = false;
                    uploadBtn.textContent = '🚀 Upload & Get Links';
                    loading.style.display = 'none';
                }
            }
            
            function displayResults(images) {
                results.innerHTML = images.map((img, i) => 
                    '<div class="result-item">' +
                        '<img src="' + img.url + '" alt="' + img.name + '">' +
                        '<div class="result-info">' +
                            '<div class="result-name">📷 ' + img.name + '</div>' +
                            '<div class="result-url">' + img.url + '</div>' +
                            '<div class="result-actions">' +
                                '<button class="action-btn copy-btn" onclick="copyUrl(\'' + img.url + '\', this)">📋 Copy</button>' +
                                '<a class="action-btn open-btn" href="' + img.url + '" target="_blank">🔗 Open</a>' +
                            '</div>' +
                        '</div>' +
                    '</div>'
                ).join('');
            }
            
            window.copyUrl = function(url, btn) {
                navigator.clipboard.writeText(url).then(() => {
                    btn.textContent = '✅ Copied';
                    btn.classList.add('copied');
                    setTimeout(() => {
                        btn.textContent = '📋 Copy';
                        btn.classList.remove('copied');
                    }, 2000);
                });
            };
            
            window.deleteAll = function() {
                uploadedUrls = [];
                results.innerHTML = '';
                deleteAllBtn.style.display = 'none';
            };
        </script>
    </body>
    </html>
    `);
});

// Upload multiple images
app.post('/upload', upload.array('images', 20), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.json({ success: false, error: 'No images uploaded' });
        }
        
        const host = req.get('host');
        const protocol = req.protocol;
        
        const uploadedImages = req.files.map(file => {
            const id = generateId();
            const imageUrl = `${protocol}://${host}/img/${id}`;
            
            // Store image data
            images[id] = {
                id,
                filename: file.filename,
                originalname: file.originalname,
                path: file.path,
                size: file.size,
                uploaded: new Date().toISOString(),
                views: 0
            };
            
            return {
                id,
                name: file.originalname,
                url: imageUrl,
                size: (file.size / 1024).toFixed(1) + ' KB'
            };
        });
        
        console.log(`✅ Uploaded ${req.files.length} images`);
        
        res.json({
            success: true,
            count: req.files.length,
            images: uploadedImages
        });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// View single image
app.get('/img/:id', (req, res) => {
    const { id } = req.params;
    const imageData = images[id];
    
    if (!imageData || !fs.existsSync(imageData.path)) {
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Image Not Found</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        background: #0f172a;
                        color: white;
                        text-align: center;
                    }
                    .icon { font-size: 4rem; }
                    a { color: #3b82f6; }
                </style>
            </head>
            <body>
                <div>
                    <div class="icon">🖼️</div>
                    <h1>Image Not Found</h1>
                    <p>This image doesn't exist or has been removed.</p>
                    <a href="/">← Upload New Images</a>
                </div>
            </body>
            </html>
        `);
    }
    
    // Increment views
    images[id].views++;
    
    // Serve the actual image file
    res.sendFile(path.resolve(imageData.path));
});

// Gallery page - view all images
app.get('/gallery', (req, res) => {
    const imageList = Object.values(images);
    const host = req.get('host');
    const protocol = req.protocol;
    
    if (imageList.length === 0) {
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Gallery</title>
                <style>
                    body { font-family: sans-serif; text-align: center; padding: 3rem; background: #0f172a; color: white; }
                    a { color: #3b82f6; }
                </style>
            </head>
            <body>
                <h1>📷 Gallery</h1>
                <p>No images uploaded yet.</p>
                <a href="/">Upload Images →</a>
            </body>
            </html>
        `);
    }
    
    const imageCards = imageList.map(img => 
        `<div style="background:white;border-radius:1rem;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
            <a href="/img/${img.id}" target="_blank">
                <img src="/img/${img.id}" style="width:100%;height:200px;object-fit:cover;" alt="${img.originalname}">
            </a>
            <div style="padding:0.8rem;">
                <p style="font-weight:600;font-size:0.85rem;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${img.originalname}</p>
                <p style="font-size:0.75rem;color:#64748b;">👁 ${img.views} views</p>
                <a href="/img/${img.id}" style="color:#3b82f6;font-size:0.8rem;word-break:break-all;">
                    ${protocol}://${host}/img/${img.id}
                </a>
            </div>
        </div>`
    ).join('');
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Image Gallery</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { background: #f1f5f9; font-family: 'Segoe UI', sans-serif; min-height: 100vh; }
                .header { background: #0f172a; color: white; padding: 1.5rem; text-align: center; }
                .header a { color: #3b82f6; }
                .grid { 
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 1rem;
                    padding: 1.5rem;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                a { text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📷 Image Gallery</h1>
                <p>${imageList.length} images</p>
                <a href="/">← Upload More</a>
            </div>
            <div class="grid">${imageCards}</div>
        </body>
        </html>
    `);
});

// Delete image
app.delete('/img/:id', (req, res) => {
    const { id } = req.params;
    const imageData = images[id];
    
    if (!imageData) {
        return res.status(404).json({ error: 'Image not found' });
    }
    
    // Delete file
    if (fs.existsSync(imageData.path)) {
        fs.unlinkSync(imageData.path);
    }
    
    delete images[id];
    res.json({ success: true });
});

// Error handler for multer
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.json({ success: false, error: 'File too large. Max 10MB.' });
        }
        return res.json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: error.message });
});

// Start server
const PORT = process.env.PORT || 3290;
app.listen(PORT, () => {
    console.log(`🖼️  Image URL Generator running on http://localhost:${PORT}`);
    console.log(`📁 Uploads directory: uploads/`);
    console.log(`📷 Gallery: http://localhost:${PORT}/gallery`);
});
