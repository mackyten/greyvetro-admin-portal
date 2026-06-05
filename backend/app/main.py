import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routers import users, organisations

load_dotenv()

app = FastAPI(title="Greyvetro Admin Portal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(organisations.router, prefix="/api/organisations", tags=["organisations"])


@app.get("/health")
def health():
    return {"status": "ok"}
