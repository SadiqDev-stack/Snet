const html = document.documentElement;
const toggleTheme = theme => {
  html.setAttribute("data-theme", theme)
}

const themes = ["light", "default", "normal"]
let themeSelector = 0;

addEventListener("dblclick", () => {
  toggleTheme(themes[themeSelector])
  themeSelector = themeSelector < themes.length ? ++themeSelector : 0
})


const minLength = 5; // for validation
const maxLength = 30;
// retry to fetch after 
retryInterval = 5

const navigationDelay = 0
const navigate = url => {
  setTimeout(() => {
  location.href = url
  }, navigationDelay)
}

const $ = ele => ele.includes('*') ? 
document.querySelectorAll(ele.replace('*','')) :
document.querySelector(ele);
const appname = "S'net";
const url = location.href
const PRODUCTION_URL = "http://localhost:8080";
const VIEW_URL = new URL(url).origin;
const API_BASE_URL = VIEW_URL == "http://localhost:7700" ? PRODUCTION_URL : VIEW_URL

document.title = `${appname} | ${document.title}`
const createEle = (tagName,attribute,text = "") => {
  const ele = document.createElement(tagName);
  const attributes = [];
  ele.className += "HTML_ELEMENT"
  
  for(name in attribute){
    attributes.push({name,value: attribute[name]})
  }
  
  attributes.forEach(attr => {
    ele.setAttribute(attr.name,attr.value)
  })
  
  ele.textContent = text
  
  return ele
}

/* for loader */
const loader = createEle("div",{
  "class": "loader"
});


loader.innerHTML = `
    <img src="./images/logo.png" alt="">
  `

document.body.appendChild(loader);

const loadTimeout = 5;
let loadTimer;
let navigationFreezed = false;

const load = (state,cb) => {
  loader.style.display = state ? "flex" : "none";
  navigationFreezed = state;
  
  clearTimeout(loadTimer)
  if(state){
    loadTimer = setTimeout(() => {
      alert('Operation Time Out', false);
      load(false);
      cb()
    }, loadTimeout * 1000)
  }
}

// for popup
const alertDelay = 3; // seconds
const alertBox = createEle("div",{
  "class": "alertBox"
});

let popupTimer;
const showAlert = (message, good = true) => {
  
  alertBox.textContent = message;
  alertBox.style.background = good ? "var(--popup-bg)" : "var(--red-bg)"
  alertBox.style.animationName = "showAlert";
  clearTimeout(popupTimer)
  alertTimer = setTimeout(() => {
    alertBox.style.animationName = "hideAlert"
  }, alertDelay * 1000)
}
 

document.body.appendChild(alertBox);
alert = showAlert // we need this not alert

 const clear = element => element.innerHTML = ""
 


const getData = key => {
  let data = localStorage.getItem(key)
  try{
    return JSON.parse(data)
  }catch(er){
    return data || false
  }
}


const setData = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value)) || false
}

const deleteData = key => localStorage.removeItem(key)


 const open = (ele, display = "block") => {
   if(!ele) return
   //ele.style.opacity = 1
   ele.style.display = display;
   ele.style.zIndex = 5;
   ele.style.pointerEvents = "visiblePainted"
 }
 
 const close = ele => {
   if(!ele) return
  // ele.style.opacity = 0;
   ele.style.zIndex = -1;
   ele.style.pointerEvents = "none"
 }
 
 const now = () => Date.now()

const copy = (t, c) => {
  navigator.clipboard.writeText(t)
  .then(() => c(true))
  .catch(() => c(false))
}

const onLongPress = (ele, callback, eventCb = () => null, delay = .2) => {
  let timer;

   let touchend = () => clearTimeout(timer);
   let touchstart = e => {
    timer = setTimeout(() => callback(e), delay * 1000);
    ele.addEventListener('touchend', touchend)
    }
    
   let touchmove = () => clearTimeout(timer)
  
  
  ele.addEventListener("touchstart", touchstart)
  ele.addEventListener("touchmove", touchmove);
  
  eventCb({touchstart, touchend, touchmove})
}


const setContent = (ele, content, selector) => {
  let element;
  if(selector){
   element = selector.includes('*') ?
   ele.querySelectorAll(selector.replace('*', '')) : ele.querySelector(selector);
  }else{
    element = ele
  }
  
  element.textContent = content
}

const onInput = (input, callback) => {
  window.addEventListener('pageshow', function(event) {
    callback(input.value)
});

  input.oninput = () => {
    callback(input.value)
  }
}


function scrollTo(targetElement, parentElement) {
  targetElement.scrollIntoView({
    block: 'center',
    behavior: 'instant'
  });
}


const removeEleById = id => {
  const ele = document.getElementById(id)
  ele.remove()
}


const userData = getData("userData");
let [token, username, userId] = [,,];
if(userData){
  token = userData.token;
  username = userData.username;
  userId = userData.id
}


const eraseAppData = () => {
  deleteData("userData");
  deleteData("draftMessages");
  deleteData("messagesToSee");
  deleteData("chats")
}

const logout = () => {
  load(true)
  eraseAppData();
  navigate("/home.html")
}


// for confirmation


const confirmationWrapper = createEle("div",{
  "class": "confirmationWrapper"
});

confirmationWrapper.innerHTML = `
  <div class="confirmBox">
  <div class="title">Are You Sure</div>
  <div class="message">Are you sure you want to send 1gb data to 08145742404 at ₦125 </div>
     <div class="actions">
    <button>Yes</button>
    <button class="no">No</button>
  </div>
</div>
 `;
document.body.appendChild(confirmationWrapper)

const [confirmTitle,confirmMessage,confirmActions]
= $('*.confirmBox *');

const confirmation = (message = "This Is Confirm Message",callback = () => null,title = "Are You Sure") => {
  confirmationWrapper.style.display = "flex"
  confirmTitle.textContent = title;
  confirmMessage.textContent = message;
  if(isSpas){
    onBack = () => {
      close(confirmationWrapper)
      return false
    }
  }
  [...confirmActions.children].forEach(confirmBtn => {
    confirmBtn.onclick = e => {
    onBack = () => true
    callback(confirmBtn.textContent.toLowerCase() == "yes");
    confirmationWrapper.style.display = "none"
    }
  })
}




/**
 * Draws a pie chart 
 * @param {data} - data to present
**/
 
function drawPieChart(data) {
  const canvas = createEle("canvas");
  const ctx = canvas.getContext('2d');
  const labels = Object.keys(data);
  const values = Object.values(data);
  const backgroundColors = [];
  const borderColors = [];
  
  // Generate random colors for each segment
  for (let i = 0; i < labels.length; i++) {
    backgroundColors.push(`rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 0.7)`);
    borderColors.push(`rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 1)`);
  }
  
  // Check if all values are zero
  if (values.every(value => value === 0)) {
    // Assign equal values to each segment
    const equalValue = 1 / labels.length;
    const chartData = labels.map(() => equalValue);
    
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          label: 'Data Distribution',
          data: chartData,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: (tooltipItem) => {
                return `${tooltipItem.label}: Equal`;
              }
            }
          },
          legend: {
            display: true
          }
        }
      }
    });
  } else {
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          label: 'Data Distribution',
          data: values,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: (tooltipItem) => {
                const value = tooltipItem.formattedValue;
                const percentage = ((value / values.reduce((a, b) => a + b, 0)) * 100).toFixed(2);
                return `${tooltipItem.label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }
  
  return canvas;
}

// for stat 
function stat(statData){
  const canvas = drawPieChart(statData);
  const statEle = createEle("div", {
    "class": "stat"
  })
  
  statEle.appendChild(canvas)
  
  for(data in statData){
    statEle.appendChild(createEle("span", {}, `${data.toLowerCase()}: ${statData[data]}` ))
  }
  
  return statEle
}


const popBox = createEle("div", {
  "class": "popup"
})

let popTimer;
let popDelay = 2

const popup = (message, good = true) => {
  popBox.textContent = message;
  popBox.style.animationName = "popin";
  popBox.style.background = good ? "lightblue" : "red"
  clearTimeout(popTimer)
  popTimer = setTimeout(() => {
    popBox.style.animationName = "popout"
  }, popDelay * 1000)
}

function decodeJWT(token, cb) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decodedData = JSON.parse(atob(base64));
    cb(decodedData);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    cb(false)
  }
}


function formatTime(timestamp) {
  const date = new Date(parseInt(timestamp));
  const now = new Date();
  
  // Calculate time difference
  const diffSeconds = Math.floor((now - date) / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  
  // Check if the date is today
  if (date.toDateString() === now.toDateString()) {
    if (diffMinutes < 1) return 'Now';
    if (diffMinutes < 60) return `${diffMinutes}min`;
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours < 12 ? 'am' : 'pm';
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    return `${formattedHours}:${formattedMinutes}${period}`;
  }
  
  // Check if the date is within the same week
  if (diffDays < 7) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }
  
  // Format date as day/month/year with time
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours < 12 ? 'am' : 'pm';
  const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
  const formattedMinutes = minutes.toString().padStart(2, '0');
  return `${day}/${month}/${year} ${formattedHours}:${formattedMinutes}${period}`;
}

// for checking input static val changes eg in settings 
const inputHasChanged = (input, staticAtrr = "staticVal") => {
  const staticVal = input.getAttribute(staticAtrr);
  return (input.value && input.value !== staticVal)
}

hasChanged = (val1, val2) => (val1 !== val2)

// for select etc 
const onChange = (input, cb) => {
  input.addEventListener("change", () => {
    cb(input.value)
  })
}

/* for navigation in spas */
let bars = [];
let lastBar = {
  _id: "lastBarRandom",
  bar: false
};
let isSpas = false;
let mainBar;

const openBar = (bar,display = "flex") => {
  if(lastBar._id !== bar._id){
  open(bar, display)
  bars.push({bar, display});
  lastBar = {bar, display}
  }
  
}

const closeBar = (bar) => {
    close(bar)
}


let canGoBack = true;
let onBack = false;
 window.onpopstate = e => {
   if(isSpas){
   e.preventDefault()
   history.forward(1);
   if(onBack) canGoBack = onBack()
   if(history.state == "last" && !navigationFreezed){
   if(canGoBack && bars.length !== 1){
    const toOpen = bars.at(-2);
    close(lastBar.bar, lastBar.display)
    open(toOpen.bar, toOpen.display);
    
    if(toOpen.bar._id == mainBar._id && focusedChat){
      focusedChat = ""
    }
    
    lastBar = toOpen;
    bars.pop()
   }
   
   onBack = false;
   canGoBack = true;
   }
   }
 }
 
 // when page resfresh reset everybar 
 onload = () => {
   if(isSpas){
   bars = [];
   openBar(mainBar)
   history.pushState('last', null, url)
   }
 }
 


const maxImageSize = 2; // in mb
const allowedImageTypes = ["img/png", "img/jpg", "img/jpeg"]



const scroll = ele => {
  ele.scrollTop = ele.scrollHeight
}



const delay = (ms) => new Promise(res => setTimeout(res, ms));
let TOKEN = token || false;

const request = {
  setToken(t) {
    TOKEN = t;
  }
};

["get", "post", "put", "delete"].forEach((method) => {
  request[method] = async (endpoint, dataOrOptions = {}, maybeOptions = {}) => {
    const isGet = method === "get";
    const data = isGet ? null : dataOrOptions;
    const options = isGet ? dataOrOptions : maybeOptions;

    let {
      headers = {},
      params = {},
      retries = 1,
      onUploadProgress,
      onDownloadProgress,
      onFinish,
      onError,
    } = options;
    

    const url = `${API_BASE_URL}${endpoint}`;
    let attempts = 0;

    while (attempts < retries) {
      try {
        const res = await axios({
          method,
          url,
          data,
          params,
          headers: {
            ...(TOKEN ? { token: TOKEN } : {}),
            ...headers,
          },
          onUploadProgress: onUploadProgress
            ? (pg) => {
                const percent = Math.floor((pg.loaded / pg.total) * 100);
                onUploadProgress(percent);
              }
            : undefined,
          onDownloadProgress: onDownloadProgress
            ? (pg) => {
                const percent = Math.floor((pg.loaded / pg.total) * 100);
                onDownloadProgress(percent);
              }
            : undefined
        });

        const body = res.data;

        if (!body || body.error) {
          const msg = body?.message || "Something went wrong";
          if (onError) onError(msg);
          if(!onError) alert(msg, false);
          throw new Error(msg);
        }

        return body;
      } catch (err) {
        attempts++;
        if (attempts >= retries) {
          const msg = err.message || "Network or Server Error";
          if (onError) onError(msg);
          if(!onError) alert(msg, false);
        }
        await delay(100);
      } finally {
        if (onFinish) onFinish();
        else load(false);
      }
    }
  };
});



// for socket io 
const listenSocket = (name, cb, ackCb = false) => {
  socket.on(name, (data, ack) => {
    console.log(data)
    if(!data && !name.includes("connect")) return 
    cb(data)
    if(ackCb && ack){
      ack(ackCb())
    }
  })
}

const emitSocket = (name, data, cb, alerting = false) => {
  socket.emit(name, data, (status, ...data) => {
    if(!status && alerting){
      alert(data, success)
      return
    } 
    if(cb) cb(...data)
  })
}



class OnScrollEnd {
  constructor(div, end = "bottom", loader = true, callback) {
    if (!div || typeof callback !== 'function') return;

    this.div = div;
    this.end = end;
    this.loader = loader;
    this.callback = callback;

    this.triggered = false;

    if (this.loader) {
      this.loadingSpinner = document.createElement("div");
      this.loadingSpinner.className = "loading-spinner";
      this.loadingSpinner.style.display = "none";
      this.loadingSpinner.innerHTML = `<span>Loading...</span> <div class="spinner"></div>`;
      if (end === "bottom") div.appendChild(this.loadingSpinner);
      else if (end === "top") div.prepend(this.loadingSpinner, div.firstChild);
    }

    this.handler = this.handler.bind(this);
    div.addEventListener("scroll", this.handler);
  }

  async handler() {
    if (this.triggered) return;

    let atEnd = false;
    const div = this.div;

    switch (this.end) {
      case "bottom":
        atEnd = div.scrollTop + div.clientHeight >= div.scrollHeight - 5;
        break;
      case "top":
        atEnd = div.scrollTop <= 5;
        break;
      case "right":
        atEnd = div.scrollLeft + div.clientWidth >= div.scrollWidth - 5;
        break;
      case "left":
        atEnd = div.scrollLeft <= 5;
        break;
    }

    if (atEnd) {
      this.triggered = true;
      if (this.loader && this.loadingSpinner) this.loadingSpinner.style.display = "flex";

      await this.callback(this); // pass `this` to callback

      if (this.loader && this.loadingSpinner) this.loadingSpinner.style.display = "none";

      // Wait for user to scroll away before re-triggering
      setTimeout(() => this._waitForScrollAway(), 100);
    }
  }

  _waitForScrollAway() {
    const div = this.div;
    const check = () => {
      let movedAway = false;
      switch (this.end) {
        case "bottom":
          movedAway = div.scrollTop + div.clientHeight < div.scrollHeight - 10;
          break;
        case "top":
          movedAway = div.scrollTop > 0
          break;
        case "right":
          movedAway = div.scrollLeft + div.clientWidth < div.scrollWidth - 10;
          break;
        case "left":
          movedAway = div.scrollLeft > 30;
          break;
      }

      if (movedAway) {
        this.triggered = false;
      } else {
        requestAnimationFrame(check);
      }
    };
    check();
  }

  show() {
    if (this.loader && this.loadingSpinner) this.loadingSpinner.style.display = "flex";
  }

  hide() {
    if (this.loader && this.loadingSpinner) this.loadingSpinner.style.display = "none";
  }

  destroy() {
    this.div.removeEventListener("scroll", this.handler);
  }
}



function formatSeconds(seconds) {
  if(isNaN(seconds)) return "00:00"
  seconds = Math.floor(seconds); // round down for display

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  // Less than 60 seconds
  if (seconds < 60) {
    return `${secs.toFixed(1)} S`;
  }

  // Less than 1 hour
  if (seconds < 3600) {
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}M`;
  }

  // 1 hour or more
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} H`;
}


let oldThumbnailUrl;
function captureThumbnail(video, time = .5, returnType = 'url') {
  //URL.revokeObjectURL(oldThumbnailUrl)
  return new Promise((resolve, reject) => {
    video.currentTime = time;
    video.addEventListener('seeked', () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      if (returnType === 'url') {
        const thumbnailUrl = canvas.toDataURL();
        oldThumbnailUrl = thumbnailUrl
        resolve(thumbnailUrl);
        console.log("captured")
      } else if (returnType === 'blob') {
        canvas.toBlob((blob) => {
          resolve(blob);
        });
      } else {
        reject(new Error('Invalid return type. Use "url" or "blob".'));
      }
    }, { once: true });
    
    video.addEventListener('error', () => {
      reject(new Error('Failed to seek to the specified time.'));
    }, { once: true });
  });
}

function randomGradient() {
  const gradients = [
    ['#ff9a9e', '#fad0c4'],
    ['#a18cd1', '#fbc2eb'],
    ['#fbc2eb', '#a6c1ee'],
    ['#fad0c4', '#ffd1ff'],
    ['#ffecd2', '#fcb69f'],
    ['#ffdde1', '#ee9ca7'],
    ['#d4fc79', '#96e6a1'],
    ['#a1c4fd', '#c2e9fb'],
    ['#667eea', '#764ba2'],
    ['#89f7fe', '#66a6ff'],
    ['#f77062', '#fe5196'],
    ['#43e97b', '#38f9d7'],
  ];
  const pick = gradients[Math.floor(Math.random() * gradients.length)];
  return `linear-gradient(135deg, ${pick[0]}, ${pick[1]})`;
}



async function getFileMetadata(file, other = { buffer: false, blob: false }) {
    const name = file.name || '';
    const extension = name.split('.').pop()?.toLowerCase() || '';
    const mime = file.type || '';

    let fileTypeCategory;

    if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(extension) || mime.includes("application/x-msdos-program")) {
        fileTypeCategory = 'audio';
    } else if (mime.startsWith('video/') || ['mp4', 'mkv', 'mov', 'avi', 'webm'].includes(extension)) {
        fileTypeCategory = 'video';
    } else if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) {
        fileTypeCategory = 'image';
    } else {
        fileTypeCategory = 'raw';
    }

    if (other.buffer || other.blob) {
        const buffer = await file.arrayBuffer();
        if (other.buffer) other.buffer = buffer;
        if (other.blob) other.blob = new Blob([buffer], { type: mime || 'application/octet-stream' });
    }

    return {
        name,
        extension,
        mime,
        _id: Date.now(),
        type: fileTypeCategory,
        size: file.size / (1024 * 1024), // MB
        lastModified: file.lastModified,
        lastModifiedDate: file.lastModifiedDate,
        ...other
    };
}


const getClickedX = (ele, x) => {
  const rect = ele.getBoundingClientRect();
  let position;
  let quota = rect.width / 4;
  const relativeX = x - rect.left; // Calculate the relative x-coordinate
  
  if (relativeX >= quota && relativeX <= rect.width - quota) {
    position = "center";
  } else if (relativeX <= quota) {
    position = "left";
  } else if (relativeX >= rect.width - quota) {
    position = "right";
  } else {
    position = "unknown"; // This case should not occur
  }
  
    return position;
};
        
        
        
// for worker 
const worker = new Worker("/worker.js")