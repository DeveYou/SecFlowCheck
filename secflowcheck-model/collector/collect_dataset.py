from github_collector import fetch_top_repositories, collect_workflows
from gitlab_collector import search_public_projects, fetch_gitlab_ci
from dataset_builder import build_sample, save_dataset
from tqdm import tqdm

samples = []

# GitHub
repos = fetch_top_repositories()
for repo in tqdm(repos):
    for wf in collect_workflows(repo):
        samples.append(build_sample(wf))

# GitLab
projects = search_public_projects()
for p in tqdm(projects):
    if "default_branch" not in p:
        continue
    ci = fetch_gitlab_ci(p["id"], p["default_branch"])
    if ci:
        samples.append(build_sample(ci))

save_dataset(samples)
