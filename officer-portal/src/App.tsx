import { useEffect, useMemo, useState } from "react";
import "./App.css";

type Page =
  | "Dashboard"
  | "Projects"
  | "Parcels"
  | "Notifications";

type Properties = {
  project_id?: string;
  project_name?: string;
  state?: string;
  district?: string;
  project_type?: string;
  status?: string;

  parcel_id?: string;
  survey_no?: string;
  owner?: string;
  area?: string;
  project?: string;

  [key: string]: any;
};

type Feature = {
  type: "Feature";
  properties: Properties;
  geometry: any;
};

type FeatureCollection = {
  type: "FeatureCollection";
  features: Feature[];
};

type ProjectDocuments = {
  preliminaryNotification?: {
    name: string;
    data: string;
  };

  sia?: {
    name: string;
    data: string;
  };
};

function App() {
  const [currentPage, setCurrentPage] =
    useState<Page>("Dashboard");

  const [projects, setProjects] =
    useState<Feature[]>([]);

  const [parcels, setParcels] =
    useState<Feature[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [selectedProject, setSelectedProject] =
    useState<Feature | null>(null);

  const [selectedParcel, setSelectedParcel] =
    useState<Feature | null>(null);

  // =====================================================
  // PROJECT DOCUMENTS
  // =====================================================

  const [projectDocuments, setProjectDocuments] =
    useState<Record<string, ProjectDocuments>>(() => {
      try {
        const saved = localStorage.getItem(
          "bhoomiProjectDocuments"
        );

        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    });

  const [documentProject, setDocumentProject] =
    useState<Feature | null>(null);

  // =====================================================
  // LOAD GEOJSON
  // =====================================================

  useEffect(() => {
    async function loadGeoJSON() {
      try {
        setLoading(true);

        const [
          projectResponse,
          parcelResponse,
        ] = await Promise.all([
          fetch("/project.geojson"),
          fetch("/parcels.geojson"),
        ]);

        if (!projectResponse.ok) {
          throw new Error(
            "project.geojson could not be loaded."
          );
        }

        if (!parcelResponse.ok) {
          throw new Error(
            "parcels.geojson could not be loaded."
          );
        }

        const projectData: FeatureCollection =
          await projectResponse.json();

        const parcelData: FeatureCollection =
          await parcelResponse.json();

        setProjects(
          projectData.features || []
        );

        setParcels(
          parcelData.features || []
        );
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load project.geojson and parcels.geojson."
        );
      } finally {
        setLoading(false);
      }
    }

    loadGeoJSON();
  }, []);

  // =====================================================
  // NORMALIZE PROJECT ID
  // =====================================================

  function normalizeProjectId(id: any) {
    if (
      id === null ||
      id === undefined
    ) {
      return "";
    }

    return String(id)
      .trim()
      .toUpperCase()
      .replace(/^P0+/, "P");
  }

  // =====================================================
  // CHECK ACQUIRED
  // =====================================================

  function isAcquired(status: any) {
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
  // STATISTICS
  // =====================================================

  const statistics = useMemo(() => {
    let acquired = 0;
    let underAcquisition = 0;
    let pending = 0;
    let notAcquired = 0;

    parcels.forEach((parcel) => {
      const status = String(
        parcel.properties?.status || ""
      )
        .trim()
        .toLowerCase();

      if (
        status === "acquired" ||
        status === "approved" ||
        status === "completed"
      ) {
        acquired++;
      } else if (
        status === "under acquisition"
      ) {
        underAcquisition++;
      } else if (
        status === "pending"
      ) {
        pending++;
      } else {
        notAcquired++;
      }
    });

    return {
      total: parcels.length,
      acquired,
      underAcquisition,
      pending,
      notAcquired,
    };
  }, [parcels]);

  // =====================================================
  // PROJECT PROGRESS
  // =====================================================

  function getProjectProgress(
    project: Feature
  ) {
    const projectId =
      normalizeProjectId(
        project.properties?.project_id
      );

    const projectParcels =
      parcels.filter(
        (parcel) =>
          normalizeProjectId(
            parcel.properties?.project_id
          ) === projectId
      );

    if (
      projectParcels.length === 0
    ) {
      return 0;
    }

    const acquiredCount =
      projectParcels.filter(
        (parcel) =>
          isAcquired(
            parcel.properties?.status
          )
      ).length;

    return Math.round(
      (acquiredCount /
        projectParcels.length) *
        100
    );
  }

  // =====================================================
  // PROJECT SEARCH
  // =====================================================

  const filteredProjects =
    useMemo(() => {
      const value =
        search.trim().toLowerCase();

      if (!value) {
        return projects;
      }

      return projects.filter(
        (project) => {
          const p =
            project.properties;

          return [
            p.project_id,
            p.project_name,
            p.state,
            p.district,
            p.project_type,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(value);
        }
      );
    }, [projects, search]);

  // =====================================================
  // PARCEL SEARCH
  // =====================================================

  const filteredParcels =
    useMemo(() => {
      const value =
        search.trim().toLowerCase();

      if (!value) {
        return parcels;
      }

      return parcels.filter(
        (parcel) => {
          const p =
            parcel.properties;

          return [
            p.parcel_id,
            p.project_id,
            p.survey_no,
            p.owner,
            p.district,
            p.state,
            p.project,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(value);
        }
      );
    }, [parcels, search]);

  // =====================================================
  // SELECT PROJECT
  // =====================================================

  function selectProject(
    project: Feature
  ) {
    setSelectedProject(project);
    setSelectedParcel(null);
    setSearch("");
    setCurrentPage("Parcels");
  }

  // =====================================================
  // SAVE DOCUMENTS
  // =====================================================

  function saveDocuments(
    documents: Record<
      string,
      ProjectDocuments
    >
  ) {
    setProjectDocuments(documents);

    localStorage.setItem(
      "bhoomiProjectDocuments",
      JSON.stringify(documents)
    );
  }

  // =====================================================
  // UPLOAD PDF
  // =====================================================

  function handleDocumentUpload(
    projectId: string,
    type:
      | "preliminaryNotification"
      | "sia",
    file: File
  ) {
    // PDF ONLY
    if (
      file.type !== "application/pdf" &&
      !file.name
        .toLowerCase()
        .endsWith(".pdf")
    ) {
      alert(
        "Please upload a PDF file only."
      );

      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      const current =
        projectDocuments[
          projectId
        ] || {};

      const updated = {
        ...projectDocuments,

        [projectId]: {
          ...current,

          [type]: {
            name: file.name,
            data:
              reader.result as string,
          },
        },
      };

      saveDocuments(updated);
    };

    reader.readAsDataURL(file);
  }

  // =====================================================
  // REMOVE PDF
  // =====================================================

  function removeDocument(
    projectId: string,
    type:
      | "preliminaryNotification"
      | "sia"
  ) {
    const current =
      projectDocuments[
        projectId
      ];

    if (!current) {
      return;
    }

    const updatedProject = {
      ...current,
    };

    delete updatedProject[type];

    const updated = {
      ...projectDocuments,

      [projectId]:
        updatedProject,
    };

    saveDocuments(updated);
  }

  // =====================================================
  // OPEN PDF
  // =====================================================

  function openDocument(
    projectId: string,
    type:
      | "preliminaryNotification"
      | "sia"
  ) {
    const document =
      projectDocuments[
        projectId
      ]?.[type];

    if (!document) {
      return;
    }

    const newWindow =
      window.open(
        "",
        "_blank"
      );

    if (!newWindow) {
      alert(
        "Please allow pop-ups to view the PDF."
      );

      return;
    }

    newWindow.document.write(`
      <!DOCTYPE html>

      <html>
        <head>
          <title>${document.name}</title>

          <style>
            html,
            body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              overflow: hidden;
              background: #f3f7f3;
            }

            iframe {
              width: 100%;
              height: 100%;
              border: none;
            }
          </style>
        </head>

        <body>

          <iframe
            src="${document.data}"
            title="${document.name}"
          ></iframe>

        </body>
      </html>
    `);

    newWindow.document.close();
  }

  // =====================================================
  // DASHBOARD
  // =====================================================

  function Dashboard() {
    return (
      <div className="page">

        <div className="page-title">
          <div>
            <h1>
              Dashboard
            </h1>

            <p>
              Bhoomi-Intel Land Acquisition
              Intelligence
            </p>
          </div>
        </div>

        {/* STATISTICS */}

        <div className="stats-grid">

          <div className="stat-box">
            <span>
              Total Projects
            </span>

            <strong>
              {projects.length}
            </strong>
          </div>

          <div className="stat-box">
            <span>
              Total Parcels
            </span>

            <strong>
              {statistics.total}
            </strong>
          </div>

          <div className="stat-box acquired-box">
            <span>
              Acquired
            </span>

            <strong>
              {statistics.acquired}
            </strong>
          </div>

          <div className="stat-box acquisition-box">
            <span>
              Under Acquisition
            </span>

            <strong>
              {statistics.underAcquisition}
            </strong>
          </div>

          <div className="stat-box pending-box">
            <span>
              Pending
            </span>

            <strong>
              {statistics.pending}
            </strong>
          </div>

          <div className="stat-box not-acquired-box">
            <span>
              Not Acquired
            </span>

            <strong>
              {statistics.notAcquired}
            </strong>
          </div>

        </div>

        {/* GIS */}

        <div className="gis-section">

          <div className="section-heading">

            <div>
              <h2>
                GIS Intelligence Map
              </h2>

              <p>
                Live project and parcel
                visualization
              </p>
            </div>

          </div>

          <div className="gis-container">

            <iframe
              src="http://127.0.0.1:5500/index.html"
              title="Bhoomi Intel GIS"
              className="gis-iframe"
            />

          </div>

        </div>

        {/* PROJECTS */}

        <div className="section-card">

          <div className="section-heading">

            <div>

              <h2>
                Projects
              </h2>

              <p>
                Projects loaded from
                project.geojson
              </p>

            </div>

            <button
              className="green-button"
              onClick={() =>
                setCurrentPage(
                  "Projects"
                )
              }
            >
              View All
            </button>

          </div>

          <div className="project-grid">

            {projects
              .slice(0, 6)
              .map(
                (
                  project,
                  index
                ) => {

                  const p =
                    project.properties;

                  const progress =
                    getProjectProgress(
                      project
                    );

                  return (
                    <div
                      className="project-card"
                      key={
                        p.project_id ||
                        index
                      }
                      onClick={() =>
                        selectProject(
                          project
                        )
                      }
                    >

                      <div className="project-card-top">

                        <div>

                          <span className="project-id">
                            {p.project_id}
                          </span>

                          <h3>
                            {
                              p.project_name
                            }
                          </h3>

                        </div>

                        <div className="progress-circle">
                          {progress}%
                        </div>

                      </div>

                      <p>
                        {
                          p.district
                        }
                        ,{" "}
                        {p.state}
                      </p>

                      <p>
                        {
                          p.project_type
                        }
                      </p>

                      <div className="progress-bar">

                        <div
                          style={{
                            width:
                              `${progress}%`,
                          }}
                        />

                      </div>

                      <small>
                        Acquisition
                        Progress
                      </small>

                    </div>
                  );
                }
              )}

          </div>

        </div>

      </div>
    );
  }

  // =====================================================
  // PROJECTS PAGE
  // =====================================================

  function ProjectsPage() {
    return (
      <div className="page">

        <div className="page-title">

          <div>

            <h1>
              Projects
            </h1>

            <p>
              {projects.length}{" "}
              projects available
            </p>

          </div>

        </div>

        <div className="search-container">

          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search Project ID, project name, district..."
          />

          {search && (
            <button
              onClick={() =>
                setSearch("")
              }
            >
              Clear
            </button>
          )}

        </div>

        <div className="project-list">

          {filteredProjects.map(
            (
              project,
              index
            ) => {

              const p =
                project.properties;

              const progress =
                getProjectProgress(
                  project
                );

              return (
                <div
                  className="project-row"
                  key={
                    p.project_id ||
                    index
                  }
                  onClick={() =>
                    selectProject(
                      project
                    )
                  }
                >

                  <div className="project-main">

                    <span className="project-id">
                      {p.project_id}
                    </span>

                    <h2>
                      {
                        p.project_name
                      }
                    </h2>

                    <div className="project-info">

                      <span>
                        📍{" "}
                        {
                          p.district
                        }
                        ,{" "}
                        {p.state}
                      </span>

                      <span>
                        🏗️{" "}
                        {
                          p.project_type
                        }
                      </span>

                    </div>

                  </div>

                  <div className="project-progress">

                    <div>

                      <span>
                        Acquisition
                      </span>

                      <strong>
                        {progress}%
                      </strong>

                    </div>

                    <div className="progress-bar">

                      <div
                        style={{
                          width:
                            `${progress}%`,
                        }}
                      />

                    </div>

                  </div>

                </div>
              );
            }
          )}

        </div>

      </div>
    );
  }

  // =====================================================
  // PARCELS PAGE
  // =====================================================

  function ParcelsPage() {

    let displayedParcels =
      filteredParcels;

    if (selectedProject) {

      const selectedId =
        normalizeProjectId(
          selectedProject
            .properties
            ?.project_id
        );

      displayedParcels =
        filteredParcels.filter(
          (parcel) =>
            normalizeProjectId(
              parcel.properties
                ?.project_id
            ) === selectedId
        );
    }

    return (
      <div className="page">

        <div className="page-title">

          <div>

            <h1>
              Parcels
            </h1>

            <p>
              {selectedProject
                ? selectedProject
                    .properties
                    ?.project_name
                : "All land parcels"}
            </p>

          </div>

          {selectedProject && (
            <button
              className="green-button"
              onClick={() =>
                setSelectedProject(
                  null
                )
              }
            >
              Show All Parcels
            </button>
          )}

        </div>

        <div className="search-container">

          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search Parcel ID, Survey No, Project ID..."
          />

          {search && (
            <button
              onClick={() =>
                setSearch("")
              }
            >
              Clear
            </button>
          )}

        </div>

        <div className="parcel-summary">

          Showing{" "}
          <strong>
            {
              displayedParcels.length
            }
          </strong>{" "}
          parcels

        </div>

        <div className="parcel-grid">

          {displayedParcels.map(
            (
              parcel,
              index
            ) => {

              const p =
                parcel.properties;

              return (
                <div
                  className="parcel-card"
                  key={
                    p.parcel_id ||
                    index
                  }
                  onClick={() =>
                    setSelectedParcel(
                      parcel
                    )
                  }
                >

                  <div className="parcel-header">

                    <span>
                      {p.parcel_id}
                    </span>

                    <span className="parcel-status">
                      {p.status}
                    </span>

                  </div>

                  <h3>
                    Survey No.{" "}
                    {
                      p.survey_no
                    }
                  </h3>

                  <p>
                    <strong>
                      Project:
                    </strong>{" "}
                    {p.project_id}
                  </p>

                  <p>
                    <strong>
                      Owner:
                    </strong>{" "}
                    {p.owner}
                  </p>

                  <p>
                    <strong>
                      Area:
                    </strong>{" "}
                    {p.area}
                  </p>

                  <p>
                    <strong>
                      Location:
                    </strong>{" "}
                    {p.district},{" "}
                    {p.state}
                  </p>

                </div>
              );
            }
          )}

        </div>

        {/* PARCEL DETAILS */}

        {selectedParcel && (

          <div className="modal-overlay">

            <div className="parcel-modal">

              <button
                className="close-button"
                onClick={() =>
                  setSelectedParcel(
                    null
                  )
                }
              >
                ×
              </button>

              <span className="project-id">
                LAND PARCEL
              </span>

              <h2>
                {
                  selectedParcel
                    .properties
                    ?.parcel_id
                }
              </h2>

              <div className="detail-grid">

                <div>
                  <span>
                    Project ID
                  </span>

                  <strong>
                    {
                      selectedParcel
                        .properties
                        ?.project_id
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Survey Number
                  </span>

                  <strong>
                    {
                      selectedParcel
                        .properties
                        ?.survey_no
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Owner
                  </span>

                  <strong>
                    {
                      selectedParcel
                        .properties
                        ?.owner
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Area
                  </span>

                  <strong>
                    {
                      selectedParcel
                        .properties
                        ?.area
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    District
                  </span>

                  <strong>
                    {
                      selectedParcel
                        .properties
                        ?.district
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    State
                  </span>

                  <strong>
                    {
                      selectedParcel
                        .properties
                        ?.state
                    }
                  </strong>
                </div>

              </div>

            </div>

          </div>

        )}

      </div>
    );
  }

  // =====================================================
  // NOTIFICATIONS PAGE
  // =====================================================

  function NotificationsPage() {

    const notificationProjects =
      projects.filter(
        (project) =>
          project.properties
            ?.project_id
      );

    return (
      <div className="page">

        <div className="page-title">

          <div>

            <h1>
              Notifications & SIA
            </h1>

            <p>
              Upload project documents
              in PDF format
            </p>

          </div>

        </div>

        <div className="notification-info">

          <strong>
            Officer Document Management
          </strong>

          <p>
            Select a project and upload
            its Preliminary Notification
            and Social Impact Assessment
            (SIA) PDF documents.
          </p>

        </div>

        <div className="notification-project-list">

          {notificationProjects.map(
            (
              project,
              index
            ) => {

              const p =
                project.properties;

              const projectId =
                normalizeProjectId(
                  p.project_id
                );

              const documents =
                projectDocuments[
                  projectId
                ] || {};

              return (
                <div
                  className="notification-project-card"
                  key={
                    p.project_id ||
                    index
                  }
                >

                  {/* PROJECT HEADER */}

                  <div className="notification-project-header">

                    <div>

                      <span className="project-id">
                        {p.project_id}
                      </span>

                      <h2>
                        {
                          p.project_name
                        }
                      </h2>

                      <p>
                        📍{" "}
                        {p.district},{" "}
                        {p.state}
                      </p>

                    </div>

                    <span className="document-project-status">
                      {p.status ||
                        "Project"}
                    </span>

                  </div>

                  {/* DOCUMENTS */}

                  <div className="documents-grid">

                    {/* PRELIMINARY NOTIFICATION */}

                    <div className="document-card">

                      <div className="document-icon">
                        PDF
                      </div>

                      <div className="document-content">

                        <h3>
                          Preliminary
                          Notification
                        </h3>

                        {documents.preliminaryNotification ? (

                          <>
                            <p className="uploaded-file">
                              ✓{" "}
                              {
                                documents
                                  .preliminaryNotification
                                  .name
                              }
                            </p>

                            <div className="document-actions">

                              <button
                                className="view-document-button"
                                onClick={() =>
                                  openDocument(
                                    projectId,
                                    "preliminaryNotification"
                                  )
                                }
                              >
                                View PDF
                              </button>

                              <label className="replace-document-button">

                                Replace PDF

                                <input
                                  type="file"
                                  accept="application/pdf,.pdf"
                                  hidden
                                  onChange={(
                                    e
                                  ) => {

                                    const file =
                                      e.target
                                        .files?.[0];

                                    if (
                                      file
                                    ) {
                                      handleDocumentUpload(
                                        projectId,
                                        "preliminaryNotification",
                                        file
                                      );
                                    }

                                    e.target.value =
                                      "";
                                  }}
                                />

                              </label>

                              <button
                                className="remove-document-button"
                                onClick={() =>
                                  removeDocument(
                                    projectId,
                                    "preliminaryNotification"
                                  )
                                }
                              >
                                Remove
                              </button>

                            </div>

                          </>

                        ) : (

                          <>

                            <p>
                              No PDF uploaded
                            </p>

                            <label className="upload-document-button">

                              + Upload PDF

                              <input
                                type="file"
                                accept="application/pdf,.pdf"
                                hidden
                                onChange={(
                                  e
                                ) => {

                                  const file =
                                    e.target
                                      .files?.[0];

                                  if (
                                    file
                                  ) {
                                    handleDocumentUpload(
                                      projectId,
                                      "preliminaryNotification",
                                      file
                                    );
                                  }

                                  e.target.value =
                                    "";
                                }}
                              />

                            </label>

                          </>

                        )}

                      </div>

                    </div>

                    {/* SIA */}

                    <div className="document-card">

                      <div className="document-icon">
                        PDF
                      </div>

                      <div className="document-content">

                        <h3>
                          Social Impact
                          Assessment
                        </h3>

                        <span className="document-subtitle">
                          SIA Report
                        </span>

                        {documents.sia ? (

                          <>
                            <p className="uploaded-file">
                              ✓{" "}
                              {
                                documents
                                  .sia
                                  .name
                              }
                            </p>

                            <div className="document-actions">

                              <button
                                className="view-document-button"
                                onClick={() =>
                                  openDocument(
                                    projectId,
                                    "sia"
                                  )
                                }
                              >
                                View PDF
                              </button>

                              <label className="replace-document-button">

                                Replace PDF

                                <input
                                  type="file"
                                  accept="application/pdf,.pdf"
                                  hidden
                                  onChange={(
                                    e
                                  ) => {

                                    const file =
                                      e.target
                                        .files?.[0];

                                    if (
                                      file
                                    ) {
                                      handleDocumentUpload(
                                        projectId,
                                        "sia",
                                        file
                                      );
                                    }

                                    e.target.value =
                                      "";
                                  }}
                                />

                              </label>

                              <button
                                className="remove-document-button"
                                onClick={() =>
                                  removeDocument(
                                    projectId,
                                    "sia"
                                  )
                                }
                              >
                                Remove
                              </button>

                            </div>

                          </>

                        ) : (

                          <>

                            <p>
                              No PDF uploaded
                            </p>

                            <label className="upload-document-button">

                              + Upload PDF

                              <input
                                type="file"
                                accept="application/pdf,.pdf"
                                hidden
                                onChange={(
                                  e
                                ) => {

                                  const file =
                                    e.target
                                      .files?.[0];

                                  if (
                                    file
                                  ) {
                                    handleDocumentUpload(
                                      projectId,
                                      "sia",
                                      file
                                    );
                                  }

                                  e.target.value =
                                    "";
                                }}
                              />

                            </label>

                          </>

                        )}

                      </div>

                    </div>

                  </div>

                </div>
              );
            }
          )}

          {notificationProjects.length ===
            0 && (
            <div className="empty-state">

              <h3>
                No projects available
              </h3>

              <p>
                Projects from
                project.geojson will
                appear here.
              </p>

            </div>
          )}

        </div>

      </div>
    );
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="loading-screen">

        <div className="loading-card">

          <div className="loading-logo">
            BI
          </div>

          <h2>
            Loading Bhoomi-Intel
          </h2>

          <p>
            Loading projects and
            land parcels...
          </p>

        </div>

      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="error-screen">

        <div className="error-card">

          <h2>
            Unable to load data
          </h2>

          <p>
            {error}
          </p>

          <p>
            Check that{" "}
            <strong>
              project.geojson
            </strong>{" "}
            and{" "}
            <strong>
              parcels.geojson
            </strong>{" "}
            are inside the public
            folder.
          </p>

        </div>

      </div>
    );
  }

  // =====================================================
  // MAIN APPLICATION
  // =====================================================

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-logo">
            BI
          </div>

          <div>

            <h2>
              Bhoomi-Intel
            </h2>

            <span>
              Officer Portal
            </span>

          </div>

        </div>

        <nav className="navigation">

          {/* DASHBOARD */}

          <button
            className={
              currentPage ===
              "Dashboard"
                ? "nav-button active"
                : "nav-button"
            }
            onClick={() =>
              setCurrentPage(
                "Dashboard"
              )
            }
          >
            <span>⌂</span>
            Dashboard
          </button>

          {/* PROJECTS */}

          <button
            className={
              currentPage ===
              "Projects"
                ? "nav-button active"
                : "nav-button"
            }
            onClick={() =>
              setCurrentPage(
                "Projects"
              )
            }
          >
            <span>▣</span>
            Projects
          </button>

          {/* PARCELS */}

          <button
            className={
              currentPage ===
              "Parcels"
                ? "nav-button active"
                : "nav-button"
            }
            onClick={() =>
              setCurrentPage(
                "Parcels"
              )
            }
          >
            <span>◇</span>
            Parcels
          </button>

          {/* NOTIFICATIONS */}

          <button
            className={
              currentPage ===
              "Notifications"
                ? "nav-button active"
                : "nav-button"
            }
            onClick={() =>
              setCurrentPage(
                "Notifications"
              )
            }
          >
            <span>▤</span>
            Notifications
          </button>

        </nav>

        <div className="sidebar-footer">

          <span>
            LAND INTELLIGENCE
          </span>

          <small>
            Bhoomi-Intel
          </small>

        </div>

      </aside>

      {/* MAIN */}

      <main className="main">

        <header className="topbar">

          <div>

            <span className="topbar-label">
              OFFICER PORTAL
            </span>

            <h2>
              {currentPage}
            </h2>

          </div>

          <div className="officer">

            <div className="officer-avatar">
              O
            </div>

            <div>

              <strong>
                Officer
              </strong>

              <span>
                Land Acquisition
              </span>

            </div>

          </div>

        </header>

        {currentPage ===
          "Dashboard" && (
          <Dashboard />
        )}

        {currentPage ===
          "Projects" && (
          <ProjectsPage />
        )}

        {currentPage ===
          "Parcels" && (
          <ParcelsPage />
        )}

        {currentPage ===
          "Notifications" && (
          <NotificationsPage />
        )}

      </main>

    </div>
  );
}

export default App;