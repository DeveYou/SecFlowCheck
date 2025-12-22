import requests

GITLAB_API = "https://gitlab.com/api/v4"


def search_public_projects(pages=5):
    projects = []
    for page in range(1, pages + 1):
        r = requests.get(
            f"{GITLAB_API}/projects",
            params={"visibility": "public", "per_page": 100, "page": page}
        )
        r.raise_for_status()
        projects.extend(r.json())
    return projects


def fetch_gitlab_ci(project_id, default_branch="main"):
    url = f"{GITLAB_API}/projects/{project_id}/repository/files/.gitlab-ci.yml/raw"
    r = requests.get(url, params={"ref": default_branch})
    if r.status_code == 200:
        return r.text
    return None
