// Show App Lock (index.html from the helper on this PC) if the helper is running, otherwise explain how to set it up.
var HELPER = "http://localhost:8765";
fetch(HELPER + "/api/state", { headers: { "X-AppLock": "1" } })
  .then(function (r) {
    if (!r.ok) throw new Error("helper refused");
    var frame = document.getElementById("app");
    frame.src = HELPER + "/#popup";
    frame.hidden = false;
  })
  .catch(function () { document.getElementById("offline").hidden = false; });
