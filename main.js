// Node and Electron modules
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

// Vendor NPM modules
const fs = require("fs-extra");
const { DateTime } = require("luxon");
const { create } = require("xmlbuilder2");
const { v4: uuidv4 } = require("uuid");

const AdmZip = require("adm-zip");

// App modules
const DataInitializer = require("./src/dataInitializer");
const GitLogLoader = require("./src/gitLogLoader");
const DocxBuilder = require("./src/DocxBuilder.js");
const docx = new DocxBuilder();
let initializer = {};
const loader = new GitLogLoader();

let mainWindow;

let repoInfo;
let gitDataPath;
let guidDB = {};

app.whenReady().then(() => {
  mainWindow = createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  loadGitData();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

const loadGitData = async () => {
  const clonePath = path.join(app.getPath("temp"), "repo-to-qda/clones");
  gitDataPath = path.join(app.getPath("temp"), "repo-to-qda/gitData");

  // TODO: Load this from UI
  repoInfo = "pippinbarr/itisasifyouweremakinglove";
  try {
    initializer = new DataInitializer(repoInfo, clonePath, gitDataPath);
  } catch (error) {
    log.error("ARCH", "Invalid repo info. >>> Stopping...");
    process.exit(1);
  }

  // Load Git log data
  let allCommits = {};
  try {
    allCommits = await initializer.loadCommitsFromGit();
  } catch (error) {
    log.error("ARCH", `Loading Git log data failed. ${error}. >>> Stopping...`);
    process.exit(1);
  }

  // Downloads the content of each commit
  let downloadAllCommitContents = [];
  allCommits.forEach((commit) => {
    downloadAllCommitContents.push(initializer.downloadZip(commit.hash));
  });
  try {
    await Promise.allSettled(downloadAllCommitContents);
  } catch (error) {
    log.warn("ARCH", `ZIP download failed. ${error}`);
  }

  mainWindow.webContents.send("gitlog", JSON.stringify(allCommits));
  createProjectFile(allCommits, path.join(gitDataPath, "zips"));
};

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile("index.html");
  return win;
};

const createProjectFile = async (commitsData, commitsFolderPath) => {
  // Prepare temp export folder and subfolder for sources XML file as .QDE
  const qdpxPath = path.join(app.getPath("temp"), "repo-to-qda/export");
  const qdpxSourcesPath = path.join(
    app.getPath("temp"),
    "repo-to-qda/export/Sources"
  );
  fs.emptyDirSync(qdpxPath);
  fs.mkdirSync(qdpxSourcesPath);
  console.log(qdpxPath);
  //Prepare template JS object with XML header, elmenets and attributes
  let defaultUser = {
    guid: uuidv4().toUpperCase(),
    name: "DEFAULT",
  };
  registerGuidDB("CommitAuthor");
  registerGuidDB("DefaultUser");
  registerGuidDB("TimestampISO");

  let xml = {
    Project: {
      "@xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
      // "@xmlns:xsd": "http://www.w3.org/2001/XMLSchema",
      "@xsi:schemaLocation":
        "urn:QDA-XML:project:1.0 http://schema.qdasoftware.org/versions/Project/v1.0/Project.xsd",
      "@origin": "RepoToQDA 0.0.1",
      "@name": "repo-to-qda test " + getNowDateTime(),
      "@creatingUserGUID": guidDB.DefaultUser,
      "@creationDateTime": getNowDateTime(),
      "@xmlns": "urn:QDA-XML:project:1.0",
      Users: [
        {
          User: {
            "@guid": defaultUser.guid,
            "@name": defaultUser.name,
          },
        },
      ],
      CodeBook: {
        Codes: {
          Code: [
            {
              "@name": "Commits",
              "@guid": guid(),
              "@isCodable": true,
              Code: [],
            },
          ],
        },
      },
      Sources: { TextSource: [] },
    },
  };

  // Create codes from commits, sorted by ascending date
  let allDevlogs = "";
  let processCompilations = [];

  commitsData.sort(orderCommitsPerAscendingDate);
  commitsData.forEach((commit, i) => {
    commit.codeName = `${String(i + 1).padStart(4, "0")} #${commit.hashAbbrev}`;
    commit.codeGuid = registerGuidDB(commit.codeName);
    const codeForCommit = createCode(commit.codeName, commit.codeGuid);
    xml.Project.CodeBook.Codes.Code[0].Code.push(codeForCommit);
    createSourceFilesFromCommit(xml, commit, qdpxSourcesPath);

    // Prepare a devlog file
    let devlogContent = "";
    devlogContent += `# _#${commit.hashAbbrev}: ${commit.subject}_\n\n\n- ${
      commit.codeName
    }\n- ${formatDate(
      DateTime.fromMillis(commit.author.timestamp)
    )}\n- <https://github.com/${repoInfo}/tree/${commit.hash}>\n\n${
      commit.body
    }\n\n---\n\n`;
    if (devlogContent.length > 0) {
      // Accumulate devlogs for a compilation
      allDevlogs += devlogContent;
      let devlogTs = createTextSourceFromTextData(
        xml,
        qdpxSourcesPath,
        `${commit.codeName} - Devlog`,
        devlogContent,
        "txt",
        formatDate(DateTime.fromMillis(commit.author.timestamp))
      );
      devlogTs.PlainTextSelection = [createPlainTextSelection("Header")];
      devlogTs.PlainTextSelection[0].Coding = [
        createCoding(guidDB[commit.codeName]),
      ];
    }

    // Merge logs
    const logsFolder = path.join(commitsFolderPath, `${commit.hash}/process`);
    let logsContent = "";
    if (fs.pathExistsSync(logsFolder)) {
      // Get the files as an array
      const files = fs.readdirSync(logsFolder);
      // Loop them all with the new for...of
      for (const file of files) {
        console.log(file);
        // Stat the file to see if we have a file or dir
        const filePath = path.join(logsFolder, file);
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
          if (["md", "txt"].indexOf(path.extname(filePath))) {
            logsContent += `# ${file} at ${formatDate(
              DateTime.fromMillis(stat.mtimeMs)
            )}\n\n${fs.readFileSync(filePath)}\n\n---\n\n`;
          }
        } else if (stat.isDirectory())
          console.log("'%s' is a directory.", filePath);
      }
    }
    console.log(commit.codeName + " process docs: " + logsContent);
    if (logsContent.length > 0) {
      let processCompilation = {
        codeName: commit.codeName,
        content: logsContent,
        dateTime: formatDate(DateTime.fromMillis(commit.author.timestamp)),
        imagesPath: logsFolder,
        commitHash: commit.hash,
      };
      processCompilations.push(processCompilation);
    }
  });

  // Create source for compilation of all devlogs
  let allDevlogsDocx = {};
  try {
    allDevlogsDocx = await docx.convert(
      allDevlogs,
      "",
      repoInfo,
      commitsData[commitsData.length - 1].hash
    );
  } catch (error) {
    console.log(error);
  }
  let allDevlogsTs = createTextSourceFromTextData(
    xml,
    qdpxSourcesPath,
    `Compilation - Devlogs`,
    allDevlogs,
    "docx",
    formatDate(
      DateTime.fromMillis(commitsData[commitsData.length - 1].author.timestamp)
    ),
    allDevlogsDocx,
    "process",
    path.join(
      gitDataPath,
      "zips",
      commitsData[commitsData.length - 1].hash,
      "process"
    )
  );

  // Create source for all process compilations
  for (const comp of processCompilations) {
    let compDocx;
    try {
      compDocx = await docx.convert(
        comp.content,
        "",
        repoInfo,
        comp.commitHash,
        "process",
        path.join(gitDataPath, "zips", comp.commitHash, "process")
      );
    } catch (error) {
      console.log(error);
    }
    let logsTs = createTextSourceFromTextData(
      xml,
      qdpxSourcesPath,
      `${comp.codeName} - Process folder compilation`,
      comp.content,
      "docx",
      comp.dateTime,
      compDocx
    );
    logsTs.PlainTextSelection = [createPlainTextSelection("Header")];
    logsTs.PlainTextSelection[0].Coding = [createCoding(guidDB[comp.codeName])];
  }

  // Convert JS object to XML string
  await exportQDPX(xml, qdpxPath);
};

async function exportQDPX(baseXmlForQdeFile, exportPath) {
  let doc = {};
  try {
    doc = create({ version: "1.0", encoding: "utf-8" }, baseXmlForQdeFile);
  } catch (error) {
    console.log(error);
  }
  // const outputXml = doc.end({ prettyPrint: true, allowEmptyTags: true });
  const outputXml = doc.end({ prettyPrint: true });
  fs.writeFileSync(path.join(exportPath, "project.qde"), outputXml);
  // Add export folder to ZIP, write it to disk as .QDPX file
  let zip = new AdmZip();
  const qdpxPath = path.join(app.getPath("temp"), "repo-to-qda/qdpx");
  fs.emptyDirSync(qdpxPath);
  zip.addLocalFolder(exportPath);
  await zip.writeZipPromise(path.join(qdpxPath, `project.qdpx`));
  console.log("done qdpx zip packing");
}

function createSourceFilesFromCommit(baseXml, commit, qdpxSourcesPath) {
  const commitDateTime = formatDate(
    DateTime.fromMillis(commit.author.timestamp)
  );
  let commitDataTs = createTextSourceFromTextData(
    baseXml,
    qdpxSourcesPath,
    `${commit.codeName} - Raw data`,
    JSON.stringify(commit, undefined, "\t"),
    "json",
    commitDateTime
  );
  commitDataTs.PlainTextSelection = [createPlainTextSelection("Commit header")];
  commitDataTs.PlainTextSelection[0].Coding = [
    createCoding(guidDB[commit.codeName]),
  ];
}

function createTextSourceFromTextData(
  baseXml,
  qdpxSourcesPath,
  name,
  textData = "",
  ext = "txt",
  dateTime = getNowDateTime(),
  richTextData = ""
) {
  const guid_txt = registerGuidDB(`${name}.txt`);
  const guid_ext = registerGuidDB(`${name}.${ext}`);
  let ts = {
    "@guid": guid(),
    "@name": name,
    "@plainTextPath": `internal://${guid_txt}.txt`,
    "@richTextPath": `internal://${guid_ext}.${ext}`,
    "@creatingUser": guidDB.DefaultUser,
    "@creationDateTime": dateTime,
    "#": "",
  };
  baseXml.Project.Sources.TextSource.push(ts);
  if (richTextData != "") {
    fs.writeFileSync(
      path.join(qdpxSourcesPath, `/${guid_ext}.${ext}`),
      richTextData
    );
  }
  fs.writeFileSync(path.join(qdpxSourcesPath, `/${guid_txt}.txt`), textData);
  return ts;
}

function createCode(name, codeGuid, color = "#CC00FF") {
  let c = {
    "@name": name,
    "@guid": codeGuid,
    "@isCodable": true,
    "@color": color,
  };
  return c;
}

function createCoding(codeGuid) {
  let cd = {
    "@guid": guid(),
    "@creatingUser": guidDB.DefaultUser,
    "@creationDateTime": getNowDateTime(),
    CodeRef: [
      {
        "@targetGUID": codeGuid,
      },
    ],
  };
  return cd;
}

function createPlainTextSelection(name, start = 0, end = 1) {
  let pts = {
    "@guid": guid(),
    "@name": name,
    "@creatingUser": guidDB.DefaultUser,
    "@creationDateTime": getNowDateTime(),
    "@startPosition": start,
    "@endPosition": end,
  };
  return pts;
}

// Utils

function formatDate(dateTime) {
  return dateTime.toUTC().toFormat("yyyy-LL-dd'T'hh:mm:ss'Z'");
}

function getNowDateTime() {
  return DateTime.utc().toFormat("yyyy-LL-dd'T'hh:mm:ss'Z'");
}

function guid() {
  return uuidv4().toUpperCase();
}

function registerGuidDB(key) {
  guidDB[key] = guid();
  return guidDB[key];
}

function orderCommitsPerAscendingDate(a, b) {
  if (a.author.timestamp < b.author.timestamp) {
    return -1;
  }
  if (a.author.timestamp == b.author.timestamp) {
    return 0;
  }
  return 1;
}
