---
date: 2023-08-15
---

# 05 A loose standard

As I worked on creating the QDPX file and trying to import and export it from QualCoder I realized that the way that different tools used the format is too different. While all of the large proprietary tools have worked together in the consortium that created the shared REFI-QDA format, all of them represent different concepts through different encodings. Each of them also has very particular limitations in how they import and export materials.

List of import/exporting info pages:

- [NVivo](https://support.qsrinternational.com/nvivo/s/article/NV14Win-Content-projects-teamwork-refi-qda-standard)
- [Atlas.ti](https://atlasti.com/features/project-export-in-qdpx-format)
- [MAXQDA](https://www.maxqda.com/help-mx20/reports/export-and-import-refi-qda-projects)
- [QualCoder](https://github.com/ccbogel/QualCoder/wiki/12-Imports-and-exports)

In a way this variation ends up sabotaging the interoperability of the format itself. If I have to encode my information within the format using different entities for each of the target tools then the format itself is actually REFI for NVivo, REFI for Atlas.ti and so on. There is ambiguity in how to express different but similar functionality. As the tools compete to add extra functionality, they also have an incentive to diversify and a need to store information in ways to support these functionalities. Another perspective is that it also means that they want to keep some lock in effects happening as importing and exporting becomes a riskier and more costly proposition for a team working on a project.

This scenario makes me think that this field is actually quite ripe for a larger open source presence. Much of the base functionality could be achieved by leveraging something like Obsidian as a starting point and then extending the coding systems from that.

In terms of the interoperability I am looking for with this tool, for now it might be the case that it is only viable to use mostly `codes`, `plain text sources` and `notes`. Grouping functionalities such as `sets` and `cases` seem to be very fragile and poorly supported, and the same happens for `variables`. In a way I would be replicating these groupings and variables by creating codes that would be applied to the first line of each file. Almost all the tools have robust support for codes which would allow for filtering and relating them within the tools, so some of the variable and grouping could still be achieved, if contrived. A key thing here would be to use hierarchical coding to represent different values of particular variables.
