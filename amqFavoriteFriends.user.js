// ==UserScript==
// @name         AMQ Favorite Friends
// @namespace    https://github.com/Mxyuki/AMQ-Scripts
// @version      1.5.2
// @description  Move your favorite friends to the top of the list and get notified when they log in/out
// @author       Mxyuki & kempanator
// @match        https://*.animemusicquiz.com/*
// @grant        none
// @require      https://github.com/joske2865/AMQ-Scripts/raw/master/common/amqScriptInfo.js
// @downloadURL  https://github.com/Mxyuki/AMQ-Scripts/raw/main/amqFavoriteFriends.user.js
// @updateURL    https://github.com/Mxyuki/AMQ-Scripts/raw/main/amqFavoriteFriends.user.js
// ==/UserScript==

if (document.getElementById("loginPage")) return;
let loadInterval = setInterval(() => {
    if (document.getElementById("loadingScreen").classList.contains("hidden")) {
        setup();
        clearInterval(loadInterval);
    }
}, 500);

let version = "1.5.2";
// Create modal window
$("#gameContainer").append($(`
    <div class="modal fade" id="friendFavorite" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">×</span>
                    </button>
                    <h2 class="modal-title">Favorite Friends</h2>
                </div>
                <div class="modal-body" style="overflow-y: auto;max-height: calc(100vh - 150px);">
                    <p>
                        Notify when your favorite friends
                        <input id="alertFavoriteLogIn" type="checkbox">
                        <label for="alertFavoriteLogIn">Log In</label>
                        <input id="alertFavoriteLogOut" type="checkbox">
                        <label for="alertFavoriteLogOut">Log Out</label>
                    </p>
                    <p>
                        <input id="onlineColor" type="color">
                        <label for="onlineColor">Online color</label>
                        <input id="offlineColor" type="color">
                        <label for="offlineColor">Offline color</label>
                    </p>
                    <p>Input name (case sensitive)</p>
                    <input id="favoriteTextBox" type="text">
                    <button id="favoriteAdd" class="btn btn-primary">Add</button>
                    <button id="favoriteRemove" class="btn btn-primary">Remove</button>
                    <p><ul id="listOfFavorite"></ul></p>
                </div>
            </div>
        </div>
    </div>
`));

// Add favorite button to settings
$("#optionsContainer > ul").prepend($(`<li class="clickAble" data-toggle="modal" data-target="#friendFavorite">Favorite</li>`));

// Assign variables and set up settings window
let savedData = JSON.parse(localStorage.getItem("favoriteFriends")) || {list: [], alertLogIn: false, alertLogOut: false};
let favoriteList = savedData.list || [];
let alertLogIn = savedData.alertLogIn || false;
let alertLogOut = savedData.alertLogOut || false;
let onlineColor = savedData.onlineColor || "#FAD681";
let offlineColor = savedData.offlineColor || "#CCAD63";
let favoriteInput;
if (alertLogIn) document.querySelector("#alertFavoriteLogIn").checked = true;
if (alertLogOut) document.querySelector("#alertFavoriteLogOut").checked = true;
favoriteList.forEach((friend) => $("#listOfFavorite").append($(`<li>${friend}</li>`)));
document.querySelector("#onlineColor").value = onlineColor;
document.querySelector("#offlineColor").value = offlineColor;

// Add info about the script
AMQ_addScriptData({
    name: "Favorite Friends",
    author: "Mxyuki & kempanator",
    version: version,
    link: "https://github.com/Mxyuki/AMQ-Scripts/raw/main/amqFavoriteFriends.user.js",
    description: `
        <p>This script is made to put your favorite friends at the top of the friend list and highlight them</p>
        <p>--- How to use ---</p>
        <p>Click at the gear at the bottom right of your screen</p>
        <img src="https://i.imgur.com/MdrC5Pu.png">
        <p>Then click the favorite button</p>
        <p>Now just write the name of your friend in the text box and click Add to add him or Remove to remove him</p>
        <p>the player must already be in your friends otherwise it won't show him</p>
        <img src="https://i.imgur.com/YhrzSjN.png">
    `
});

// Add styles
AMQ_addStyle(`
    #friendOnlineList li.favoriteFriend h4 {
        color: ${onlineColor};
    }
    #friendOfflineList li.favoriteFriend h4 {
        color: ${offlineColor};
    }
    #friendFavorite label[for="onlineColor"] {
        margin-right: 20px;
    }
    #friendFavorite .modal-body{
        min-height: 400px;
    }
    #alertFavoriteLogIn, #alertFavoriteLogOut {
        width: 15px;
        height: 15px;
        margin-left: 10px;
    }
    #friendFavorite label {
        margin-left: 2px;
    }
    #favoriteTextBox {
        color: black;
    }
`);

// Add click functions to buttons
$("#favoriteAdd").click(() => {
    let name = $("#favoriteTextBox").val();
    if (name !== "" && !favoriteList.includes(name) && getAllFriends().includes(name)) {
        favoriteList.push(name);
        updateList();
    }
});
$("#favoriteRemove").click(() => {
    let name = $("#favoriteTextBox").val();
    if (name !== "") {
        favoriteList = favoriteList.filter((item) => item !== name);
        updateList();
    }
});
$("#alertFavoriteLogIn").click(() => {
    alertLogIn = !alertLogIn;
    saveSettings();
});
$("#alertFavoriteLogOut").click(() => {
    alertLogOut = !alertLogOut;
    saveSettings();
});
$("#onlineColor").on("change", function() {
    onlineColor = $(this).val();
    AMQ_addStyle(`#friendOnlineList li.favoriteFriend h4 { color: ${onlineColor} }`);
    saveSettings();
});
$("#offlineColor").on("change", function() {
    offlineColor = $(this).val();
    AMQ_addStyle(`#friendOfflineList li.favoriteFriend h4 { color: ${offlineColor} }`);
    saveSettings();
});

// Set up stuff on initial log in
function setup() {
    favoriteInput = new AmqAwesomeplete(document.querySelector("#favoriteTextBox"), {list: getAllFriends(), minChars: 1, maxItems: 8});
    for (let li of document.querySelectorAll("#friendOnlineList li, #friendOfflineList li")) {
        if (favoriteList.includes(li.querySelector("h4").innerText)) {
            li.classList.add("favoriteFriend");
        }
    }
}

// Update favorite list and reload friends list
function updateList() {
    favoriteList.sort((a, b) => a.localeCompare(b));
    saveSettings();
    $("#listOfFavorite").empty();
    favoriteList.forEach((friend) => $("#listOfFavorite").append($(`<li>${friend}</li>`)));
    for (let li of document.querySelectorAll("#friendOnlineList li, #friendOfflineList li")) {
        if (favoriteList.includes(li.querySelector("h4").innerText)) {
            li.classList.add("favoriteFriend");
        }
        else {
            li.classList.remove("favoriteFriend");
        }
    }
    socialTab.updateFriendList(socialTab.onlineFriends, "online", socialTab.$onlineFriendList);
    socialTab.updateFriendList(socialTab.offlineFriends, "offline", socialTab.$offlineFriendList);
}

// Save settings to local storage
function saveSettings() {
    localStorage.setItem("favoriteFriends", JSON.stringify({
        list: favoriteList,
        alertLogIn: alertLogIn,
        alertLogOut: alertLogOut,
        onlineColor: onlineColor,
        offlineColor: offlineColor
    }));
}

// Return a list of names of all your friends
function getAllFriends() {
    return Object.keys(socialTab.onlineFriends).concat(Object.keys(socialTab.offlineFriends));
}

// Overload updateFriendList function to move favorite friends to the top of the list
SocialTab.prototype.updateFriendList = function (friendMap, type, $list) {
    let sortedFriends = Object.values(friendMap).sort((a, b) => a.name.localeCompare(b.name));
    let tempFriends = [];
    let tempFavoriteFriends = [];
    sortedFriends.forEach((entry) => { favoriteList.includes(entry.name) ? tempFavoriteFriends.push(entry) : tempFriends.push(entry) });
    sortedFriends = tempFavoriteFriends.concat(tempFriends);
    sortedFriends.forEach((entry, index) => {
        if (entry.inList !== type) {
            entry.inList = type;
            index === 0 ? $list.prepend(entry.$html) : entry.$html.insertAfter(sortedFriends[index - 1].$html);
            entry.updateTextSize();
        }
    });
    sortedFriends.forEach(entry => { entry.checkLazyLoad() });
};

// Listen for favorite friend log in/out
new Listener("friend state change", (payload) => {
    if (((alertLogIn && payload.online) || (alertLogOut && !payload.online)) && favoriteList.includes(payload.name)) {
        popoutMessages.displayStandardMessage("", `${payload.name} is ${payload.online ? "online" : "offline"}`);
    }
}).bindListener();
