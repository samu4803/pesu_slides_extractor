chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
  let response = await chrome.tabs.sendMessage(tabs[0].id, {}, (res) => {

    if (res == null || Object.hasOwn(res, "Error")) {

      window.addEventListener("load", (event) => {

        let mainLoader = document.getElementById("mainLoader");
        let errorMsg = document.createElement("h3");

        mainLoader.style.display = "none";
        errorMsg.innerHTML = "open the slides list page of any unit";
        errorMsg.style.color = "black";
        errorMsg.style.margin = "10px 10px 10px 10px";
        document.body.append(errorMsg);

      });
    } else {

      let mergePdfDownload = document.getElementById("mergeButton");
      let downloadAll = document.getElementById("downloadButton");
      let loader = document.getElementById("loader");
      let buttonLoaderDiv = document.getElementById("buttonLoader");
      let table = document.getElementsByTagName("table")[0];
      let mainLoader = document.getElementById("mainLoader");
      let randomFact = document.getElementById("randomFact");
      let linkButtons = [];
      
      mainLoader.style.display = "none";
      loader.style.display = "none";
      buttonLoaderDiv.style.display = "flex";
      table.style.display = "block";
      
      randomFact.innerHTML = randomFactsList[Math.floor(Math.random() * randomFactsList.length)];
      
      mergePdfDownload.disabled = false;
      downloadAll.disabled = false;
      
      mergePdfDownload.onclick = async () => {
        if (!res.canMerge) {

          alert("Files cannot be merged as it contains files other than pdf");
        
        } else {
          const pdfDoc = await PDFLib.PDFDocument.create();
          
          mergePdfDownload.disabled = true;
          loader.style.display = "block";
          
          for (let i = 0; i < res.value.length; i++) {
           
            //download the document
            const tempPdfBytes = await fetch(
              "https://www.pesuacademy.com" + res.value[i].link
            ).then((value) => {
              return value.arrayBuffer();
            });

            //convert the document into pdf document object
            const tempPdfDoc = await PDFLib.PDFDocument.load(tempPdfBytes, {
              ignoreEncryption: true,
            });

            for (let j = 0; j < tempPdfDoc.getPageCount(); j++) {
              const [page] = await pdfDoc.copyPages(tempPdfDoc, [j]);
              pdfDoc.addPage(page);
            }

          }
          pdfDoc.save().then((value) => {

            var blob = new Blob([value], { type: "application/pdf" });
            var link = document.createElement("a");
            var fileName = "Merged Pdf: " + res.name;
            
            link.href = window.URL.createObjectURL(blob);
            link.download = fileName;
            
            link.click();
            
            mergePdfDownload.disabled = false;
            loader.style.display = "none";
          
          });
        }
      };

      downloadAll.onclick = () => {
        downloadAll.disabled = true;
        loader.style.display = "block";
        linkButtons.forEach(async (ele, index) => {
          setTimeout(() => {
            ele.click();
            if (index == linkButtons.length - 1) {
              loader.style.display = "none";
              downloadAll.disabled = false;
            }
          }, index * 950);
        });
      };

      res.value.forEach((element, index) => {

        let row = document.createElement("tr");
        let slNo = document.createElement("td");
        let link = document.createElement("td");
        let button = document.createElement("button");

        slNo.innerHTML = index + 1;
        slNo.style.width = "25px";
        button.classList.add("link");
        button.style.display = "block";
        button.innerHTML = element.name;
        button.onclick = async () => {

          loader.style.display = "block";
          await fetch(
            "https://www.pesuacademy.com" + element.link.toString().trim(),
            { responseType: "arraybuffer" },
          ).then((value) => {

            value.blob().then((blobElement) => {

              var link = document.createElement("a");
              var fileName = index + 1 + " " + String(element.name);
              
              link.href = window.URL.createObjectURL(blobElement);
              link.download = fileName;
              loader.style.display = "none";
              link.click();
            
            });

          });
        };

        linkButtons.push(button);
        row.append(slNo, link);
        link.appendChild(button);
        table.appendChild(row);
        
      });
    }
  });
});
