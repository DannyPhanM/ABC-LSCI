const searchBox = document.querySelector(".enable-search-box");
const overlayBox = document.querySelector(".overlay__search-box");
const searchModal = document.querySelector(".modal__search-box");
const suggestBoxes = document.querySelectorAll(".suggest__search-box");
const detailsBox = document.querySelector(".custom-details");
const mobileSearch = document.querySelector(".mobile__default-search");
const searchInputs = document.querySelectorAll(".search__input");
const hiddenBoxes = document.querySelector(".hidden-box");
const showBoxes = document.querySelector(".show-box");
const holdBoxes = document.querySelector(".hold-box");
const predictiveSearch = document.querySelectorAll(".custom-searchbox");
const resetButton = document.querySelector(".flag-reset");
const loginPopup = document.querySelector(".userdropdown ");
const searchContent = document.querySelector(".search-modal__content");
const closeButton = document.querySelector(".close_all__button");

if (closeButton) {
  closeButton.addEventListener("click", (event) => {
    event.stopPropagation();
    console.log("close click");

    overlayBox.classList.add("hidden");
    searchModal.classList.remove("show-modal__search-box");
    suggestBoxes.forEach((box) => {
      if (box.classList.contains("suggest__search-box__mobile") == false)
        box.classList.add("hidden");
    });
  });
}

function handleEmpty() {
  searchInputs.forEach((input) => {
    if (input.value === "") {
      predictiveSearch.forEach((pre) => {
        pre.removeAttribute("open");
      });
    } else {
      predictiveSearch.forEach((pre) => {
        pre.setAttribute("open", "true");
      });
    }
  });
}
handleEmpty();
searchBox.addEventListener("click", (event) => {
  event.stopPropagation();
  overlayBox?.classList.remove("hidden");
  searchModal?.classList.add("show-modal__search-box");
  suggestBoxes.forEach((box) => box.classList.remove("hidden"));
  loginPopup.classList.add("hidden");

  handleEmpty();
});

document.addEventListener("click", (event) => {
  if (
    !searchBox.contains(event.target) &&
    !searchContent.contains(event.target)
  ) {
    overlayBox?.classList.add("hidden");
    searchModal?.classList.remove("show-modal__search-box");
    suggestBoxes.forEach((box) => {
      if (box.classList.contains("suggest__search-box__mobile") == false)
        box.classList.add("hidden");
    });
  }
});

function handleResize() {
  if (predictiveSearch.length > 0) {
    console.log(predictiveSearch);
    if (window.innerWidth <= 768) {
      if (detailsBox && overlayBox) {
        if (detailsBox && !overlayBox.classList.contains("hidden")) {
          detailsBox.setAttribute("open", "true");
          searchBox.dispatchEvent(new Event("click"));
        }
      } else {
        if (detailsBox && detailsBox.hasAttribute("open")) {
          detailsBox.removeAttribute("open");
          searchBox.dispatchEvent(new Event("click"));
        }
      }
    }
  }
}

handleResize();
let resizeTimerBox;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimerBox);
  resizeTimerSlide = setTimeout(() => {
    handleResize();
  }, 300);
});

function syncSearchInputs(event) {
  searchInputs.forEach((input) => {
    input.value = event.target.value;
    if (event.target.value.trim() === "") {
      showBoxes.classList.add("hidden");
      holdBoxes.classList.remove("hidden");

      predictiveSearch.forEach((pre) => {
        pre.removeAttribute("open");
      });
    } else {
      holdBoxes.classList.add("hidden");
      showBoxes.classList.remove("hidden");
      predictiveSearch.forEach((pre) => {
        pre.setAttribute("open", "true");
      });
    }
  });
}

searchInputs.forEach((input) => {
  input.addEventListener("input", syncSearchInputs);
});

const observer = new MutationObserver((mutationsList) => {
  for (const mutation of mutationsList) {
    if (
      mutation.type === "childList" ||
      // mutation.type === "attributes" ||
      mutation.type === "characterData"
    ) {
      showBoxes.innerHTML = hiddenBoxes.innerHTML;
    }
  }
});

if (observer) {
  observer.observe(hiddenBoxes, {
    childList: true,
    attributes: true,
    characterData: true,
    subtree: true,
  });
}

resetButton.addEventListener("click", (event) => {
  event.stopPropagation();
  event.preventDefault();
  searchInputs.forEach((input) => (input.value = ""));

  overlayBox.classList.add("hidden");
  searchModal.classList.remove("show-modal__search-box");
  suggestBoxes.forEach((box) => box.classList.add("hidden"));
});
