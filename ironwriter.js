"use strict";

let stats = {
    edge: 0,
    heart: 0,
    iron: 0,
    shadow: 0,
    wits: 0,
};

let isControlPressed = false;

window.addEventListener("load", handleInit);

function handleInit() {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let submitButton = document.getElementById("submit-log");
    submitButton.addEventListener("click", handleSubmitLog);

    let progressTracks = container.querySelectorAll(".progress-track");
    for (let i = 0; i < progressTracks.length; i++) {
        initProgressTrack(progressTracks[i]);
    }
}

function initProgressTrack(track) {
    let template = track.querySelector(".progress-box");
    let container = track.querySelector(".progress-wrapper");
    for (let i = 0; i < 10; i++) {
        let newBox = template.cloneNode(true);
        container.appendChild(newBox);
    }
}

function handleKeyDown(event) {
    if (event.key == "Control") {
        isControlPressed = true;
    } else if (isControlPressed && event.key == "Enter") {
        handleSubmitLog();
    }
}

function handleKeyUp(event) {
    if (event.key == "Control") {
        isControlPressed = false;
    }
}

function handleSubmitLog() {
    let logElement = document.getElementById("log-content");
    let logContent = logElement.value;
    logElement.value = null;

    let regex = /\[(.*?)\]/;
    let result = logContent.match(regex);
    console.log(result);

    let logTemplate = document.getElementById("log-template");
    let newLog = logTemplate.cloneNode(true);
    newLog.querySelector("#content").innerText = logContent

    let historyElement = document.getElementById("log-history");
    historyElement.appendChild(newLog);

    newLog.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
}

/*
# SYNTAX

## EXAMPLE
"The the highwayman stabs you with his sword [health -1]"

## COMMANDS
experience +1
setname "John Doe"
progress "highwayman"
health +1
spirit -1
momentum reset
supply 1
wounded
!cursed
additem "Great Bow"
additem Arrow 10
roll 2d5+1
oracle region


*/