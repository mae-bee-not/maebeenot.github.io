(function() {
    const BALL_FRAME_MS = 1000 / 60;
    const MAX_FRAME_SCALE = 2.5;
    const DEFAULT_BALL_GRAVITY = 0.5;
    const MAX_BALL_COUNT = 500;
    const MIN_BALL_SIZE = 8;
    const MAX_BALL_SIZE = 180;
    const MAX_INITIAL_SPEED = 80;
    const MAX_DRAG_SPEED = 60;
    const MAX_BALL_GRAVITY = 5;
    const WALL_RESTITUTION = 0.8;
    const BALL_RESTITUTION = 0.82;
    const FLOOR_FRICTION = 0.985;
    const REST_VELOCITY = 0.08;

    const state = {
        balls: [],
        animationId: null,
        draggedBall: null,
        dragOffsetX: 0,
        dragOffsetY: 0,
        lastFrameTime: null,
        motionEnabled: false,
        motionGravityX: 0,
        motionGravityY: DEFAULT_BALL_GRAVITY,
        motionPermissionGranted: false,
        pendingMotionPermissionHandler: null
    };

    const ballThemeColors = {
        dark: ['#ff79c6', '#ff008cff', '#fde3f2ff', '#ff008cff', '#ff82c9ff', '#ffffffff', '#c45f98ff'],
        matrix: ['#00ff41', '#049c2aff', '#52fa7cff', '#0aff16ff', '#44ff73ff', '#00d535ff', '#00ff40ff'],
        ocean: ['#64ffda', '#0040ffff', '#00c496ff', '#8892b0', '#ffffffff', '#066affff', '#5c4cc5ff'],
        scary: ['#ff0000', '#ff0000', '#ff0000', '#ff0000', '#ff0000', '#ff0000', '#ff0000'],
        light: ['#0055ff', '#ff9679ff', '#0dd7ffff', '#73ff00ff', '#fffb00ff', '#ff4b4bff', '#ff9100ff'],
        'gruvbox-rainbow': ['#fb4934', '#fe8019', '#fabd2f', '#b8bb26', '#8ec07c', '#83a598', '#d3869b']
    };

    function noop() {}

    function getPrinter(printToHistory) {
        return typeof printToHistory === 'function' ? printToHistory : noop;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function getBallColor() {
        const themeName = document.body.className.replace('theme-', '').trim() || 'dark';
        const colors = ballThemeColors[themeName] || ballThemeColors.dark;
        return colors[Math.floor(Math.random() * colors.length)];
    }

    function isTouchDevice() {
        return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    }

    function getMaxBallSize() {
        const viewportLimit = Math.max(MIN_BALL_SIZE, Math.min(window.innerWidth, window.innerHeight) * 0.9);
        return Math.min(MAX_BALL_SIZE, viewportLimit);
    }

    function parseBallArgs(args) {
        const argsArray = args.trim() ? args.trim().split(/\s+/).map(Number) : [];
        const sizeArg = argsArray[0];
        const speedArg = argsArray[1];
        const gravityArg = argsArray[2];
        const countArg = argsArray[3];
        const maxSize = getMaxBallSize();
        const hasSize = Number.isFinite(sizeArg) && sizeArg > 0;
        const hasSpeed = Number.isFinite(speedArg) && speedArg > 0;
        const hasGravity = Number.isFinite(gravityArg) && gravityArg >= 0;

        return {
            sizeArg,
            speedArg,
            gravityArg,
            size: hasSize ? clamp(sizeArg, MIN_BALL_SIZE, maxSize) : null,
            speed: hasSpeed ? clamp(speedArg / 10, 0, MAX_INITIAL_SPEED) : null,
            gravity: hasGravity ? clamp(gravityArg / 10, 0, MAX_BALL_GRAVITY) : DEFAULT_BALL_GRAVITY,
            count: Number.isFinite(countArg) && countArg > 0 ? clamp(Math.floor(countArg), 1, MAX_BALL_COUNT) : 1,
            hasSize,
            hasSpeed,
            hasGravity
        };
    }

    function randomBallSize() {
        return clamp(Math.random() * 100 + 10, MIN_BALL_SIZE, getMaxBallSize());
    }

    function updateBallElement(ball) {
        const scale = ball.isDragging ? 1.1 : 1;
        ball.element.style.transform = `translate3d(${ball.x}px, ${ball.y}px, 0) scale(${scale})`;
    }

    function constrainBallToViewport(ball) {
        const diameter = ball.radius * 2;
        ball.x = clamp(ball.x, 0, Math.max(0, window.innerWidth - diameter));
        ball.y = clamp(ball.y, 0, Math.max(0, window.innerHeight - diameter));
    }

    function limitBallVelocity(ball) {
        const speedSq = ball.vx * ball.vx + ball.vy * ball.vy;
        const maxSpeedSq = MAX_INITIAL_SPEED * MAX_INITIAL_SPEED;

        if (speedSq <= maxSpeedSq) return;

        const scale = MAX_INITIAL_SPEED / Math.sqrt(speedSq);
        ball.vx *= scale;
        ball.vy *= scale;
    }

    function updateDraggedBall(clientX, clientY, eventTime) {
        const ball = state.draggedBall;
        if (!ball) return;

        const now = typeof eventTime === 'number' ? eventTime : performance.now();
        const elapsed = Math.max(1, now - (ball.lastPointerTime || now));
        const frameScale = Math.max(elapsed / BALL_FRAME_MS, 0.1);
        const deltaX = clientX - ball.lastMouseX;
        const deltaY = clientY - ball.lastMouseY;

        ball.vx = clamp(deltaX / frameScale, -MAX_DRAG_SPEED, MAX_DRAG_SPEED);
        ball.vy = clamp(deltaY / frameScale, -MAX_DRAG_SPEED, MAX_DRAG_SPEED);
        ball.x = clientX - state.dragOffsetX;
        ball.y = clientY - state.dragOffsetY;

        constrainBallToViewport(ball);
        updateBallElement(ball);

        ball.lastMouseX = clientX;
        ball.lastMouseY = clientY;
        ball.lastPointerTime = now;
    }

    function mouseMoveHandler(e) {
        if (!state.draggedBall) return;
        e.preventDefault();
        updateDraggedBall(e.clientX, e.clientY, e.timeStamp);
    }

    function touchMoveHandler(e) {
        if (!state.draggedBall) return;
        e.preventDefault();

        const touch = e.touches[0];
        if (!touch) return;

        updateDraggedBall(touch.clientX, touch.clientY, e.timeStamp);
    }

    function stopDragging() {
        if (state.draggedBall) {
            state.draggedBall.element.classList.remove('dragging');
            state.draggedBall.isDragging = false;

            if (!state.motionEnabled) {
                state.draggedBall.gravity = state.draggedBall.originalGravity;
            }

            updateBallElement(state.draggedBall);
            state.draggedBall = null;
        }

        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', stopDragging);
        document.removeEventListener('touchmove', touchMoveHandler);
        document.removeEventListener('touchend', stopDragging);
        document.removeEventListener('touchcancel', stopDragging);
    }

    function deviceMotionHandler(event) {
        if (!state.motionEnabled) return;

        const accel = event.accelerationIncludingGravity || {};
        const sensitivity = 0.5;

        state.motionGravityX = clamp(accel.x || 0, -9.8, 9.8) * sensitivity;
        state.motionGravityY = clamp(accel.y || 0, -9.8, 9.8) * -sensitivity;
    }

    function enableMotion(print) {
        if (!state.motionEnabled) {
            window.addEventListener('devicemotion', deviceMotionHandler);
        }

        state.motionPermissionGranted = true;
        state.motionEnabled = true;
        state.balls.forEach(ball => {
            ball.gravity = 0;
        });
        print('Motion controls <strong>enabled</strong>');
    }

    function requestMotionPermission(print) {
        if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
            return DeviceMotionEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        enableMotion(print);
                        return true;
                    }

                    print('Motion permission denied.');
                    return false;
                })
                .catch((error) => {
                    console.error(error);
                    print('Error requesting motion permission.');
                    return false;
                });
        }

        enableMotion(print);
        return Promise.resolve(true);
    }

    function startBallAnimation() {
        if (state.animationId) return;

        state.lastFrameTime = null;
        state.animationId = requestAnimationFrame(animateBalls);
    }

    function getBallFrameScale(timestamp) {
        if (state.lastFrameTime == null) {
            state.lastFrameTime = timestamp;
            return 1;
        }

        const elapsed = Math.max(0, timestamp - state.lastFrameTime);
        state.lastFrameTime = timestamp;

        if (elapsed === 0) return 1;
        return Math.min(elapsed / BALL_FRAME_MS, MAX_FRAME_SCALE);
    }

    function resolveWallCollisions(ball, frameScale) {
        const diameter = ball.radius * 2;
        const maxX = Math.max(0, window.innerWidth - diameter);
        const maxY = Math.max(0, window.innerHeight - diameter);

        if (ball.x > maxX) {
            ball.x = maxX;
            ball.vx = -Math.abs(ball.vx) * WALL_RESTITUTION;
        } else if (ball.x < 0) {
            ball.x = 0;
            ball.vx = Math.abs(ball.vx) * WALL_RESTITUTION;
        }

        if (ball.y > maxY) {
            const impactVelocity = Math.abs(ball.vy);
            ball.y = maxY;
            ball.vy = -Math.abs(ball.vy) * WALL_RESTITUTION;

            if (!state.motionEnabled) {
                const settleThreshold = Math.max(0.35, ball.originalGravity * frameScale * 1.2);

                if (impactVelocity < settleThreshold) {
                    ball.vy = 0;
                }

                ball.vx *= Math.pow(FLOOR_FRICTION, frameScale);

                if (Math.abs(ball.vx) < REST_VELOCITY) {
                    ball.vx = 0;
                }
            }
        } else if (ball.y < 0) {
            ball.y = 0;
            ball.vy = Math.abs(ball.vy) * WALL_RESTITUTION;
        }
    }

    function integrateBall(ball, frameScale) {
        if (ball.isDragging) return;

        if (state.motionEnabled) {
            ball.vx += state.motionGravityX * frameScale;
            ball.vy += state.motionGravityY * frameScale;
        } else {
            ball.vy += ball.gravity * frameScale;
        }

        limitBallVelocity(ball);

        ball.x += ball.vx * frameScale;
        ball.y += ball.vy * frameScale;

        resolveWallCollisions(ball, frameScale);
    }

    function resolveBallCollision(ball, otherBall) {
        const ballCenterX = ball.x + ball.radius;
        const ballCenterY = ball.y + ball.radius;
        const otherBallCenterX = otherBall.x + otherBall.radius;
        const otherBallCenterY = otherBall.y + otherBall.radius;
        const dx = otherBallCenterX - ballCenterX;
        const dy = otherBallCenterY - ballCenterY;
        const minDistance = ball.radius + otherBall.radius;
        const minDistanceSq = minDistance * minDistance;
        const distanceSq = dx * dx + dy * dy;

        if (distanceSq >= minDistanceSq) return;

        const distance = distanceSq === 0 ? 0 : Math.sqrt(distanceSq);
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

        constrainBallToViewport(ball);
        constrainBallToViewport(otherBall);

        const rvx = ball.vx - otherBall.vx;
        const rvy = ball.vy - otherBall.vy;
        const velAlongNormal = rvx * nx + rvy * ny;

        if (velAlongNormal <= 0) return;

        const massRatio1 = ((1 + BALL_RESTITUTION) * otherBall.mass) / totalMass;
        const massRatio2 = ((1 + BALL_RESTITUTION) * ball.mass) / totalMass;

        ball.vx -= massRatio1 * velAlongNormal * nx;
        ball.vy -= massRatio1 * velAlongNormal * ny;
        otherBall.vx += massRatio2 * velAlongNormal * nx;
        otherBall.vy += massRatio2 * velAlongNormal * ny;

        limitBallVelocity(ball);
        limitBallVelocity(otherBall);
    }

    function buildCollisionGrid(cellSize) {
        const grid = new Map();

        state.balls.forEach((ball, index) => {
            const centerX = ball.x + ball.radius;
            const centerY = ball.y + ball.radius;
            const cellX = Math.floor(centerX / cellSize);
            const cellY = Math.floor(centerY / cellSize);
            const key = `${cellX},${cellY}`;

            if (!grid.has(key)) {
                grid.set(key, []);
            }

            grid.get(key).push(index);
        });

        return grid;
    }

    function resolveBallCollisions() {
        if (state.balls.length < 2) return;

        const maxRadius = state.balls.reduce((max, ball) => Math.max(max, ball.radius), 0);
        const cellSize = Math.max(MIN_BALL_SIZE * 2, maxRadius * 2);
        const iterations = state.balls.length > 120 ? 3 : 4;

        for (let k = 0; k < iterations; k++) {
            const grid = buildCollisionGrid(cellSize);

            grid.forEach((indices, key) => {
                const [cellX, cellY] = key.split(',').map(Number);

                for (let offsetX = -1; offsetX <= 1; offsetX++) {
                    for (let offsetY = -1; offsetY <= 1; offsetY++) {
                        const neighborIndices = grid.get(`${cellX + offsetX},${cellY + offsetY}`);
                        if (!neighborIndices) continue;

                        indices.forEach(index => {
                            neighborIndices.forEach(otherIndex => {
                                if (otherIndex <= index) return;
                                resolveBallCollision(state.balls[index], state.balls[otherIndex]);
                            });
                        });
                    }
                }
            });
        }
    }

    function animateBalls(timestamp) {
        if (state.balls.length === 0) {
            state.animationId = null;
            state.lastFrameTime = null;
            return;
        }

        const frameScale = getBallFrameScale(timestamp);

        state.balls.forEach(ball => integrateBall(ball, frameScale));
        resolveBallCollisions();
        state.balls.forEach(updateBallElement);

        state.animationId = requestAnimationFrame(animateBalls);
    }

    function beginDrag(ball, clientX, clientY, eventTime) {
        state.draggedBall = ball;
        ball.isDragging = true;
        ball.element.classList.add('dragging');
        ball.vx = 0;
        ball.vy = 0;
        ball.gravity = 0;
        ball.lastMouseX = clientX;
        ball.lastMouseY = clientY;
        ball.lastPointerTime = typeof eventTime === 'number' ? eventTime : performance.now();
        state.dragOffsetX = clientX - ball.x;
        state.dragOffsetY = clientY - ball.y;
        updateBallElement(ball);
    }

    function addBallDragHandlers(ball) {
        ball.element.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            e.preventDefault();

            beginDrag(ball, e.clientX, e.clientY, e.timeStamp);
            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', stopDragging);
        });

        ball.element.addEventListener('touchstart', (e) => {
            e.preventDefault();

            const touch = e.touches[0];
            if (!touch) return;

            beginDrag(ball, touch.clientX, touch.clientY, e.timeStamp);
            document.addEventListener('touchmove', touchMoveHandler, { passive: false });
            document.addEventListener('touchend', stopDragging);
            document.addEventListener('touchcancel', stopDragging);
        });
    }

    function createBall(size, speed, gravity, fragment) {
        const element = document.createElement('div');
        const radius = size / 2;
        const maxX = Math.max(0, window.innerWidth - size);
        const maxY = Math.max(0, window.innerHeight * 0.5 - size);
        const ball = {
            element,
            x: Math.random() * maxX,
            y: Math.random() * maxY,
            vx: (Math.random() - 0.5) * speed * 2,
            vy: (Math.random() - 0.5) * speed,
            radius,
            gravity,
            originalGravity: gravity,
            mass: Math.PI * radius * radius,
            isDragging: false,
            lastMouseX: 0,
            lastMouseY: 0,
            lastPointerTime: 0
        };

        element.className = 'ball';
        element.style.width = `${size}px`;
        element.style.height = `${size}px`;
        element.style.backgroundColor = getBallColor();

        addBallDragHandlers(ball);
        updateBallElement(ball);
        fragment.appendChild(element);
        state.balls.push(ball);
    }

    function createBalls(args, print) {
        const parsed = parseBallArgs(args);
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < parsed.count; i++) {
            const size = parsed.size == null ? randomBallSize() : parsed.size;
            const speed = parsed.speed == null ? Math.random() * 50 + 2 : parsed.speed;
            const gravity = state.motionEnabled ? 0 : parsed.gravity;
            createBall(size, speed, gravity, fragment);
        }

        document.body.appendChild(fragment);
        startBallAnimation();

        if (parsed.count === 1) {
            const sizeStr = parsed.hasSize ? parsed.size.toFixed(0) : 'random';
            const speedStr = parsed.hasSpeed ? parsed.speed.toFixed(1) : 'random';
            const gravityStr = state.motionEnabled
                ? 'motion-controlled'
                : parsed.hasGravity ? parsed.gravity.toFixed(1) : `default (${DEFAULT_BALL_GRAVITY.toFixed(1)})`;

            print(`Ball created (Size: ${sizeStr}, Speed: ${speedStr}, Gravity: ${gravityStr})`);
        } else {
            print(`Created ${parsed.count} balls.`);
        }
    }

    function create(args, printToHistory) {
        const print = getPrinter(printToHistory);

        if (!state.motionPermissionGranted) {
            if (isTouchDevice()) {
                print('Tap the screen to enable motion controls');

                if (state.pendingMotionPermissionHandler) {
                    document.body.removeEventListener('click', state.pendingMotionPermissionHandler);
                }

                state.pendingMotionPermissionHandler = () => {
                    const pendingHandler = state.pendingMotionPermissionHandler;
                    state.pendingMotionPermissionHandler = null;
                    document.body.removeEventListener('click', pendingHandler);

                    requestMotionPermission(print).then(granted => {
                        if (granted) {
                            createBalls(args, print);
                        }
                    });
                };

                document.body.addEventListener('click', state.pendingMotionPermissionHandler);
                return;
            }

            state.motionPermissionGranted = true;
        }

        createBalls(args, print);
    }

    function clear() {
        if (state.animationId) {
            cancelAnimationFrame(state.animationId);
            state.animationId = null;
        }

        stopDragging();

        state.balls.forEach(ball => ball.element.remove());
        state.balls = [];
        state.lastFrameTime = null;

        if (state.pendingMotionPermissionHandler) {
            document.body.removeEventListener('click', state.pendingMotionPermissionHandler);
            state.pendingMotionPermissionHandler = null;
        }

        window.removeEventListener('devicemotion', deviceMotionHandler);
        state.motionEnabled = false;
        state.motionPermissionGranted = false;
        state.motionGravityX = 0;
        state.motionGravityY = DEFAULT_BALL_GRAVITY;
    }

    window.BallSystem = {
        create,
        clear
    };
})();
