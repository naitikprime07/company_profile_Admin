import { useEffect, useRef } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import styles from "./ConfirmDeleteDialog.module.css";

export default function ConfirmDeleteDialog({
  title = "Delete this record?",
  description,
  itemName,
  onCancel,
  onConfirm,
}) {
  const confirmButton = useRef(null);
  useEffect(() => {
    confirmButton.current?.focus();
    const handleKey = (event) => event.key === "Escape" && onCancel();
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);
  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onMouseDown={(event) =>
        event.target === event.currentTarget && onCancel()
      }
    >
      <section
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
      >
        <button
          className={styles.close}
          type="button"
          aria-label="Close confirmation"
          onClick={onCancel}
        >
          <X size={16} />
        </button>
        <span className={styles.icon}>
          <AlertTriangle size={24} />
        </span>
        <small>CONFIRM DELETION</small>
        <h2 id="delete-dialog-title">{title}</h2>
        {itemName && <strong className={styles.item}>{itemName}</strong>}
        <p>
          {description ||
            "This action permanently removes the data and cannot be undone."}
        </p>
        <div className={styles.actions}>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button ref={confirmButton} type="button" onClick={onConfirm}>
            <Trash2 size={15} /> Delete permanently
          </button>
        </div>
      </section>
    </div>
  );
}
