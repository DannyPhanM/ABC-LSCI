document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".policy-tab--title");
  const collectionDivs = document.querySelectorAll(".policy-content");

  buttons.forEach((button) => {
    console.log("button");
    button.addEventListener("click", () => {
      buttons.forEach((btn) => btn.removeAttribute("active"));
      button.setAttribute("active", "");

      // const targetId = button.getAttribute("policy-title");

      // collectionDivs.forEach((div) => {
      //   div.style.display = "none";
      // });

      // const targetDiv = document.getElementById(targetId);
      // targetDiv.style.display = "block";

      // Update content

      const rootUrl = window.location.origin; // Base URL (protocol + domain)
      const url = button.getAttribute("page-url");
      console.log(url, "url page");
      const pageUrl = rootUrl + url;
      console.log(pageUrl, "url");

      fetch(pageUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              "Network response was not ok " + response.statusText
            );
          }
          return response.text();
        })
        .then((html) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          const pageContent = doc.querySelector(".policy-content");

          document.querySelector(".policy-content").innerHTML = pageContent
            ? pageContent.innerHTML
            : "No content found";
            window.history.pushState({ path: pageUrl }, '', pageUrl);
        })
        .catch((error) => {
          console.error("Error fetching page content:", error);
          document.querySelector(".policy-content").innerHTML =
            "Failed to load content.";
        });
    });
  });
});
