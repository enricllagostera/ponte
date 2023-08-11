const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs-extra");
const { DateTime } = require("luxon");

const { v4: uuidv4 } = require("uuid");
const { XMLBuilder } = require("fast-xml-parser");
const AdmZip = require("adm-zip");

const GitLogLoader = require("./src/gitLogLoader");
const loader = new GitLogLoader();

let mainWindow;

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

  createProjectFile();

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

const createProjectFile = async () => {
  //Prepare template JS object with XML header, elmenets and attributes
  let defaultUser = {
    guid: uuidv4(),
    name: "DEFAULT",
  };
  let baseXmlForQdeFile = {
    "?xml": {
      "@_version": "1.0",
      "@_encoding": "utf-8",
      "@_standalone": "yes",
      Project: {
        "@_name": "enricllagostera-sample_webgame_repo.qda",
        "@_xmlns:xsd": "http://www.w3.org/2001/XMLSchema",
        "@_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "@_creatingUserGUID": defaultUser.guid,
        "@_origin": "RepoToQDA",
        "@_creationDateTime": DateTime.now().toString(),
        "@_xmlns": "urn:QDA-XML:project:1.0",
        Users: [
          {
            User: {
              "@_guid": defaultUser.guid,
              "@_name": defaultUser.name,
            },
          },
        ],
        Sources: {},
        Description: {},
      },
    },
  };
  // Convert JS object to XML string
  const builder = new XMLBuilder({
    arrayNodeName: "commits",
    ignoreAttributes: false,
  });
  const outputXml = builder.build(baseXmlForQdeFile);
  console.log(outputXml);
  // Prepare temp export folder and save XML file as .QDE
  const exportPath = path.join(app.getPath("temp"), "export");
  const exportSourcesPath = path.join(app.getPath("temp"), "export/Sources");
  console.log(exportPath);
  fs.emptyDirSync(exportPath);
  fs.mkdirSync(exportSourcesPath);
  fs.writeFileSync(path.join(exportPath, "project.qde"), outputXml);
  // Add export folder to ZIP, write it to disk as .QDPX file
  let zip = new AdmZip();
  const qdpxPath = path.join(app.getPath("temp"), "qdpx");
  fs.emptyDirSync(qdpxPath);
  await zip.addLocalFolderPromise(exportPath, "");
  await zip.writeZipPromise(path.join(qdpxPath, `project.qdpx`));
  console.log("done qdpx zip packing");
};

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
