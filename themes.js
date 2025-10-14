(function() {
    const themes = {
        'dark': 'pink on grey',
        'matrix': 'green on black',
        'ocean': 'mint on navy',
        'light': 'blue on white',
        'scary': 'red on black'
    };

    function applyTheme(themeName) {
        document.body.className = '';
        if (themeName && themeName !== 'dark') { // default
            document.body.classList.add(`theme-${themeName}`);
        }
        localStorage.setItem('terminal-theme', themeName);
    }

    function loadTheme() {
        const savedTheme = localStorage.getItem('terminal-theme') || 'dark';
        if (savedTheme && savedTheme !== 'dark') {
            document.body.classList.add(`theme-${savedTheme}`);
        }
    }

    window.terminalThemes = {
        list: themes,
        apply: applyTheme
    };

    document.addEventListener('DOMContentLoaded', loadTheme);
})();