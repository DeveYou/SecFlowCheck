import os
import requests
from pathlib import Path

HEADERS = {
    "Authorization": f"Bearer {os.getenv('GITHUB_TOKEN')}",
    "Accept": "application/vnd.github+json"
}

print("Githuh token : ", os.getenv('GITHUB_TOKEN'))

BASE_DIR = Path("data/github")


def fetch_top_repositories(stars=1000, pages=1):
    repos = []
    for page in range(1, pages + 1):
        r = requests.get(
            "https://api.github.com/search/repositories",
            headers=HEADERS,
            params={
                "q": f"stars:>{stars}",
                "sort": "stars",
                "order": "desc",
                "per_page": 9000,
                "page": page
            }
        )
        r.raise_for_status()
        repos.extend(r.json()["items"])
    return repos


def collect_workflows(repo):
    owner = repo["owner"]["login"]
    name = repo["name"]

    url = f"https://api.github.com/repos/{owner}/{name}/contents/.github/workflows"
    r = requests.get(url, headers=HEADERS)
    if r.status_code != 200:
        return []

    workflows = []
    for wf in r.json():
        if wf["name"].endswith((".yml", ".yaml")):
            workflows.append(requests.get(wf["download_url"]).text)
    return workflows
