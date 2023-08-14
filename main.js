const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs-extra");
const { DateTime } = require("luxon");

const { create } = require("xmlbuilder2");

const { v4: uuidv4 } = require("uuid");
const AdmZip = require("adm-zip");

const GitLogLoader = require("./src/gitLogLoader");
const loader = new GitLogLoader();

let mainWindow;

let guidDB = {};

console.log(GitLogLoader);

app.whenReady().then(() => {
  mainWindow = createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  const clonePath = path.join(app.getPath("temp"), "clone");
  const gitData = processGitData(clonePath);
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
  const exportPath = path.join(app.getPath("temp"), "repo-to-qda/export");
  const exportSourcesPath = path.join(
    app.getPath("temp"),
    "repo-to-qda/export/Sources"
  );
  fs.emptyDirSync(exportPath);
  fs.mkdirSync(exportSourcesPath);
  console.log(exportPath);
  //Prepare template JS object with XML header, elmenets and attributes
  let defaultUser = {
    guid: uuidv4(),
    name: "DEFAULT",
  };
  guidDB.CommitAuthor = uuidv4();
  guidDB.DefaultUser = defaultUser.guid;
  guidDB.TimestampISO = uuidv4();

  let baseXmlForQdeFile = {
    Project: {
      "@name": "enricllagostera-sample_webgame_repo.qda",
      "@xmlns:xsd": "http://www.w3.org/2001/XMLSchema",
      "@xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
      "@creatingUserGUID": guidDB.DefaultUser,
      "@origin": "RepoToQDA",
      "@creationDateTime": DateTime.now().toString(),
      "@xmlns": "urn:QDA-XML:project:1.0",
      Users: [
        {
          User: {
            "@guid": defaultUser.guid,
            "@name": defaultUser.name,
          },
        },
      ],
      Sources: { TextSource: [] },
      Description: {},
      Cases: { Case: [] },
      Variables: {
        Variable: [
          {
            "@name": "TimestampISO",
            "@guid": guidDB.TimestampISO,
            "@typeOfVariable": "Text",
          },
          {
            "@name": "CommitAuthor",
            "@guid": guidDB.CommitAuthor,
            "@typeOfVariable": "Text",
          },
        ],
      },
    },
  };
  // Create cases from commits
  commitsData.forEach((commit) => {
    createJSONFromCommit(baseXmlForQdeFile, commit, exportSourcesPath);
    console.log(guidDB[`${commit.hashAbbrev}__raw_data`]);
    let newCase = {
      "@name": commit.hashAbbrev + ": " + commit.subject,
      "@guid": uuidv4(),
      Description: {
        "#":
          "Commit " +
          commit.hashAbbrev +
          ": " +
          commit.subject +
          " created on " +
          DateTime.fromMillis(commit.author.timestamp).toLocaleString(),
      },
      VariableValue: [],
      SourceRef: {
        "@targetGUID": guidDB[`${commit.hashAbbrev}__raw_data`],
      },
    };
    newCase.VariableValue.push(
      createVariableValueText(
        guidDB.TimestampISO,
        DateTime.fromMillis(commit.author.timestamp).toISO()
      )
    );
    newCase.VariableValue.push(
      createVariableValueText(guidDB.CommitAuthor, commit.author.name)
    );
    baseXmlForQdeFile.Project.Cases.Case.push(newCase);
  });
  //console.log("\n" + JSON.stringify(baseXmlForQdeFile));

  // Convert JS object to XML string
  let doc = {};
  try {
    doc = create(
      { version: "1.0", encoding: "utf-8", standalone: "yes" },
      baseXmlForQdeFile
    );
  } catch (error) {
    console.log(error);
  }
  const outputXml = doc.end({ prettyPrint: true });
  fs.writeFileSync(path.join(exportPath, "project.qde"), outputXml);
  // Add export folder to ZIP, write it to disk as .QDPX file
  let zip = new AdmZip();
  const qdpxPath = path.join(app.getPath("temp"), "repo-to-qda/qdpx");
  fs.emptyDirSync(qdpxPath);
  await zip.writeZipPromise(path.join(qdpxPath, `project.qdpx`));
  console.log("done qdpx zip packing");
};

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

function createJSONFromCommit(baseXml, commit, sourcesPath) {
  let ts = createTextSourceObject(
    `commit_data_${commit.hashAbbrev}`,
    `Raw commit data for ${
      commit.hashAbbrev
    }. Commit from ${DateTime.fromMillis(
      commit.author.timestamp
    ).toLocaleString()}.`
  );
  guidDB[commit.hashAbbrev + "__raw_data"] = ts["@guid"];
  baseXml.Project.Sources.TextSource.push(ts);

  fs.writeFileSync(
    path.join(sourcesPath + `/${guidDB[commit.hashAbbrev + "__raw_data"]}.txt`),
    JSON.stringify(commit, undefined, "\t")
  );
}

function createTextSourceObject(sourceName, sourceDescription) {
  const guid = uuidv4();
  let textSource = {
    "@guid": guid,
    "@name": sourceName,
    "@plainTextPath": `internal://${guid}.txt`,
    "@creatingUser": guidDB.DefaultUser,
    "@creationDateTime": DateTime.now().toString(),
    Description: {
      "#": sourceDescription,
    },
  };
  return textSource;
}

function createVariableValueText(targetGUID, value) {
  let vv = {
    VariableRef: {
      "@targetGUID": targetGUID,
    },
    TextValue: { "#": value },
  };
  return vv;
}
