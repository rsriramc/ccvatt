// Javascript file that renders the sessions and stores only the changes that have occured

let count = 0;
let conStartTime = new Date();

let req_dose = 0;

let interval = -100;

let pincodes = [],
    importantPincodes = [],
    agesToTrack = [];

// Returns the date in DD-MM-YYYY format
const todayDate = () => {
    let today = new Date();
    let date =
        today.getDate() +
        "-" +
        ((today.getMonth() + 1 < 10 ? "0" : "") + (today.getMonth() + 1)) +
        "-" +
        today.getFullYear();
    return date;
};

// Returns the tommorrows date in DD-MM-YYYY format
const tomorrowDate = () => {
    let today = new Date();
    var nextDay = new Date();
    nextDay.setDate(today.getDate() + 1);
    let date =
        nextDay.getDate() +
        "-" +
        ((nextDay.getMonth() + 1 < 10 ? "0" : "") + (nextDay.getMonth() + 1)) +
        "-" +
        nextDay.getFullYear();
    return date;
};

// Identifier for the Light of the conenction status light
let statusLight = ".netStatus .light";
// Identifier for the request count holder
let requestCountHolder = ".requestCount";
// Identifier for the result holder
let resultHolder = ".result";
// Start time holder
let startTimeHolder = ".sessionStart";

// Given all params, returns a string containing template for accordion
const makeAccordion = (
    headingId,
    collapseId,
    parentId,
    heading,
    content,
    defaultCollapsed
) => {
    return `<div class="card">
                <div class="card-header" id="${headingId}">
                    <h5 class="mb-0">
                        <button
                            class="btn ${defaultCollapsed ? " collapsed" : ""}"
                            type="button"
                            data-toggle="collapse"
                            data-target="#${collapseId}"
                            aria-expanded="${!defaultCollapsed}"
                            aria-controls="${collapseId}"
                        >
                            ${heading}
                        </button>
                    </h5>
                </div>
                <div
                    id="${collapseId}"
                    class="collapse ${defaultCollapsed ? "" : "show"}"
                    aria-labelledby="${headingId}"
                    data-parent="#${parentId}"
                >
                    <div class="card-body">${content}</div>
                </div>
            </div>`;
};

const renderResultToScreen = (resultsSet) => {
    let resultsString = "";
    let isLoss = false,
        isGain = false;
    let notifString = JSON.parse(localStorage.getItem("notifications"));
    if (notifString == null) notifString = "";
    let notifTime;

    for (const session in resultsSet) {
        let sessionContent = "";
        let sessionDate = new Date(parseInt(session));

        let sessionHeading = `Tracking session starting at <b> ${sessionDate
            .toLocaleString()
            .toUpperCase()} </b> 
           ${resultsSet[session].count} requests sent
            ${
                parseInt(session) === conStartTime.getTime()
                    ? " <b class='small'>Currently Running session</b> "
                    : ""
            }`;

        for (const pincode in resultsSet[session]) {
            if (pincode === "count") {
                continue;
            }
            sessionContent =
                sessionContent +
                "<h2 class='pincodeName'>Pincode at " +
                pincode +
                "</h2>";

            for (const center in resultsSet[session][pincode]) {
                // console.log(center);
                if (center === "firstTrack") {
                    continue;
                }
                let ageLimit = parseInt(center.split("+")[0]) % 100;
                let vaccineName = center.split("+")[1];
                let centerObj = resultsSet[session][pincode][center];
                sessionContent =
                    sessionContent +
                    `<h2 class='centerName'>
                        Center Name: <b>${centerObj["name"]}</b> @ 
                        ${centerObj["address"]} 
                        <br/>
                        Age Limit: <b>${ageLimit}+</b><br/>
                        Paid or Free: 
                        <b>${centerObj["fee_type"]}</b><br/>
                        Vaccine: 
                        <b>${centerObj["vaccine"]} Dose ${req_dose + 1} </b>
                        Timings:
                        <b>${centerObj["from"]} - ${centerObj["to"]}  </b>
                        Fee: 
                        <b>${centerObj["fee"]} </b>
                    </h2>`;

                let slotsContent = "";
                let prev = -1;
                for (const stamp in centerObj) {
                    if (
                        stamp === "name" ||
                        stamp === "address" ||
                        stamp === "lastTrack" ||
                        stamp === "firstTrack" ||
                        stamp === "vaccine" ||
                        stamp === "from" ||
                        stamp === "to" ||
                        stamp === "fee" ||
                        stamp === "fee_type"
                    ) {
                        continue;
                    }
                    // New centers tracking
                    if (
                        prev === -1 &&
                        importantPincodes.includes(pincode) &&
                        parseInt(session) === conStartTime.getTime() &&
                        agesToTrack.includes(ageLimit)
                    ) {
                        if (
                            centerObj["firstTrack"] ===
                                centerObj["lastTrack"] &&
                            centerObj["firstTrack"] !==
                                resultsSet[session][pincode]["firstTrack"]
                        ) {
                            isGain = true;
                            notifString =
                                "<div class='notifLine brandNew'>New Dose - " +
                                (req_dose + 1) +
                                " center at <b>" +
                                pincode +
                                "</b> " +
                                centerObj["name"] +
                                " <b>" +
                                centerObj["vaccine"] +
                                "</b> " +
                                " <b>" +
                                ageLimit +
                                "+</b> " +
                                " Doses : " +
                                centerObj[stamp][req_dose] +
                                "</div>" +
                                notifString;
                        }
                    }
                    // Tracks that need to be displayed
                    if (
                        prev !== centerObj[stamp][req_dose] ||
                        parseInt(stamp) === centerObj["lastTrack"]
                    ) {
                        let date67 = new Date(parseInt(stamp));
                        slotsContent =
                            "<h2 class='stampName'>Slots at " +
                            date67.toLocaleString().toUpperCase() +
                            "    : " +
                            centerObj[stamp][req_dose] +
                            (parseInt(stamp) === centerObj["lastTrack"]
                                ? " (Last Tracked)"
                                : "") +
                            "</h2>" +
                            slotsContent;
                    }
                    // If this is the last track, analysing if any gains or losses
                    if (
                        parseInt(stamp) === centerObj["lastTrack"] &&
                        importantPincodes.includes(pincode) &&
                        parseInt(session) === conStartTime.getTime() &&
                        agesToTrack.includes(ageLimit)
                    ) {
                        notifTime = new Date(parseInt(stamp));
                        notifTime = notifTime.toLocaleString();
                        if (prev > centerObj[stamp][req_dose]) {
                            isLoss = true;
                            notifString =
                                "<div class='notifLine loss'>Loss in Dose - " +
                                (req_dose + 1) +
                                " occured at <b>" +
                                pincode +
                                "</b> " +
                                centerObj["name"] +
                                " <b>" +
                                centerObj["vaccine"] +
                                "</b> " +
                                " <b>" +
                                ageLimit +
                                "+</b> " +
                                " from " +
                                prev +
                                " to " +
                                centerObj[stamp][req_dose] +
                                "</div>" +
                                notifString;
                        }
                        if (prev < centerObj[stamp][req_dose] && prev !== -1) {
                            isGain = true;
                            notifString =
                                "<div class='notifLine gain'>Gain in Dose - " +
                                (req_dose + 1) +
                                " occured at <b>" +
                                pincode +
                                "</b> " +
                                centerObj["name"] +
                                " <b>" +
                                centerObj["vaccine"] +
                                "</b> " +
                                " <b>" +
                                ageLimit +
                                "+</b> " +
                                " from " +
                                prev +
                                " to " +
                                centerObj[stamp][req_dose] +
                                "</div>" +
                                notifString;
                        }
                        if (prev === -1 && centerObj[stamp][req_dose] > 0) {
                            isGain = true;
                            notifString =
                                "<div class='notifLine new'>Dose - " +
                                (req_dose + 1) +
                                " available at <b>" +
                                pincode +
                                "</b> " +
                                centerObj["name"] +
                                " <b>" +
                                centerObj["vaccine"] +
                                "</b> " +
                                " <b>" +
                                ageLimit +
                                "+</b> " +
                                " Doses: " +
                                centerObj[stamp][req_dose] +
                                "</div>" +
                                notifString;
                        }
                    }
                    prev = centerObj[stamp][req_dose];
                }
                slotsContent =
                    "<h2 class='stampName'><b>CHANGES OBSERVED AT: </b></h2>" +
                    slotsContent;
                sessionContent = sessionContent + slotsContent;
            }
        }

        resultsString =
            makeAccordion(
                "center" + session,
                "centerContent" + session,
                "result",
                sessionHeading,
                sessionContent,
                parseInt(session) !== conStartTime.getTime()
            ) + resultsString;
    }

    if (isGain) {
        let audio = new Audio("./mixkit-correct-answer-reward-952.wav");
        audio.play();
    }

    if (isLoss) {
        setTimeout(() => {
            let audio = new Audio(
                "./mixkit-game-show-wrong-answer-buzz-950.wav"
            );
            audio.play();
        }, 2000);
    }

    if (isGain || isLoss) {
        notifString =
            "<div class='notifTime'>" + notifTime + "</div>" + notifString;
    }

    localStorage.setItem("notifications", JSON.stringify(notifString));
    $("#clearNotif").show();

    if (notifString == "") {
        $("#clearNotif").hide();
        $("#noContentNotif").show();
    } else {
        $("#noContentNotif").hide();
    }

    $("#notifContent").html(notifString);
    $(resultHolder).html(resultsString);
};

// After loading of document
$(document).ready(() => {
    //Changing required visuals
    $(statusLight).css("background-color", "green");

    // Load variables from input bars
    req_dose = $("#dose2").prop("checked") + 0;

    // Load variables from local storage into the code and as well as the input bars
    let resultsSet = JSON.parse(localStorage.getItem("resultsSet"));
    if (resultsSet == null) resultsSet = {};

    $("#track_pins").prop(
        "value",
        JSON.parse(localStorage.getItem("track_pins")) === null
            ? ""
            : JSON.parse(localStorage.getItem("track_pins"))
    );
    $("#notify_pins").prop(
        "value",
        JSON.parse(localStorage.getItem("notify_pins")) === null
            ? ""
            : JSON.parse(localStorage.getItem("notify_pins"))
    );
    $("#track_date").prop(
        "value",
        JSON.parse(localStorage.getItem("track_date")) === null
            ? todayDate().split("-").reverse().join("-")
            : JSON.parse(localStorage.getItem("track_date"))
    );

    // Rendering to the screen
    renderResultToScreen(resultsSet);

    // Ajax related settings
    $.ajax({
        cache: false,
    });

    // *
    // Action event handlers

    // Dose switch
    $("#dose2").change(() => {
        req_dose = $("#dose2").prop("checked") + 0;
        renderResultToScreen(resultsSet);
    });

    $("#clearNotif").click(() => {
        localStorage.setItem("notifications", JSON.stringify(""));
        $("#notifContent").html("");
        $("#noContentNotif").show();
        $("#clearNotif").hide();
    });

    // Button to start tracking
    $("#btnUpdtSearch").click(() => {
        pincodes = $("#track_pins").prop("value").split(",").slice(0, 3);
        importantPincodes = $("#notify_pins")
            .prop("value")
            .split(",")
            .slice(0, 3);
        if ($("#age18").prop("checked")) agesToTrack.push(18);
        if ($("#age45").prop("checked")) agesToTrack.push(45);

        let date = $("#track_date")
            .prop("value")
            .split("-")
            .reverse()
            .join("-");

        // Update connection status
        $("#conStatus").show();
        $(startTimeHolder).html(conStartTime.toLocaleString().toUpperCase());
        $("#pins").html(pincodes.join(", "));
        $("#notif_pins").html(importantPincodes.join(", "));

        localStorage.setItem("track_pins", JSON.stringify(pincodes.join(",")));
        localStorage.setItem(
            "notify_pins",
            JSON.stringify(importantPincodes.join(","))
        );
        localStorage.setItem(
            "track_date",
            JSON.stringify($("#track_date").prop("value"))
        );

        count = 0;
        $(requestCountHolder).html(count);
        conStartTime = new Date();

        resultsSet = JSON.parse(localStorage.getItem("resultsSet"));
        if (resultsSet == null) resultsSet = {};

        if (resultsSet[`${conStartTime.getTime()}`] == null) {
            resultsSet[`${conStartTime.getTime()}`] = {};
            resultsSet[`${conStartTime.getTime()}`]["count"] = 0;
        }
        renderResultToScreen(resultsSet);

        if (interval !== -100) clearInterval(interval);

        interval = setInterval(() => {
            let presentTime = new Date();
            presentTime = presentTime.getTime();
            // console.log(resultsSet[`${conStartTime.getTime()}`]);
            for (let pincode of pincodes) {
                let url = `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByPin?pincode=${pincode}&date=${date}&_=${presentTime}`;

                $.ajax({
                    dataType: "json", // type of response data
                    url: url,
                    method: "GET",
                    cache: false,
                })
                    .done(function (data) {
                        $(statusLight).css("background-color", "green");

                        if (
                            resultsSet[`${conStartTime.getTime()}`][
                                `${pincode}`
                            ] == null
                        ) {
                            resultsSet[`${conStartTime.getTime()}`][
                                `${pincode}`
                            ] = {};
                            resultsSet[`${conStartTime.getTime()}`][
                                `${pincode}`
                            ]["firstTrack"] = presentTime;
                        }

                        for (let session of data["sessions"]) {
                            let center_name =
                                session["center_id"] +
                                "" +
                                session["min_age_limit"] +
                                "+" +
                                session["vaccine"];

                            let centerLevelObj =
                                resultsSet[`${conStartTime.getTime()}`][
                                    `${pincode}`
                                ][center_name];

                            if (centerLevelObj == null) {
                                centerLevelObj = {};
                                centerLevelObj["name"] = session["name"];
                                centerLevelObj["fee_type"] =
                                    session["fee_type"];
                                centerLevelObj["address"] = session["address"];
                                centerLevelObj["firstTrack"] = presentTime;
                            }

                            centerLevelObj["from"] = session["from"];
                            centerLevelObj["to"] = session["to"];
                            centerLevelObj["fee"] = session["fee"];
                            centerLevelObj["vaccine"] = session["vaccine"];
                            centerLevelObj[presentTime] = [];
                            centerLevelObj[presentTime][0] =
                                session["available_capacity_dose1"];
                            centerLevelObj[presentTime][1] =
                                session["available_capacity_dose2"];
                            centerLevelObj["lastTrack"] = presentTime;

                            resultsSet[`${conStartTime.getTime()}`][
                                `${pincode}`
                            ][center_name] = centerLevelObj;
                        }
                        resultsSet[`${conStartTime.getTime()}`]["count"] =
                            ++count;

                        localStorage.setItem(
                            "resultsSet",
                            JSON.stringify(resultsSet)
                        );

                        if (count % pincodes.length == 0) {
                            $(requestCountHolder).html(count);
                            renderResultToScreen(resultsSet);
                        }
                    })
                    .fail(function (XMLHttpRequest, textStatus, errorThrown) {
                        $(statusLight).css("background-color", "red");
                        console.log(XMLHttpRequest);
                    });
            }
        }, 60000);
    });

    // For every 30 seconds (as we are taking three pincodes at once which makes 30 requests per minute)
});
