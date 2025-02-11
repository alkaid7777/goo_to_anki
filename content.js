// Wait for the page to fully load
window.addEventListener("load", function () {
  // Find the word title (original text and reading)
  const wordElement = document.querySelector("#NR-main .basic_title h1");
  const readingElement = document.querySelector("#NR-main .basic_title h1 .yomi");

  // Get the original text, excluding potential <span> tags (such as the reading)
  const word = wordElement
    ? wordElement.childNodes[0].textContent.trim()
    : "";

  // Get the reading (if available)
  const reading = readingElement ? readingElement.innerText.trim() : "";

  // Original text + reading, used for the back of the flashcard
  const wordTitle = reading ? `${word} ${reading}` : word;

  // Find the word definition content
  const meaningContainer = document.querySelector(".content-box.contents_area .contents");
  let wordMeaning = "";

  if (meaningContainer) {
    // Remove <a> tags (keeping inner text) and newline characters
    let rawHTML = meaningContainer.innerHTML
      .replace(/<a[^>]*>(.*?)<\/a>/g, "$1")
      .replace(/\n/g, "")
      .trim();

    // Use a temporary DOM element to process HTML:
    // Remove auto-generated numbering for all <ol> tags and adjust indentation if nested within <li>
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = rawHTML;
    const allOlList = tempDiv.querySelectorAll("ol");
    allOlList.forEach(ol => {
      // Remove automatic numbering
      ol.style.listStyleType = "none";
      ol.style.paddingLeft = "0";
      // If <ol> is nested within <li> (e.g., example sentences), increase indentation
      if (ol.parentElement && ol.parentElement.tagName.toLowerCase() === "li") {
        ol.style.marginLeft = "20px"; // Adjust indentation distance as needed
      } else {
        ol.style.marginLeft = "0";
      }
    });
    // Store the processed HTML
    wordMeaning = tempDiv.innerHTML;
  }

  if (word && wordMeaning) {
    // Ensure the button is not added multiple times
    if (document.getElementById("anki-button")) return;

    // Create a new button
    const button = document.createElement("button");
    button.id = "anki-button";
    button.innerText = "Add to Anki";

    // Set button styles
    button.style.fontSize = "15px";
    button.style.fontWeight = "bold";
    button.style.color = "white";
    button.style.backgroundColor = "#8B4513";  // Goo dictionary's brown color
    button.style.border = "2px solid #5A2D0C";
    button.style.marginLeft = "100px";
    button.style.cursor = "pointer";
    button.style.borderRadius = "5px";

    // Set hover effects
    button.addEventListener("mouseover", function () {
      button.style.backgroundColor = "#A0522D";
    });
    button.addEventListener("mouseout", function () {
      button.style.backgroundColor = "#8B4513";
    });

    // Set click event to add the word to Anki
    button.addEventListener("click", function () {
      if (!word || !wordMeaning) {
        alert("❌ Word or definition not found. Please check the HTML structure!");
        return;
      }
      // Back content: first display the original text + reading, followed by a line break and then the definition
      const backContent = `${wordTitle}${wordMeaning}`;
      addToAnki(word, backContent);
    });

    // Insert the button after the word title
    wordElement.appendChild(button);
  } else {
    console.warn("Word title or definition not found. Please check the HTML structure!");
  }
});

// Add a flashcard to Anki
function addToAnki(front, back) {
  fetch("http://127.0.0.1:8765", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "addNote",
      version: 6,
      params: {
        note: {
          deckName: "test",  // Deck name
          modelName: "基本型",  // Card type
          fields: {
            正面: front,
            背面: back
          },
          options: {
            allowDuplicate: false
          },
        }
      }
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      alert(`❌ Failed to add to Anki: ${data.error}`);
    } else {
      alert(`✅ Successfully added to Anki!\nWord: ${front}`);
    }
  })
  .catch(error => {
    alert("❌ Failed to connect to Anki. Please ensure AnkiConnect is installed and running!");
    console.error("AnkiConnect Error:", error);
  });
}
