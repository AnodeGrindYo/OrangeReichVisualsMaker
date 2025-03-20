import { APP_CONFIG, DEFAULT_SETTINGS } from './config.js';

// Main application state
const appState = {
    audioFile: null,
    videoFile: null,
    audioContext: null,
    audioSource: null,
    audioAnalyser: null,
    frequencyData: null,
    timeData: null,
    mediaStream: null,
    isPlaying: false,
    mediaRecorder: null,
    recordedChunks: [],
    settings: { ...DEFAULT_SETTINGS },
    exportProgress: 0,
    useFallbackMode: false
};

// DOM elements
const elements = {
    // Upload elements
    audioFileInput: document.getElementById('audio-file'),
    videoFileInput: document.getElementById('video-file'),
    audioUploadBtn: document.getElementById('audio-upload-btn'),
    videoUploadBtn: document.getElementById('video-upload-btn'),
    audioFileInfo: document.getElementById('audio-file-info'),
    videoFileInfo: document.getElementById('video-file-info'),
    
    // Preview elements
    previewVideo: document.getElementById('preview-video'),
    effectCanvas: document.getElementById('effect-canvas'),
    waveformCanvas: document.getElementById('waveform'),
    spectrumCanvas: document.getElementById('spectrum'),
    logoOverlay: document.getElementById('logo-overlay'),
    textOverlay: document.getElementById('text-overlay'),
    artistText: document.getElementById('artist'),
    trackText: document.getElementById('track'),
    
    // Control elements
    playPauseBtn: document.getElementById('play-pause-btn'),
    currentTime: document.getElementById('current-time'),
    totalTime: document.getElementById('total-time'),
    
    // Customization inputs
    artistName: document.getElementById('artist-name'),
    trackName: document.getElementById('track-name'),
    textPosition: document.getElementById('text-position'),
    textColor: document.getElementById('text-color'),
    logoSize: document.getElementById('logo-size'),
    logoSizeValue: document.getElementById('logo-size-value'),
    logoPosition: document.getElementById('logo-position'),
    logoOpacity: document.getElementById('logo-opacity'),
    logoOpacityValue: document.getElementById('logo-opacity-value'),
    
    // Effect settings
    videoEffectType: document.getElementById('video-effect-type'),
    videoReactivity: document.getElementById('video-reactivity'),
    videoReactivityValue: document.getElementById('video-reactivity-value'),
    videoFrequencyRange: document.getElementById('video-frequency-range'),
    logoEffectType: document.getElementById('logo-effect-type'),
    logoReactivity: document.getElementById('logo-reactivity'),
    logoReactivityValue: document.getElementById('logo-reactivity-value'),
    logoFrequencyRange: document.getElementById('logo-frequency-range'),
    textEffectType: document.getElementById('text-effect-type'),
    textReactivity: document.getElementById('text-reactivity'),
    textReactivityValue: document.getElementById('text-reactivity-value'),
    textFrequencyRange: document.getElementById('text-frequency-range'),
    
    // Tab buttons
    tabButtons: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Export elements
    exportQuality: document.getElementById('export-quality'),
    exportFormat: document.getElementById('export-format'),
    audioQuality: document.getElementById('audio-quality'),
    exportBtn: document.getElementById('export-btn'),
    exportProgress: document.querySelector('.export-progress'),
    progressBar: document.querySelector('.progress-bar'),
    progressStep: document.getElementById('progress-step'),
    progressPercentage: document.querySelector('.progress-percentage'),
    exportResult: document.querySelector('.export-result'),
    resultVideo: document.getElementById('result-video'),
    downloadBtn: document.getElementById('download-btn'),
    startOverBtn: document.getElementById('start-over-btn'),
    tipCarousel: document.querySelector('.tip-carousel'),
    tips: document.querySelectorAll('.tip')
};

// Initialize the application
async function initApp() {
    // Setup file upload listeners
    elements.audioUploadBtn.addEventListener('click', () => elements.audioFileInput.click());
    elements.videoUploadBtn.addEventListener('click', () => elements.videoFileInput.click());
    elements.audioFileInput.addEventListener('change', handleAudioUpload);
    elements.videoFileInput.addEventListener('change', handleVideoUpload);
    
    // Setup playback controls
    elements.playPauseBtn.addEventListener('click', togglePlayback);
    elements.previewVideo.addEventListener('timeupdate', updateTimeDisplay);
    
    // Setup customization inputs
    elements.artistName.addEventListener('input', updateTextOverlay);
    elements.trackName.addEventListener('input', updateTextOverlay);
    elements.textPosition.addEventListener('change', updateTextPosition);
    elements.textColor.addEventListener('input', updateTextColor);
    elements.logoSize.addEventListener('input', updateLogoSize);
    elements.logoPosition.addEventListener('change', updateLogoPosition);
    elements.logoOpacity.addEventListener('input', updateLogoOpacity);
    
    // Setup effect input listeners
    elements.videoEffectType.addEventListener('change', updateEffectSettings);
    elements.videoReactivity.addEventListener('input', updateEffectSettings);
    elements.videoFrequencyRange.addEventListener('change', updateEffectSettings);
    elements.logoEffectType.addEventListener('change', updateEffectSettings);
    elements.logoReactivity.addEventListener('input', updateEffectSettings);
    elements.logoFrequencyRange.addEventListener('change', updateEffectSettings);
    elements.textEffectType.addEventListener('change', updateEffectSettings);
    elements.textReactivity.addEventListener('input', updateEffectSettings);
    elements.textFrequencyRange.addEventListener('change', updateEffectSettings);
    
    // Setup tab navigation
    elements.tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            elements.tabButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            // Hide all tab contents
            elements.tabContents.forEach(content => content.classList.remove('active'));
            // Show the selected tab content
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Setup export controls
    elements.exportBtn.addEventListener('click', startExport);
    elements.downloadBtn.addEventListener('click', downloadExportedVideo);
    elements.startOverBtn.addEventListener('click', resetApp);
    
    // Initialize FFmpeg
    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        appState.audioContext = new AudioContext();
    } catch (error) {
        console.error('Failed to load FFmpeg:', error);
        console.log('Using fallback export simulation mode');
        appState.useFallbackMode = true;
    }
    
    // Initialize audio context
    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        appState.audioContext = new AudioContext();
    } catch (error) {
        console.error('Failed to create audio context:', error);
        alert('Your browser does not support the Web Audio API.');
    }
    
    // Setup tip carousel
    startTipCarousel();
}

// Handle audio file upload
function handleAudioUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'audio/wav') {
        alert('Please upload a WAV audio file.');
        return;
    }

    appState.audioFile = file;
    elements.audioFileInfo.textContent = `${file.name} (${formatFileSize(file.size)})`;

    // Création de l'URL audio
    const audioUrl = URL.createObjectURL(file);

    // Si une source audio existait, on la supprime proprement
    if (appState.audioSource) {
        appState.audioSource.disconnect();
        appState.audioSource = null;
    }

    // Création de l'élément audio et association à la vidéo
    if (!appState.audioElement) {
        appState.audioElement = new Audio();
        appState.audioElement.controls = true;
        elements.previewVideo.parentElement.appendChild(appState.audioElement);
    }

    appState.audioElement.src = audioUrl;
    appState.audioElement.loop = true;
    
    // Jouer l'audio quand la vidéo est jouée
    elements.previewVideo.addEventListener('play', () => {
        if (appState.audioElement.paused) {
            appState.audioElement.play().catch(err => console.warn('Autoplay blocked:', err));
        }
    });

    // Mettre pause à l'audio quand la vidéo est en pause
    elements.previewVideo.addEventListener('pause', () => {
        appState.audioElement.pause();
    });

    checkReadyToExport();
}


// Handle video file upload
function handleVideoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check supported video formats
    if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type)) {
        alert('Please upload an MP4, WebM, or MOV video file.');
        return;
    }
    
    appState.videoFile = file;
    elements.videoFileInfo.textContent = `${file.name} (${formatFileSize(file.size)})`;
    
    // Create video preview
    const videoUrl = URL.createObjectURL(file);
    
    if (appState.audioFile) {
        // If we have both audio and video, we need to mute the video
        elements.previewVideo.muted = true;
    } else {
        elements.previewVideo.muted = false;
    }
    
    elements.previewVideo.src = videoUrl;
    elements.previewVideo.srcObject = null;
    
    // Show overlays
    elements.logoOverlay.classList.remove('hidden');
    elements.textOverlay.classList.remove('hidden');
    
    checkReadyToExport();
}

// Toggle playback of preview video
function togglePlayback() {
    if (appState.audioContext.state === 'suspended') {
        appState.audioContext.resume();
    }
    
    if (elements.previewVideo.paused) {
        elements.previewVideo.play();
        elements.playPauseBtn.textContent = '⏸️';
        appState.isPlaying = true;
        
        // Start animation frame for audio visualizers
        requestAnimationFrame(updateAudioVisualizers);
    } else {
        elements.previewVideo.pause();
        elements.playPauseBtn.textContent = '▶️';
        appState.isPlaying = false;
    }
}

// Update time display for video playback
function updateTimeDisplay() {
    elements.currentTime.textContent = formatTime(elements.previewVideo.currentTime);
    elements.totalTime.textContent = formatTime(elements.previewVideo.duration);
}

// Format time in seconds to MM:SS format
function formatTime(timeInSeconds) {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Format file size in bytes to human-readable format
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
}

// Update text overlay based on input values
function updateTextOverlay() {
    appState.settings.track.artist = elements.artistName.value;
    appState.settings.track.title = elements.trackName.value;
    
    elements.artistText.textContent = appState.settings.track.artist;
    elements.trackText.textContent = appState.settings.track.title;
}

// Update text position based on selected value
function updateTextPosition() {
    appState.settings.track.textPosition = elements.textPosition.value;
    
    // Reset all position classes
    elements.textOverlay.style.top = '';
    elements.textOverlay.style.right = '';
    elements.textOverlay.style.bottom = '';
    elements.textOverlay.style.left = '';
    elements.textOverlay.style.textAlign = '';
    
    // Apply new position
    switch (elements.textPosition.value) {
        case 'top-left':
            elements.textOverlay.style.top = '20px';
            elements.textOverlay.style.left = '20px';
            elements.textOverlay.style.textAlign = 'left';
            break;
        case 'top-right':
            elements.textOverlay.style.top = '20px';
            elements.textOverlay.style.right = '20px';
            elements.textOverlay.style.textAlign = 'right';
            break;
        case 'bottom-left':
            elements.textOverlay.style.bottom = '20px';
            elements.textOverlay.style.left = '20px';
            elements.textOverlay.style.textAlign = 'left';
            break;
        case 'bottom-right':
            elements.textOverlay.style.bottom = '20px';
            elements.textOverlay.style.right = '20px';
            elements.textOverlay.style.textAlign = 'right';
            break;
    }
}

// Update text color based on color picker
function updateTextColor() {
    appState.settings.track.textColor = elements.textColor.value;
    elements.textOverlay.style.color = elements.textColor.value;
}

// Update logo size based on slider value
function updateLogoSize() {
    appState.settings.logo.size = elements.logoSize.value;
    elements.logoSizeValue.textContent = `${elements.logoSize.value}%`;
    elements.logoOverlay.style.maxWidth = `${elements.logoSize.value}%`;
}

// Update logo position based on select value
function updateLogoPosition() {
    appState.settings.logo.position = elements.logoPosition.value;
    
    // Reset all position styles
    elements.logoOverlay.style.top = '';
    elements.logoOverlay.style.right = '';
    elements.logoOverlay.style.bottom = '';
    elements.logoOverlay.style.left = '';
    
    // Apply new position
    switch (elements.logoPosition.value) {
        case 'top-left':
            elements.logoOverlay.style.top = '20px';
            elements.logoOverlay.style.left = '20px';
            break;
        case 'top-right':
            elements.logoOverlay.style.top = '20px';
            elements.logoOverlay.style.right = '20px';
            break;
        case 'bottom-left':
            elements.logoOverlay.style.bottom = '20px';
            elements.logoOverlay.style.left = '20px';
            break;
        case 'bottom-right':
            elements.logoOverlay.style.bottom = '20px';
            elements.logoOverlay.style.right = '20px';
            break;
    }
}

// Update logo opacity based on slider value
function updateLogoOpacity() {
    appState.settings.logo.opacity = elements.logoOpacity.value;
    elements.logoOpacityValue.textContent = `${elements.logoOpacity.value}%`;
    elements.logoOverlay.style.opacity = elements.logoOpacity.value / 100;
}

// Update effect settings based on user input
function updateEffectSettings() {
    // Update video effect settings
    appState.settings.effects.video.type = elements.videoEffectType.value;
    appState.settings.effects.video.reactivity = elements.videoReactivity.value;
    elements.videoReactivityValue.textContent = `${elements.videoReactivity.value}%`;
    appState.settings.effects.video.frequencyRange = elements.videoFrequencyRange.value;
    
    // Update logo effect settings
    appState.settings.effects.logo.type = elements.logoEffectType.value;
    appState.settings.effects.logo.reactivity = elements.logoReactivity.value;
    elements.logoReactivityValue.textContent = `${elements.logoReactivity.value}%`;
    appState.settings.effects.logo.frequencyRange = elements.logoFrequencyRange.value;
    
    // Update text effect settings
    appState.settings.effects.text.type = elements.textEffectType.value;
    appState.settings.effects.text.reactivity = elements.textReactivity.value;
    elements.textReactivityValue.textContent = `${elements.textReactivity.value}%`;
    appState.settings.effects.text.frequencyRange = elements.textFrequencyRange.value;
}

// Get audio energy for a specific frequency range
function getAudioEnergy(frequencyRange) {
    if (!appState.frequencyData) return 0;
    
    const range = APP_CONFIG.audio.frequencyRanges[frequencyRange];
    const nyquist = appState.audioContext.sampleRate / 2;
    const lowIndex = Math.round((range.min / nyquist) * appState.frequencyData.length);
    const highIndex = Math.round((range.max / nyquist) * appState.frequencyData.length);
    
    let total = 0;
    let count = 0;
    
    for (let i = lowIndex; i <= highIndex && i < appState.frequencyData.length; i++) {
        total += appState.frequencyData[i];
        count++;
    }
    
    return count > 0 ? total / (count * 255) : 0; // Normalize to 0-1
}

// Update audio visualizers (waveform and spectrum)
function updateAudioVisualizers() {
    if (!appState.isPlaying || !appState.audioAnalyser) {
        return;
    }
    
    // Get audio data
    appState.audioAnalyser.getByteFrequencyData(appState.frequencyData);
    appState.audioAnalyser.getByteTimeDomainData(appState.timeData);
    
    // Draw waveform
    const waveformCtx = elements.waveformCanvas.getContext('2d');
    const waveformWidth = elements.waveformCanvas.width;
    const waveformHeight = elements.waveformCanvas.height;
    
    // Clear canvas
    waveformCtx.clearRect(0, 0, waveformWidth, waveformHeight);
    
    // Draw waveform
    waveformCtx.beginPath();
    waveformCtx.lineWidth = 2;
    waveformCtx.strokeStyle = '#ff6b00';
    
    const sliceWidth = waveformWidth / appState.timeData.length;
    let x = 0;
    
    for (let i = 0; i < appState.timeData.length; i++) {
        const v = appState.timeData[i] / 128.0;
        const y = v * waveformHeight / 2;
        
        if (i === 0) {
            waveformCtx.moveTo(x, y);
        } else {
            waveformCtx.lineTo(x, y);
        }
        
        x += sliceWidth;
    }
    
    waveformCtx.lineTo(waveformWidth, waveformHeight / 2);
    waveformCtx.stroke();
    
    // Draw spectrum
    const spectrumCtx = elements.spectrumCanvas.getContext('2d');
    const spectrumWidth = elements.spectrumCanvas.width;
    const spectrumHeight = elements.spectrumCanvas.height;
    
    // Clear canvas
    spectrumCtx.clearRect(0, 0, spectrumWidth, spectrumHeight);
    
    // Draw frequency bars
    const barWidth = (spectrumWidth / appState.frequencyData.length) * 2.5;
    let barX = 0;
    
    for (let i = 0; i < appState.frequencyData.length; i++) {
        const barHeight = (appState.frequencyData[i] / 255) * spectrumHeight;
        
        // Create gradient
        const gradient = spectrumCtx.createLinearGradient(0, spectrumHeight, 0, spectrumHeight - barHeight);
        gradient.addColorStop(0, '#ff6b00');
        gradient.addColorStop(1, '#ffbb00');
        
        spectrumCtx.fillStyle = gradient;
        spectrumCtx.fillRect(barX, spectrumHeight - barHeight, barWidth, barHeight);
        
        barX += barWidth + 1;
        
        // Only draw a subset of bars to prevent overcrowding
        if (barX > spectrumWidth) break;
    }
    
    // Apply audio reactive effects
    applyAudioReactiveEffects();
    
    // Continue animation
    requestAnimationFrame(updateAudioVisualizers);
}

// Apply audio reactive effects to video, logo, and text
function applyAudioReactiveEffects() {
    // Apply video effects
    if (appState.settings.effects.video.type !== 'none') {
        const videoEnergy = getAudioEnergy(appState.settings.effects.video.frequencyRange);
        const videoReactivity = appState.settings.effects.video.reactivity / 100;
        
        applyVideoEffect(appState.settings.effects.video.type, videoEnergy * videoReactivity);
    }
    
    // Apply logo effects
    if (appState.settings.effects.logo.type !== 'none') {
        const logoEnergy = getAudioEnergy(appState.settings.effects.logo.frequencyRange);
        const logoReactivity = appState.settings.effects.logo.reactivity / 100;
        
        applyLogoEffect(appState.settings.effects.logo.type, logoEnergy * logoReactivity);
    }
    
    // Apply text effects
    if (appState.settings.effects.text.type !== 'none') {
        const textEnergy = getAudioEnergy(appState.settings.effects.text.frequencyRange);
        const textReactivity = appState.settings.effects.text.reactivity / 100;
        
        applyTextEffect(appState.settings.effects.text.type, textEnergy * textReactivity);
    }
}

// Apply video effects based on audio energy
function applyVideoEffect(effectType, energy) {
    // For now, we'll just log the effect info
    // In a full implementation, you would modify the canvas to apply effects
    console.log(`Applying ${effectType} video effect with energy ${energy.toFixed(2)}`);
    
    // Example: modify video with CSS filters
    const effectIntensity = energy * 2; // Scale for more noticeable effect
    
    switch (effectType) {
        case 'pulse':
            elements.previewVideo.style.transform = `scale(${1 + 0.05 * effectIntensity})`;
            break;
        case 'hue-rotate':
            elements.previewVideo.style.filter = `hue-rotate(${effectIntensity * 360}deg)`;
            break;
        case 'glitch':
            // Simplified glitch effect
            if (energy > 0.7) {
                elements.previewVideo.style.transform = `translate(${(Math.random() - 0.5) * 10}px, ${(Math.random() - 0.5) * 10}px)`;
            } else {
                elements.previewVideo.style.transform = 'translate(0, 0)';
            }
            break;
        case 'particles':
            // Particles would need canvas drawing, simplified version:
            elements.previewVideo.style.boxShadow = `0 0 ${energy * 20}px rgba(255, 107, 0, ${energy})`;
            break;
        default:
            elements.previewVideo.style.filter = '';
            elements.previewVideo.style.transform = '';
            elements.previewVideo.style.boxShadow = '';
    }
}

// Apply logo effects based on audio energy
function applyLogoEffect(effectType, energy) {
    // Example implementation for logo effects
    const config = APP_CONFIG.effects.logo[effectType];
    
    switch (effectType) {
        case 'pulse':
            const scale = 1 + (config.maxScale - 1) * energy;
            elements.logoOverlay.style.transform = `scale(${scale})`;
            break;
        case 'rotate':
            const angle = config.maxAngle * energy;
            elements.logoOverlay.style.transform = `rotate(${angle}deg)`;
            break;
        case 'bounce':
            const yOffset = -config.height * energy;
            elements.logoOverlay.style.transform = `translateY(${yOffset}px)`;
            break;
        case 'glitch':
            if (energy > 0.7) {
                const xOffset = (Math.random() - 0.5) * 10 * config.intensity;
                const yOffset = (Math.random() - 0.5) * 10 * config.intensity;
                elements.logoOverlay.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
            } else {
                elements.logoOverlay.style.transform = 'translate(0, 0)';
            }
            break;
        default:
            elements.logoOverlay.style.transform = '';
    }
}

// Apply text effects based on audio energy
function applyTextEffect(effectType, energy) {
    // Example implementation for text effects
    const config = APP_CONFIG.effects.text[effectType];
    
    switch (effectType) {
        case 'fade':
            const opacity = 1 - ((1 - config.minOpacity) * energy);
            elements.textOverlay.style.opacity = opacity;
            break;
        case 'glow':
            const blurSize = config.maxBlur * energy;
            elements.textOverlay.style.textShadow = `0 0 ${blurSize}px ${config.color}`;
            break;
        case 'wave':
            // Wave would need more complex canvas rendering, simplified:
            const skewAngle = config.amplitude * energy;
            elements.textOverlay.style.transform = `skewX(${skewAngle}deg)`;
            break;
        case 'typewriter':
            // Typewriter effect would need a more complex implementation with timing
            // Simplified version: just shake a bit
            if (energy > 0.8) {
                elements.textOverlay.style.transform = `translateX(${(Math.random() - 0.5) * 3}px)`;
            } else {
                elements.textOverlay.style.transform = '';
            }
            break;
        default:
            elements.textOverlay.style.opacity = '';
            elements.textOverlay.style.textShadow = '';
            elements.textOverlay.style.transform = '';
    }
}

// Check if we're ready to enable the export button
function checkReadyToExport() {
    const readyToExport = appState.audioFile && appState.videoFile;
    elements.exportBtn.disabled = !readyToExport;
}

// Start the export process
// async function startExport() {
//     if (!appState.audioFile || !appState.videoFile) {
//         alert('Please upload both a video and an audio file before exporting.');
//         return;
//     }

//     console.log('Starting export process...');

//     elements.exportProgress.classList.remove('hidden');
//     elements.exportBtn.disabled = true;
//     updateExportProgress(0, 'Initializing export...');

//     try {
//         // Création d'un canvas pour appliquer les overlays (texte, logo, etc.)
//         console.log('Creating canvas...');
//         const video = document.createElement('video');
//         video.src = URL.createObjectURL(appState.videoFile);
//         video.crossOrigin = "anonymous";
//         video.muted = true;
//         await video.play();

//         const canvas = document.createElement('canvas');
//         canvas.width = video.videoWidth;
//         canvas.height = video.videoHeight;
//         const ctx = canvas.getContext('2d');

//         // Création du MediaRecorder pour capturer la vidéo avec les overlays
//         console.log('Setting up MediaRecorder...');
//         const stream = canvas.captureStream(30);
//         const recordedChunks = [];
//         const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

//         mediaRecorder.ondataavailable = event => recordedChunks.push(event.data);
//         mediaRecorder.start();

//         // Fonction de rendu pour appliquer les overlays à chaque frame
//         function renderFrame() {
//             if (video.paused || video.ended) {
//                 console.log('Stopping MediaRecorder...');
//                 mediaRecorder.stop();
//                 return;
//             }

//             ctx.clearRect(0, 0, canvas.width, canvas.height);
//             ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

//             // Ajoute le texte
//             ctx.font = '30px Arial';
//             ctx.fillStyle = elements.textColor.value || '#FFFFFF';
//             ctx.fillText(elements.artistName.value, 50, 50);
//             ctx.fillText(elements.trackName.value, 50, 100);

//             // Ajoute le logo si visible
//             if (!elements.logoOverlay.classList.contains('hidden')) {
//                 const logo = new Image();
//                 logo.src = elements.logoOverlay.src;
//                 logo.onload = () => ctx.drawImage(logo, canvas.width - 150, 50, 100, 100);
//             }

//             requestAnimationFrame(renderFrame);
//         }

//         video.addEventListener('play', renderFrame);

//         mediaRecorder.onstop = async () => {
//             console.log('MediaRecorder stopped. Merging audio and video...');
//             updateExportProgress(50, 'Processing video...');

//             try {
//                 const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
//                 const audioBlob = appState.audioFile;
//                 const finalVideoBlob = appState.useFallbackMode
//                     ? videoBlob
//                     : await mergeAudioWithVideo(videoBlob, audioBlob);

//                 console.log('Export finished successfully!');
//                 updateExportProgress(100, 'Export complete!');

//                 const finalVideoUrl = URL.createObjectURL(finalVideoBlob);
//                 elements.resultVideo.src = finalVideoUrl;
//                 elements.exportProgress.classList.add('hidden');
//                 elements.exportResult.classList.remove('hidden');
//             } catch (mergeError) {
//                 console.error('Failed to merge audio with video:', mergeError);
//                 alert('Failed to merge audio with video. Exporting video without sound.');
//                 elements.exportProgress.classList.add('hidden');
//                 elements.exportResult.classList.remove('hidden');
//             }
//         };

//     } catch (error) {
//         console.error('Export failed:', error);
//         alert('Export failed: ' + error.message);
//         elements.exportBtn.disabled = false;
//         elements.exportProgress.classList.add('hidden');
//     }
// }

async function startExport() {
    if (!appState.audioFile || !appState.videoFile) {
        alert('Please upload both a video and an audio file before exporting.');
        return;
    }

    console.log('Starting export process...');

    elements.exportProgress.classList.remove('hidden');
    elements.exportBtn.disabled = true;
    updateExportProgress(0, 'Initializing export...');

    try {
        console.log('Creating canvas...');
        const video = document.createElement('video');
        video.src = URL.createObjectURL(appState.videoFile);
        video.crossOrigin = "anonymous";
        video.muted = true;
        await video.play();

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');

        console.log('Setting up MediaRecorder...');
        const stream = canvas.captureStream(30);
        const recordedChunks = [];
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

        mediaRecorder.ondataavailable = event => recordedChunks.push(event.data);
        mediaRecorder.start();

        function renderFrame() {
            if (video.paused || video.ended) {
                console.log('Stopping MediaRecorder...');
                mediaRecorder.stop();
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            ctx.font = '30px Arial';
            ctx.fillStyle = elements.textColor.value || '#FFFFFF';
            ctx.fillText(elements.artistName.value, 50, 50);
            ctx.fillText(elements.trackName.value, 50, 100);

            if (!elements.logoOverlay.classList.contains('hidden')) {
                const logo = new Image();
                logo.src = elements.logoOverlay.src;
                logo.onload = () => ctx.drawImage(logo, canvas.width - 150, 50, 100, 100);
            }

            requestAnimationFrame(renderFrame);
        }

        video.addEventListener('play', renderFrame);

        mediaRecorder.onstop = async () => {
            console.log('MediaRecorder stopped. Merging audio and video...');
            updateExportProgress(50, 'Processing video...');

            try {
                const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
                const audioBlob = appState.audioFile;
                const finalVideoBlob = await mergeAudioWithVideo(videoBlob, audioBlob);

                console.log('Export finished successfully!');
                updateExportProgress(100, 'Export complete!');

                const finalVideoUrl = URL.createObjectURL(finalVideoBlob);
                elements.resultVideo.src = finalVideoUrl;
                elements.exportProgress.classList.add('hidden');
                elements.exportResult.classList.remove('hidden');
            } catch (mergeError) {
                console.error('Failed to merge audio with video:', mergeError);
                alert('Failed to merge audio with video. Exporting video without sound.');
                elements.exportProgress.classList.add('hidden');
                elements.exportResult.classList.remove('hidden');
            }
        };

    } catch (error) {
        console.error('Export failed:', error);
        alert('Export failed: ' + error.message);
        elements.exportBtn.disabled = false;
        elements.exportProgress.classList.add('hidden');
    }
}

async function mergeAudioWithVideo(videoBlob, audioBlob) {
    try {
        const { createFFmpeg, fetchFile } = FFmpeg;
        const ffmpeg = createFFmpeg({ log: true });

        console.log("⏳ Chargement de FFmpeg...");
        await ffmpeg.load();
        console.log("✅ FFmpeg chargé avec succès.");

        console.log("📝 Écriture des fichiers dans le FS virtuel de FFmpeg...");
        ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(videoBlob));
        ffmpeg.FS('writeFile', 'input.wav', await fetchFile(audioBlob));

        console.log("📂 Vérification des fichiers...");
        const videoExists = ffmpeg.FS('readdir', '.').includes('input.mp4');
        const audioExists = ffmpeg.FS('readdir', '.').includes('input.wav');

        if (!videoExists || !audioExists) {
            throw new Error("❌ Les fichiers ne sont pas correctement chargés dans FFmpeg.");
        }

        console.log("🎬 Démarrage de la fusion audio/vidéo...");
        await ffmpeg.run(
            '-i', 'input.mp4',
            '-i', 'input.wav',
            '-c:v', 'libx264',
            '-preset', 'ultrafast',  // Rend l'encodage BEAUCOUP plus rapide
            '-c:a', 'aac',
            '-b:a', '192k',
            '-strict', 'experimental',
            'output.mp4'
        );

        console.log("✅ Fusion terminée.");

        console.log("📥 Récupération de la vidéo exportée...");
        const outputData = ffmpeg.FS('readFile', 'output.mp4');
        return new Blob([outputData.buffer], { type: 'video/mp4' });

    } catch (error) {
        console.error("❌ Erreur FFmpeg :", error);
        alert("Échec de la fusion audio/vidéo. Export sans audio.");
        return videoBlob;
    }
}


// Simulate export process with progress updates
async function simulateExport() {
    const steps = [
        { progress: 10, message: 'Analyzing audio...' },
        { progress: 20, message: 'Preparing video frames...' },
        { progress: 30, message: 'Applying video effects...' },
        { progress: 50, message: 'Applying logo effects...' },
        { progress: 60, message: 'Adding text overlays...' },
        { progress: 70, message: 'Encoding video...' },
        { progress: 85, message: 'Encoding audio...' },
        { progress: 95, message: 'Finalizing export...' },
        { progress: 100, message: 'Export complete!' }
    ];
    
    for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        updateExportProgress(step.progress, step.message);
    }
}

// Update export progress UI
function updateExportProgress(percentage, message) {
    console.log(`🔄 Mise à jour de la barre : ${percentage}% - ${message}`);
    elements.progressBar.style.width = `${percentage}%`;
    elements.progressStep.textContent = message;
    elements.progressPercentage.textContent = `${Math.round(percentage)}%`;
}

// Start tip carousel
function startTipCarousel() {
    let currentTipIndex = 0;
    elements.tips[0].classList.add('active');
    
    setInterval(() => {
        elements.tips[currentTipIndex].classList.remove('active');
        currentTipIndex = (currentTipIndex + 1) % elements.tips.length;
        elements.tips[currentTipIndex].classList.add('active');
    }, APP_CONFIG.ui.tipChangeInterval);
}

// Download the exported video
function downloadExportedVideo() {
    if (!elements.resultVideo.src) {
        alert("No exported video available.");
        return;
    }

    // Création d'un lien de téléchargement
    const downloadLink = document.createElement("a");
    downloadLink.href = elements.resultVideo.src;
    downloadLink.download = "exported_video.mp4";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    console.log("Exported video downloaded successfully.");
}

// Reset app to initial state
function resetApp() {
    // Reset UI
    elements.exportResult.classList.add('hidden');
    
    // Clear file inputs
    elements.audioFileInput.value = '';
    elements.videoFileInput.value = '';
    elements.audioFileInfo.textContent = '';
    elements.videoFileInfo.textContent = '';
    
    // Reset preview
    elements.previewVideo.src = '';
    elements.previewVideo.srcObject = null;
    
    // Hide overlays
    elements.logoOverlay.classList.add('hidden');
    elements.textOverlay.classList.add('hidden');
    
    // Reset state
    appState.audioFile = null;
    appState.videoFile = null;
    
    // If audio source exists, disconnect it
    if (appState.audioSource) {
        appState.audioSource.disconnect();
        appState.audioSource = null;
    }
    
    // Reset export button
    elements.exportBtn.disabled = true;
    
    // Reset form to default values
    elements.artistName.value = '';
    elements.trackName.value = '';
    updateTextOverlay();
    
    elements.textPosition.value = DEFAULT_SETTINGS.track.textPosition;
    updateTextPosition();
    
    elements.textColor.value = DEFAULT_SETTINGS.track.textColor;
    updateTextColor();
    
    elements.logoSize.value = DEFAULT_SETTINGS.logo.size;
    updateLogoSize();
    
    elements.logoPosition.value = DEFAULT_SETTINGS.logo.position;
    updateLogoPosition();
    
    elements.logoOpacity.value = DEFAULT_SETTINGS.logo.opacity;
    updateLogoOpacity();
    
    // Reset effect settings
    elements.videoEffectType.value = DEFAULT_SETTINGS.effects.video.type;
    elements.videoReactivity.value = DEFAULT_SETTINGS.effects.video.reactivity;
    elements.videoFrequencyRange.value = DEFAULT_SETTINGS.effects.video.frequencyRange;
    
    elements.logoEffectType.value = DEFAULT_SETTINGS.effects.logo.type;
    elements.logoReactivity.value = DEFAULT_SETTINGS.effects.logo.reactivity;
    elements.logoFrequencyRange.value = DEFAULT_SETTINGS.effects.logo.frequencyRange;
    
    elements.textEffectType.value = DEFAULT_SETTINGS.effects.text.type;
    elements.textReactivity.value = DEFAULT_SETTINGS.effects.text.reactivity;
    elements.textFrequencyRange.value = DEFAULT_SETTINGS.effects.text.frequencyRange;
    
    updateEffectSettings();
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);