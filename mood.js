 


document.addEventListener('DOMContentLoaded', () => {
     
    const screens = {
        initial: document.getElementById('initial-screen'),
        camera: document.getElementById('camera-screen'),
        moodSelection: document.getElementById('mood-selection-screen'),
        recommendation: document.getElementById('recommendation-screen'),
    };

    const buttons = {
        allowCamera: document.getElementById('allow-camera-btn'),
        noPicLink: document.getElementById('no-pic-link'),
        checkMood: document.getElementById('check-mood-btn'),
        cancelCamera: document.getElementById('cancel-camera-btn'),
        moodOptions: document.querySelectorAll('.mood-option-btn'),
        submitMood: document.getElementById('submit-mood-btn'),
        scanAgain: document.getElementById('scan-again-btn'),
        watchNow: document.getElementById('watch-now-btn'),
        backToStart: document.getElementById('back-to-start-btn'),
    };

    const videoElement = document.getElementById('camera-feed');
    const cameraStatus = document.getElementById('camera-status');
    const scanAnimationElement = document.getElementById('scan-animation');

    const movieRecommendationElements = {
        moodHeading: document.getElementById('mood-heading'),
        detectedMoodText: document.getElementById('detected-mood-text'),
        thumbnail: document.getElementById('movie-thumbnail'),
        name: document.getElementById('movie-name'),
    };

    const movieOptions = {
        Happy: { name: "Welcome", link: "https://www.primevideo.com/detail/0MJFLZHIV04F9V9V21RAY2Z8ZZ/", thumbnail: "https://m.media-amazon.com/images/S/pv-target-images/af13e1c59556eb143d2b213c9f95567677f409033d4c9619c553367d71bee982._SX1920_FMwebp_.jpg" },
        Sad: { name: "Call me Bae", link: "https://www.primevideo.com/detail/0TF2BODX83KZOWTP08NXFE897E/", thumbnail: "https://m.media-amazon.com/images/S/pv-target-images/0cb7ac74d1d6e8eb2e3d59aa5354359714eb54d84fcfaa616d9de19d64b492ca._SX1920_FMwebp_.jpg" },
        Excited: { name: "Citadel Honey Bunny", link: "https://www.primevideo.com/detail/0KYRVT4JDB957NXZO72E2MIFW5", thumbnail: "https://m.media-amazon.com/images/S/pv-target-images/51c2c75da778c109ccc33ff293ff48f0cccc60b18c3fef8a42afe2a80e07acac._SX1920_FMwebp_.jpg" },
        Neutral: { name: "Farzi", link: "https://www.primevideo.com/detail/0HDHQAUF5LPWOJRCO025LFJSJI", thumbnail: "https://m.media-amazon.com/images/S/pv-target-images/8aed532f0875925f72c4012aab688ed409773ecbfb3b18e1a39cd9ad1a4dd485._SX1920_FMwebp_.jpg" },
        Angry: { name: "Agneepath", link: "https://www.primevideo.com/detail/0NU7IFXPL2WWSDHNGAR5Z1GUJE/", thumbnail: "https://images-eu.ssl-images-amazon.com/images/S/pv-target-images/1863426056ae862def9a69ca76e8af54cdb6b8a5a2be1100e096e59b00060847._UX1920_.png" },
    };

    const availableMoods = ["Happy", "Excited", "Neutral", "Angry", "Sad"];
    let currentStream = null;
    let selectedMood = null;

     
    const GEMINI_API_KEY = 'AIzaSyBOQlJH-cTymUxrGc7b5o2d6LC6mt1azKk';  

    
    const GEMINI_MODEL_NAME = 'gemini-1.5-flash';  
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;


    function showScreen(screenName) {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        if (screens[screenName]) {
            screens[screenName].classList.add('active');
        }
    }

    async function startCamera() {
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
                videoElement.srcObject = currentStream;
                videoElement.onloadedmetadata = () => {
                    videoElement.play();
                };
                cameraStatus.textContent = "";
                showScreen('camera');
            } else {
                cameraStatus.textContent = 'Camera not supported by this browser.';
                throw new Error('getUserMedia not supported');
            }
        } catch (error) {
            console.error("Error accessing camera:", error);
            cameraStatus.textContent = 'Could not access camera. Allow access or try choosing mood manually.';
        }
    }

    function stopCamera() {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
            videoElement.srcObject = null;
            currentStream = null;
        }
    }

    function playScanAnimation() {
        scanAnimationElement.style.display = 'block';
        gsap.fromTo(scanAnimationElement,
            { top: "0%" },
            {
                top: "100%",
                duration: 1.5,
                ease: "power1.inOut",
                yoyo: true,
                repeat: 1,
                onComplete: () => {
                    scanAnimationElement.style.display = 'none';
                }
            }
        );
    }

    function captureFrame() {
        if (!videoElement.srcObject || videoElement.videoWidth === 0) {
            console.error("Video stream not available or not ready for capture.");
            return null;
        }
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        return canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
    }
    async function detectMoodWithGemini(base64ImageData) {
       
        if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {  
            cameraStatus.textContent = "API Key not configured. Please set it in script.js (with security understanding).";
            console.warn("Gemini API Key not configured. This is highly insecure in frontend code. Use a backend proxy for production.");
            return "Neutral";  
        }

         

        buttons.checkMood.disabled = true;
        buttons.checkMood.textContent = "Analyzing...";
        playScanAnimation();  
        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: "Analyze the primary facial expression in this image. Your task is to classify the dominant mood. Respond *only* with one of the following words: Happy, Excited, Neutral, Angry, Sad. If no clear face is detected, if the expression is ambiguous, or if the image is unsuitable for mood detection, respond with 'Neutral'. Do not add any other explanation or punctuation."
                        },
                        {
                            inline_data: {
                                mime_type: "image/jpeg",
                                data: base64ImageData
                            }
                        }
                    ]
                }
            ],
            generationConfig: {
                candidateCount: 1,
                maxOutputTokens: 10,
                temperature: 0.2,
                topP: 0.9,
            },
        };

        try {
           
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            buttons.checkMood.disabled = false;
            buttons.checkMood.textContent = "Check My Mood";

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ error: { message: response.statusText } }));
                console.error('Gemini API Error:', response.status, errorBody);
                cameraStatus.textContent = `API Error: ${errorBody.error?.message || response.statusText || 'Unknown API error'}. Defaulting to Neutral.`;
                return "Neutral";
            }

            const data = await response.json();
            console.log("Gemini API Response:", data);

            let mood = "Neutral";
            if (data.candidates && data.candidates.length > 0 &&
                data.candidates[0].content && data.candidates[0].content.parts &&
                data.candidates[0].content.parts.length > 0 && data.candidates[0].content.parts[0].text) {
                mood = data.candidates[0].content.parts[0].text.trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
            } else if (data.promptFeedback && data.promptFeedback.blockReason) {
                console.warn("Prompt blocked by Gemini API:", data.promptFeedback.blockReason, data.promptFeedback.safetyRatings);
                cameraStatus.textContent = `Image or prompt issue: ${data.promptFeedback.blockReason}. Defaulting to Neutral.`;
                mood = "Neutral";
            } else if (data.error) {
                console.error("Gemini API returned an error object:", data.error);
                cameraStatus.textContent = `API Error: ${data.error.message || 'Unknown API error'}. Defaulting to Neutral.`;
                mood = "Neutral";
            }

            const cleanedMood = mood.charAt(0).toUpperCase() + mood.slice(1).toLowerCase();
            if (availableMoods.includes(cleanedMood)) {
                return cleanedMood;
            } else {
                console.warn(`Received mood '${mood}' (cleaned: '${cleanedMood}') not in available moods. Response was:`, data.candidates?.[0]?.content?.parts?.[0]?.text, "Defaulting to Neutral.");
                return "Neutral";
            }

        } catch (error) {
            console.error('Error calling Gemini API or processing response:', error);
            buttons.checkMood.disabled = false;
            buttons.checkMood.textContent = "Check My Mood";
            cameraStatus.textContent = 'Failed to analyze mood. Check console. Defaulting to Neutral.';
            return "Neutral";
        }
    }

     

    function displayMovieRecommendation(mood) {
        const movie = movieOptions[mood] || movieOptions["Neutral"];
        movieRecommendationElements.detectedMoodText.textContent = mood;
        movieRecommendationElements.thumbnail.src = movie.thumbnail;
        movieRecommendationElements.thumbnail.alt = `${movie.name} Thumbnail`;
        movieRecommendationElements.name.textContent = movie.name;
        buttons.watchNow.href = movie.link;
        showScreen('recommendation');
    }

    
    buttons.allowCamera.addEventListener('click', () => {
        cameraStatus.textContent = "Requesting camera access...";
        startCamera();
    });

    buttons.noPicLink.addEventListener('click', (e) => {
        e.preventDefault();
        stopCamera();
        showScreen('moodSelection');
    });

    buttons.checkMood.addEventListener('click', async () => {
        if (!currentStream) {
            cameraStatus.textContent = 'Camera not active. Please allow access.';
            return;
        }
        const imageData = captureFrame();
        if (!imageData) {
            cameraStatus.textContent = 'Could not capture frame from video.';
            return;
        }
        const mood = await detectMoodWithGemini(imageData);
        stopCamera();  
        displayMovieRecommendation(mood);
    });

    buttons.cancelCamera.addEventListener('click', () => {
        stopCamera();
        showScreen('initial');
    });

    buttons.moodOptions.forEach(button => {
        button.addEventListener('click', () => {
            buttons.moodOptions.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            selectedMood = button.dataset.mood;
            buttons.submitMood.disabled = false;
        });
    });

    buttons.submitMood.addEventListener('click', () => {
        if (selectedMood) {
            displayMovieRecommendation(selectedMood);
        }
    });

    buttons.scanAgain.addEventListener('click', () => {
        selectedMood = null;
        buttons.moodOptions.forEach(btn => btn.classList.remove('selected'));
        buttons.submitMood.disabled = true;
        cameraStatus.textContent = "";
        showScreen('initial');
    });

    buttons.backToStart.addEventListener('click', () => {
        selectedMood = null;
        buttons.moodOptions.forEach(btn => btn.classList.remove('selected'));
        buttons.submitMood.disabled = true;
        cameraStatus.textContent = "";
        showScreen('initial');
    });

     
    showScreen('initial');
});