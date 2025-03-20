// Configuration settings for the Orange Reich Audio-Visual Mixer

export const APP_CONFIG = {
    // Video export settings
    export: {
        // Available quality presets
        qualityPresets: {
            '720p': { width: 1280, height: 720, videoBitrate: '4M' },
            '1080p': { width: 1920, height: 1080, videoBitrate: '8M' },
            '4k': { width: 3840, height: 2160, videoBitrate: '16M' }
        },
        // Available audio bitrates
        audioBitrates: {
            '192': '192k',
            '256': '256k',
            '320': '320k'
        },
        // Maximum file size in MB
        maxFileSize: 500
    },
    
    // Audio analysis settings
    audio: {
        // Frequency ranges for audio reactive effects
        frequencyRanges: {
            bass: { min: 20, max: 250 },
            mid: { min: 250, max: 2000 },
            treble: { min: 2000, max: 20000 },
            full: { min: 20, max: 20000 }
        },
        // FFT size for audio analysis (must be power of 2)
        fftSize: 2048,
        // Smoothing factor for audio analysis
        smoothingTimeConstant: 0.85
    },
    
    // Visual effects settings
    effects: {
        // Video effects configuration
        video: {
            pulse: {
                intensity: 0.2,
                speed: 1.0
            },
            'hue-rotate': {
                maxRotation: 180,
                speed: 0.5
            },
            glitch: {
                intensity: 0.5,
                frequency: 0.1
            },
            particles: {
                count: 100,
                size: 3,
                speed: 1.0
            }
        },
        
        // Logo effects configuration
        logo: {
            pulse: {
                minScale: 0.9,
                maxScale: 1.1,
                speed: 1.0
            },
            rotate: {
                maxAngle: 15,
                speed: 0.5
            },
            bounce: {
                height: 20,
                speed: 1.0
            },
            glitch: {
                intensity: 0.3,
                frequency: 0.05
            }
        },
        
        // Text effects configuration
        text: {
            fade: {
                minOpacity: 0.6,
                speed: 1.0
            },
            glow: {
                maxBlur: 10,
                color: '#ff6b00'
            },
            wave: {
                amplitude: 5,
                frequency: 2
            },
            typewriter: {
                speed: 50,
                delay: 1000
            }
        }
    },
    
    // UI settings
    ui: {
        // Carousel tips shown during export
        exportTips: [
            "Tip: Higher quality exports take longer to process",
            "Tip: MP4 format is recommended for YouTube uploads",
            "Tip: 4K exports will produce sharper results but larger files",
            "Tip: Audio reactions work best with music that has clear rhythmic patterns",
            "Tip: Lower reactivity settings create more subtle effects",
            "Tip: Consider copyright issues when uploading to platforms like YouTube",
            "Tip: Bass-reactive effects work well with electronic and hip-hop music",
            "Tip: Export processing happens entirely in your browser - no data is uploaded to servers"
        ],
        // Delay between carousel tip changes (in milliseconds)
        tipChangeInterval: 5000
    }
};

// Default user settings
export const DEFAULT_SETTINGS = {
    // Track information
    track: {
        artist: '',
        title: '',
        textPosition: 'bottom-right',
        textColor: '#ffffff'
    },
    
    // Logo settings
    logo: {
        size: 25,
        position: 'top-right',
        opacity: 80
    },
    
    // Effect settings
    effects: {
        video: {
            type: 'none',
            reactivity: 50,
            frequencyRange: 'mid'
        },
        logo: {
            type: 'pulse',
            reactivity: 70,
            frequencyRange: 'bass'
        },
        text: {
            type: 'glow',
            reactivity: 60,
            frequencyRange: 'treble'
        }
    },
    
    // Export settings
    export: {
        quality: '1080p',
        format: 'mp4',
        audioBitrate: '256'
    }
};

