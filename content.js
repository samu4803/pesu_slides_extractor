chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    searchPage()
      .then((value) => {
        sendResponse(value);
      })
      .catch((res) => {
        sendResponse({ Error: "Page Not Loaded" });
      });
  } catch (error) {
    sendResponse({ Error: "Page Not Loaded" });
  }
  return true;
});

async function searchPage() {
  const myCourseTab = document.getElementById("menuTab_653");
  if (myCourseTab == null || myCourseTab == undefined) {
    throw new Error("Error");
  } else if (myCourseTab.className == "active") {
    const rightContentScreen = document.getElementsByClassName(
      "content-right-wrapper"
    )[0];
    const contentInfo = rightContentScreen.getElementsByClassName(
      "course-info-content"
    )[0];
    if (
      rightContentScreen == null ||
      rightContentScreen == undefined ||
      contentInfo == null ||
      contentInfo == undefined
    ) {
      throw new Error("Error");
    }
    let list = contentInfo.getElementsByClassName(
      "nav nav-tabs nav-tabs-white-bg"
    )[1];
    let name = "";
    if ((list.id = "courselistunit")) {
      name = list.getElementsByClassName("active")[0].innerText;
    }
    let table = contentInfo.getElementsByTagName("table")[0];
    let tableRow = table.getElementsByTagName("tr");
    let slidesLink = [];
    for (let i = 1; i < tableRow.length; i++) {
      if (tableRow[i].children[3].innerText != "-") {
        slidesLink[slidesLink.length] = tableRow[i].attributes.onclick.value;
      }
    }
    slidesLink.forEach((element, index) => {
      let temp = String(element).split(",");
      let courseUnitId = String(temp[0].split("'")[1]);
      let subjectId = String(temp[1].replaceAll("'", "").trim());
      let courseContentId = String(temp[2].replaceAll("'", "").trim());
      let classNo = String(temp[3].replaceAll("'", "").trim());
      let type = 2;
      slidesLink[index] = {
        courseUnitId,
        subjectId,
        courseContentId,
        classNo,
        type,
        gotPdfLink: false,
        pdfLink: "",
      };
    });
    let linksGot = await getPdfLinks(slidesLink);
    return { value: linksGot.extractedPdfLinks, canMerge:!linksGot.downloadcoursedoc , name: name };
  }
}

async function getPdfLinks(pdfLinkList = []) {
  let extractedPdfLinks = [];
  let downloadcoursedoc=false;
  for (let i = 0; i < pdfLinkList.length; i++) {
    if (!pdfLinkList[i].gotPdfLink) {
      // --- Start of Pure JS conversion ---

      // 1. Get the CSRF token from the meta tag
      const csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        .getAttribute("content");

      // 2. Define the data object
      const data = {
        url: "studentProfilePESUAdmin",
        controllerMode: 6403,
        actionType: 60,
        selectedData: pdfLinkList[i].subjectId,
        id: 2,
        unitid: pdfLinkList[i].courseUnitId,
        menuId: "1",
      };

      // 3. Create URL-encoded query parameters
      const params = new URLSearchParams(data);

      // 4. Construct the full URL
      const url = `studentProfilePESUAdmin?${params.toString()}`;

      // 5. Make the request using fetch
      try {
        const response = await fetch(url, {
          method: "GET", // 'type' becomes 'method'
          headers: {
            "X-CSRF-Token": csrfToken,
          },
        });

        // Check if the request was successful (HTTP status 200-299)
        if (response.ok) {
          // 'data' in jQuery success is the response body.
          // We get it as text since you're calling .split() on it.
          const responseData = await response.text();
          // Your original success logic (unchanged)
          if(responseData.includes("class=\"pesu-icon-unlink\"")){
            let herfLinkExtractor = String(responseData).split(
              'downloadcoursedoc('
            );
            herfLinkExtractor.shift();
            herfLinkExtractor.forEach((element) => {
              let temp=element.split("<span class=\"pesu-icon-arr-right pull-right\" aria-hidden=\"true\"></span>\r\n\t\t\t");
              let nameAndLinkExtraction=temp[0].split("<span class=\"pesu-icon-unlink\" aria-hidden=\"true\"></span>\r\n\t\t\t\t\t")
              let link=nameAndLinkExtraction[0].split("')")
              let name=nameAndLinkExtraction[1].split("\\r")
              link=link[0].split("'")[1]
              name=name[0].trim()
            extractedPdfLinks.push({
              "link":"/Academy/s/referenceMeterials/downloadcoursedoc/"+ link,
              "name": name,
            }); 
          });
          downloadcoursedoc=true;
          }else{
            let herfLinkExtractor = String(responseData).split(
              'onclick="loadIframe('
            );
            herfLinkExtractor.shift();
            herfLinkExtractor.forEach((element) => {
              let temp = element.split("<span")[0];
            let temp1 = temp.split("#view=");
            let sourceLink = temp1[0].replaceAll("'", "");
            let sourceName = temp1[1].split('">')[1];
            console.log(sourceLink)
            extractedPdfLinks.push({
              link: sourceLink,
              name: sourceName,
            });
          });
        }
        pdfLinkList[i].gotPdfLink = true;


        } else {
          // Handle HTTP errors (like 404, 500)
          console.error("HTTP Error:", response.status, response.statusText);
        }
      } catch (error) {
        // This catches network errors (e.g., server down, no internet)
        console.error("Fetch Network Error:", error);
      }

      if (pdfLinkList.every((element) => element.gotPdfLink))
        return {extractedPdfLinks,downloadcoursedoc};
    }
  }
}
