// adding manifest file

const head = document.querySelector("head");
const manifest = document.createElement("link");
manifest.href = "/manifest.json";
manifest.rel = "manifest"

head.appendChild(manifest);

// registering service worker 
navigator.serviceWorker.register("/sw.js", w => {
  console.log(`service worker registered ${w}`)
})