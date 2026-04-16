// ====== NOTIFICATION SYSTEM ======
// Desktop notifications and in-app alerts

class NotificationManager {
    constructor() {
        this.notifications = [];
        this.requestPermission();
    }

    requestPermission() {
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    }

    sendNotification(title, options = {}) {
        const defaultOptions = {
            icon: '🎬',
            duration: 5000,
            type: 'info' // 'info', 'success', 'warning', 'error'
        };

        const config = { ...defaultOptions, ...options };

        // In-app notification
        this.showInAppNotification(title, config);

        // Desktop notification (if permitted)
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                icon: '🎬 CineWorld',
                body: config.body,
                tag: 'cineworld-notification'
            });
        }
    }

    showInAppNotification(title, config) {
        const notificationId = Date.now();
        const colors = {
            'info': 'rgba(0, 191, 255, 0.9)',
            'success': 'rgba(102, 205, 170, 0.9)',
            'warning': 'rgba(255, 193, 7, 0.9)',
            'error': 'rgba(255, 107, 107, 0.9)'
        };

        const icons = {
            'info': 'ℹ️',
            'success': '✓',
            'warning': '⚠️',
            'error': '✕'
        };

        const notificationHTML = `
            <div id="notification-${notificationId}" style="
                position: fixed;
                top: 100px;
                right: 20px;
                background: ${colors[config.type] || colors.info};
                color: white;
                padding: 16px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                z-index: 3000;
                animation: slideInRight 0.3s ease-out;
                display: flex;
                align-items: center;
                gap: 12px;
                max-width: 350px;
                min-width: 300px;
            ">
                <span style="font-size: 1.2em;">${icons[config.type]}</span>
                <div style="flex: 1;">
                    <strong style="display: block; margin-bottom: 4px;">${title}</strong>
                    ${config.body ? `<small style="opacity: 0.9;">${config.body}</small>` : ''}
                </div>
                <button onclick="this.parentElement.style.opacity='0'; setTimeout(() => this.parentElement.remove(), 300);" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.2em;
                    cursor: pointer;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">×</button>
            </div>
        `;

        if (!document.querySelector('#notifications-container')) {
            document.body.insertAdjacentHTML('beforeend', '<div id="notifications-container"></div>');
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.querySelector('#notifications-container').insertAdjacentHTML('beforeend', notificationHTML);

        if (config.duration > 0) {
            setTimeout(() => {
                const notification = document.getElementById(`notification-${notificationId}`);
                if (notification) {
                    notification.style.opacity = '0';
                    notification.style.transition = 'opacity 0.3s ease';
                    setTimeout(() => notification.remove(), 300);
                }
            }, config.duration);
        }
    }

    success(title, body = '') {
        this.sendNotification(title, { body, type: 'success' });
    }

    info(title, body = '') {
        this.sendNotification(title, { body, type: 'info' });
    }

    warning(title, body = '') {
        this.sendNotification(title, { body, type: 'warning' });
    }

    error(title, body = '') {
        this.sendNotification(title, { body, type: 'error' });
    }

    addedToWatchlist(movieTitle) {
        this.success(`Added to Watchlist`, `"${movieTitle}" added successfully!`);
    }

    removedFromWatchlist(movieTitle) {
        this.info(`Removed from Watchlist`, `"${movieTitle}" removed.`);
    }

    newRelease(movieTitle) {
        this.info(`🎉 New Release`, `"${movieTitle}" just came out!`);
    }

    savedRating(movieTitle, rating) {
        this.success(`Rating Saved`, `You rated "${movieTitle}" ${rating}/10`);
    }

    exportComplete() {
        this.success(`Export Complete`, `Your data has been downloaded.`);
    }

    shareCreated() {
        this.success(`Share Link Created`, `Link copied to clipboard!`);
    }
}

// Initialize notification manager
const notificationManager = new NotificationManager();
window.notificationManager = notificationManager;
