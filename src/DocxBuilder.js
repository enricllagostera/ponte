const fs = require("fs-extra");
const path = require("path");
const sanitizeHtml = require("sanitize-html");
const cheerio = require("cheerio");
const { marked } = require("marked");
const { markedXhtml } = require("marked-xhtml");
marked.use(markedXhtml());
const HTMLtoDOCX = require("html-to-docx");
const url = require("url");
const imageToBase64 = require("image-to-base64");

class DocxBuilder {
  convert = async (
    md,
    name = "",
    repoInfo = "",
    commitHash = "",
    baseFolder = "",
    basePath = ""
  ) => {
    const htmlData = marked.parse(md, { gfm: true });
    // https://raw.githubusercontent.com/pippinbarr/itisasifyouweremakinglove/master/process/
    const $ = cheerio.load(htmlData, {});
    for (const el of $("img").toArray()) {
      var old_src = $(el).attr("src");
      if (old_src.startsWith("http") == false) {
        var new_src = url
          .pathToFileURL(path.join(basePath, old_src))
          .toString();
        var new_src = await imageToBase64(path.join(basePath, old_src));
        // var new_src = `https://raw.githubusercontent.com/${repoInfo}/${commitHash}/${baseFolder}/${old_src}`;
        $(el).attr("src", "data:image/png;base64," + new_src);
      }
    }
    const processedHtml = $.xml();
    let sanitizedHtml = sanitizeHtml(processedHtml, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
      allowedSchemesByTag: {
        img: ["file", "https", "http", "data"],
      },
    });

    let docRs = await HTMLtoDOCX(sanitizedHtml, null, {
      footer: true,
      pageNumber: true,
      font: "Roboto",
      fontSize: "12pt",
      title: name,
      decodeUnicode: true,
    });
    return docRs;
  };
}

module.exports = DocxBuilder;
