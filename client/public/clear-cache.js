// Clear cache and reload
console.log("Clearing browser cache...");

// Clear localStorage
localStorage.clear();

// Clear sessionStorage
sessionStorage.clear();

// Clear service worker cache if present
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}

// Clear browser cache programmatically
if ("caches" in window) {
  caches.keys().then(function (names) {
    for (let name of names) {
      caches.delete(name);
    }
  });
}

console.log("Cache cleared, reloading...");
setTimeout(() => {
  window.location.reload(true);
}, 1000);
