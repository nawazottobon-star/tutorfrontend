import { useState, useCallback } from 'react';

export function useEmailSelection() {
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());

  const toggleEmailSelection = useCallback((email: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedEmails(new Set());
  }, []);

  const toggleSelectAll = useCallback((emails: string[]) => {
    setSelectedEmails((prev) => {
      const allSelected = emails.every((email) => prev.has(email));
      const next = new Set(prev);
      if (allSelected) {
        emails.forEach((email) => next.delete(email));
      } else {
        emails.forEach((email) => next.add(email));
      }
      return next;
    });
  }, []);

  const isAllSelected = useCallback((emails: string[]) => {
    return emails.length > 0 && emails.every((email) => selectedEmails.has(email));
  }, [selectedEmails]);

  const isSomeSelected = useCallback((emails: string[]) => {
    return emails.some((email) => selectedEmails.has(email)) && !isAllSelected(emails);
  }, [selectedEmails, isAllSelected]);

  return {
    selectedEmails,
    toggleEmailSelection,
    clearSelection,
    toggleSelectAll,
    isAllSelected,
    isSomeSelected,
  };
}
