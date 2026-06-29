import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Building2, Landmark, Pencil, Search, Trash2, UserPlus, UserRound } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ContactForm from "@/components/forms/ContactForm";
import BankAccountForm from "@/components/forms/BankAccountForm";
import { useAuth } from "@/contexts/AuthContext";
import {
  useBankAccountsQuery,
  useContactsQuery,
  useDeleteBankAccountMutation,
  useDeleteContactMutation,
} from "@/hooks/useContacts";
import type { BankAccount, Contact, ContactType } from "@/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ContactSection = ContactType | "bank-accounts";

const sectionLabels: Record<ContactSection, string> = {
  customer: "Customer Contacts",
  supplier: "Supplier Contacts",
  "bank-accounts": "Bank Accounts",
};

const sectionDescriptions: Record<ContactSection, string> = {
  customer: "Customer records with phone, email, and address details.",
  supplier: "Supplier directory for procurement and follow-up.",
  "bank-accounts": "Active and inactive banking accounts for the shop.",
};

const emptyContact = null;
const emptyBankAccount = null;

const ContactsPage = () => {
  const { user } = useAuth();
  const canEdit = user?.role === "owner";
  const [searchParams, setSearchParams] = useSearchParams();
  const rawSection = searchParams.get("section");
  const section = useMemo<ContactSection>(() => {
    if (rawSection === "customer" || rawSection === "supplier" || rawSection === "bank-accounts") {
      return rawSection;
    }
    return "customer";
  }, [rawSection]);
  const [search, setSearch] = useState("");
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [bankFormOpen, setBankFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editingBankAccount, setEditingBankAccount] = useState<BankAccount | null>(null);
  const [deleteContactTarget, setDeleteContactTarget] = useState<Contact | null>(null);
  const [deleteBankTarget, setDeleteBankTarget] = useState<BankAccount | null>(null);

  useEffect(() => {
    if (rawSection !== section) {
      setSearchParams({ section }, { replace: true });
    }
  }, [rawSection, section, setSearchParams]);

  const contactsQuery = useContactsQuery(
    section === "bank-accounts" ? "customer" : section,
    section !== "bank-accounts"
  );
  const bankAccountsQuery = useBankAccountsQuery();
  const deleteContactMutation = useDeleteContactMutation();
  const deleteBankMutation = useDeleteBankAccountMutation();

  const items: Contact[] | BankAccount[] =
    section === "bank-accounts" ? bankAccountsQuery.data ?? [] : contactsQuery.data ?? [];

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item) => {
      if (section === "bank-accounts") {
        const account = item as BankAccount;
        return [
          account.bankName,
          account.accountHolderName,
          account.accountNumber,
          account.ifscRoutingCode,
        ].some((value) => value.toLowerCase().includes(query));
      }

      const contact = item as Contact;
      return [
        contact.name,
        contact.phone,
        contact.email ?? "",
        contact.companyName ?? "",
        contact.address ?? "",
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [items, search, section]);

  const isLoading = section === "bank-accounts" ? bankAccountsQuery.isLoading : contactsQuery.isLoading;
  const error = section === "bank-accounts" ? bankAccountsQuery.error : contactsQuery.error;

  const openCreate = () => {
    if (section === "bank-accounts") {
      setEditingBankAccount(null);
      setBankFormOpen(true);
      return;
    }

    setEditingContact(null);
    setContactFormOpen(true);
  };

  const openEdit = (item: Contact | BankAccount) => {
    if (section === "bank-accounts") {
      setEditingBankAccount(item as BankAccount);
      setBankFormOpen(true);
      return;
    }

    setEditingContact(item as Contact);
    setContactFormOpen(true);
  };

  const handleDelete = async () => {
    try {
      if (section === "bank-accounts" && deleteBankTarget) {
        await deleteBankMutation.mutateAsync(deleteBankTarget.id);
        toast.success(`${deleteBankTarget.bankName} deleted.`);
        setDeleteBankTarget(null);
        return;
      }

      if (deleteContactTarget) {
        await deleteContactMutation.mutateAsync(deleteContactTarget.id);
        toast.success(`${deleteContactTarget.name} deleted.`);
        setDeleteContactTarget(null);
      }
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Failed to delete record.";
      toast.error(message);
    }
  };

  const isDeleting =
    deleteContactMutation.isPending || deleteBankMutation.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Contacts module
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{sectionLabels[section]}</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {sectionDescriptions[section]}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { key: "customer", label: "Customers", icon: UserRound },
              { key: "supplier", label: "Suppliers", icon: Building2 },
              { key: "bank-accounts", label: "Bank Accounts", icon: Landmark },
            ].map(({ key, label, icon: Icon }) => {
              const active = section === key;
              return (
                <button
                  key={key}
                  onClick={() => setSearchParams({ section: key }, { replace: true })}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                    active
                      ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="block text-xs opacity-80">{active ? "Active view" : "Open section"}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search ${sectionLabels[section].toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredItems.length}</span> record
              {filteredItems.length !== 1 ? "s" : ""}
            </div>
            {canEdit && (
              <Button onClick={openCreate}>
                <UserPlus className="mr-2 h-4 w-4" />
                {section === "bank-accounts" ? "Add Account" : "Add Contact"}
              </Button>
            )}
          </div>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Loading records...</p>}

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load records."}
          </p>
        )}

        {!isLoading && !error && (
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            {section === "bank-accounts" ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Bank</th>
                    <th className="px-5 py-3 font-medium">Account Holder</th>
                    <th className="px-5 py-3 font-medium">Account Number</th>
                    <th className="px-5 py-3 font-medium">Routing Code</th>
                    <th className="px-5 py-3 font-medium text-center">Status</th>
                    {canEdit && <th className="px-5 py-3 font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 6 : 5} className="px-5 py-10 text-center text-sm text-muted-foreground">
                        No bank accounts found.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((account) => (
                      <tr
                        key={account.id}
                        className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/50"
                      >
                        <td className="px-5 py-3 font-medium text-card-foreground">{account.bankName}</td>
                        <td className="px-5 py-3 text-muted-foreground">{account.accountHolderName}</td>
                        <td className="px-5 py-3 font-mono text-xs text-card-foreground">{account.accountNumber}</td>
                        <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{account.ifscRoutingCode}</td>
                        <td className="px-5 py-3 text-center">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              account.isActive ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"
                            }`}
                          >
                            {account.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        {canEdit && (
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                aria-label={`Edit ${account.bankName}`}
                                onClick={() => openEdit(account)}
                                className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                aria-label={`Delete ${account.bankName}`}
                                onClick={() => setDeleteBankTarget(account)}
                                className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Phone</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">Company</th>
                    <th className="px-5 py-3 font-medium">Address</th>
                    {canEdit && <th className="px-5 py-3 font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 6 : 5} className="px-5 py-10 text-center text-sm text-muted-foreground">
                        No contacts found.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((contact) => (
                      <tr
                        key={contact.id}
                        className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/50"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                contact.type === "customer"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-secondary text-secondary-foreground"
                              }`}
                            >
                              {contact.type}
                            </span>
                            <span className="font-medium text-card-foreground">{contact.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{contact.phone}</td>
                        <td className="px-5 py-3 text-muted-foreground">{contact.email || "-"}</td>
                        <td className="px-5 py-3 text-muted-foreground">{contact.companyName || "-"}</td>
                        <td className="px-5 py-3 text-muted-foreground">{contact.address || "-"}</td>
                        {canEdit && (
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                aria-label={`Edit ${contact.name}`}
                                onClick={() => openEdit(contact)}
                                className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                aria-label={`Delete ${contact.name}`}
                                onClick={() => setDeleteContactTarget(contact)}
                                className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <ContactForm
        mode={editingContact ? "edit" : "create"}
        type={section === "supplier" ? "supplier" : "customer"}
        open={contactFormOpen}
        onOpenChange={(open) => {
          setContactFormOpen(open);
          if (!open) {
            setEditingContact(emptyContact);
          }
        }}
        contact={editingContact ?? undefined}
      />

      <BankAccountForm
        mode={editingBankAccount ? "edit" : "create"}
        open={bankFormOpen}
        onOpenChange={(open) => {
          setBankFormOpen(open);
          if (!open) {
            setEditingBankAccount(emptyBankAccount);
          }
        }}
        account={editingBankAccount ?? undefined}
      />

      <AlertDialog
        open={Boolean(deleteContactTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteContactTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this contact?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-semibold text-foreground">{deleteContactTarget?.name}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteContactTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(deleteBankTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteBankTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this bank account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-semibold text-foreground">{deleteBankTarget?.bankName}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteBankTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default ContactsPage;
