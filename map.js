console.log("map.js is connected!");

let projectData = null;
let parcelData = null;
let statistics = {};

window.projectLayer = null;
window.parcelLayer = null;


// =====================================================
// NORMALIZE PROJECT ID
// =====================================================

function normalizeProjectId(id) {

    if (id === null || id === undefined) {
        return "";
    }

    return String(id)
        .trim()
        .toUpperCase()
        .replace(/^P0+/, "P");
}


// =====================================================
// CHECK ACQUIRED STATUS
// =====================================================

function isAcquired(status) {

    const value = String(status || "")
        .trim()
        .toLowerCase();

    return (
        value === "acquired" ||
        value === "approved" ||
        value === "completed"
    );
}


// =====================================================
// CALCULATE PROJECT STATISTICS
// =====================================================

function calculateProjectStatistics(data) {

    const stats = {};

    if (!data || !Array.isArray(data.features)) {

        console.error("Invalid parcel data");

        return stats;
    }

    data.features.forEach(function (feature) {

        const p = feature.properties || {};

        const projectId =
            normalizeProjectId(p.project_id);

        if (!projectId) {
            return;
        }

        if (!stats[projectId]) {

            stats[projectId] = {
                total: 0,
                acquired: 0,
                percentage: 0
            };
        }

        stats[projectId].total++;

        if (isAcquired(p.status)) {
            stats[projectId].acquired++;
        }
    });


    Object.keys(stats).forEach(function (projectId) {

        const s = stats[projectId];

        if (s.total > 0) {

            s.percentage =
                (s.acquired / s.total) * 100;
        }
    });

    return stats;
}


// =====================================================
// UPDATE DASHBOARD
// =====================================================

function updateDashboard(data) {

    if (
        !data ||
        !Array.isArray(data.features)
    ) {

        console.error(
            "Cannot update dashboard: invalid parcel data"
        );

        return;
    }


    let total = data.features.length;

    let acquired = 0;

    let underAcquisition = 0;

    let pending = 0;

    let notAcquired = 0;


    // Count every parcel

    data.features.forEach(function (feature) {

        const p = feature.properties || {};

        const status =
            String(p.status || "")
                .trim()
                .toLowerCase();


        if (
            status === "acquired" ||
            status === "approved" ||
            status === "completed"
        ) {

            acquired++;

        }

        else if (
            status === "under acquisition"
        ) {

            underAcquisition++;

        }

        else if (
            status === "pending"
        ) {

            pending++;

        }

        else {

            notAcquired++;
        }
    });


    // =================================================
    // UPDATE HTML
    // =================================================

    const totalElement =
        document.getElementById("totalParcels");

    const acquiredElement =
        document.getElementById("acquiredParcels");

    const acquisitionElement =
        document.getElementById("underAcquisition");

    const pendingElement =
        document.getElementById("pendingParcels");

    const notAcquiredElement =
        document.getElementById("notAcquired");


    if (totalElement) {

        totalElement.textContent = total;
    }


    if (acquiredElement) {

        acquiredElement.textContent =
            acquired;
    }


    if (acquisitionElement) {

        acquisitionElement.textContent =
            underAcquisition;
    }


    if (pendingElement) {

        pendingElement.textContent =
            pending;
    }


    if (notAcquiredElement) {

        notAcquiredElement.textContent =
            notAcquired;
    }


    // =================================================
    // CONSOLE CHECK
    // =================================================

    console.log(
        "Dashboard updated:",
        {
            total: total,
            acquired: acquired,
            underAcquisition: underAcquisition,
            pending: pending,
            notAcquired: notAcquired
        }
    );
}


// =====================================================
// CREATE MAP
// =====================================================

const leafletMap = L.map("map").setView(
    [22.5, 80.0],
    5
);


// =====================================================
// OPEN STREET MAP
// =====================================================

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution:
            "&copy; OpenStreetMap contributors"
    }
).addTo(leafletMap);


// =====================================================
// PROJECT MARKER COLOR
// =====================================================

function getProjectColor(status) {

    const value = String(status || "")
        .trim()
        .toLowerCase();

    if (value === "acquired") {
        return "#2e7d32";
    }

    if (value === "under acquisition") {
        return "#f57c00";
    }

    if (value === "pending") {
        return "#fbc02d";
    }

    return "#757575";
}


// =====================================================
// PARCEL COLOR
// =====================================================

function getParcelColor(status) {

    const value = String(status || "")
        .trim()
        .toLowerCase();

    if (
        value === "acquired" ||
        value === "approved" ||
        value === "completed"
    ) {

        return "#2e7d32";
    }

    if (value === "under acquisition") {

        return "#f57c00";
    }

    if (value === "pending") {

        return "#fbc02d";
    }

    return "#9e9e9e";
}


// =====================================================
// SHOW ACTUAL PARCELS FOR SELECTED PROJECT
// =====================================================

function showProjectParcels(projectId) {

    projectId =
        normalizeProjectId(projectId);

    console.log(
        "Showing parcels for project:",
        projectId
    );


    // Remove previous parcel layer

    if (window.parcelLayer) {

        leafletMap.removeLayer(
            window.parcelLayer
        );

        window.parcelLayer = null;
    }


    if (
        !parcelData ||
        !Array.isArray(parcelData.features)
    ) {

        console.error(
            "Parcel data is not available."
        );

        return;
    }


    // Find actual parcels using project_id

    const selectedFeatures =
        parcelData.features.filter(
            function (feature) {

                const parcelProjectId =
                    normalizeProjectId(
                        feature.properties &&
                        feature.properties.project_id
                    );

                return (
                    parcelProjectId === projectId
                );
            }
        );


    console.log(
        "Parcels found for",
        projectId,
        ":",
        selectedFeatures.length
    );


    if (selectedFeatures.length === 0) {

        alert(
            "No parcels found for project " +
            projectId
        );

        return;
    }


    const selectedParcels = {

        type: "FeatureCollection",

        features: selectedFeatures
    };


    // =================================================
    // CREATE ACTUAL GEOJSON PARCEL LAYER
    // =================================================

    window.parcelLayer =
        L.geoJSON(
            selectedParcels,
            {

                style: function (feature) {

                    const p =
                        feature.properties || {};

                    return {

                        color: "#222222",

                        weight: 2,

                        opacity: 1,

                        fillColor:
                            getParcelColor(
                                p.status
                            ),

                        fillOpacity: 0.45
                    };
                },


                onEachFeature:
                    function (feature, layer) {

                        const p =
                            feature.properties || {};


                        // =================================================
                        // PARCEL POPUP
                        // =================================================

                        layer.bindPopup(`

                            <div class="parcel-popup">

                                <h3>Land Parcel</h3>

                                <hr>

                                <b>Parcel ID:</b>
                                ${p.parcel_id || "-"}

                                <br><br>

                                <b>Project ID:</b>
                                ${p.project_id || "-"}

                                <br><br>

                                <b>Survey No:</b>
                                ${p.survey_no || "-"}

                                <br><br>

                                <b>Owner:</b>
                                ${p.owner || "-"}

                                <br><br>

                                <b>District:</b>
                                ${p.district || "-"}

                                <br><br>

                                <b>State:</b>
                                ${p.state || "-"}

                                <br><br>

                                <b>Area:</b>
                                ${p.area || "-"}

                                <br><br>

                                <b>Status:</b>
                                ${p.status || "-"}

                            </div>

                        `);


                        // =================================================
                        // HOVER
                        // =================================================

                        layer.on(
                            "mouseover",
                            function () {

                                layer.setStyle({

                                    weight: 4,

                                    fillOpacity: 0.70
                                });
                            }
                        );


                        layer.on(
                            "mouseout",
                            function () {

                                window.parcelLayer
                                    .resetStyle(layer);
                            }
                        );


                        // =================================================
                        // CLICK
                        // =================================================

                        layer.on(
                            "click",
                            function () {

                                console.log(
                                    "Parcel clicked:",
                                    p.parcel_id
                                );
                            }
                        );
                    }
            }
        )
        .addTo(leafletMap);


    // =================================================
    // ZOOM TO ACTUAL PARCELS
    // =================================================

    const parcelBounds =
        window.parcelLayer.getBounds();


    if (parcelBounds.isValid()) {

        leafletMap.flyToBounds(
            parcelBounds,
            {

                padding: [50, 50],

                maxZoom: 17,

                duration: 1.5
            }
        );
    }
}


// =====================================================
// LOAD PROJECTS + PARCELS
// =====================================================

Promise.all([

    // =================================================
    // LOAD PROJECT GEOJSON
    // =================================================

    fetch("project.geojson")
        .then(function (response) {

            if (!response.ok) {

                throw new Error(
                    "project.geojson could not be loaded"
                );
            }

            return response.json();
        }),


    // =================================================
    // LOAD PARCEL GEOJSON
    // =================================================

    fetch("parcels.geojson")
        .then(function (response) {

            if (!response.ok) {

                throw new Error(
                    "parcels.geojson could not be loaded"
                );
            }

            return response.json();
        })

])


.then(function (results) {

    projectData = results[0];

    parcelData = results[1];


    console.log(
        "Projects loaded:",
        projectData.features.length
    );


    console.log(
        "Parcels loaded:",
        parcelData.features.length
    );


    // =================================================
    // UPDATE DASHBOARD
    // =================================================

    updateDashboard(
        parcelData
    );


    // =================================================
    // CALCULATE PROJECT STATISTICS
    // =================================================

    statistics =
        calculateProjectStatistics(
            parcelData
        );


    console.log(
        "Project acquisition statistics:",
        statistics
    );


    // =================================================
    // CREATE PROJECT MARKERS
    // =================================================

    window.projectLayer =
        L.geoJSON(
            projectData,
            {

                // =================================================
                // PROJECT MARKER
                // =================================================

                pointToLayer:
                    function (
                        feature,
                        latlng
                    ) {

                        const p =
                            feature.properties || {};


                        const projectId =
                            normalizeProjectId(
                                p.project_id
                            );


                        const stats =
                            statistics[
                                projectId
                            ];


                        let percentage = 0;


                        if (stats) {

                            percentage =
                                stats.percentage;
                        }


                        const markerHTML = `

                            <div class="project-marker">

                                <div
                                    class="project-marker-circle"
                                    style="
                                        border-color:${getProjectColor(
                                            p.status
                                        )};
                                    "
                                >

                                    ${Math.round(
                                        percentage
                                    )}%

                                </div>

                            </div>

                        `;


                        return L.marker(
                            latlng,
                            {

                                icon:
                                    L.divIcon({

                                        className: "",

                                        html:
                                            markerHTML,

                                        iconSize:
                                            [60, 60],

                                        iconAnchor:
                                            [30, 30],

                                        popupAnchor:
                                            [0, 35]
                                    })
                            }
                        );
                    },


                // =================================================
                // PROJECT POPUP + CLICK
                // =================================================

                onEachFeature:
                    function (
                        feature,
                        layer
                    ) {

                        const p =
                            feature.properties || {};


                        const projectId =
                            normalizeProjectId(
                                p.project_id
                            );


                        const stats =
                            statistics[
                                projectId
                            ];


                        let total = 0;

                        let acquired = 0;

                        let percentage = 0;


                        if (stats) {

                            total =
                                stats.total;

                            acquired =
                                stats.acquired;

                            percentage =
                                stats.percentage;
                        }


                        // =================================================
                        // CLICK PROJECT
                        // =================================================

                        layer.on(
                            "click",
                            function () {

                                console.log(
                                    "Project clicked:",
                                    projectId
                                );


                                showProjectParcels(
                                    projectId
                                );
                            }
                        );
                        
                        
                        // =================================================
                        // PROJECT POPUP
                        // =================================================

                        layer.bindPopup(`

                            <div class="project-popup">

                                <h3>
                                    ${
                                        p.project_name ||
                                        "Land Acquisition Project"
                                    }
                                </h3>

                                <hr>

                                <b>Project ID:</b>
                                ${p.project_id || "-"}

                                <br><br>

                                <b>State:</b>
                                ${p.state || "-"}

                                <br>

                                <b>District:</b>
                                ${p.district || "-"}

                                <br>

                                <b>Project Type:</b>
                                ${p.project_type || "-"}

                                <br>

                                <b>Status:</b>
                                ${p.status || "-"}

                                <hr>

                                <b>Total Parcels:</b>
                                ${total}

                                <br>

                                <b>Acquired Parcels:</b>
                                ${acquired}

                                <br><br>

                                <b>
                                    Acquisition Progress:
                                </b>

                                <strong>
                                    ${Math.round(
                                        percentage
                                    )}%
                                </strong>

                            </div>

                        `);
                    }
            }
        )
        .addTo(leafletMap);


    // =================================================
    // INITIAL MAP VIEW
    // =================================================

    const bounds =
        window.projectLayer.getBounds();


    if (bounds.isValid()) {

        leafletMap.fitBounds(
            bounds,
            {
                padding: [30, 30]
            }
        );
    }

})


.catch(function (error) {

    console.error(
        "GEOJSON ERROR:",
        error
    );


    alert(
        "Could not load project.geojson or parcels.geojson. Check the browser console."
    );
});


// =====================================================
// SEARCH PROJECT
// =====================================================

function searchParcel() {

    const input =
        document
            .getElementById(
                "surveySearch"
            )
            .value
            .trim()
            .toLowerCase();


    if (!input) {

        alert(
            "Enter Project ID."
        );

        return;
    }


    if (!window.projectLayer) {

        alert(
            "Projects are still loading. Please wait."
        );

        return;
    }


    let found = false;


    window.projectLayer.eachLayer(
        function (layer) {

            const p =
                layer.feature.properties || {};


            const searchableText = (

                (p.project_id || "") +
                " " +
                (p.project_name || "") +
                " " +
                (p.state || "") +
                " " +
                (p.district || "") +
                " " +
                (p.project_type || "") +
                " " +
                (p.status || "")

            ).toLowerCase();


            if (
                searchableText.includes(input)
            ) {

                found = true;


                leafletMap.setView(
                    layer.getLatLng(),
                    10
                );


                layer.openPopup();


                // =================================================
                // SHOW ACTUAL PARCELS
                // =================================================

                showProjectParcels(
                    p.project_id
                );
            }
        }
    );


    if (!found) {

        alert(
            "No matching project found."
        );
    }
}