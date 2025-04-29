document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const chatDisplay = document.getElementById('chat-display');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const clearButton = document.getElementById('clear-button');
    // Update the PDF button text to be more generic
    const pdfButton = document.getElementById('pdf-button');
    if (pdfButton) {
        pdfButton.innerHTML = '<i class="fas fa-file"></i> Upload';
        pdfButton.title = "Upload PDF, DOCX, or image files";
    }
    const pdfInput = document.getElementById('pdf-input');
    const statusBar = document.getElementById('status-bar');
    const newChatButton = document.getElementById('new-chat-button');
    const chatHistory = document.getElementById('chat-history');
    
    // Add auth-related elements
    const authButton = document.getElementById('auth-button');
    const userIcon = document.getElementById('user-icon');
    const authModal = document.getElementById('auth-modal');
    const closeModalBtn = document.getElementById('close-modal');
    
    // API key (in a real application, this should be secured on the server side)
    const GEMINI_API_KEY = "AIzaSyCVWYCuAoWu0TrP-hSfOh7qXhIC45X3M9Y";
    
    // User authentication state
    let isLoggedIn = false;
    let userEmail = '';
    let userName = '';
    
    // Chat history management
    let chats = [];
    let currentChatId = null;
    
    // Voice assistant variables
    let speechSynthesis = window.speechSynthesis;
    let speechRecognition = null;
    let isListening = false;
    let isSpeaking = false;
    
    // Research keywords for filtering queries
    const researchKeywords = [
        'research', 'study', 'analysis', 'methodology', 'findings', 
        'paper', 'journal', 'experiment', 'data', 'hypothesis', 
        'theory', 'patent', 'scientific', 'publication'
    ];
    
    // Get auth form elements
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForms = document.querySelectorAll('.auth-form');
    const switchToSignup = document.getElementById('switch-to-signup');
    const switchToSignin = document.getElementById('switch-to-signin');
    const signinFooter = document.getElementById('signin-footer');
    const signupFooter = document.getElementById('signup-footer');
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    
    // Theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        // Check for saved theme preference or use default
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeToggleText(savedTheme);
        
        // Theme toggle event listener
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeToggleText(newTheme);
        });
    }
    
    // Function to update theme toggle button text and icon
    function updateThemeToggleText(theme) {
        if (!themeToggle) return;
        
        if (theme === 'dark') {
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            themeToggle.title = "Switch to light mode";
        } else {
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            themeToggle.title = "Switch to dark mode";
        }
    }
    
    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    pdfButton.addEventListener('click', () => pdfInput.click());
    pdfInput.addEventListener('change', handlePdfUpload);
    newChatButton.addEventListener('click', createNewChat);
    
    if (clearButton) {
        clearButton.addEventListener('click', clearChat);
    }
    
    // Make sure the mic button is properly initialized
    const micButton = document.getElementById('mic-button');
    if (micButton) {
        micButton.addEventListener('click', toggleSpeechRecognition);
    }
    
    // Auth-related event listeners
    if (authButton) {
        authButton.addEventListener('click', openAuthModal);
    }
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeAuthModal);
    }
    
    // Tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // Update active tab
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show corresponding form
            authForms.forEach(form => form.classList.remove('active'));
            document.getElementById(`${tabName}-form`).classList.add('active');
            
            // Update footer visibility
            if (tabName === 'signin') {
                signinFooter.style.display = 'block';
                signupFooter.style.display = 'none';
            } else {
                signinFooter.style.display = 'none';
                signupFooter.style.display = 'block';
            }
        });
    });
    
    // Footer links for switching forms
    if (switchToSignup) {
        switchToSignup.addEventListener('click', (e) => {
            e.preventDefault();
            authTabs.forEach(t => t.classList.remove('active'));
            document.querySelector('[data-tab="signup"]').classList.add('active');
            
            authForms.forEach(form => form.classList.remove('active'));
            signupForm.classList.add('active');
            
            signinFooter.style.display = 'none';
            signupFooter.style.display = 'block';
        });
    }
    
    if (switchToSignin) {
        switchToSignin.addEventListener('click', (e) => {
            e.preventDefault();
            authTabs.forEach(t => t.classList.remove('active'));
            document.querySelector('[data-tab="signin"]').classList.add('active');
            
            authForms.forEach(form => form.classList.remove('active'));
            signinForm.classList.add('active');
            
            signinFooter.style.display = 'block';
            signupFooter.style.display = 'none';
        });
    }
    
    // Handle form submissions
    if (signinForm) {
        signinForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('signin-email').value;
            const password = document.getElementById('signin-password').value;
            
            if (email && password) {
                isLoggedIn = true;
                userEmail = email;
                
                // Update UI
                updateAuthUI();
                closeAuthModal();
            }
        });
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            
            if (name && email && password) {
                isLoggedIn = true;
                userEmail = email;
                userName = name;
                
                // Update UI
                updateAuthUI();
                closeAuthModal();
            }
        });
    }
    
    // Initialize with a new chat
    initializeApp();
    
    // Initialize speech recognition
    initSpeechRecognition();
    
    // Function to initialize the app
    function initializeApp() {
        // Load chats from localStorage
        loadChats();
        
        // Create a new chat if none exists
        if (chats.length === 0) {
            createNewChat();
        } else {
            // Load the most recent chat
            loadChat(chats[0].id);
        }
    }
    
    // Function to update auth UI
    function updateAuthUI() {
        if (authButton && userIcon) {
            if (isLoggedIn) {
                authButton.style.display = 'none';
                userIcon.style.display = 'flex';
                
                // Set user initial - prefer name over email if available
                if (userName) {
                    userIcon.textContent = userName.charAt(0).toUpperCase();
                } else {
                    userIcon.textContent = userEmail.charAt(0).toUpperCase();
                }
                
                // Add tooltip with full name/email
                userIcon.title = userName || userEmail;
            } else {
                authButton.style.display = 'flex';
                userIcon.style.display = 'none';
            }
        }
    }
    
    // Function to open auth modal
    function openAuthModal() {
        if (authModal) {
            authModal.style.display = 'flex';
        }
    }
    
    // Function to close auth modal
    function closeAuthModal() {
        if (authModal) {
            authModal.style.display = 'none';
        }
    }
    
    // Function to load chats from localStorage
    function loadChats() {
        const savedChats = localStorage.getItem('researchChats');
        if (savedChats) {
            chats = JSON.parse(savedChats);
            renderChatHistory();
        }
    }
    
    // Function to save chats to localStorage
    function saveChats() {
        localStorage.setItem('researchChats', JSON.stringify(chats));
    }
    
    // Function to create a new chat
    function createNewChat() {
        // Save current chat if it exists
        if (currentChatId) {
            saveCurrentChat();
        }
        
        // Create new chat object
        const newChat = {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [],
            createdAt: new Date().toISOString()
        };
        
        // Add to chats array
        chats.unshift(newChat);
        saveChats();
        
        // Set as current chat
        loadChat(newChat.id);
        renderChatHistory();
    }
    
    // Function to save current chat
    function saveCurrentChat() {
        if (!currentChatId) return;
        
        // Find current chat
        const chatIndex = chats.findIndex(chat => chat.id === currentChatId);
        if (chatIndex === -1) return;
        
        // Get messages from display
        const messages = [];
        const messageElements = chatDisplay.querySelectorAll('.message');
        
        messageElements.forEach(el => {
            const isUser = el.classList.contains('user-message');
            messages.push({
                content: isUser ? el.textContent : el.innerHTML,
                isUser: isUser,
                timestamp: new Date().toISOString()
            });
        });
        
        // Update chat
        chats[chatIndex].messages = messages;
        
        // Update title if it's "New Chat" and there are messages
        if (chats[chatIndex].title === 'New Chat' && messages.length > 0) {
            const firstUserMessage = messages.find(m => m.isUser);
            if (firstUserMessage) {
                chats[chatIndex].title = firstUserMessage.content.substring(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
            }
        }
        
        saveChats();
        renderChatHistory();
    }
    
    // Function to load a chat
    function loadChat(chatId) {
        // Save current chat if it exists
        if (currentChatId) {
            saveCurrentChat();
        }
        
        // Find the chat
        const chat = chats.find(c => c.id === chatId);
        if (!chat) return;
        
        // Set as current chat
        currentChatId = chatId;
        
        // Clear display
        chatDisplay.innerHTML = '';
        
        // Load messages
        chat.messages.forEach(message => {
            if (message.isUser) {
                const messageElement = document.createElement('div');
                messageElement.className = 'message user-message';
                messageElement.textContent = message.content;
                chatDisplay.appendChild(messageElement);
            } else {
                const messageElement = document.createElement('div');
                messageElement.className = 'message ai-message';
                messageElement.innerHTML = message.content;
                chatDisplay.appendChild(messageElement);
            }
        });
        
        // Scroll to bottom
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
        
        // Update active chat in history
        updateActiveChatInHistory();
    }
    
    // Function to delete a chat
    function deleteChat(chatId, event) {
        // Prevent event bubbling
        event.stopPropagation();
        
        // Find the chat
        const chatIndex = chats.findIndex(c => c.id === chatId);
        if (chatIndex === -1) return;
        
        // Remove from array
        chats.splice(chatIndex, 1);
        saveChats();
        
        // If it was the current chat, load another one
        if (chatId === currentChatId) {
            if (chats.length > 0) {
                loadChat(chats[0].id);
            } else {
                createNewChat();
            }
        }
        
        renderChatHistory();
    }
    
    // Function to share a specific chat
    function shareChat(chatId, event) {
        // Prevent event bubbling
        event.stopPropagation();
        
        // Find the chat
        const chat = chats.find(c => c.id === chatId);
        if (!chat) return;
        
        // Create shareable text
        let shareText = `# ${chat.title}\n\n`;
        
        chat.messages.forEach(message => {
            if (message.isUser) {
                shareText += `**User:** ${message.content}\n\n`;
            } else {
                // Strip HTML for plain text sharing
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = message.content;
                shareText += `**Assistant:** ${tempDiv.textContent}\n\n`;
            }
        });
        
        // Copy to clipboard
        navigator.clipboard.writeText(shareText)
            .then(() => {
                alert('Chat copied to clipboard!');
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                alert('Failed to copy chat to clipboard');
            });
    }
    
    // Function to render chat history
    function renderChatHistory() {
        chatHistory.innerHTML = '';
        
        chats.forEach(chat => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            if (chat.id === currentChatId) {
                historyItem.classList.add('active');
            }
            historyItem.dataset.chatId = chat.id;
            
            const historyTitle = document.createElement('div');
            historyTitle.className = 'history-title';
            historyTitle.textContent = chat.title;
            
            const historyActions = document.createElement('div');
            historyActions.className = 'history-actions';
            
            // Share button - now added to each history item
            const shareButton = document.createElement('button');
            shareButton.className = 'history-action-btn';
            shareButton.innerHTML = '<i class="fas fa-share-alt"></i>';
            shareButton.addEventListener('click', (e) => shareChat(chat.id, e));
            
            // Delete button
            const deleteButton = document.createElement('button');
            deleteButton.className = 'history-action-btn';
            deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
            deleteButton.addEventListener('click', (e) => deleteChat(chat.id, e));
            
            historyActions.appendChild(shareButton);
            historyActions.appendChild(deleteButton);
            historyItem.appendChild(historyTitle);
            historyItem.appendChild(historyActions);
            
            historyItem.addEventListener('click', () => loadChat(chat.id));
            
            chatHistory.appendChild(historyItem);
        });
    }
    
    // Function to update active chat in history
    function updateActiveChatInHistory() {
        const historyItems = chatHistory.querySelectorAll('.history-item');
        historyItems.forEach(item => {
            if (item.dataset.chatId === currentChatId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    // Initialize with a welcome message
    function displayWelcomeMessage() {
        displayAiMessage("Welcome to the Research Assistant. I can help you analyze scientific research papers and studies. Please upload a PDF or enter your research query.");
    }
    
    // Function to send user message
    function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;
        
        // Display user message
        displayUserMessage(message);
        userInput.value = '';
        
        updateStatus('Generating response...');
        
        // Check if it's a greeting
        const greetingPatterns = /^(hi|hello|hey|greetings|good morning|good afternoon|good evening|howdy)/i;
        if (greetingPatterns.test(message)) {
            // Respond to greeting
            setTimeout(() => {
                displayAiMessage("Hello! I'm your research assistant. How can I help with your research today?");
                updateStatus('Ready');
                saveCurrentChat();
            }, 300);
            return;
        }
        
        // Check if it's a research query
        const isResearchQuery = researchKeywords.some(keyword => 
            message.toLowerCase().includes(keyword)
        );
        
        if (isResearchQuery) {
            // Call Gemini API for research queries
            callGeminiApi(message);
        } else {
            // Standard response for non-research queries
            setTimeout(() => {
                displayAiMessage("I'm a research assistant designed to help with scientific research topics. For general questions like this, please refer to Google or other search engines.");
                updateStatus('Ready');
                saveCurrentChat();
            }, 500);
        }
    }
    
    // Function to call Gemini API
    async function callGeminiApi(prompt) {
        try {
            const formattedPrompt = `As a friendly scientific research assistant, provide a well-structured analysis with clear formatting:

**1. Key Findings:**
* List the most important discoveries or insights as bullet points
* Focus on actionable information
* Highlight statistical significance where applicable

**2. Methodology Summary:**
* Describe the research approach
* Outline data collection methods
* Mention analytical techniques used

**3. Novel Contributions:**
* Identify what makes this research unique
* Highlight innovations in approach or findings
* Explain advancements over previous work

**4. Potential Applications:**
* Suggest practical uses for the findings
* Identify industries or fields that could benefit
* Note any limitations to application

For this content:
${prompt.substring(0, 15000)}`;
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: formattedPrompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 8192
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                })
            });
            
            const data = await response.json();
            
            if (data.candidates && data.candidates[0].content) {
                const responseText = data.candidates[0].content.parts[0].text;
                displayAiMessage(responseText);
                saveCurrentChat();
            } else {
                throw new Error('Invalid response from API');
            }
        } catch (error) {
            console.error('API Error:', error);
            displayAiMessage(`Oops! Something went wrong: ${error.message}. Let's try again.`);
            saveCurrentChat();
        } finally {
            updateStatus('Ready');
        }
    }
    
    // Function to handle file upload
    async function handlePdfUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        updateStatus(`Loading: ${file.name}`);
        
        try {
            let text = '';
            let imageData = null;
            
            // Check file extension
            const fileExtension = file.name.split('.').pop().toLowerCase();
            
            if (fileExtension === 'pdf') {
                // Handle PDF files
                text = await extractTextFromPdf(file);
            } else if (fileExtension === 'doc' || fileExtension === 'docx') {
                // For Word files, we'll use a FileReader to get the binary content
                // and then use mammoth.js to convert it to text (for DOCX)
                if (fileExtension === 'docx') {
                    try {
                        // Use mammoth.js for DOCX files
                        const arrayBuffer = await file.arrayBuffer();
                        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                        text = result.value;
                    } catch (error) {
                        console.error('Error extracting text from DOCX:', error);
                        text = "Could not extract text from this DOCX file. Please try copying and pasting the content directly.";
                    }
                } else {
                    // For DOC files (older format), we can't reliably extract in browser
                    text = "DOC format cannot be processed directly in the browser. Please convert to DOCX or PDF, or copy and paste the content directly.";
                }
            } else {
                throw new Error('Unsupported file format');
            }
            
            // Send the extracted content
            if (imageData) {
                sendImageContent(imageData, text, file.name);
            } else {
                sendFileContent(text, file.name);
            }
        } catch (error) {
            console.error('File Error:', error);
            alert(`File Error: ${error.message}`);
            updateStatus('Ready');
        }
    }
    
    // Rename function to be more generic
    function sendFileContent(text, filename) {
        // Display a message that file was uploaded
        displayUserMessage(`Uploaded File: ${filename}`);
        updateStatus('Analyzing file...');
        
        // Process the file content
        callGeminiApi(text);
    }
    
    // Function to extract text from PDF using PDF.js
    async function extractTextFromPdf(file) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const textItems = textContent.items.map(item => item.str);
            fullText += textItems.join(' ') + '\n\n';
        }
        
        return fullText;
    }
    
    // Function to display user message
    function displayUserMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';
        messageElement.textContent = message;
        chatDisplay.appendChild(messageElement);
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
    }
    
    // Function to display AI message with typing effect
    function displayAiMessage(message) {
        // Create message element with header for controls
        const messageElement = document.createElement('div');
        messageElement.className = 'message ai-message';
        
        // Create header with speak button
        const messageHeader = document.createElement('div');
        messageHeader.className = 'ai-message-header';
        
        const speakButton = document.createElement('button');
        speakButton.className = 'voice-btn';
        speakButton.title = 'Listen to response';
        speakButton.innerHTML = '<i class="fas fa-volume-up"></i>';
        
        // Format the message before displaying
        const formattedMessage = formatMessage(message);
        
        // Add event listener with the formatted message
        speakButton.addEventListener('click', () => toggleSpeakText(message));
        
        messageHeader.appendChild(speakButton);
        
        // Create content container
        const contentContainer = document.createElement('div');
        contentContainer.className = 'ai-message-content';
        
        // Assemble the message element
        messageElement.appendChild(messageHeader);
        messageElement.appendChild(contentContainer);
        
        // Add to chat display
        chatDisplay.appendChild(messageElement);
        
        // Scroll to bottom
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
        
        // Type the message character by character
        let i = 0;
        const typingSpeed = 5; // milliseconds per character
        
        function typeNextChar() {
            if (i < formattedMessage.length) {
                // Add next character of the formatted message
                contentContainer.innerHTML = formattedMessage.substring(0, i + 1);
                i++;
                
                // Scroll to keep up with typing
                chatDisplay.scrollTop = chatDisplay.scrollHeight;
                
                // Schedule next character
                setTimeout(typeNextChar, typingSpeed);
            } else {
                // Typing complete
                updateStatus('Ready');
            }
        }
        
        // Start typing
        updateStatus('AI is typing...');
        typeNextChar();
    }
    
    // Function to toggle text-to-speech
    function toggleSpeakText(text) {
        if (isSpeaking) {
            // If already speaking, stop it
            speechSynthesis.cancel();
            isSpeaking = false;
            updateStatus('Speech stopped');
            return;
        }
        
        // Stop any ongoing speech
        speechSynthesis.cancel();
        
        // Get the formatted text without markdown
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = formatMessage(text);
        const cleanText = tempDiv.textContent;
        
        // Create a new speech synthesis utterance
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        // Set properties for female voice
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.2; // Higher pitch for more feminine voice
        
        // Get available voices
        let voices = speechSynthesis.getVoices();
        
        // If voices aren't loaded yet, wait for them
        if (voices.length === 0) {
            speechSynthesis.addEventListener('voiceschanged', function() {
                voices = speechSynthesis.getVoices();
                setFemaleVoice();
            }, { once: true });
        } else {
            setFemaleVoice();
        }
        
        function setFemaleVoice() {
            // Try to find a female voice with priority order
            const femaleVoiceKeywords = ['female', 'woman', 'girl', 'Samantha', 'Victoria', 'Zira', 'Microsoft Zira'];
            
            // First try to find voices with explicit female indicators
            let femaleVoice = voices.find(voice => 
                femaleVoiceKeywords.some(keyword => 
                    voice.name.toLowerCase().includes(keyword.toLowerCase())
                )
            );
            
            // If no explicit female voice found, try common female voice names
            if (!femaleVoice) {
                const femaleNames = ['lisa', 'amy', 'emma', 'joanna', 'salli', 'kimberly', 'kendra', 'joana', 'ivy'];
                femaleVoice = voices.find(voice => 
                    femaleNames.some(name => 
                        voice.name.toLowerCase().includes(name.toLowerCase())
                    )
                );
            }
            
            // If still no female voice, try to avoid explicitly male voices
            if (!femaleVoice) {
                femaleVoice = voices.find(voice => 
                    !voice.name.toLowerCase().includes('male') && 
                    !voice.name.toLowerCase().includes('man') &&
                    !voice.name.toLowerCase().includes('guy')
                );
            }
            
            // Set the voice if found
            if (femaleVoice) {
                utterance.voice = femaleVoice;
                console.log("Using female voice:", femaleVoice.name);
            }
            
            // Set speaking flag
            isSpeaking = true;
            
            // Speak the text
            speechSynthesis.speak(utterance);
            
            // Update status
            updateStatus('Speaking...');
        }
        
        // When speech ends
        utterance.onend = function() {
            isSpeaking = false;
            updateStatus('Ready');
        };
    }
    
    // Add this function to ensure voices are loaded
    function loadVoices() {
        // Fetch the available voices
        const voices = speechSynthesis.getVoices();
        
        // If voices are available, we're good to go
        if (voices.length > 0) {
            return;
        }
        
        // If no voices are available yet, wait for them to load
        speechSynthesis.addEventListener('voiceschanged', function() {
            // Voices have been loaded
        });
    }
    
    // Call this function early to ensure voices are loaded
    loadVoices();
    
    // Initialize speech recognition
    function initSpeechRecognition() {
        // Check browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn("Your browser doesn't support speech recognition. Please try Chrome or Edge.");
            return false;
        }
        
        // Create speech recognition instance
        speechRecognition = new SpeechRecognition();
        speechRecognition.continuous = true;
        speechRecognition.interimResults = true;
        speechRecognition.lang = 'en-US';
        
        // Handle results
        speechRecognition.onresult = function(event) {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');
            
            userInput.value = transcript;
        };
        
        // Handle end of speech
        speechRecognition.onend = function() {
            if (isListening) {
                speechRecognition.start();
            } else {
                const micButton = document.getElementById('mic-button');
                if (micButton) micButton.classList.remove('active');
            }
        };
        
        return true;
    }
    
    // Toggle speech recognition
    function toggleSpeechRecognition() {
        const micButton = document.getElementById('mic-button');
        
        if (!speechRecognition && !initSpeechRecognition()) {
            return;
        }
        
        if (isListening) {
            // Stop listening
            isListening = false;
            speechRecognition.stop();
            micButton.classList.remove('active');
            updateStatus('Voice input stopped');
        } else {
            // Start listening
            isListening = true;
            speechRecognition.start();
            micButton.classList.add('active');
            updateStatus('Listening...');
        }
    }
    
    // Function to clear chat
    function clearChat() {
        chatDisplay.innerHTML = '';
        displayAiMessage("Chat cleared. How can I help with your research?");
        updateStatus('Chat cleared');
        saveCurrentChat();
    }
    
    // Function to update status bar
    function updateStatus(message) {
        if (statusBar) {
            if (message === 'AI is typing...') {
                statusBar.innerHTML = `${message} <span class="typing-indicator"></span>`;
            } else {
                statusBar.textContent = message;
            }
        }
    }
    
    // If no welcome message is displayed yet, show it
    if (chatDisplay.children.length === 0) {
        displayWelcomeMessage();
    }
});

// Function to format message with markdown and links
function formatMessage(text) {
    // Handle section headers (##)
    text = text.replace(/##\s+(.*?)(?=\n|$)/g, '<h2>$1</h2>');
    
    // Handle subsection headers (###)
    text = text.replace(/###\s+(.*?)(?=\n|$)/g, '<h3>$1</h3>');
    
    // Convert URLs to clickable links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    text = text.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
    
    // Basic markdown for bold
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Basic markdown for italics
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Basic markdown for bullet points
    text = text.replace(/^\s*\*\s+(.*?)$/gm, '<li>$1</li>');
    
    // Wrap consecutive list items in ul tags
    text = text.replace(/(<li>.*?<\/li>)(\s*<li>.*?<\/li>)+/gs, '<ul>$&</ul>');
    
    // Basic markdown for code blocks
    text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Basic markdown for inline code
    text = text.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Convert line breaks to <br>
    text = text.replace(/\n/g, '<br>');
    
    return text;
}