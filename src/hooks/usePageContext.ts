import { useCallback, useEffect, useState } from "react";
import { getActivePage } from "../lib/browser";
import type { PageContext } from "../shared/types";

export function usePageContext() {
  const [page, setPage] = useState<PageContext | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshPage = useCallback(async () => {
    try {
      const activePage = await getActivePage();
      setPage(activePage);
      setError(null);
    } catch (nextError) {
      setPage(null);
      setError(
        nextError instanceof Error ? nextError.message : "无法读取当前页面"
      );
    }
  }, []);

  useEffect(() => {
    void refreshPage();

    const handleActivated = () => void refreshPage();
    const handleUpdated = (
      tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab
    ) => {
      if (tab.active && (changeInfo.status === "complete" || changeInfo.url)) {
        void refreshPage();
      }
    };

    chrome.tabs.onActivated.addListener(handleActivated);
    chrome.tabs.onUpdated.addListener(handleUpdated);
    return () => {
      chrome.tabs.onActivated.removeListener(handleActivated);
      chrome.tabs.onUpdated.removeListener(handleUpdated);
    };
  }, [refreshPage]);

  return { page, pageError: error, refreshPage };
}
