import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  RemoveFormatting,
  Underline,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./RichTextEditor.module.css";

const tools = [
  { command: "bold", tag: "strong", label: "Bold", Icon: Bold },
  { command: "italic", tag: "em", label: "Italic", Icon: Italic },
  { command: "underline", tag: "u", label: "Underline", Icon: Underline },
  { command: "insertUnorderedList", label: "Bulleted list", Icon: List },
  { command: "insertOrderedList", label: "Numbered list", Icon: ListOrdered },
  { command: "formatBlock", value: "blockquote", label: "Quote", Icon: Quote },
  {
    command: "removeFormat",
    label: "Clear formatting",
    Icon: RemoveFormatting,
  },
];

const fontSizes = ["12", "14", "16", "18", "20", "24", "28", "32"];

const containsRange = (editor, range) =>
  editor && range && editor.contains(range.commonAncestorContainer);

const closestTag = (node, tags, boundary) => {
  let current =
    node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
  while (current && current !== boundary) {
    if (tags.includes(current.tagName?.toLowerCase())) return current;
    current = current.parentElement;
  }
  return null;
};

const selectElementContents = (element) => {
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
  return range;
};

const unwrap = (element) => {
  const parent = element.parentNode;
  const first = element.firstChild;
  const last = element.lastChild;
  if (!parent || !first || !last) return null;
  while (element.firstChild) parent.insertBefore(element.firstChild, element);
  element.remove();
  const range = document.createRange();
  range.setStartBefore(first);
  range.setEndAfter(last);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  return range;
};

export default function RichTextEditor({ value = "", onChange }) {
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);
  const [active, setActive] = useState({});
  const [block, setBlock] = useState("p");
  const [fontSize, setFontSize] = useState("16");
  const pendingFontSizeRef = useRef("16");

  const emitChange = useCallback(() => {
    const editor = editorRef.current;
    if (editor) onChange(editor.innerHTML === "<br>" ? "" : editor.innerHTML);
  }, [onChange]);

  const rememberSelection = useCallback(() => {
    const selection = window.getSelection();
    const editor = editorRef.current;
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!containsRange(editor, range)) {
      setActive({});
      return;
    }
    savedRangeRef.current = range.cloneRange();
    const start = range.startContainer;
    setActive({
      bold:
        Boolean(closestTag(start, ["strong", "b"], editor)) ||
        document.queryCommandState("bold"),
      italic:
        Boolean(closestTag(start, ["em", "i"], editor)) ||
        document.queryCommandState("italic"),
      underline:
        Boolean(closestTag(start, ["u"], editor)) ||
        document.queryCommandState("underline"),
      insertUnorderedList: Boolean(closestTag(start, ["ul"], editor)),
      insertOrderedList: Boolean(closestTag(start, ["ol"], editor)),
    });
    const sizedFont = closestTag(start, ["font"], editor);
    setFontSize(sizedFont?.dataset.fontSize || pendingFontSizeRef.current);
    const currentBlock = document
      .queryCommandValue("formatBlock")
      .replace(/[<>]/g, "")
      .toLowerCase();
    setBlock(
      ["h2", "h3", "blockquote"].includes(currentBlock) ? currentBlock : "p",
    );
  }, []);

  const restoreSelection = () => {
    const editor = editorRef.current;
    const range = savedRangeRef.current;
    editor?.focus({ preventScroll: true });
    if (!containsRange(editor, range)) return false;
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  };

  const finish = (range) => {
    if (range) savedRangeRef.current = range.cloneRange();
    rememberSelection();
    emitChange();
  };

  const run = (command, commandValue = null) => {
    if (!restoreSelection()) return;
    document.execCommand(command, false, commandValue);
    finish(
      window.getSelection()?.rangeCount
        ? window.getSelection().getRangeAt(0)
        : null,
    );
  };

  const runInline = (command, tag) => {
    if (!restoreSelection()) return;
    const selection = window.getSelection();
    const editor = editorRef.current;
    const range = selection.getRangeAt(0);
    const existing = closestTag(
      range.startContainer,
      [tag, tag === "strong" ? "b" : tag === "em" ? "i" : tag],
      editor,
    );
    if (existing) {
      finish(unwrap(existing));
      return;
    }
    if (range.collapsed) {
      document.execCommand(command, false);
      finish(selection.getRangeAt(0));
      return;
    }
    const wrapper = document.createElement(tag);
    wrapper.appendChild(range.extractContents());
    range.insertNode(wrapper);
    finish(selectElementContents(wrapper));
  };

  const runFontSize = (size) => {
    if (!restoreSelection()) return;
    pendingFontSizeRef.current = size;
    setFontSize(size);
    document.execCommand("fontSize", false, "7");
    editorRef.current?.querySelectorAll('font[size="7"]').forEach((node) => {
      node.dataset.fontSize = size;
      node.removeAttribute("size");
    });
    const selection = window.getSelection();
    finish(selection?.rangeCount ? selection.getRangeAt(0) : null);
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (
      editor &&
      document.activeElement !== editor &&
      editor.innerHTML !== value
    ) {
      editor.innerHTML = value;
    }
  }, [value]);

  useEffect(() => {
    document.addEventListener("selectionchange", rememberSelection);
    return () =>
      document.removeEventListener("selectionchange", rememberSelection);
  }, [rememberSelection]);

  return (
    <div className={styles.editorShell}>
      <div
        className={styles.toolbar}
        role="toolbar"
        aria-label="Article formatting"
      >
        <select
          aria-label="Text style"
          value={block}
          onMouseDown={rememberSelection}
          onChange={(event) => {
            setBlock(event.target.value);
            run("formatBlock", event.target.value);
          }}
        >
          <option value="p">Paragraph</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
        <select
          aria-label="Font size"
          value={fontSize}
          onMouseDown={rememberSelection}
          onChange={(event) => runFontSize(event.target.value)}
        >
          {fontSizes.map((size) => (
            <option key={size} value={size}>
              {size}px
            </option>
          ))}
        </select>
        <span />
        {tools.map(({ command, tag, value: commandValue, label, Icon }) => (
          <button
            key={label}
            className={active[command] ? styles.active : ""}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={Boolean(active[command])}
            onMouseDown={(event) => {
              event.preventDefault();
              if (tag) runInline(command, tag);
              else run(command, commandValue);
            }}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        className={styles.editable}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Article content"
        data-placeholder="Write your article here..."
        onBlur={emitChange}
        onInput={() => {
          editorRef.current
            ?.querySelectorAll('font[size="7"]')
            .forEach((node) => {
              node.dataset.fontSize = pendingFontSizeRef.current;
              node.removeAttribute("size");
            });
          rememberSelection();
          emitChange();
        }}
        onKeyUp={rememberSelection}
        onMouseUp={rememberSelection}
      />
    </div>
  );
}
