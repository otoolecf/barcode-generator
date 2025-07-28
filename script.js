let currentSVG = null;

document.addEventListener('DOMContentLoaded', function() {
    // Clear any stored state on page load
    currentSVG = null;
    
    const generateBtn = document.getElementById('generateBtn');
    const scaleSlider = document.getElementById('scale');
    const scaleNumber = document.getElementById('scaleNumber');
    const opacitySlider = document.getElementById('backgroundOpacity');
    const opacityNumber = document.getElementById('opacityNumber');
    const sizeMode = document.getElementById('sizeMode');
    const scaleGroup = document.getElementById('scaleGroup');
    const pixelGroup = document.getElementById('pixelGroup');
    const foregroundColor = document.getElementById('foregroundColor');
    const foregroundColorText = document.getElementById('foregroundColorText');
    const backgroundColor = document.getElementById('backgroundColor');
    const backgroundColorText = document.getElementById('backgroundColorText');
    
    // Sync scale slider and number input
    scaleSlider.addEventListener('input', function() {
        scaleNumber.value = this.value;
    });
    
    scaleNumber.addEventListener('input', function() {
        scaleSlider.value = this.value;
    });
    
    // Sync opacity slider and number input
    opacitySlider.addEventListener('input', function() {
        opacityNumber.value = this.value;
    });
    
    opacityNumber.addEventListener('input', function() {
        opacitySlider.value = this.value;
    });
    
    // Sync color picker and text input for foreground
    foregroundColor.addEventListener('input', function() {
        foregroundColorText.value = this.value;
    });
    
    foregroundColorText.addEventListener('input', function() {
        const color = parseColor(this.value);
        if (color) {
            foregroundColor.value = color;
        }
    });
    
    // Sync color picker and text input for background
    backgroundColor.addEventListener('input', function() {
        backgroundColorText.value = this.value;
    });
    
    backgroundColorText.addEventListener('input', function() {
        const color = parseColor(this.value);
        if (color) {
            backgroundColor.value = color;
        }
    });
    
    // Toggle between scale and pixel size
    sizeMode.addEventListener('change', function() {
        if (this.value === 'pixels') {
            scaleGroup.style.display = 'none';
            pixelGroup.style.display = 'flex';
        } else {
            scaleGroup.style.display = 'flex';
            pixelGroup.style.display = 'none';
        }
    });
    
    generateBtn.addEventListener('click', generateBarcode);
    
    document.getElementById('saveBtn').addEventListener('click', function() {
        const format = document.getElementById('fileFormat').value;
        downloadBarcode(format);
    });
    
    generateBarcode();
});

let isGenerating = false;

function generateBarcode() {
    if (isGenerating) {
        console.log('Already generating, skipping...');
        return;
    }
    isGenerating = true;
    
    const barcodeType = document.getElementById('barcodeType').value;
    const barcodeData = document.getElementById('barcodeData').value;
    const sizeMode = document.getElementById('sizeMode').value;
    const foregroundColor = document.getElementById('foregroundColor').value;
    const backgroundColor = document.getElementById('backgroundColor').value;
    const backgroundOpacity = parseInt(document.getElementById('backgroundOpacity').value) / 100;
    
    let scale;
    if (sizeMode === 'pixels') {
        const pixelSize = parseInt(document.getElementById('pixelSize').value);
        // Calculate scale based on desired pixel width
        // Base size for most barcodes is around 100 units, adjust scale accordingly
        scale = pixelSize / 100;
    } else {
        scale = parseFloat(document.getElementById('scale').value);
    }
    
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.classList.remove('show');
    
    if (!barcodeData) {
        showError('Please enter barcode data');
        return;
    }
    
    const canvas = document.getElementById('barcodeCanvas');
    
    // Ensure canvas has proper context and dimensions
    const ctx = canvas.getContext('2d');
    
    // Clear the canvas first to ensure transparency
    if (canvas.width) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else {
        // Initialize canvas with minimum dimensions if not set
        canvas.width = 300;
        canvas.height = 150;
    }
    
    try {
        const options = {
            bcid: barcodeType,
            text: barcodeData,
            scale: scale,
            height: 10,
            includetext: true,
            textxalign: 'center',
            padding: 10
        };
        
        // Set colors - bwip-js expects colors without # and in hex format
        options.barcolor = foregroundColor.substring(1);
        
        // Handle background transparency
        if (backgroundOpacity === 0) {
            // No background color for full transparency
        } else if (backgroundOpacity === 1) {
            // Full opacity - use solid background
            options.backgroundcolor = backgroundColor.substring(1);
        } else {
            // Partial transparency - don't set background, we'll handle it manually
        }
        
        if (barcodeType === 'qrcode' || barcodeType === 'datamatrix' || barcodeType === 'azteccode') {
            delete options.height;
            delete options.includetext;
        }
        
        console.log('Barcode options:', options);
        console.log('Background opacity:', backgroundOpacity, 'Type:', typeof backgroundOpacity);
        console.log('bwipjs available:', typeof bwipjs);
        console.log('bwipjs methods:', Object.keys(bwipjs));
        console.log('toCanvas method:', typeof bwipjs.toCanvas);
        console.log('canvas:', canvas);
        console.log('canvas dimensions:', canvas.width, 'x', canvas.height);
        
        try {
            console.log('About to call bwipjs.toCanvas synchronously...');
            
            // Use synchronous API
            bwipjs.toCanvas(canvas, options);
            console.log('Barcode generated successfully');
            
            // Apply transparency to preview for partial opacity
            console.log('Checking transparency condition:', backgroundOpacity > 0 && backgroundOpacity < 1, 'opacity:', backgroundOpacity);
            if (backgroundOpacity > 0 && backgroundOpacity < 1) {
                console.log('Applying transparency effect...');
                const ctx = canvas.getContext('2d');
                
                // Create temp canvas for barcode without background
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                
                // Draw barcode with transparent background on temp canvas
                const transparentOptions = Object.assign({}, options);
                delete transparentOptions.backgroundcolor;
                
                // Generate barcode without background
                bwipjs.toCanvas(tempCanvas, transparentOptions);
                
                // Clear main canvas and draw transparent background using RGBA
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Convert hex to RGB and apply alpha
                const r = parseInt(backgroundColor.substring(1, 3), 16);
                const g = parseInt(backgroundColor.substring(3, 5), 16);
                const b = parseInt(backgroundColor.substring(5, 7), 16);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${backgroundOpacity})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw the transparent barcode on top, maintaining positioning
                ctx.drawImage(tempCanvas, 0, 0);
            }
            isGenerating = false;
        } catch (bwipjsError) {
            console.error('Error calling bwipjs.toCanvas:', bwipjsError);
            showError('bwipjs error: ' + bwipjsError.message);
            isGenerating = false;
        }
        
    } catch (err) {
        showError('Error: ' + err.message);
    }
}


function createCanvasSVG() {
    try {
        // Convert canvas to SVG using data URL approach
        const canvas = document.getElementById('barcodeCanvas');
        const dataURL = canvas.toDataURL('image/png');
        currentSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
            <image href="${dataURL}" width="${canvas.width}" height="${canvas.height}"/>
        </svg>`;
        console.log('Created canvas-based SVG fallback');
    } catch (fallbackErr) {
        console.error('SVG fallback error:', fallbackErr);
        currentSVG = null;
    }
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    
    const rHex = r.toString(16).padStart(2, '0');
    const gHex = g.toString(16).padStart(2, '0');
    const bHex = b.toString(16).padStart(2, '0');
    const aHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
    
    return rHex + gHex + bHex + aHex;
}

function downloadBarcode(format) {
    const canvas = document.getElementById('barcodeCanvas');
    const barcodeType = document.getElementById('barcodeType').value;
    const barcodeData = document.getElementById('barcodeData').value;
    
    // Check if a barcode has been generated
    if (!canvas.width || !canvas.height) {
        showError('Please generate a barcode first');
        return;
    }
    
    // Generate a cleaner filename
    let cleanData = barcodeData;
    
    // If it's a URL, extract the domain
    if (cleanData.startsWith('http://') || cleanData.startsWith('https://')) {
        try {
            const url = new URL(cleanData);
            cleanData = url.hostname.replace('www.', '');
        } catch (e) {
            // If URL parsing fails, just clean it up
            cleanData = cleanData.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '_');
        }
    } else {
        // For non-URLs, keep alphanumeric and replace special chars with underscore
        cleanData = cleanData.replace(/[^a-zA-Z0-9]/g, '_');
    }
    
    // Limit length and remove trailing underscores
    cleanData = cleanData.substring(0, 20).replace(/_+$/, '');
    
    // Create timestamp for uniqueness
    const timestamp = new Date().toISOString().split('T')[0];
    
    const filename = `${barcodeType}_${cleanData}_${timestamp}`;
    
    if (format === 'svg') {
        // Reconstruct options from current form values
        const sizeMode = document.getElementById('sizeMode').value;
        const foregroundColor = document.getElementById('foregroundColor').value;
        const backgroundColor = document.getElementById('backgroundColor').value;
        const backgroundOpacity = parseInt(document.getElementById('backgroundOpacity').value) / 100;
        
        let scale;
        if (sizeMode === 'pixels') {
            const pixelSize = parseInt(document.getElementById('pixelSize').value);
            scale = pixelSize / 100;
        } else {
            scale = parseFloat(document.getElementById('scale').value);
        }
        
        const options = {
            bcid: barcodeType,
            text: barcodeData,
            scale: scale,
            height: 10,
            includetext: true,
            textxalign: 'center',
            padding: 10
        };
        
        // Set colors
        options.barcolor = foregroundColor.substring(1);
        if (backgroundOpacity === 0) {
            // For fully transparent, don't set background color
        } else {
            // Always set background color without alpha (we'll handle transparency after)
            options.backgroundcolor = backgroundColor.substring(1);
        }
        
        if (barcodeType === 'qrcode' || barcodeType === 'datamatrix' || barcodeType === 'azteccode') {
            delete options.height;
            delete options.includetext;
        }
        
        // Use canvas-based SVG since CDN version doesn't include toSVG
        createCanvasSVG();
        if (currentSVG) {
            const blob = new Blob([currentSVG], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename + '.svg';
            a.click();
            URL.revokeObjectURL(url);
        } else {
            showError('SVG generation failed. Please try again.');
        }
    } else {
        // Handle transparency for export
        if (format === 'png' && backgroundOpacity < 1) {
            // Create a new canvas with transparency applied
            const exportCanvas = document.createElement('canvas');
            exportCanvas.width = canvas.width;
            exportCanvas.height = canvas.height;
            const exportCtx = exportCanvas.getContext('2d');
            
            if (backgroundOpacity === 0) {
                // For fully transparent background, render without background
                const tempOptions = {
                    bcid: barcodeType,
                    text: barcodeData,
                    scale: sizeMode === 'pixels' ? parseInt(document.getElementById('pixelSize').value) / 100 : parseFloat(document.getElementById('scale').value),
                    height: 10,
                    includetext: true,
                    textxalign: 'center',
                    padding: 10,
                    barcolor: document.getElementById('foregroundColor').value.substring(1)
                    // No background color for transparency
                };
                
                if (barcodeType === 'qrcode' || barcodeType === 'datamatrix' || barcodeType === 'azteccode') {
                    delete tempOptions.height;
                    delete tempOptions.includetext;
                }
                
                bwipjs.toCanvas(exportCanvas, tempOptions, function(err) {
                    if (!err) {
                        exportCanvas.toBlob(function(blob) {
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = filename + '.png';
                            a.click();
                            URL.revokeObjectURL(url);
                        }, 'image/png');
                    } else {
                        showError('Export failed');
                    }
                });
            } else {
                // For partial transparency, create background with proper alpha
                const r = parseInt(document.getElementById('backgroundColor').value.substring(1, 3), 16);
                const g = parseInt(document.getElementById('backgroundColor').value.substring(3, 5), 16);
                const b = parseInt(document.getElementById('backgroundColor').value.substring(5, 7), 16);
                
                exportCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${backgroundOpacity})`;
                exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
                
                // Create a temporary canvas for the barcode without background
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = exportCanvas.width;
                tempCanvas.height = exportCanvas.height;
                
                const tempOptions = {
                    bcid: barcodeType,
                    text: barcodeData,
                    scale: document.getElementById('sizeMode').value === 'pixels' ? parseInt(document.getElementById('pixelSize').value) / 100 : parseFloat(document.getElementById('scale').value),
                    height: 10,
                    includetext: true,
                    textxalign: 'center',
                    padding: 10,
                    barcolor: document.getElementById('foregroundColor').value.substring(1)
                };
                
                if (barcodeType === 'qrcode' || barcodeType === 'datamatrix' || barcodeType === 'azteccode') {
                    delete tempOptions.height;
                    delete tempOptions.includetext;
                }
                
                bwipjs.toCanvas(tempCanvas, tempOptions, function(err) {
                    if (!err) {
                        exportCtx.drawImage(tempCanvas, 0, 0);
                        
                        exportCanvas.toBlob(function(blob) {
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = filename + '.png';
                            a.click();
                            URL.revokeObjectURL(url);
                        }, 'image/png');
                    } else {
                        showError('Export failed');
                    }
                });
                return; // Exit early since we handle the blob creation in the callback
            }
        } else {
            // Regular export without transparency handling
            canvas.toBlob(function(blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename + '.' + (format === 'png' ? 'png' : 'jpg');
                a.click();
                URL.revokeObjectURL(url);
            }, format === 'png' ? 'image/png' : 'image/jpeg', 0.95);
        }
    }
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.classList.add('show');
    setTimeout(() => {
        errorElement.classList.remove('show');
    }, 5000);
}

function parseColor(color) {
    // Remove spaces
    color = color.trim();
    
    // Check if it's already a valid hex color
    if (/^#[0-9A-F]{6}$/i.test(color)) {
        return color;
    }
    
    // Add # if it's missing
    if (/^[0-9A-F]{6}$/i.test(color)) {
        return '#' + color;
    }
    
    // Parse rgb(r, g, b) format
    const rgbMatch = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i);
    if (rgbMatch) {
        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);
        if (r <= 255 && g <= 255 && b <= 255) {
            return '#' + 
                r.toString(16).padStart(2, '0') + 
                g.toString(16).padStart(2, '0') + 
                b.toString(16).padStart(2, '0');
        }
    }
    
    return null;
}