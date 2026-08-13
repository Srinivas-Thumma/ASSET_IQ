import React, { useState } from 'react';
import { Plus, Edit, Trash2, Mail, Phone, Truck, ExternalLink } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import Breadcrumbs from '../../components/ui/Breadcrumbs.jsx';
import { useDashboard } from '../../hooks/useDashboard.js';
import { useToast } from '../../components/ui/ToastProvider.jsx';

export const Vendors = () => {
  const { vendors, createVendor, updateVendor, deleteVendor } = useDashboard();
  const toast = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [name, setName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditingItem(null);
    setName('');
    setContactEmail('');
    setPhone('');
    setIsOpen(true);
  };

  const openEditModal = (ven) => {
    setEditingItem(ven);
    setName(ven.name);
    setContactEmail(ven.contactEmail || '');
    setPhone(ven.phone || '');
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      await deleteVendor(id);
      toast.success('Vendor record removed');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vendor name is required');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateVendor({
          id: editingItem._id,
          data: { name: name.trim(), contactEmail: contactEmail.trim(), phone: phone.trim() }
        });
        toast.success('Vendor details updated successfully');
      } else {
        await createVendor({
          name: name.trim(),
          contactEmail: contactEmail.trim(),
          phone: phone.trim()
        });
        toast.success('Vendor supplier registered successfully');
      }
      setIsOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Vendor / OEM Supplier',
      accessor: 'name',
      className: 'font-semibold text-slate-900 dark:text-white',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center border border-purple-200 dark:border-purple-800">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-[#1E293B] dark:text-white block">{row.name}</span>
            <span className="text-[10px] text-slate-400 font-mono">ID: {row._id.slice(-6)}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Contact Email',
      accessor: 'contactEmail',
      render: (row) =>
        row.contactEmail ? (
          <a
            href={`mailto:${row.contactEmail}`}
            className="text-xs text-purple-700 dark:text-purple-300 hover:underline flex items-center gap-1.5 font-medium"
          >
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{row.contactEmail}</span>
          </a>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )
    },
    {
      header: 'Phone Support',
      accessor: 'phone',
      render: (row) =>
        row.phone ? (
          <span className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-medium">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{row.phone}</span>
          </span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <Breadcrumbs
        items={[
          { label: 'Administration', to: '/dashboard' },
          { label: 'Vendors & Suppliers' }
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#1E293B] dark:text-white tracking-tight mb-2">
            Vendors & Authorized Suppliers
          </h1>
          <p className="text-sm text-[#64748B] dark:text-slate-400 mb-6">
            Authorized OEMs, hardware distributors, leasing partners, and warranty service providers.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={openCreateModal}>
          Add New Vendor
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={vendors}
        searchPlaceholder="Search suppliers..."
        searchKey="name"
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <Button size="sm" variant="ghost" icon={Edit} onClick={() => openEditModal(row)} />
            <Button size="sm" variant="ghost" icon={Trash2} onClick={() => handleDelete(row._id)} />
          </div>
        )}
      />

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingItem ? 'Edit Vendor' : 'Register Authorized Vendor'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} loading={isSubmitting}>
              {editingItem ? 'Update Vendor' : 'Save Supplier'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <Input
            label="Vendor / Supplier Company Name"
            required
            placeholder="e.g. Dell Enterprise, Apple Authorized, CDW Direct"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Procurement / Support Email"
            type="email"
            placeholder="enterprise@vendor.com"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
          <Input
            label="Dedicated Phone Support Line"
            placeholder="+1 (800) 555-0199"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
};

export default Vendors;
