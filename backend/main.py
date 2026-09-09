from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from auth import verify_password, create_token

app = FastAPI()


# ==============================
# CORS
# ==============================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==============================
# HOME
# ==============================

@app.get("/")
def home():
    return {
        "message": "Bhoomi-Intel API running"
    }


# ==============================
# OFFICER LOGIN
# ==============================

@app.post("/api/auth/login")
def login(data: dict):

    username = data.get("username")
    password = data.get("password")

    if username != "officer":
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    if not verify_password(password):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    token = create_token(username)

    return {
        "message": "Login successful",
        "access_token": token,
        "role": "officer"
    }


# ==============================
# PROJECTS
# ==============================

projects = []


@app.get("/api/projects")
def get_projects():
    return projects


@app.post("/api/projects")
def create_project(project: dict):

    projects.append(project)

    return {
        "message": "Project created successfully",
        "project": project
    }