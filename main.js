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
const GitLogLoader = require("./src/gitLogLoader");
const loader = new GitLogLoader();

let mainWindow;

let guidDB = {};

app.whenReady().then(() => {
  mainWindow = createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  const clonePath = path.join(app.getPath("temp"), "clone");
  const gitData = processGitData(clonePath);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

const processGitData = async (clonePath) => {
  let result = await loader.loadFrom(
    "enricllagostera/sample_webgame_repo",
    clonePath
  );
  //console.log(result);
  mainWindow.webContents.send("gitlog", JSON.stringify(result));
  createProjectFile(result);
  return result;
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

const createProjectFile = async (commitsData) => {
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
      "@name": "enricllagostera-sample_webgame_repo",
      "@creatingUserGUID": guidDB.DefaultUser,
      "@creationDateTime": formatDate(DateTime.now()),
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
  commitsData.sort((a, b) => {
    if (a.author.timestamp < b.author.timestamp) {
      return -1;
    }
    if (a.author.timestamp == b.author.timestamp) {
      return 0;
    }
    return 1;
  });
  commitsData.forEach((commit, i) => {
    commit.codeName = `${String(i + 1).padStart(4, "0")} #${commit.hashAbbrev}`;
    commit.codeGuid = registerGuidDB(commit.codeName);
    const codeForCommit = createCode(commit.codeName, commit.codeGuid);
    xml.Project.CodeBook.Codes.Code[0].Code.push(codeForCommit);
    createSourceFilesFromCommit(xml, commit, qdpxSourcesPath);
  });

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
    `${commit.codeName} Raw data`,
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
  dateTime = getNowDateTime()
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
  fs.writeFileSync(
    path.join(qdpxSourcesPath + `/${guid_ext}.${ext}`),
    textData
  );
  fs.writeFileSync(path.join(qdpxSourcesPath + `/${guid_txt}.txt`), textData);
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
