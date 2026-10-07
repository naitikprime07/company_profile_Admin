import { useRef, useState } from "react";
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog";

export default function useConfirmDelete() {
  const resolver = useRef(null);
  const [options, setOptions] = useState(null);
  const close = (result) => {
    resolver.current?.(result);
    resolver.current = null;
    setOptions(null);
  };
  const confirmDelete = (nextOptions) => new Promise((resolve) => {
    resolver.current = resolve;
    setOptions(nextOptions);
  });
  return {
    confirmDelete,
    deleteDialog: options ? <ConfirmDeleteDialog {...options} onCancel={() => close(false)} onConfirm={() => close(true)} /> : null,
  };
}
