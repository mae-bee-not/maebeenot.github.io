(function () {
  const historyEl = document.getElementById("history");
  const inputEl = document.getElementById("input-line");

  // --- music player code ---
  const playlist = [
    { title: "Nyan", path: "/assets/playlist/nyan.mp3" },
    { title: "Antonymph", path: "/assets/playlist/antonympth.mp3" },
    { title: "Brb", path: "/assets/playlist/brb.mp3" },
    { title: "Spookwave", path: "/assets/playlist/spookwave.mp3" },
    { title: "Stal", path: "/assets/playlist/stal.mp3" },
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
    const imageUrl = "/assets/zigzagoon.png";
    const zImage = document.createElement("img");
    zImage.src = imageUrl;
    zImage.className = "zigzagoon-animation";
    document.body.appendChild(zImage);

    setTimeout(() => {
      zImage.remove();
    }, 3000);
  }

  function bdayAnimation() {
    const imageUrl = "/assets/neil.jpeg";
    const bdayImage = document.createElement("img");
    bdayImage.src = imageUrl;
    bdayImage.className = "bday-animation";
    document.body.appendChild(bdayImage);

    setTimeout(() => {
      bdayImage.remove();
    }, 4000);
  }

  const commands = {
    help: function () {
      printToHistory("Available commands:");
      printToHistory("<strong>apps</strong> – view self hosted apps");
      printToHistory("<strong>socials</strong> – view socials");
      printToHistory("<strong>message</strong> – leave a message");
      printToHistory("<strong>minecraft</strong> – view my servers");
      printToHistory("<strong>music</strong> – play, pause, skip, or see now playing");
      printToHistory("<strong>old</strong> – visit the old site");
      printToHistory("<strong>theme</strong> – change the terminal theme");
      printToHistory("<strong>date</strong> – display date");
      printToHistory("<strong>echo [text]</strong> – print text to the terminal");
      printToHistory("<strong>neofetch</strong> – display user information");
      printToHistory("<strong>tetris</strong> – play Tetris");
      printToHistory("<strong>snake</strong> – play Snake");
      printToHistory("<strong>ball [size] [speed] [gravity] [count]</strong> – make bouncing balls");
      printToHistory("<strong>help</strong> – show this help message");
      printToHistory("<strong>clear</strong> – clear this terminal");
    },
    clear: function () {
      historyEl.innerHTML = "";

      // Clear bugs
      const bugs = document.querySelectorAll(".bug");
      bugs.forEach((bug) => bug.remove());

      if (window.BallSystem) {
        window.BallSystem.clear();
      }
    },
    apps: function () {
      window.location.href = "/pages/apps.html";
    },
    socials: function () {
      window.location.href = "/pages/socials.html";
    },
    old: function () {
      const isLocal = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
      window.location.href = isLocal ? "/old/" : "https://old.coolbugs.win/";
    },
    message: function () {
      window.location.href = "/pages/messages.html";
    },
    minecraft: function () {
      window.location.href = "/pages/dynmap.html";
    },
    echo: function (args) {
      printToHistory(escapeHtml(args));
    },
    date: function () {
      printToHistory(new Date().toLocaleString());
    },
    tetris: function () {
      window.location.href = "/pages/tetris.html";
    },
    snake: function () {
      window.location.href = "/pages/snake.html";
    },
    cosc484: function () {
      window.location.href = "/pages/COSC484.html";
    },
    theme: function (args) {
      const themeName = args.trim().toLowerCase();
      const themes = {
        dark: "pink on grey",
        matrix: "green on black",
        ocean: "mint on navy",
        light: "blue on white",
        scary: "red on black",
        "gruvbox-rainbow": "warm gruvbox with rainbow accents",
      };

      if (!themeName || themeName === "list") {
        printToHistory("Available Themes:");
        for (const name in themes) {
          printToHistory(`- <strong>${name}</strong>: ${themes[name]}`);
        }
      } else if (themes[themeName]) {
        window.terminalThemes.apply(themeName);
        printToHistory(`Theme changed to <strong>${themeName}</strong>.`);
      } else {
        printToHistory(`Theme not found: <strong>${themeName}</strong>.`);
      }
    },
    music: function (args) {
      const parts = args.split(" ");
      const subCommand = parts[0].toLowerCase();

      switch (subCommand) {
        case "play":
          if (audio.paused && audio.src) {
            audio.play();
            printToHistory("Resumed playback.");
          } else {
            playSong(currentSongIndex);
          }
          break;
        case "pause":
          audio.pause();
          printToHistory("Playback paused.");
          break;
        case "skip":
          let nextSongIndex = (currentSongIndex + 1) % playlist.length;
          playSong(nextSongIndex);
          break;
        case "nowplaying":
          if (!audio.paused) {
            printToHistory(`Currently playing: <strong>${playlist[currentSongIndex].title}</strong>`);
          } else {
            printToHistory("Nothing is currently playing.");
          }
          break;
        default:
          printToHistory("Usage: music [play|pause|skip|nowplaying]");
          break;
      }
    },
    neofetch: function () {
      const browserInfo = ["<strong>Vendor:</strong> " + navigator.vendor, "<strong>User Agent:</strong> " + navigator.userAgent, "<strong>Platform:</strong> " + navigator.platform, "<strong>CPU Cores:</strong> " + navigator.hardwareConcurrency, "<strong>Resolution:</strong> " + screen.width + "x" + screen.height, "<strong>Language:</strong> " + navigator.language, "<strong>Cookies Enabled:</strong> " + navigator.cookieEnabled];
      printToHistory(browserInfo.join("<br>"));
    },
    deer: function () {
      const deerImages = ["/assets/deer1.png", "/assets/deer2.png", "/assets/deer3.webp", "/assets/deer4.webp", "/assets/deer6.png"];
      for (let i = 0; i < 15; i++) {
        setTimeout(() => {
          const deer = document.createElement("img");
          deer.className = "deer";
          deer.src = deerImages[Math.floor(Math.random() * deerImages.length)];
          deer.style.top = Math.random() * 80 + 10 + "%";
          deer.style.animationDuration = Math.random() * 5 + 5 + "s";
          document.body.appendChild(deer);
          setTimeout(() => {
            deer.remove();
          }, 10000);
        }, i * 500);
      }
    },
    sal: function () {
      const audio = new Audio("/assets/sal.mp3");
      audio.play();
    },
    bugs: function () {
      const numBugs = Math.random() * (40 - 1) + 1;
      const bugs = [];

      for (let i = 0; i < numBugs; i++) {
        const bug = document.createElement("div");
        bug.className = "bug";
        bug.innerHTML = '<img src="/assets/scarab.webp" style="width:100%;height:100%;">';
        bug.style.left = Math.random() * window.innerWidth + "px";
        bug.style.top = Math.random() * window.innerHeight + "px";
        document.body.appendChild(bug);
        bugs.push({
          element: bug,
          x: parseFloat(bug.style.left),
          y: parseFloat(bug.style.top),
          vx: Math.random() * 2 - 1,
          vy: Math.random() * 2 - 1,
        });
      }

      let mouseX = window.innerWidth / 2;
      let mouseY = window.innerHeight / 2;

      document.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
      });

      function animateBugs() {
        bugs.forEach((bug) => {
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

          bug.element.style.left = bug.x - bug.element.offsetWidth / 2 + "px";
          bug.element.style.top = bug.y - bug.element.offsetHeight / 2 + "px";
        });

        requestAnimationFrame(animateBugs);
      }

      animateBugs();
    },
    ball: function (args) {
      if (!window.BallSystem) {
        printToHistory("Ball system failed to load.");
        return;
      }

      window.BallSystem.create(args, printToHistory);
    },
  };

  const history = [];
  let historyIndex = -1;

  function printToHistory(message) {
    const line = document.createElement("div");
    line.classList.add("history-line");
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

    if (trimmed.toLowerCase() === "zigzagoon i choose you") {
      zigzagoonAnimation();
      return;
    }
    if (trimmed === "04/13/06") {
      bdayAnimation();
      return;
    }

    const parts = trimmed.split(" ");
    const command = parts[0].toLowerCase();
    const args = parts.slice(1).join(" ");

    if (commands[command]) {
      commands[command](args);
    } else {
      printToHistory(`Command not recognized: <strong>${escapeHtml(command)}</strong>`);
    }
  }

  function escapeHtml(unsafe) {
    return unsafe.replace(/[&<"'>]/g, function (m) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        '"': "&quot;",
        "'": "&#039;",
        ">": "&gt;",
      }[m];
    });
  }

  window.addEventListener("load", () => {
    inputEl.focus();
    printToHistory("Welcome! Type <strong>help</strong> to see available commands 𐂂");
  });

  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const commandText = inputEl.textContent;
      executeCommand(commandText);
      inputEl.textContent = "";
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        inputEl.textContent = history[historyIndex];
        placeCaretAtEnd(inputEl);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        historyIndex++;
        inputEl.textContent = history[historyIndex];
      } else {
        historyIndex = history.length;
        inputEl.textContent = "";
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
