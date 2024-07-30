# Ponte

A tool to prepare game dev project repositories for analysis using QDA (qualitative data analysis) digital tools. Its main purpose is to facilitate qualitative methodologies being applied to game creation processes documented using the [MDM](https://www.gamesasresearch.com/mdm) approach. It takes a project repository URL from GitHub and processes it to create a structured project file in the REFI-QDA format, ready to be imported into QDA tools (e.g. QualCoder, Atlas.ti, NVivo) for analysis.

This project is being developed by [Enric Granzotto Llagostera](https://enric.llagostera.com.br) as part of the [Games as Research](https://www.gamesasresearch.com/) project.

See the [information page](info/README.md) for more detail on the project.

## Installation

Requires [git](https://git-scm.com/downloads) to be installed and that it can be called using the command git.

TBD.

## Usage

TBD.

## Development notes

### Preparing a release

1. Use `npm run dry-release` to preview and then `npm run release` to generate a changelog and version bump.
2. Run `npm run build:win` or `npm run build:mac` (according to your machine's OS) to generate the build files.
   1. Make sure to prepare the build file as a zip (on Windows) or dmg (on Mac).
   2. Create a tag and a release page on the [RepoToQDA releases repository](https://github.com/enricllagostera/repo-to-qda-releases). Link the CHANGELOG.md file in the release message.
   3. Publish the release and share it with the community.

### Preparing tool documentation

TBD.
