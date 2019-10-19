const moment = require("moment-timezone");
const workshopQuery = `
    eventbases(where: {
        opengt: true
    }) {
        start_time
        area {
            name
        }
        title
    }
`;

const getCMSData = async (queryString) => {
    return fetch("https://cms.hack.gt/graphql", {
        method: "POST",
        headers: {
            "Content-Type": `application/json`,
            Accept: `application/json`
        },
        body: JSON.stringify({
            query: `query {
                ${queryString}
            }`
        })
    })
        .then(r => {
            return r.json();
        })
        .catch(err => {
            console.error(err);
            return false;
        });
}

const eToSlug = (e) => {
    if (e.checkin_slug) return e.checkin_slug;
    const base = e.title.toLowerCase().replace(/[\s-]+/g, '_');
    if (!e.area || !e.area.name) return base;
    const areaClean = e.area.name.toLowerCase().replace(/[\s-]+/g, '_');
    return `${base}_${areaClean}`;
}

const UNSAFE_parseAsLocal = (t) => { // parse iso-formatted string as EST
    let localString = t;
    if (t.slice(-1).toLowerCase() === "z") {
        localString = t.slice(0, -1);
    }
    return moment.tz(localString, 'America/New_York');
}

getCMSData(workshopQuery).then(result => {
    let info = result.data.eventbases;
    let table = document.getElementById("table");
    let load = document.getElementById("load");
    for (let e of info) {
        e.start_time = UNSAFE_parseAsLocal(e.start_time);
    }
    info = info.sort((a, b) => {
        return a.start_time.diff(b.start_time);
    })
    for (let e of info) {
        const startTime = e.start_time.format('MMMM D, h:mm A');
        let row = table.insertRow();
        row.insertCell().innerHTML = e.title;
        if (e.area && e.area.name) {
            row.insertCell().innerHTML = e.area.name;
        } else {
            row.insertCell().innerHTML = "Location to be announced";
        }
        row.insertCell().innerHTML = startTime;
    }
    load.classList.remove("active");
    table.classList.remove("hidden");
}).catch(err => {
    console.log(err);
});
