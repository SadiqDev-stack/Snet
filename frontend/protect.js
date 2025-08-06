
const dt = JSON.parse(localStorage.getItem("userData"))
if(dt == null){
  location.href = '/home.html'
}else if(!dt.token){
  location.href = "/login.html"
}