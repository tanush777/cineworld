// ====== PWA SETUP & SERVICE WORKER REGISTRATION ======

class PWAManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.init();
    }

    init() {
        this.registerServiceWorker();
        this.setupOnlineOfflineHandlers();
        this.displayInstallPrompt();
        this.handleDeepLinks();
    }

    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.log('Service Workers not supported');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register('sw.js', {
                scope: '/'
            });
            console.log('Service Worker registered:', registration);

            // Check for updates periodically
            setInterval(() => {
                registration.update();
            }, 60000); // Check every minute

            // Listen for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'activated') {
                        this.showUpdateNotification();
                    }
                });
            });
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }

    setupOnlineOfflineHandlers() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showOfflineIndicator(false);
            notificationManager.info('Back Online', 'You are now connected to the internet');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showOfflineIndicator(true);
            notificationManager.warning('Offline Mode', 'You are now offline. Cached content available.');
        });

        // Initial check
        if (!navigator.onLine) {
            this.showOfflineIndicator(true);
        }
    }

    showOfflineIndicator(isOffline) {
        let indicator = document.getElementById('offline-indicator');
        
        if (isOffline) {
            if (!indicator) {
                const html = `
                    <div id="offline-indicator" style="
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        background: linear-gradient(90deg, #ff6b6b 0%, #ff8e8e 100%);
                        color: white;
                        padding: 12px 20px;
                        text-align: center;
                        font-weight: 600;
                        z-index: 9999;
                        box-shadow: 0 2px 10px rgba(255, 107, 107, 0.3);
                    ">
                        📡 You are offline. Cached content may be displayed.
                    </div>
                `;
                document.body.insertAdjacentHTML('afterbegin', html);
                document.body.style.marginTop = '44px';
            }
        } else {
            if (indicator) {
                indicator.remove();
                document.body.style.marginTop = '0';
            }
        }
    }

    displayInstallPrompt() {
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.showInstallButton(deferredPrompt);
        });

        window.addEventListener('appinstalled', () => {
            console.log('App installed successfully');
            notificationManager.success('App Installed', 'CineWorld is now on your device!');
        });
    }

    showInstallButton(deferredPrompt) {
        if (!document.getElementById('install-prompt-btn')) {
            const button = document.createElement('button');
            button.id = 'install-prompt-btn';
            button.innerHTML = '📥 Install App';
            button.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: linear-gradient(135deg, #e5bd09 0%, #ffcc00 100%);
                color: #000;
                border: none;
                padding: 12px 24px;
                border-radius: 25px;
                font-weight: 700;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(229, 189, 9, 0.3);
                z-index: 2000;
                transition: all 0.3s ease;
            `;

            button.addEventListener('mouseover', () => {
                button.style.transform = 'translateY(-3px)';
                button.style.boxShadow = '0 8px 25px rgba(229, 189, 9, 0.5)';
            });

            button.addEventListener('mouseout', () => {
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = '0 4px 15px rgba(229, 189, 9, 0.3)';
            });

            button.addEventListener('click', async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    console.log(`Install outcome: ${outcome}`);
                    deferredPrompt = null;
                    button.style.display = 'none';
                }
            });

            document.body.appendChild(button);
        }
    }

    showUpdateNotification() {
        const updateDiv = document.createElement('div');
        updateDiv.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, var(--accent-blue) 0%, #0099cc 100%);
            color: white;
            padding: 16px 24px;
            border-radius: 25px;
            box-shadow: 0 4px 15px rgba(0, 191, 255, 0.3);
            z-index: 2000;
        `;
        updateDiv.innerHTML = `
            ✨ New version available! 
            <button onclick="location.reload()" style="
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid white;
                color: white;
                padding: 6px 12px;
                border-radius: 15px;
                cursor: pointer;
                margin-left: 12px;
                font-weight: 600;
            ">Reload</button>
        `;
        document.body.appendChild(updateDiv);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            updateDiv.style.opacity = '0';
            updateDiv.style.transition = 'opacity 0.3s ease';
            setTimeout(() => updateDiv.remove(), 300);
        }, 10000);
    }

    handleDeepLinks() {
        const params = new URLSearchParams(window.location.search);
        
        if (params.has('search')) {
            setTimeout(() => {
                const searchInput = document.getElementById('search-input');
                if (searchInput) searchInput.focus();
            }, 500);
        }

        if (params.has('watchlist')) {
            setTimeout(() => {
                const watchlistBtn = document.getElementById('favorites-btn');
                if (watchlistBtn) watchlistBtn.click();
            }, 500);
        }

        if (params.has('tab')) {
            const tab = params.get('tab');
            setTimeout(() => {
                const tabBtn = document.querySelector(`[data-tab="${tab}"]`);
                if (tabBtn) tabBtn.click();
            }, 500);
        }

        if (params.has('import')) {
            const encodedData = params.get('import');
            sharingManager.importSharedData(encodedData);
            notificationManager.success('Data Imported', 'Shared watchlist imported successfully!');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    async getDeviceStorage() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            return {
                usage: estimate.usage,
                quota: estimate.quota,
                percentage: (estimate.usage / estimate.quota * 100).toFixed(2)
            };
        }
        return null;
    }

    async requestPersistentStorage() {
        if ('storage' in navigator && 'persist' in navigator.storage) {
            const persistent = await navigator.storage.persist();
            if (persistent) {
                notificationManager.success('Storage Protected', 'App data will not be cleared');
                return true;
            }
        }
        return false;
    }
}

// Initialize PWA manager when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const pwaManager = new PWAManager();
        window.pwaManager = pwaManager;
    });
} else {
    const pwaManager = new PWAManager();
    window.pwaManager = pwaManager;
}
