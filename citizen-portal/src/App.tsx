import { useEffect, useState } from "react";
import "./App.css";

type ParcelProperties = {
  parcel_id?: string;
  project_id?: string;
  survey_no?: string;
  owner?: string;
  district?: string;
  state?: string;
  area?: string;
  status?: string;
  project?: string;
  [key: string]: any;
};

type ParcelFeature = {
  type: "Feature";
  properties: ParcelProperties;
  geometry?: {
    type: string;
    coordinates: any;
  };
};

type ParcelGeoJSON = {
  type: "FeatureCollection";
  features: ParcelFeature[];
};

function App() {
  const [parcels, setParcels] = useState<ParcelFeature[]>([]);
  const [searchId, setSearchId] = useState("");
  const [selectedParcel, setSelectedParcel] =
    useState<ParcelFeature | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD PARCELS.GEOJSON
  // =========================================================

  useEffect(() => {
    const loadParcels = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/parcels.geojson", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            `parcels.geojson could not be loaded. HTTP ${response.status}`
          );
        }

        const data: ParcelGeoJSON = await response.json();

        if (!data || data.type !== "FeatureCollection") {
          throw new Error(
            "Invalid GeoJSON. Expected a FeatureCollection."
          );
        }

        if (!Array.isArray(data.features)) {
          throw new Error(
            "Invalid GeoJSON. No features array found."
          );
        }

        console.log(
          "✅ parcels.geojson loaded:",
          data.features.length,
          "parcels"
        );

        console.log(
          "📍 Parcel IDs:",
          data.features.map(
            (feature) =>
              feature.properties?.parcel_id ||
              feature.properties?.PARCEL_ID ||
              feature.properties?.id
          )
        );

        setParcels(data.features);
        setLoading(false);
      } catch (err) {
        console.error("❌ Parcel loading error:", err);

        setParcels([]);

        setError(
          "Unable to load parcels.geojson. Make sure it is inside the public folder."
        );

        setLoading(false);
      }
    };

    loadParcels();
  }, []);

  // =========================================================
  // GET PARCEL ID SAFELY
  // =========================================================

  const getParcelId = (parcel: ParcelFeature) => {
    const properties = parcel.properties || {};

    return String(
      properties.parcel_id ??
        properties.PARCEL_ID ??
        properties.Parcel_ID ??
        properties.id ??
        ""
    ).trim();
  };

  // =========================================================
  // SEARCH PARCEL
  // =========================================================

  const searchParcel = () => {
    const id = searchId.trim().toUpperCase();

    if (!id) {
      setSelectedParcel(null);
      setError("Please enter a Parcel ID.");
      return;
    }

    if (parcels.length === 0) {
      setSelectedParcel(null);
      setError(
        "Parcel data is not available. Please check parcels.geojson."
      );
      return;
    }

    const parcel = parcels.find((item) => {
      return getParcelId(item).toUpperCase() === id;
    });

    if (!parcel) {
      setSelectedParcel(null);
      setError(`No parcel found with ID "${id}".`);
      return;
    }

    console.log("✅ Parcel found:", parcel);

    setError("");
    setSelectedParcel(parcel);
  };

  // =========================================================
  // ENTER KEY
  // =========================================================

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      searchParcel();
    }
  };

  // =========================================================
  // STATUS CLASS
  // =========================================================

  const statusClass = (status: string = "") => {
    const value = status.toLowerCase().trim();

    if (value === "acquired") {
      return "status acquired";
    }

    if (
      value === "under acquisition" ||
      value === "under_acquisition"
    ) {
      return "status under";
    }

    if (value === "pending") {
      return "status pending";
    }

    if (
      value === "not acquired" ||
      value === "not_acquired"
    ) {
      return "status not-acquired";
    }

    return "status";
  };

  // =========================================================
  // DOCUMENT AVAILABILITY
  // =========================================================

  const getDocuments = (projectId: string = "") => {
    const documents: Record<
      string,
      {
        preliminary: boolean;
        sia: boolean;
      }
    > = {
      P001: {
        preliminary: true,
        sia: true,
      },

      P002: {
        preliminary: true,
        sia: true,
      },

      P003: {
        preliminary: true,
        sia: true,
      },

      P004: {
        preliminary: true,
        sia: true,
      },

      P005: {
        preliminary: true,
        sia: true,
      },

      P006: {
        preliminary: true,
        sia: true,
      },

      P007: {
        preliminary: true,
        sia: true,
      },

      P008: {
        preliminary: true,
        sia: true,
      },

      P009: {
        preliminary: true,
        sia: true,
      },

      P010: {
        preliminary: true,
        sia: true,
      },
    };

    return (
      documents[projectId] || {
        preliminary: false,
        sia: false,
      }
    );
  };

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-box">
          <div className="spinner"></div>

          <h2>Loading Bhoomi-Intel</h2>

          <p>
            Loading land acquisition information...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN APPLICATION
  // =========================================================

  return (
    <div className="app">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="header">

        <div className="brand">

          <div className="brand-logo">
            B
          </div>

          <div>
            <h1>Bhoomi-Intel</h1>
            <p>Citizen Portal</p>
          </div>

        </div>

        <nav>
          <button>Home</button>
          <button>Land Search</button>
          <button>Projects</button>
          <button>Notifications</button>
          <button>Help</button>
        </nav>

      </header>

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="hero">

        <div className="hero-content">

          <div className="eyebrow">
            LAND ACQUISITION INFORMATION SYSTEM
          </div>

          <h2>
            Know the status of
            <br />
            your land
          </h2>

          <p>
            Enter your Parcel ID to access available
            land acquisition information, project
            details, notifications and SIA documents.
          </p>

          {/* SEARCH */}

          <div className="search-container">

            <input
              value={searchId}
              onChange={(event) => {
                setSearchId(event.target.value);

                if (error) {
                  setError("");
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Enter Parcel ID  e.g. PCL001"
            />

            <button
              className="search-button"
              onClick={searchParcel}
            >
              🔍 Search
            </button>

          </div>

          {/* ERROR */}

          {error && (
            <div className="error">
              ⚠️ {error}
            </div>
          )}

        </div>

      </section>

      {/* =====================================================
          SEARCH RESULT
      ====================================================== */}

      {selectedParcel && (
        <main className="content">

          {/* RESULT HEADER */}

          <section className="result-header">

            <div>

              <span className="section-label">
                PARCEL FOUND
              </span>

              <h2>
                {getParcelId(selectedParcel)}
              </h2>

              <p>
                {selectedParcel.properties.project ||
                  "Land Acquisition Project"}
              </p>

            </div>

            <div
              className={statusClass(
                selectedParcel.properties.status
              )}
            >
              {selectedParcel.properties.status ||
                "Status unavailable"}
            </div>

          </section>

          {/* BASIC DETAILS */}

          <section className="cards">

            <div className="info-card">
              <span>Survey Number</span>
              <strong>
                {selectedParcel.properties.survey_no ||
                  "—"}
              </strong>
            </div>

            <div className="info-card">
              <span>Land Area</span>
              <strong>
                {selectedParcel.properties.area || "—"}
              </strong>
            </div>

            <div className="info-card">
              <span>District</span>
              <strong>
                {selectedParcel.properties.district ||
                  "—"}
              </strong>
            </div>

            <div className="info-card">
              <span>State</span>
              <strong>
                {selectedParcel.properties.state || "—"}
              </strong>
            </div>

          </section>

          {/* =================================================
              ACQUISITION DETAILS
          ================================================== */}

          <section className="section">

            <div className="section-heading">

              <span>01</span>

              <div>
                <h3>Land Acquisition Details</h3>

                <p>
                  Information associated with this parcel
                </p>
              </div>

            </div>

            <div className="details">

              <div className="detail">
                <span>Parcel ID</span>
                <strong>
                  {getParcelId(selectedParcel)}
                </strong>
              </div>

              <div className="detail">
                <span>Project ID</span>
                <strong>
                  {selectedParcel.properties.project_id ||
                    "—"}
                </strong>
              </div>

              <div className="detail">
                <span>Survey Number</span>
                <strong>
                  {selectedParcel.properties.survey_no ||
                    "—"}
                </strong>
              </div>

              <div className="detail">
                <span>Area</span>
                <strong>
                  {selectedParcel.properties.area || "—"}
                </strong>
              </div>

              <div className="detail">
                <span>District</span>
                <strong>
                  {selectedParcel.properties.district ||
                    "—"}
                </strong>
              </div>

              <div className="detail">
                <span>State</span>
                <strong>
                  {selectedParcel.properties.state || "—"}
                </strong>
              </div>

              <div className="detail">
                <span>Acquisition Status</span>
                <strong>
                  {selectedParcel.properties.status ||
                    "—"}
                </strong>
              </div>

            </div>

          </section>

          {/* =================================================
              PROJECT
          ================================================== */}

          <section className="section">

            <div className="section-heading">

              <span>02</span>

              <div>
                <h3>Associated Project</h3>

                <p>
                  Project connected to this parcel
                </p>
              </div>

            </div>

            <div className="project-card">

              <div className="project-icon">
                🏗️
              </div>

              <div className="project-info">

                <span>PROJECT NAME</span>

                <h3>
                  {selectedParcel.properties.project ||
                    "Project information unavailable"}
                </h3>

                <p>
                  Project ID:{" "}
                  {selectedParcel.properties.project_id ||
                    "—"}
                </p>

              </div>

            </div>

          </section>

          {/* =================================================
              PUBLIC DOCUMENTS
          ================================================== */}

          <section className="section">

            <div className="section-heading">

              <span>03</span>

              <div>
                <h3>
                  Public Notifications & Documents
                </h3>

                <p>
                  Documents published for this project
                </p>
              </div>

            </div>

            <div className="documents">

              {/* PRELIMINARY NOTIFICATION */}

              <div className="document-card">

                <div className="document-icon">
                  📢
                </div>

                <div className="document-info">

                  <span className="document-type">
                    OFFICIAL NOTIFICATION
                  </span>

                  <h3>
                    Preliminary Notification
                  </h3>

                  <p>
                    Official preliminary notification
                    relating to the land acquisition
                    project.
                  </p>

                </div>

                {getDocuments(
                  selectedParcel.properties.project_id
                ).preliminary ? (
                  <button
                    className="view-button"
                    onClick={() =>
                      alert(
                        "Preliminary Notification document will open here."
                      )
                    }
                  >
                    View
                  </button>
                ) : (
                  <span className="not-published">
                    Not Published
                  </span>
                )}

              </div>

              {/* SIA */}

              <div className="document-card">

                <div className="document-icon sia">
                  📄
                </div>

                <div className="document-info">

                  <span className="document-type">
                    PUBLIC REPORT
                  </span>

                  <h3>
                    Social Impact Assessment (SIA)
                  </h3>

                  <p>
                    Social Impact Assessment report
                    associated with the project.
                  </p>

                </div>

                {getDocuments(
                  selectedParcel.properties.project_id
                ).sia ? (
                  <button
                    className="view-button"
                    onClick={() =>
                      alert(
                        "SIA document will open here."
                      )
                    }
                  >
                    View SIA
                  </button>
                ) : (
                  <span className="not-published">
                    Not Published
                  </span>
                )}

              </div>

            </div>

          </section>

          {/* =================================================
              PROJECT TIMELINE
          ================================================== */}

          <section className="section">

            <div className="section-heading">

              <span>04</span>

              <div>
                <h3>Acquisition Process</h3>

                <p>
                  Current stage of the acquisition process
                </p>
              </div>

            </div>

            <div className="timeline">

              <div className="timeline-item completed">

                <div className="timeline-dot">
                  ✓
                </div>

                <div>
                  <h4>
                    Project Created
                  </h4>

                  <p>
                    Project has been registered.
                  </p>
                </div>

              </div>

              <div className="timeline-line"></div>

              <div className="timeline-item completed">

                <div className="timeline-dot">
                  ✓
                </div>

                <div>
                  <h4>
                    Project Approved
                  </h4>

                  <p>
                    Project has been approved by the
                    authority.
                  </p>
                </div>

              </div>

              <div className="timeline-line"></div>

              <div className="timeline-item completed">

                <div className="timeline-dot">
                  ✓
                </div>

                <div>
                  <h4>
                    Preliminary Notification
                  </h4>

                  <p>
                    Public notification has been
                    published.
                  </p>
                </div>

              </div>

              <div className="timeline-line"></div>

              <div className="timeline-item completed">

                <div className="timeline-dot">
                  ✓
                </div>

                <div>
                  <h4>
                    Social Impact Assessment
                  </h4>

                  <p>
                    SIA information is available to
                    citizens.
                  </p>
                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              OWNER
          ================================================== */}

          <section className="section">

            <div className="section-heading">

              <span>05</span>

              <div>
                <h3>Land Record</h3>

                <p>
                  Information available in the parcel
                  dataset
                </p>
              </div>

            </div>

            <div className="owner-card">

              <div className="owner-icon">
                👤
              </div>

              <div>

                <span>RECORDED OWNER</span>

                <h3>
                  {selectedParcel.properties.owner ||
                    "Owner information unavailable"}
                </h3>

              </div>

            </div>

          </section>

        </main>
      )}

      {/* =====================================================
          INITIAL STATE
      ====================================================== */}

      {!selectedParcel && !error && (
        <section className="welcome">

          <div className="welcome-icon">
            🏞️
          </div>

          <h2>
            Search your land parcel
          </h2>

          <p>
            Enter your Parcel ID above to view
            land acquisition information.
          </p>

        </section>
      )}

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer>

        <div>

          <strong>
            Bhoomi-Intel
          </strong>

          <span>
            Citizen Land Information Portal
          </span>

        </div>

        <p>
          Public land acquisition information portal
        </p>

      </footer>

    </div>
  );
}

export default App;