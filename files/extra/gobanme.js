//gobanme injects a window.banano that has many useful features for gobanme browser extension users

if (window.banano) {
  document.getElementById("gobanme-request-address").style.display = "block";
  document.getElementsByClassName("form-label")[0].style.marginBottom = "15px";
}

function requestAddress() {
  window.banano.request_address();
}

window.addEventListener("message", function(e) {
  if (e.data.type === "banano_link") {
    document.getElementById("address").value e.data.content.address;
  }
});
