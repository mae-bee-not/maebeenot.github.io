(function() {
    const historyEl = document.getElementById('history');
    const inputEl = document.getElementById('input-line');

    // --- Ball stuff ---
    let bouncingBalls = [];
    let ballAnimationId = null;
    let draggedBall = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    const ballThemeColors = {
      dark: ['#ff79c6', '#ff008cff', '#fde3f2ff', '#5e0034ff', '#ff82c9ff', '#ffffffff', '#3d0023ff'],
      matrix: ['#00ff41', '#049c2aff', '#145825ff', '#0aff16ff', '#44ff73ff', '#00771eff', '#00ff40ff'],
      ocean: ['#64ffda', '#0040ffff', '#00c496ff', '#8892b0', '#ffffffff', '#066affff', '#0f006eff'],
      scary: ['#ff0000', '#ff0000', '#ff0000', '#ff0000', '#ff0000', '#ff0000', '#ff0000'],
      light: ['#0055ff', '#ff9679ff', '#0dd7ffff', '#73ff00ff', '#fffb00ff', '#ff4b4bff', '#ff9100ff']
    };

    function getBallColor() {
        const themeName = document.body.className.replace('theme-', '').trim() || 'dark';
        const colors = ballThemeColors[themeName] || ballThemeColors.dark;
        return colors[Math.floor(Math.random() * colors.length)];
    }

    function mouseMoveHandler(e) {
        if (!draggedBall) return;
        e.preventDefault();

        const deltaX = e.clientX - draggedBall.lastMouseX;
        const deltaY = e.clientY - draggedBall.lastMouseY;

        draggedBall.vx = Math.max(-40, Math.min(40, deltaX));
        draggedBall.vy = Math.max(-40, Math.min(40, deltaY));

        draggedBall.x = e.clientX - dragOffsetX;
        draggedBall.y = e.clientY - dragOffsetY;

        draggedBall.lastMouseX = e.clientX;
        draggedBall.lastMouseY = e.clientY;
    }

    // --- NEW FUNCTION ---
    function touchMoveHandler(e) {
        if (!draggedBall) return;
        e.preventDefault(); 

        const touch = e.touches[0];
        if (!touch) return; 

        const deltaX = touch.clientX - draggedBall.lastMouseX;
        const deltaY = touch.clientY - draggedBall.lastMouseY;
        draggedBall.vx = Math.max(-40, Math.min(40, deltaX));
        draggedBall.vy = Math.max(-40, Math.min(40, deltaY));

        draggedBall.x = touch.clientX - dragOffsetX;
        draggedBall.y = touch.clientY - dragOffsetY;

        draggedBall.lastMouseX = touch.clientX;
        draggedBall.lastMouseY = touch.clientY;
    }
    // --- END OF NEW FUNCTION ---
    function mouseUpHandler() {
        if (!draggedBall) return;
        draggedBall.element.classList.remove('dragging');
        draggedBall.isDragging = false;
        draggedBall.gravity = draggedBall.originalGravity; 
        
        
        draggedBall = null;

        // Remove mouse listeners
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);

        // Also remove touch listeners
        document.removeEventListener('touchmove', touchMoveHandler, { passive: false });
        document.removeEventListener('touchend', mouseUpHandler);
        document.removeEventListener('touchcancel', mouseUpHandler);
    }

    function animateBalls() {
        bouncingBalls.forEach((ball, index) => {
            if (ball.isDragging) return; 
            ball.vy += ball.gravity;
            ball.x += ball.vx;
            ball.y += ball.vy;

            if (ball.x + ball.radius * 2 > window.innerWidth) {
                ball.x = window.innerWidth - ball.radius * 2;
                ball.vx *= -0.8;
            } else if (ball.x < 0) {
                ball.x = 0;
                ball.vx *= -0.8;
            }

            if (ball.y + ball.radius * 2 > window.innerHeight) {
                ball.y = window.innerHeight - ball.radius * 2;
                ball.vy *= -0.8;
            } else if (ball.y < 0) {
                ball.y = 0;
                ball.vy *= -0.8;
            }
        });

        // Ball-to-ball collisions
        const iterations = 5;
        for (let k = 0; k < iterations; k++) {
            bouncingBalls.forEach((ball, index) => {
                for (let i = index + 1; i < bouncingBalls.length; i++) {
                    const otherBall = bouncingBalls[i];

                    const ballCenterX = ball.x + ball.radius;
                    const ballCenterY = ball.y + ball.radius;
                    const otherBallCenterX = otherBall.x + otherBall.radius;
                    const otherBallCenterY = otherBall.y + otherBall.radius;

                    const dx = otherBallCenterX - ballCenterX;
                    const dy = otherBallCenterY - ballCenterY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const minDistance = ball.radius + otherBall.radius;

                    if (distance < minDistance) {
                        const overlap = minDistance - distance;
                        const nx = distance === 0 ? 1 : dx / distance;
                        const ny = distance === 0 ? 0 : dy / distance;

                        const totalMass = ball.mass + otherBall.mass;
                        const overlapRatio1 = otherBall.mass / totalMass;
                        const overlapRatio2 = ball.mass / totalMass;

                        ball.x -= overlap * overlapRatio1 * nx;
                        ball.y -= overlap * overlapRatio1 * ny;
                        otherBall.x += overlap * overlapRatio2 * nx;
                        otherBall.y += overlap * overlapRatio2 * ny;

                        const rvx = ball.vx - otherBall.vx;
                        const rvy = ball.vy - otherBall.vy;
                        const velAlongNormal = rvx * nx + rvy * ny;

                        if (velAlongNormal <= 0) continue;
                        
                        const restitution = 0.8;
                        const massRatio1 = ((1 + restitution) * otherBall.mass) / totalMass;
                        const massRatio2 = ((1 + restitution) * ball.mass) / totalMass;

                        ball.vx = ball.vx - massRatio1 * velAlongNormal * nx;
                        ball.vy = ball.vy - massRatio1 * velAlongNormal * ny;
                        otherBall.vx = otherBall.vx + massRatio2 * velAlongNormal * nx;
                        otherBall.vy = otherBall.vy + massRatio2 * velAlongNormal * ny;
                    }
                }
            });
        }

        // Update DOM
        bouncingBalls.forEach(ball => {
            ball.element.style.left = ball.x + 'px';
            ball.element.style.top = ball.y + 'px';
        });

        ballAnimationId = requestAnimationFrame(animateBalls);
    }

    window.addEventListener('resize', () => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        bouncingBalls.forEach(ball => {
            if (ball.x + ball.radius * 2 > width) {
                ball.x = width - ball.radius * 2;
            }
            if (ball.y + ball.radius * 2 > height) {
                ball.y = height - ball.radius * 2;
            }
            if (ball.x < 0) {
                ball.x = 0;
            }
            if (ball.y < 0) {
                ball.y = 0;
            }
        });
    });
    // --- End ball stuff ---

    // --- music player code ---
    const playlist = [
        {title: 'Nyan', path: '/assets/playlist/nyan.mp3'},
        {title: 'Antonymph', path: '/assets/playlist/antonympth.mp3'},
        {title: 'Brb', path: '/assets/playlist/brb.mp3'},
        {title: 'Spookwave', path: '/assets/playlist/spookwave.mp3'},
        {title: 'Stal', path: '/assets/playlist/stal.mp3'},
    ];
    let currentSongIndex = 0;
    let audio = new Audio();

    function playSong(index) {
        if (index >= 0 && index < playlist.length) {
            currentSongIndex = index;
            audio.src = playlist[currentSongIndex].path;
            audio.play();
            printToHistory(`Now playing: <strong>${playlist[currentSongIndex].title}</strong>`);
        }
    }
    
    function zigzagoonAnimation() {
        const imageUrl = '/assets/zigzagoon.png';
        const zImage = document.createElement('img');
        zImage.src = imageUrl;
        zImage.className = 'zigzagoon-animation';
        document.body.appendChild(zImage);

        setTimeout(() => {
            zImage.remove();
        }, 3000);
    }

    function bdayAnimation() {
        const imageUrl = '/assets/neil.jpeg' ;
        const bdayImage = document.createElement('img');
        bdayImage.src = imageUrl;
        bdayImage.className = 'bday-animation';
        document.body.appendChild(bdayImage);

        setTimeout(() => {
            bdayImage.remove();
        }, 4000);
    }

    const commands = {
        help: function() {
            printToHistory('Available commands:');
            printToHistory('<strong>apps</strong> – view self hosted apps');
            printToHistory('<strong>socials</strong> – view socials');
            printToHistory('<strong>message</strong> – leave a message');
            printToHistory('<strong>minecraft</strong> – view my servers');
            printToHistory('<strong>music</strong> – play, pause, skip, or see now playing');
            printToHistory('<strong>old</strong> – visit the old site');
            printToHistory('<strong>theme</strong> – change the terminal theme');
            printToHistory('<strong>date</strong> – display date');
            printToHistory('<strong>echo [text]</strong> – print text to the terminal');
            printToHistory('<strong>neofetch</strong> – display user information');
            printToHistory('<strong>tetris</strong> – play Tetris');
            printToHistory('<strong>ball [size] [speed] [gravity] [count]</strong> – make bouncing balls');
            printToHistory('<strong>help</strong> – show this help message');
            printToHistory('<strong>clear</strong> – clear this terminal');
        },
        clear: function() {
            historyEl.innerHTML = '';
            
            // Clear bugs
            const bugs = document.querySelectorAll('.bug');
            bugs.forEach(bug => bug.remove());

            // Clear balls
            if (ballAnimationId) {
                cancelAnimationFrame(ballAnimationId);
                ballAnimationId = null;
            }
            bouncingBalls.forEach(ball => ball.element.remove());
            bouncingBalls = [];
            mouseUpHandler();
        },
        apps: function() {
            window.location.href = '/pages/apps.html';
        },
        socials: function() {
            window.location.href = '/pages/socials.html';
        },
        old: function() {
            window.location.href = 'https://old.coolbugs.win';
        },
        message: function() {
            window.location.href = '/pages/messages.html';
        },
        minecraft: function() {
            window.location.href = '/pages/dynmap.html';
        },
        echo: function(args) {
            printToHistory(escapeHtml(args));
        },
        date: function() {
            printToHistory(new Date().toLocaleString());
        },
        tetris: function() {
             window.location.href = '/pages/tetris.html';
        },
        theme: function(args) {
            const themeName = args.trim().toLowerCase();
            const themes = {
                'dark': 'pink on grey',
                'matrix': 'green on black',
                'ocean': 'mint on navy',
                'light': 'blue on white',
                'scary': 'red on black'
            };

            if (!themeName || themeName === 'list') {
                printToHistory('Available Themes:');
                for (const name in themes) {
                    printToHistory(`- <strong>${name}</strong>: ${themes[name]}`);
                }
            } else if (themes[themeName]) {
                window.terminalThemes.apply(themeName); // Use the global function
                printToHistory(`Theme changed to <strong>${themeName}</strong>.`);
            } else {
                printToHistory(`Theme not found: <strong>${themeName}</strong>.`);
            }
        },
        music: function(args) {
            const parts = args.split(' ');
            const subCommand = parts[0].toLowerCase();

            switch (subCommand) {
                case 'play':
                    if (audio.paused && audio.src) {
                        audio.play();
                        printToHistory('Resumed playback.');
                    } else {
                        playSong(currentSongIndex);
                    }
                    break;
                case 'pause':
                    audio.pause();
                    printToHistory('Playback paused.');
                    break;
                case 'skip':
                    let nextSongIndex = (currentSongIndex + 1) % playlist.length;
                    playSong(nextSongIndex);
                    break;
                case 'nowplaying':
                    if (!audio.paused) {
                        printToHistory(`Currently playing: <strong>${playlist[currentSongIndex].title}</strong>`);
                    } else {
                        printToHistory('Nothing is currently playing.');
                    }
                    break;
                default:
                    printToHistory('Usage: music [play|pause|skip|nowplaying]');
                    break;
            }
        },
        neofetch: function() {
            const browserInfo = [
            '<strong>Vendor:</strong> ' + navigator.vendor,
            '<strong>User Agent:</strong> ' + navigator.userAgent,
            '<strong>Platform:</strong> ' + navigator.platform,
            '<strong>CPU Cores:</strong> ' + navigator.hardwareConcurrency,
            '<strong>Resolution:</strong> ' + screen.width + 'x' + screen.height,
            '<strong>Language:</strong> ' + navigator.language,
            '<strong>Cookies Enabled:</strong> ' + navigator.cookieEnabled,
        ];
            printToHistory(browserInfo.join('<br>'));
            },
        deer: function() {
            const deerImages = [
                '/assets/deer1.png',
                '/assets/deer2.png',
                '/assets/deer3.webp',
                '/assets/deer4.webp',
                '/assets/deer5.png',
                '/assets/deer6.png'
            ];
            for (let i = 0; i < 15; i++) {
                setTimeout(() => {
                    const deer = document.createElement('img');
                    deer.className = 'deer';
                    deer.src = deerImages[Math.floor(Math.random() * deerImages.length)];
                    deer.style.top = Math.random() * 80 + 10 + '%';
                    deer.style.animationDuration = Math.random() * 5 + 5 + 's';
                    document.body.appendChild(deer);
                    setTimeout(() => {
                        deer.remove();
                    }, 10000);
                }, i * 500);
            }
        },
        sal: function() {
            const audio = new Audio('/assets/sal.mp3');
            audio.play();
        },
        bugs: function() {
            const numBugs = Math.random() * (40 - 1) + 1;
            const bugs = [];

            for (let i = 0; i < numBugs; i++) {
                const bug = document.createElement('div');
                bug.className = 'bug';
                bug.innerHTML = '<img src="/assets/scarab.webp" style="width:100%;height:100%;">';
                bug.style.left = Math.random() * window.innerWidth + 'px';
                bug.style.top = Math.random() * window.innerHeight + 'px';
                document.body.appendChild(bug);
                bugs.push({
                    element: bug,
                    x: parseFloat(bug.style.left),
                    y: parseFloat(bug.style.top),
                    vx: Math.random() * 2 - 1,
                    vy: Math.random() * 2 - 1
                });
            }

            let mouseX = window.innerWidth / 2;
            let mouseY = window.innerHeight / 2;

            document.addEventListener('mousemove', (e) => {
                mouseX = e.clientX;
                mouseY = e.clientY;
            });

            function animateBugs() {
                bugs.forEach(bug => {
                    const dx = mouseX - bug.x;
                    const dy = mouseY - bug.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist > 1) {
                        const angle = Math.atan2(dy, dx);
                        bug.vx = Math.cos(angle);
                        bug.vy = Math.sin(angle);
                        const angleInDegrees = angle * (180 / Math.PI);
                        bug.element.style.transform = `rotate(${angleInDegrees + 90}deg)`;
                    }

                    bug.x += bug.vx;
                    bug.y += bug.vy;

                    bug.element.style.left = (bug.x - bug.element.offsetWidth / 2) + 'px';
                    bug.element.style.top = (bug.y - bug.element.offsetHeight / 2) + 'px';
                });

                requestAnimationFrame(animateBugs);
            }

            animateBugs();
        },
        ball: function(args) {
            const argsArray = args.split(' ').map(Number);
            
            const sizeArg = argsArray[0];
            const speedArg = argsArray[1];
            const gravityArg = argsArray[2];
            const count = isNaN(argsArray[3]) || argsArray[3] <= 0 ? 1 : Math.min(Math.floor(argsArray[3]), 500);

            for (let i = 0; i < count; i++) {
                const size = isNaN(sizeArg) || sizeArg <= 0 ? Math.random() * 100 + 10 : sizeArg;
                const speed = isNaN(speedArg) || speedArg <= 0 ? Math.random() * 50 + 2 : speedArg / 10;
                const gravity = gravityArg == null || gravityArg < 0 || isNaN(gravityArg) ? 0.5 : gravityArg / 10;

                const ball = document.createElement('div');
                ball.className = 'ball';
                ball.style.width = size + 'px';
                ball.style.height = size + 'px';
                ball.style.backgroundColor = getBallColor();
                document.body.appendChild(ball);

                const ballObj = {
                    element: ball,
                    x: Math.random() * (window.innerWidth - size),
                    y: Math.random() * (window.innerHeight / 2),
                    vx: (Math.random() - 0.5) * speed * 2,
                    vy: (Math.random() - 0.5) * speed,
                    radius: size / 2,
                    gravity: gravity,
                    originalGravity: gravity,
                    mass: Math.PI * (size / 2) * (size / 2), 
                    isDragging: false,
                    lastMouseX: 0, // --- MODIFICATION: Add property to track mouse ---
                    lastMouseY: 0  // --- MODIFICATION: Add property to track mouse ---
                };

                // --- drag logic ---
                ball.addEventListener('mousedown', (e) => {
                    if (e.button !== 0) return;
                    e.preventDefault();

                    draggedBall = ballObj;
                    draggedBall.isDragging = true;
                    draggedBall.element.classList.add('dragging');

                    // --- MODIFICATION: Stop ball and record start drag position ---
                    draggedBall.vx = 0;
                    draggedBall.vy = 0;
                    draggedBall.gravity = 0;
                    draggedBall.lastMouseX = e.clientX;
                    draggedBall.lastMouseY = e.clientY;

                    dragOffsetX = e.clientX - draggedBall.x;
                    dragOffsetY = e.clientY - draggedBall.y;

                    document.addEventListener('mousemove', mouseMoveHandler);
                    document.addEventListener('mouseup', mouseUpHandler);
                });
                // --- end drag logic ---

                ball.addEventListener('touchstart', (e) => {
                    e.preventDefault(); 
                    
                    const touch = e.touches[0];
                    if (!touch) return;

                    draggedBall = ballObj;
                    draggedBall.isDragging = true;
                    draggedBall.element.classList.add('dragging');

                    draggedBall.vx = 0;
                    draggedBall.vy = 0;
                    draggedBall.gravity = 0;
                    draggedBall.lastMouseX = touch.clientX;
                    draggedBall.lastMouseY = touch.clientY;

                    dragOffsetX = touch.clientX - draggedBall.x;
                    dragOffsetY = touch.clientY - draggedBall.y;

                    document.addEventListener('touchmove', touchMoveHandler, { passive: false });
                    document.addEventListener('touchend', mouseUpHandler); 
                    document.addEventListener('touchcancel', mouseUpHandler);
                });

                bouncingBalls.push(ballObj);

                if (!ballAnimationId) {
                    animateBalls();
                }
            } 

            if (count === 1) {
                const sizeStr = isNaN(sizeArg) || sizeArg <= 0 ? "random" : sizeArg.toFixed(0);
                const speedStr = isNaN(speedArg) || speedArg <= 0 ? "random" : (speedArg/10).toFixed(1);
                const gravityStr = (gravityArg == null || isNaN(gravityArg) || gravityArg < 0) ? "default (0.5)" : (gravityArg/10).toFixed(1);
                printToHistory(`Ball created (Size: ${sizeStr}, Speed: ${speedStr}, Gravity: ${gravityStr})`);
            } else {
                printToHistory(`Created ${count} balls.`);
            }
        }
    };
    
    const history = [];
    let historyIndex = -1;

    function printToHistory(message) {
        const line = document.createElement('div');
        line.classList.add('history-line');
        line.innerHTML = message;
        historyEl.appendChild(line);
        historyEl.scrollTop = historyEl.scrollHeight;
    }

    function executeCommand(cmd) {
        const trimmed = cmd.trim();
        if (!trimmed) return;
        printToHistory(`<span class="prompt">$</span> ${escapeHtml(trimmed)}`);
        history.push(trimmed);
        historyIndex = history.length;
        
        if (trimmed.toLowerCase() === 'zigzagoon i choose you') {
            zigzagoonAnimation();
            return;
        }
        if (trimmed === '04/13/06') {
            bdayAnimation();
            return;
        }

        const parts = trimmed.split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1).join(' ');

        if (commands[command]) {
            commands[command](args);
        } else {
            printToHistory(`Command not recognized: <strong>${escapeHtml(command)}</strong>`);
        }
    }

    function escapeHtml(unsafe) {
        return unsafe.replace(/[&<"'>]/g, function(m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '"': '&quot;',
                "'": '&#039;',
                '>': '&gt;'
            }[m];
        });
    }

    window.addEventListener('load', () => {
        inputEl.focus();
        printToHistory('Welcome! Type <strong>help</strong> to see available commands 𐂂');
    });

    inputEl.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const commandText = inputEl.textContent;
            executeCommand(commandText);
            inputEl.textContent = '';
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                inputEl.textContent = history[historyIndex];
                placeCaretAtEnd(inputEl);
            }
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex < history.length - 1) {
                historyIndex++;
                inputEl.textContent = history[historyIndex];
            } else {
                historyIndex = history.length;
                inputEl.textContent = '';
            }
            placeCaretAtEnd(inputEl);
            return;
        }
    });
    
    function placeCaretAtEnd(el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }

})();