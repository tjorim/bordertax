import { useEffect } from "react";

/** Sets the document title for the mounted route so tabs and history entries differ. */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
