"use strict";

/*
    IronWriter is an open-source writing tool for solo playthroughs of the free tabletop RPG Ironsworn.
    Copyright (C) 2019 Alex Larioza

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program. If not, see https://github.com/SHiLLySiT/IronWriter/blob/master/LICENSE.txt.
*/

const VERSION = "0.3.1";
const MAX_EXPERIENCE = 30;
const MAX_PROGRESS = 10;

const CHALLENGE_RANKS = {
    troublesome: 12,
    dangerous: 8,
    formidable: 4,
    extreme: 2,
    epic: 1,
};

const STATS = {
    edge: 0,
    heart: 0,
    iron: 0,
    shadow: 0,
    wits: 0,
    health: 0,
    supply: 0,
    spirit: 0,
    momentum: 0,
    momentumMax: 0,
    momentumReset: 0,
    experience: 0,
    experienceSpent: 0,
    bonds: 0,
};

const DEBILITIES = {
    wounded: 0,
    shaken: 0,
    unprepared: 0,
    encumbered: 0,
    maimed: 0,
    corrupted: 0,
    cursed: 0,
    tormented: 0,
};

const SCROLL_EFFECT = { behavior: "smooth", block: "center", inline: "nearest" };

const EventType = {
    None: 'none',
    Fiction: 'fiction',
    Meta: 'meta',
    Roll: 'roll',
}

const BookmarkTypeMapping = {
    'fiction': {iconClass: 'far fa-file-alt', title: "Fiction"},
    'meta': {iconClass: 'fas fa-file-alt', title: "Meta"},
    'bond': {iconClass: 'fas fa-link', title: "Bond"},
    'unbond': {iconClass: 'fas fa-unlink', title: "Unbond"},
    'progress_add': {iconClass: 'far fa-star', title: "Started Progress"},
    'progress_progress': {iconClass: 'fas fa-star-half-alt', title: "Made Progress" },
    'progress_complete': {iconClass: 'fas fa-star', title: "Completed Progress"},
}

const BookmarkFilterTypeMapping = {
    /* "all" is implied */
    1: ['bond', 'unbond'],
    2: ['fiction', 'meta'],
    3: ['progress_add', 'progress_progress', 'progress_complete']
};

let statElements = {};
for (let p in STATS) {
    statElements[p] = undefined;
}

let debilityElements = {
    none: undefined,
};
for (let p in DEBILITIES) {
    debilityElements[p] = undefined;
}

let experience = undefined;
let submitButton = undefined;
let cancelButton = undefined;
let saveButton = undefined;
let fictionEventTemplate = undefined;
let metaEventTemplate = undefined;
let entryInput = undefined;
let eventHistory = undefined;
let eventHistoryScrollObserver = undefined;
let progressCard = undefined;
let progressTrackTemplate = undefined;
let bondCard = undefined;
let bondTemplate = undefined;
let characterName = undefined;
let modeSwitch = undefined;
let assetCard = undefined;
let assetTemplate = undefined;
let inventoryCard = undefined;
let inventoryTemplate = undefined;
let confirmDialog = undefined;
let bookmarksDialog = undefined;
let bookmarksFilter = undefined;
let bookmarksFilterIndex = 0;
let bookmarksList = undefined;
let bookmarkTemplate = undefined;

let bondProgressTrack = undefined;
let edittingEvent = null;
let oldEditEventColor = {
    background: "#FF",
    border: "#FF",
};
let oldInput = "";
let oldMode = false;

let scrolledIndex = null;

let session = new Session();

window.addEventListener("load", handleInit);

function handleInit() {
    window.mdc.autoInit();

    // not sure why, but the material component library isn't automatically handling setting the label to the select item...
    let allDropdowns = document.querySelectorAll(".mdc-select");
    for (let i = 0; i < allDropdowns.length; i++) {
        allDropdowns[i].addEventListener("MDCSelect:change", (event) => {
            allDropdowns[i].MDCSelect.selectedText.innerHTML = allDropdowns[i].MDCSelect.menu.items[event.detail.index].innerHTML;
        });
    }

    let rollContainer = document.querySelector(".roll-container");
    rollContainer.style.display = "none";

    let oracleContainer = document.querySelector(".oracle-container");
    oracleContainer.style.display = "none";

    let storyContainer = document.querySelector(".story-container");

    let entryTab = new mdc.tabBar.MDCTabBar(document.getElementById('entry-tabs'));
    entryTab.listen("MDCTabBar:activated", (event) => {
        if (event.detail.index == 0) {
            storyContainer.style.display = "block";
            rollContainer.style.display = "none";
            oracleContainer.style.display = "none";
        } else if (event.detail.index == 1) {
            storyContainer.style.display = "none";
            rollContainer.style.display = "flex";
            oracleContainer.style.display = "none";
        } else if (event.detail.index == 2) {
            storyContainer.style.display = "none";
            rollContainer.style.display = "none";
            oracleContainer.style.display = "flex";
        }

        // dropdown sizes reset when hidden via tab switching
        resizeDropdowns();
    });

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", resizeDropdowns);

    confirmDialog = document.getElementById("confirm-dialog").MDCDialog;

    entryInput = document.getElementById("event-input");

    eventHistory = document.getElementById("event-history");

    fictionEventTemplate = document.getElementById("fiction-event-template");
    fictionEventTemplate.remove();

    metaEventTemplate = document.getElementById("meta-event-template");
    metaEventTemplate.remove();

    characterName = document.getElementById("character-name");

    document.getElementById("import").addEventListener("click", () => {
        let handler = (action) => { 
            confirmDialog.root.removeEventListener("MDCDialog:closed", handler);
            if (action.detail.action == "accept") {
                importSession();
            }
        };
        confirmDialog.root.addEventListener("MDCDialog:closed", handler);
        confirmDialog.content_.textContent = "Are you sure you want to import a session? Your current session will be lost.";
        confirmDialog.open();
    });

    document.getElementById("export").addEventListener("click", () => {
        exportSession();
    });

    document.getElementById("new").addEventListener("click", () => {
        let handler = (action) => { 
            confirmDialog.root.removeEventListener("MDCDialog:closed", handler);
            if (action.detail.action == "accept") {
                newSession();
            }
        };
        confirmDialog.root.addEventListener("MDCDialog:closed", handler);
        confirmDialog.content_.textContent = "Are you sure you want to start a new session? Your current session will be deleted.";
        confirmDialog.open();
    });

    document.getElementById("help").addEventListener("click", () => {
        window.open("https://github.com/SHiLLySiT/IronWriter/blob/master/readme.md");
    });

    modeSwitch = document.getElementById("mode-switch").MDCIconButtonToggle;

    document.getElementById("version").textContent = "v" + VERSION;

    submitButton = document.getElementById("submit-event");
    submitButton.addEventListener("click", handleSubmitEvent);

    cancelButton = document.getElementById("cancel-event");
    cancelButton.addEventListener("click", handleCancelEditEvent);
    cancelButton.style.display = "none";

    saveButton = document.getElementById("save-event");
    saveButton.addEventListener("click", handleSaveEditEvent);
    saveButton.style.display = "none";

    initProgressTrack();
    initExperience();
    initDebilities();
    initStats();
    initBonds();
    initRoll();
    initOracle();
    initAssets();
    initInventory();
    initBookmarks();

    window.requestAnimationFrame(() => {
        let str = localStorage.getItem("session");
        if (str === undefined || str === null) {
            newSession();
            refresh();
        } else {
            loadSession(str);
        }

        document.getElementById("page-container").style.display = "flex";

        let events = eventHistory.querySelectorAll("#event-history .event-base");
        if (events.length > 0) {
            let lastEvent = events[events.length - 1];
            lastEvent.scrollIntoView(SCROLL_EFFECT);
        }
    });    
}

function newSession() {
    session = new Session();
    
    let initialMoment = new Moment("", EventType.None);
    initialMoment.addAction(new CharacterNameAction("New Character"));
    initialMoment.addAction(new StatAction("momentum", "=", 2));
    initialMoment.addAction(new StatAction("momentumReset", "=", 2));
    initialMoment.addAction(new StatAction("momentumMax", "=", 10));
    initialMoment.addAction(new StatAction("health", "=", 5));
    initialMoment.addAction(new StatAction("supply", "=", 5));
    initialMoment.addAction(new StatAction("spirit", "=", 5));
    initialMoment.addAction(new StatAction("spirit", "=", 5));
    session.addMoment(initialMoment);

    saveSession();
    clearEventHistory();
    refresh();
}

function importSession() {
    let linkElement = document.createElement("input");
    linkElement.setAttribute("type", "file");
    linkElement.addEventListener("change", () => {
        let file = event.target.files[0];
        var reader = new FileReader();
        reader.addEventListener("load", () => {
            newSession();
            loadSession(reader.result); 
            saveSession();
        });
        reader.readAsText(file);
    });
    linkElement.click();
}

function exportSession() {
    let str = JSON.stringify(session);
    let uri = "data:application/json;charset=utf-8,"+ encodeURIComponent(str);

    let exportFileDefaultName = session.state.characterName + ".json";

    let linkElement = document.createElement("a");
    linkElement.setAttribute("href", uri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
}

function saveSession() {
    let str = JSON.stringify(session);
    localStorage.setItem("session", str);
}

function loadSession(str) {
    let json = JSON.parse(str);
    session = _.merge(new Session, json);
    for (let i = 0; i < session.history.length; i++) {
        session.history[i] = _.merge(new Moment, session.history[i]);
        for (let j = 0; j < session.history[i].actions.length; j++) {
            let type = session.history[i].actions[j].type;
            if (ACTION_TYPES[type] === undefined) { continue; }
            session.history[i].actions[j] = _.merge(new ACTION_TYPES[type], session.history[i].actions[j]);
        }
    }

    for (let i = 0; i < session.history.length; i++) {
        let moment = session.history[i];
        if (moment.type == EventType.None) {
            continue;
        }
        addEvent(i, moment.input, moment.type);
    }
    refresh();
}

function initAssets() {
    assetCard = document.getElementById("asset-card");
    assetTemplate = document.getElementById("asset-template");
    assetTemplate.remove();
}

function initInventory() {
    inventoryCard = document.getElementById("inventory-card");
    inventoryTemplate = document.getElementById("inventory-template");
    inventoryTemplate.remove();
}

function initRoll() {
    let rollSource = document.getElementById("roll-source");
    let rollStats = document.getElementById("roll-stats");
    let rollAdd = document.getElementById("roll-add");

    let rollButton = document.getElementById("roll");
    rollButton.addEventListener("click", () => {
        doRoll(rollStats.MDCSelect.value, rollAdd.value, rollSource.MDCSelect.value);
    });
    
    let rollResetButton = document.getElementById("roll-reset");
    rollResetButton.addEventListener("click", () => {
        rollSource.MDCSelect.selectedIndex = 0;
        rollStats.MDCSelect.selectedIndex = -1;
        rollAdd.value = "";
    });
}

function initOracle() {
    let template = document.getElementById("oracle-template");
    let container = template.parentElement;
    template.remove();

    for (let type in ORACLE) {
        let item = template.cloneNode(true);
        item.querySelector(".js-value").textContent = type;
        item.addEventListener("click", () => handleSelectOracle(type));
        container.appendChild(item);
    }
}

function initStats() {
    for (let p in statElements) {
        let container = document.getElementById("stat-" + p);
        if (container === null) {
            delete statElements[p];
            continue;
        }
        statElements[p] = container.querySelector(".stat-value");
    }
}

function initDebilities() {
    for (let p in debilityElements) {
        debilityElements[p] = document.getElementById("debility-" + p);
        debilityElements[p].style.display = "none";
    }
    debilityElements["none"].style.display = "";
}

function initExperience() {
    experience = document.getElementById("experience");
    let template = experience.querySelector(".dot");
    let container = experience.querySelector(".wrapper");
    for (let i = 0; i < MAX_EXPERIENCE - 1; i++) {
        let dot = template.cloneNode(true);
        container.insertBefore(dot, container.lastChild);
    }
}

function initProgressTrack() {
    progressCard = document.getElementById("progress-card");

    progressTrackTemplate = document.getElementById("progress-track-template");
    progressTrackTemplate.remove();

    let boxTemplate = progressTrackTemplate.querySelector(".box");
    let ticks = boxTemplate.querySelectorAll(".tick");
    for (let j = 0; j < ticks.length; j++) {
        ticks[j].style.display = "none";
    }

    let container = progressTrackTemplate.querySelector(".wrapper");
    for (let i = 0; i < MAX_PROGRESS - 1; i++) {
        let box = boxTemplate.cloneNode(true);
        container.insertBefore(box, container.lastChild);
    }
}

function initBonds() {
    bondCard = document.getElementById("bond-card")
    let bondContainer = bondCard.querySelector(".track-container");
    bondProgressTrack = createProgressTrack(null, null, false);
    bondContainer.append(bondProgressTrack);

    bondTemplate = document.getElementById("bond-template");
    bondTemplate.remove();
}

function initBookmarks() {
    bookmarksDialog = document.getElementById("bookmarks-dialog").MDCDialog;
    bookmarksFilter = document.getElementById("bookmarks-filter").MDCTabBar;
    bookmarksList = document.getElementById("bookmarks-list").MDCList;
    bookmarkTemplate = document.getElementById('bookmark-template');
    bookmarkTemplate.remove();

    eventHistoryScrollObserver = new IntersectionObserver(handleEventHistoryScroll, {root: eventHistory, threshold: 1.0});

    bookmarksFilter.listen("MDCTabBar:activated", (event) => {
        bookmarksFilterIndex = event.detail.index;
        refreshBookmarksList(bookmarksFilterIndex);
    });

    bookmarksList.root.addEventListener("MDCList:action", (event) => {
        let eventIndex = bookmarksList.listElements[event.detail.index].dataset.eventIndex;
        // While you can pass an object to the `close` call, the docs indicate it should be a string, so...
        bookmarksDialog.close("bookmarkSelected:" + eventIndex);
    });

    document.getElementById("bookmarks").addEventListener("click", () => {
        bookmarksDialog.open();
    });

    bookmarksDialog.listen("MDCDialog:closed", (event) => {
        let [action, index] = event.detail.action.split(':');
        if (index === undefined) { return; }
        let item = eventHistory.querySelector('.mdc-card[data-index="' + index + '"]');
        eventHistoryScrollObserver.observe(item);
        scrolledIndex = index;
        // Timeout needed for Chrome workaround since MDCDialog.close() will cancel all animation frames (and thus the
        // smooth scroll) even at this late stage in its lifecycle.
        setTimeout( (el) => { el.scrollIntoView(SCROLL_EFFECT) }, 0, item);
    });
}


function handleEventHistoryScroll(event) {
    if (scrolledIndex === null || event[0].isIntersecting === false ) { return; }

    let eventElement = event[0].target;
    eventElement.classList.add('bookmark-selected');
    eventElement.focus();
    eventElement.addEventListener('blur', handleEventHistoryBlur);
    eventHistoryScrollObserver.unobserve(eventElement);
    scrolledIndex = null;
}

function handleEventHistoryBlur(event) {
    let el = event.target;
    el.classList.remove('bookmark-selected');
    el.removeEventListener('blur', handleEventHistoryBlur);
}

/**
 * @params {Resource} resource
 */
function createResource(resource, template) {
    let newResource = template.cloneNode(true);

    newResource.querySelector(".name").textContent = resource.name;

    let properties = newResource.querySelector(".properties");
    for (let p in resource.properties) {
        if (resource.properties[p] === undefined) {
            continue;
        }

        let e = document.createElement("div");
        e.textContent = resource.properties[p].name + ": " + resource.properties[p].value;
        properties.appendChild(e);
    }

    return newResource;
}

/**
 * @param {Asset} asset
 */
function createAsset(asset) {
    let newAsset = createResource(asset, assetTemplate);

    let upgrades = newAsset.querySelector(".upgrades");
    for (let i = 0; i < upgrades.children.length; i++) {
        let empty = upgrades.children[i].querySelector(".empty");
        let filled = upgrades.children[i].querySelector(".filled");
        if (asset.upgrades[i]) {
            empty.style.display = "none";
            filled.style.display = "block";
        } else {
            empty.style.display = "block";
            filled.style.display = "none";
        }
    }

    return newAsset;
}

/**
 * @param {InventoryItem} item
 */
function createInventory(item) {
    return createResource(item, inventoryTemplate);
}

function createProgressTrack(name, rank, roll) {
    let newTrack = progressTrackTemplate.cloneNode(true);
    if (name == null && rank == null) {
        newTrack.querySelector(".meta").remove();
    } else {
        newTrack.querySelector(".name").textContent = name + " (" + rank + ")";
    }
    return newTrack;
}

function updateProgressTrack(track, value) {
    let ticks = track.querySelectorAll(".tick");
    for (let i = 0; i < MAX_PROGRESS * 4; i++) {
        if (i < value) {
            ticks[i].style.display = "block";
        } else {
            ticks[i].style.display = "none";
        }
    }
}

function resizeDropdowns() {
    // update dropdown menu widths
    let menus = document.querySelectorAll(".js-resize-menu");
    for (let i = 0; i < menus.length; i++) {
        let id = menus[i].dataset.selectId;
        let width = document.getElementById(id).offsetWidth;
        menus[i].style.width = width + "px";
    }
}

function handleKeyDown(event) {
    if (event.getModifierState("Control")) {
        if (event.key == "Enter") {
            if (edittingEvent == null) {
                handleSubmitEvent();
            } else {
                handleSaveEditEvent();
            }
        } else if (event.key == "m") {
            modeSwitch.on = !modeSwitch.on;
        } 
    }
}

function handleSelectOracle(type) {
    let input = doOracleRoll(type);
    addEvent(session.history.length, input, EventType.Roll);

    let moment = new Moment(input, EventType.Roll);
    moment.addAction(new OracleAction(type));
    session.addMoment(moment);
    saveSession();
}
function doOracleRoll(type) {
    let result = getOracleValue(ORACLE[type]);
    return "Ask the Oracle (" + type + "): " + result;
}
function getOracleValue(value) {
    if (typeof (value) == "string") {
        return value;
    } else if (Array.isArray(value)) {
        let result = getOracleValue(value[0]);
        for (let i = 1; i < value.length; i++) {
            result += getOracleValue(value[i]);
        }
        return result;
    }

    let die = new rpgDiceRoller.DiceRoll("1d100");
    let dieValue = die.rolls[0][0];
    if (value[dieValue] === undefined) {
        for (let p in value) {
            if (dieValue < p) {
                return getOracleValue(value[p]);
            }
        }
    }
    return getOracleValue(value[dieValue]);
}

function doRoll(statAdd, genericAdd, source) {
    let moment = new Moment("", EventType.Roll);
    moment.addAction(new RollAction(statAdd, genericAdd, source));
    session.addMoment(moment);
    addEvent(session.history.length - 1, moment.input, EventType.Roll);
    saveSession();
}

function handleSubmitEvent() {
    let input = entryInput.value;
    let type = (modeSwitch.on) ? EventType.Meta : EventType.Fiction
    let newEvent = addEvent(session.history.length, input, type);

    let moment = createMoment(input, type, session.history.length);
    session.addMoment(moment);

    entryInput.value = null;
    saveSession();
    refresh();
}

function createEvent(content, type) {
    let newEvent = undefined;
    if (type == EventType.Meta) {
        newEvent = metaEventTemplate.cloneNode(true);
        newEvent.querySelector(".edit").addEventListener("click", () => handleEditEvent(newEvent));
        newEvent.querySelector(".reroll").remove();
    } else if (type == EventType.Roll) {
        newEvent = metaEventTemplate.cloneNode(true);
        newEvent.querySelector(".reroll").addEventListener("click", () => handleRerollEvent(newEvent));
        newEvent.querySelector(".edit").remove();
    } else if (type == EventType.Fiction) {
        newEvent = fictionEventTemplate.cloneNode(true);
        newEvent.querySelector(".edit").addEventListener("click", () => handleEditEvent(newEvent));
    } else {
        console.error(type + " not implemented!");
        return;
    }
    delete newEvent.id;
    newEvent.querySelector(".delete").addEventListener("click", () => handleDeleteEvent(newEvent));
    newEvent.querySelector(".content").innerText = content;
    return newEvent;
}

function addEvent(index, input, type) {
    let newEvent = createEvent(input, type);
    newEvent.dataset.index = index;
    eventHistory.appendChild(newEvent);
    newEvent.scrollIntoView(SCROLL_EFFECT);
}

function handleRerollEvent(eventElement) {
    let moment = session.history[eventElement.dataset.index];
    let action = moment.actions[0];
    if (action instanceof RollAction) {
        action.reroll();
        action.applyAction(session.state, moment);
    } else if (action instanceof OracleAction) {
        moment.input = doOracleRoll(action.oracleType);
    } else {
        console.log("Unable to reroll " + typeof(action));
    }
    eventElement.querySelector(".content").innerText = moment.input;
}

function handleEditEvent(eventElement) {
    submitButton.style.display = "none";
    saveButton.style.display = "inline";
    cancelButton.style.display = "inline";

    if (edittingEvent == null) {
        oldInput = entryInput.value;
        oldMode = modeSwitch.on;
    } else {
        edittingEvent.style.backgroundColor = oldEditEventColor.background;
        edittingEvent.style.borderColor = oldEditEventColor.border;
    }
    edittingEvent = eventElement;
    oldEditEventColor.background = eventElement.style.backgroundColor;
    oldEditEventColor.border = eventElement.style.borderColor;
    eventElement.style.backgroundColor = "var(--mdc-theme-primary-light, #ff0000)";
    eventElement.style.borderColor = "var(--mdc-theme-primary-light, #ff0000)";

    let moment = session.history[edittingEvent.dataset.index];
    entryInput.value = moment.input;
    modeSwitch.on = (moment.type == EventType.Meta);

    eventElement.scrollIntoView(SCROLL_EFFECT);
}

function handleCancelEditEvent() {
    submitButton.style.display = "block";
    saveButton.style.display = "none";
    cancelButton.style.display = "none";
    edittingEvent.style.backgroundColor = oldEditEventColor.background;
    edittingEvent.style.borderColor = oldEditEventColor.border;

    edittingEvent = null;
    entryInput.value = oldInput;
    modeSwitch.on = oldMode;
}

function handleSaveEditEvent() {
    submitButton.style.display = "block";
    saveButton.style.display = "none";
    cancelButton.style.display = "none";
    edittingEvent.style.backgroundColor = oldEditEventColor.background;
    edittingEvent.style.borderColor = oldEditEventColor.border;

    edittingEvent.querySelector(".content").innerText = entryInput.value;

    session.gotoMoment(edittingEvent.dataset.index - 1);

    let type = (modeSwitch.on) ? EventType.Meta : EventType.Fiction
    let moment = createMoment(entryInput.value, type, edittingEvent.dataset.index);
    session.updateMoment(edittingEvent.dataset.index, moment);
    session.gotoPresentMoment();

    let newEvent = createEvent(entryInput.value, type);
    newEvent.dataset.index = edittingEvent.dataset.index;
    eventHistory.insertBefore(newEvent, edittingEvent);
    edittingEvent.remove();

    saveSession();
    refresh();

    edittingEvent = null;
    entryInput.value = oldInput;
    modeSwitch.on = oldMode;
}

function handleDeleteEvent(eventElement) {
    let handler = (action) => { 
        confirmDialog.root.removeEventListener("MDCDialog:closed", handler);
        if (action.detail.action != "accept") {
            return;
        }
        session.gotoMoment(eventElement.dataset.index - 1);
        session.removeMoment(eventElement.dataset.index);
        session.gotoPresentMoment();

        if (eventElement === edittingEvent) {
            handleCancelEditEvent();
        }

        eventElement.remove();
        let eventElements = eventHistory.querySelectorAll(".event-base");
        for (let i = eventElement.dataset.index - 1; i < eventElements.length; i++) {
            let child = eventElements[i];
            child.dataset.index = i + 1;
        }

        saveSession();
        refresh();
    };
    confirmDialog.root.addEventListener("MDCDialog:closed", handler);
    confirmDialog.content_.textContent = "Are you sure you want to delete this event?";
    confirmDialog.open();
}

function clearEventHistory() {
    let events = eventHistory.querySelectorAll("#event-history .event-base");
    for (let i = 0; i < events.length; i++) {
        events[i].remove();
    }
}

function refresh() {
    // stats
    for (let p in statElements) {
        statElements[p].textContent = session.state.stats[p];
    }

    // experience
    let dots = experience.querySelectorAll(".dot");
    for (let i = 0; i < dots.length; i++) {
        let empty = dots[i].querySelector(".empty");
        let spent = dots[i].querySelector(".spent");
        let available = dots[i].querySelector(".available");

        empty.style.display = "none";
        spent.style.display = "none";
        available.style.display = "none";

        if (i < session.state.stats.experience) {
            if (i < session.state.stats.experienceSpent) {
                available.style.display = "block";
            } else {
                spent.style.display = "block";
            }
        } else {
            empty.style.display = "block";
        }
    }

    // bonds
    updateProgressTrack(bondProgressTrack, session.state.stats.bonds);

    let bondList = bondCard.querySelector(".bond-list");
    let bonds = bondList.querySelectorAll("div");
    for (let i = 0; i < bonds.length; i++) {
        bonds[i].remove();
    }
    for (let p in session.state.bonds) {
        let bond = bondTemplate.cloneNode(true);
        bond.querySelector(".content").textContent = session.state.bonds[p].name;
        bondList.appendChild(bond);
    }

    // progress cards
    let progressList = progressCard.querySelector(".tracks");
    while (progressList.children.length > 0) {
        let last = progressList.children.length - 1;
        progressList.children[last].remove();
    }
    for (let p in session.state.progress) {
        let state = session.state.progress[p];
        if (session.state.progress[p] == undefined) {
            continue;
        }

        if (progressList.children.length > 0) {
            let divider = document.createElement("hr");
            divider.classList.add("card-divider");
            progressList.appendChild(divider);
        }

        let track = createProgressTrack(state.name, state.rank, true);
        updateProgressTrack(track, state.value);
        progressList.appendChild(track);
    }

    // progress sources
    let sourceList = document.getElementById("roll-source-list");
    let sources = sourceList.querySelectorAll("li");
    for (let i = 1; i < sources.length; i++) {
        sources[i].remove();
    }
    for (let p in session.state.progress) {
        if (session.state.progress[p] === undefined) {
            continue;
        }

        let e = document.createElement("li");
        e.classList.add("mdc-list-item")
        e.textContent = session.state.progress[p].name;
        e.dataset.value = p;
        sourceList.appendChild(e);
    }
    let select = document.getElementById("roll-source");
    select.MDCSelect.selectedIndex = 0;

    // debilities
    debilityElements.none.style.display = "";
    for (let p in session.state.debilities) {
        if (session.state.debilities[p]) {
            debilityElements[p].style.display = "";
            debilityElements.none.style.display = "none";
        } else {
            debilityElements[p].style.display = "none";
        }
    }

    // name
    characterName.textContent = session.state.characterName;

    // assets
    let assetList = assetCard.querySelector(".assets");
    while (assetList.children.length > 0) {
        let last = assetList.children.length - 1;
        assetList.children[last].remove();
    }
    for (let p in session.state.assets) {
        let state = session.state.assets[p];
        if (session.state.assets[p] == undefined) {
            continue;
        }

        if (assetList.children.length > 0) {
            let divider = document.createElement("hr");
            divider.classList.add("card-divider");
            assetList.appendChild(divider);
        }

        let asset = createAsset(state);
        assetList.appendChild(asset);
    }

    // inventory items
    let itemList = inventoryCard.querySelector(".items");
    while (itemList.children.length > 0) {
        let last = itemList.children.length - 1;
        itemList.children[last].remove();
    }

    for (let p in session.state.items) {
        let state = session.state.items[p];
        if (session.state.items[p] == undefined) {
            continue;
        }

        if (itemList.children.length > 0) {
            let divider = document.createElement("hr");
            divider.classList.add("card-divider");
            itemList.appendChild(divider);
        }

        let item = createInventory(state);
        itemList.appendChild(item);
    }

    // bookmarks
    refreshBookmarksList(bookmarksFilterIndex);
}

function refreshBookmarksList(filterIdx = 0) {
    // Clear existing list so we always get the freshest bookmarks from the session
    bookmarksList.root.innerHTML = '';
    for (let [index, entryBookmarks] of Object.entries(session.bookmarks)) {
        for(let bookmark of entryBookmarks) {
            if (filterIdx !== 0 && !_.includes(BookmarkFilterTypeMapping[filterIdx], bookmark.type)) { continue; }
            let newBookmark = bookmarkTemplate.cloneNode(true);
            newBookmark.dataset.eventIndex = index; // Needed for the bookmarkList MDC component
            newBookmark.querySelector('.content').textContent = bookmark.name;

            let icon = newBookmark.querySelector('i');
            icon.className = BookmarkTypeMapping[bookmark.type].iconClass;
            icon.title = BookmarkTypeMapping[bookmark.type].title;

            bookmarksList.root.appendChild(newBookmark);
        }
    }
}

function createMoment(input, type, index) {
    index = parseInt(index);
    let moment = new Moment(input, type);
    let result = input.match(/\[(.*?)\]/g);
    let action = undefined;
    if (result != null) {
        for (let i = 0; i < result.length; i++) {
            let args = result[i]
                .replace("[", "")
                .replace("]", "")
                .split(/\s(?=(?:(?:[^"]*"){2})*(?:[^"])*$)/);

            for (let j = 0; j < args.length; j++) {
                args[j] = args[j].replace(/^"(.+(?="$))"$/, '$1');
            };

            // Ignore case for tags
            args[0] = args[0].toLowerCase();

            if (args[0] == "bond") {
                action = addBond(args);
                moment.addAction(action);
            } else if (args[0] == "unbond") {
                action = removeBond(args);
                moment.addAction(action);
            } else if (args[0] == "asset") {
                moment.addAction(updateAsset(args));
            } else if (args[0] == "removeasset") {
                moment.addAction(removeAsset(args));
            } else if (args[0] == "item") {
                moment.addAction(updateInventory(args));
            } else if (args[0] == "removeitem") {
                moment.addAction(removeInventory(args));
            } else if (args[0] == "progress") {
                action = progress(args);
                moment.addAction(action);
            } else if (args[0] == "rename") {
                moment.addAction(renameCharacter(args));
            } else if (args[0] == "is") {
                moment.addAction(addDebility(args));
                moment.addAction(new StatAction("momentumMax", "-", 1));
                moment.addAction(new StatAction("momentumReset", "-", 1));
            } else if (args[0] == "not") {
                moment.addAction(removeDebility(args));
                moment.addAction(new StatAction("momentumMax", "+", 1));
                moment.addAction(new StatAction("momentumReset", "+", 1));
            } else if (args[0] == "bookmark") {
                args[2] = type;
                moment.addAction(addBookmark(args, index));
            } else if (STATS[args[0]] !== undefined) {
                moment.addAction(changeStat(args));
            } else {
                // invalid command
            }

            if (action !== undefined) {
                moment.addAction(addBookmark(action.bookmarkArgs(), index));
            }
        }
    }

    return moment;
}

function updateAsset(args) {
    if (args[1] == undefined) {
        return;
    }

    let id = args[1].toLowerCase();
    let action = new AssetAction(id);
    action.assetName = args[1];

    if (args.length == 2) {
        // no arguments, so just add asset
        action.action = "add";
        return action;
    }

    if (!isNaN(args[2])) {
        // first argument is a number, assume this is an upgrade
        action.action = "upgrade";
        action.upgradeIndex = Number(args[2]) - 1;
        return action;
    }

    action.action = "update";
    action.propertyId = args[2].toLowerCase();
    action.propertyName = args[2];

    action.propertyModifier = "=";
    let value = args[3];
    if (isNaN(value)) {
        action.propertyValue = value;
    } else {
        if (value[0] == "+" || value[0] == "-") {
            action.propertyModifier = value[0];
        }
        action.propertyValue = Math.abs(value);
    }

    return action;
}

function removeAsset(args) {
     if (args[1] == undefined) {
        return;
    }

    let id = args[1].toLowerCase();
    let action = new AssetAction(id);
    action.action = "remove";
    action.assetName = args[1];
    return action;

}

function updateInventory(args) {
    if (args[1] == undefined) {
        return;
    }

    let id = args[1].toLowerCase();
    let action = new InventoryAction(id);
    action.inventoryName = args[1];

    if (args.length == 2) {
        // no arguments, so just add inventory item
        action.action = "add";
        return action;
    }

    if (args.length == 3) {
        // assume last argument is quantity
        args[3] = args[2];
        args[2] = 'Quantity';
    }

    action.action = (session.state.items[id]) ? "update" : "add";
    action.propertyId = args[2].toLowerCase();
    action.propertyName = args[2];

    action.propertyModifier = "=";
    let value = args[3];
    if (isNaN(value)) {    
        action.propertyValue = value;
    } else {
        if (value[0] == "+" || value[0] == "-") {
            action.propertyModifier = value[0];
        }
        action.propertyValue = Math.abs(value);
    }

    return action;
}

function removeInventory(args) {
     if (args[1] == undefined) {
        return;
    }

    let id = args[1].toLowerCase();
    let action = new InventoryAction(id);
    action.action = "remove";
    action.inventoryName = args[1];
    return action;

}

function renameCharacter(args) {
    if (args[1] == undefined) {
        return;
    }

    return new CharacterNameAction(args[1]);
}

function removeDebility(args) {
    if (args[1] == undefined) {
        return;
    }

    let debilityName = args[1].toLowerCase();
    if (DEBILITIES[debilityName] === undefined) {
        return;
    }

    return new DebilityAction(debilityName, false);
}

function addDebility(args) {
    if (args[1] == undefined) {
        return;
    }

    let debilityName = args[1].toLowerCase();
    if (DEBILITIES[debilityName] === undefined) {
        return;
    }

    return new DebilityAction(debilityName, true);
}

function progress(args) {
    if (args[1] == undefined) {
        return;
    }

    let id = args[1].toLowerCase();
    let option = (args[2] === undefined) ? undefined : args[2].toLowerCase();
    let progress = new ProgressAction(id);
    progress.progressName = args[1];

    if (option === undefined) {
        // mark progress
        progress.action = "progress";
    } else if (!isNaN(option)) {
        // mark progress with param
        progress.modifier = "=";
        if (option[0] == "+" || option[0] == "-") {
            progress.modifier = option[0];
        }
        progress.action = "tick";
        progress.value = Math.abs(option);
    } else if (option == "complete") {
        // flag as complete
        progress.action = "complete";
    } else {
        // start new progress
        progress.action = "add";
        progress.rank = option;
    }

    return progress;
}

function removeBond(args) {
    if (args[1] == undefined) {
        return;
    }

    let id = args[1].toLowerCase();
    let bond = new BondAction(id);
    bond.action = "remove";
    bond.bondName = args[1];
    return bond;
}

function addBond(args) {
    if (args[1] == undefined) {
        return;
    }

    let id = args[1].toLowerCase();
    let bond = new BondAction(id);
    bond.action = "add";
    bond.bondName = args[1];
    return bond;
}

function addBookmark(args, index) {
    if (args[1] == undefined) {
        return;
    }
    let bookmark = new BookmarkAction(index, args[0] === 'auto-bookmark');
    bookmark.action = "add";
    bookmark.bookmarkName = args[1];
    bookmark.bookmarkType = (args[2] !== undefined) ? args[2] : "fiction";
    return bookmark;
}

function changeStat(args) {
    if (args[1] == undefined) {
        return;
    }

    let statName = args[0];
    let value = Math.abs(args[1]);
    let modifier = "=";
    if (args[1][0] == "+" || args[1][0] == "-") {
        modifier = args[1][0];
    }

    return new StatAction(statName, modifier, value);
}
