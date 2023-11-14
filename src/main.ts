import "./style.css";

const resultElement = document.getElementById("result") as HTMLDivElement;
const inputElement = document.getElementById("pasteBox") as HTMLDivElement;
const copyButtonElement = document.getElementById(
  "copyButton"
) as HTMLButtonElement;
const statusElement = document.getElementById("status") as HTMLSpanElement;

const handlePaste = (e: ClipboardEvent) => {
  const htmlData = e.clipboardData?.getData("text/html");
  if (!htmlData) return;
  inputElement.innerHTML = htmlData;
  const parser = new DOMParser();
  const htmlDoc = parser.parseFromString(htmlData, "text/html");
  const findAndReturnATag = (node: ChildNode): ChildNode[] => {
    if (node.nodeName === "A") {
      if (!node.textContent) {
        node.textContent = '["]';
      }
      return [node];
    }
    return Array.from(node.childNodes).reduce((result, childNode) => {
      const nextATag = findAndReturnATag(childNode);
      result = [...result, ...nextATag];
      return result;
    }, [] as ChildNode[]);
  };

  const stripStyles = (node: ChildNode | HTMLElement) => {
    if (node.nodeType === 1) {
      if (!node.textContent) {
        const aNodes = findAndReturnATag(node);
        if (aNodes.length) {
          const spanTag = document.createElement("span");
          /** node replace inner childs to aNodes elements */
          aNodes.forEach((aNode) => {
            stripStyles(aNode);
            spanTag.appendChild(aNode);
          });
          node.replaceWith(spanTag);
        } else {
          //Nothing useful found
          node.remove();
        }
      } else {
        // Element node
        if ("removeAttribute" in node) {
          node.removeAttribute("style"); // Remove style attribute
          Array.from(node.attributes).forEach((attr) => {
            if (attr.name !== "href") {
              // Preserve href attributes
              node.removeAttribute(attr.name); // Remove other attributes
            }
          });
        }
      }
    }
    Array.from(node.childNodes).forEach(stripStyles); // Recurse through child nodes
  };

  stripStyles(htmlDoc.body);

  const resultHtml = htmlDoc.body.innerHTML;
  if (resultElement) {
    resultElement.innerHTML = resultHtml;
  }
};

if (inputElement) {
  inputElement.addEventListener("paste", handlePaste);
}

if (copyButtonElement) {
  copyButtonElement.addEventListener("click", () => {
    statusElement.innerText = "⏳";
    navigator.clipboard
      .writeText(resultElement.innerHTML)
      .then(() => {
        if (statusElement) {
          statusElement.innerText = "✅";
          setTimeout(() => {
            statusElement.innerText = "📋";
          }, 2000);
        }
      })
      .catch(() => {
        if (statusElement) {
          statusElement.innerText = "❌";
          setTimeout(() => {
            statusElement.innerText = "📋";
          }, 2000);
        }
      });
  });
}
