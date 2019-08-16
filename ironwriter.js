"use strict";

let isControlPressed = false;

window.addEventListener("load", handleInit);

function handleInit() {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let submitButton = document.getElementById("submit-log");
    submitButton.addEventListener("click", handleSubmitLog);

    let progressTracks = document.querySelectorAll(".progress-track");
    for (let i = 0; i < progressTracks.length; i++) {
        initProgressTrack(progressTracks[i]);
    }

    
    initExperience();
}

function initExperience() {
    const MAX_EXPERIENCE = 30;
    let experience = document.getElementById("experience");
    let template = experience.querySelector(".dot");
    let container = experience.querySelector(".wrapper");
    for (let i = 0; i < MAX_EXPERIENCE - 1; i++) {
        let dot = template.cloneNode(true);
        container.insertBefore(dot, container.lastChild);
    }
}

function initProgressTrack(track) {
    const MAX_PROGRESS = 10;
    let template = track.querySelector(".box");
    let container = track.querySelector(".wrapper");
    for (let i = 0; i < MAX_PROGRESS - 1; i++) {
        let box = template.cloneNode(true);
        container.insertBefore(box, container.lastChild);
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