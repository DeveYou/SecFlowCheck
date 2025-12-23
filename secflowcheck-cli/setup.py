from setuptools import setup, find_packages

setup(
    name="secflowcheck-cli",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "typer",
        "requests",
        "pydantic",
        "python-dotenv",
        "pyyaml",
        "rich"
    ],
    entry_points={
        "console_scripts": [
            "secflowcheck=app.main:main",
        ],
    },
)
