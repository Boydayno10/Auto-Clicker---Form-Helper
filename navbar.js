(function () {
    'use strict';

    function initNavIndicator() {
        const navList = document.querySelector('.navbar ul');
        if (!navList) return;

        const links = Array.from(navList.querySelectorAll('a'));
        if (!links.length) return;

        let activeLink = null;

        function setIndicatorForLink(link) {
            if (!link) {
                navList.style.setProperty('--nav-indicator-visible', '0');
                return;
            }

            const navRect = navList.getBoundingClientRect();
            const linkRect = link.getBoundingClientRect();

            const x = Math.max(0, linkRect.left - navRect.left);
            const w = Math.max(0, linkRect.width);

            navList.style.setProperty('--nav-indicator-x', `${x}px`);
            navList.style.setProperty('--nav-indicator-w', `${w}px`);
            navList.style.setProperty('--nav-indicator-visible', w > 0 ? '1' : '0');
        }

        function pickActiveLinkFromLocation() {
            const path = (window.location.pathname || '').toLowerCase();
            const isOptionsPage = path.endsWith('/options.html') || path.endsWith('options.html');

            if (isOptionsPage) {
                return null;
            }

            const currentHash = window.location.hash || '';

            // When index opens without a hash, treat it as the implicit "Início" (no highlighted section).
            if (!currentHash) {
                return null;
            }

            // Back-compat: historically Docs used #Inicio. Now #Inicio means "Início" (no highlight).
            if (currentHash.toLowerCase() === '#inicio') {
                return null;
            }

            if (currentHash) {
                for (const link of links) {
                    try {
                        const url = new URL(link.getAttribute('href') || '', window.location.href);
                        if (url.hash === currentHash) {
                            return link;
                        }
                    } catch {
                        // ignore invalid hrefs
                    }
                }
            }

            return null;
        }

        function updateActiveLink() {
            activeLink = pickActiveLinkFromLocation();
            requestAnimationFrame(() => setIndicatorForLink(activeLink));
        }

        function onResize() {
            requestAnimationFrame(() => setIndicatorForLink(activeLink));
        }

        // Update on in-page navigation changes.
        window.addEventListener('hashchange', updateActiveLink);
        window.addEventListener('resize', onResize);

        // Update immediately on clicks.
        navList.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof Element)) return;
            const link = target.closest('a');
            if (!link) return;

            // Give immediate visual feedback.
            setIndicatorForLink(link);

            // Let the browser update the hash first.
            window.setTimeout(updateActiveLink, 0);
        });

        updateActiveLink();
    }

    function initNavbarMenu() {
        const menuButton = document.querySelector('.topbar-menu-btn');
        const overlay = document.querySelector('.topbar-menu-overlay');
        const menu = document.querySelector('.topbar-menu');
        const closeButton = document.querySelector('.topbar-menu-close');

        if (!menuButton || !overlay || !menu || !closeButton) {
            return;
        }

        let closeTimerId = 0;

        function setExpanded(isExpanded) {
            menuButton.setAttribute('aria-expanded', String(isExpanded));
        }

        function openMenu() {
            if (closeTimerId) {
                window.clearTimeout(closeTimerId);
                closeTimerId = 0;
            }

            overlay.hidden = false;
            menu.hidden = false;

            // Start closed (for animation), then open on next frame.
            menu.dataset.open = 'false';
            overlay.dataset.open = 'false';
            requestAnimationFrame(() => {
                menu.dataset.open = 'true';
                overlay.dataset.open = 'true';
            });

            setExpanded(true);

            const firstFocusable = menu.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }

        function closeMenu() {
            menu.dataset.open = 'false';
            overlay.dataset.open = 'false';
            setExpanded(false);

            // Wait for the slide/fade animation before hiding.
            if (closeTimerId) {
                window.clearTimeout(closeTimerId);
            }

            closeTimerId = window.setTimeout(() => {
                if (menu.dataset.open === 'false') {
                    menu.hidden = true;
                }
                if (overlay.dataset.open === 'false') {
                    overlay.hidden = true;
                }
                closeTimerId = 0;
            }, 240);

            menuButton.focus();
        }

        function toggleMenu() {
            const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
            if (isOpen) {
                closeMenu();
            } else {
                openMenu();
            }
        }

        menuButton.addEventListener('click', toggleMenu);
        closeButton.addEventListener('click', closeMenu);
        overlay.addEventListener('click', closeMenu);

        menu.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof Element)) return;

            const link = target.closest('a');
            if (link) {
                closeMenu();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape') return;
            const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
            if (isOpen) {
                event.preventDefault();
                closeMenu();
            }
        });
    }

    function init() {
        initNavbarMenu();
        initNavIndicator();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
