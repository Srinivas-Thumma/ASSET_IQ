import React, { useState } from 'react';
import { Plus, Edit, Trash2, Clock, Tag } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import Breadcrumbs from '../../components/ui/Breadcrumbs.jsx';
import { useDashboard } from '../../hooks/useDashboard.js';
import { useToast } from '../../components/ui/ToastProvider.jsx';

export const Categories = () => {
  const { categories, createCategory, updateCategory, deleteCategory } = useDashboard();
  const toast = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [name, setName] = useState('');
  const [expectedLifespanMonths, setExpectedLifespanMonths] = useState(36);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditingItem(null);
    setName('');
    setExpectedLifespanMonths(36);
    setIsOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingItem(cat);
    setName(cat.name);
    setExpectedLifespanMonths(cat.expectedLifespanMonths || 36);
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      await deleteCategory(id);
      toast.success('Category removed');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateCategory({
          id: editingItem._id,
          data: { name: name.trim(), expectedLifespanMonths: Number(expectedLifespanMonths) }
        });
        toast.success('Category updated successfully');
      } else {
        await createCategory({
          name: name.trim(),
          expectedLifespanMonths: Number(expectedLifespanMonths)
        });
        toast.success('Category provisioned successfully');
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
      header: 'Category Classification',
      accessor: 'name',
      className: 'font-semibold text-slate-900 dark:text-white',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center border border-purple-200 dark:border-purple-800">
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white block">{row.name}</span>
            <span className="text-[10px] text-slate-400 font-mono">ID: {row._id.slice(-6)}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Standard Lifespan Benchmark',
      accessor: 'expectedLifespanMonths',
      render: (row) => {
        const months = row.expectedLifespanMonths || 36;
        const maxMonths = 60;
        const pct = Math.min(100, Math.round((months / maxMonths) * 100));

        return (
          <div className="space-y-1 w-48">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {months} Months
              </span>
              <span className="text-[10px] text-slate-400 font-medium">({(months / 12).toFixed(1)} yrs)</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#6D28D9] h-full rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      header: 'Cataloged Assets',
      accessor: 'assetCount',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          {row.assetCount || 0} tracked devices
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <Breadcrumbs
        items={[
          { label: 'Administration', to: '/dashboard' },
          { label: 'Asset Categories' }
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#1E293B] dark:text-white tracking-tight mb-2">
            Asset Categories & Lifespan Benchmarks
          </h1>
          <p className="text-sm text-[#64748B] dark:text-slate-400 mb-6">
            Define equipment classifications and their standard useful lifespan benchmarks to auto-calculate retirement schedules.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={openCreateModal}>
          Add New Category
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={categories}
        searchPlaceholder="Search categories..."
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
        title={editingItem ? 'Edit Category' : 'Provision Asset Category'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} loading={isSubmitting}>
              {editingItem ? 'Update Category' : 'Save Category'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <Input
            label="Category Name"
            required
            placeholder="e.g. Laptop, Server, Display Monitor, Mobile Workstation"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Expected Standard Lifespan (Months)"
            type="number"
            required
            min={1}
            max={120}
            value={expectedLifespanMonths}
            onChange={(e) => setExpectedLifespanMonths(e.target.value)}
          />
          <p className="text-[11px] text-slate-400">
            Hardware registered in this category will automatically compute expected retirement dates based on purchase date + lifespan.
          </p>
        </form>
      </Modal>
    </div>
  );
};

export default Categories;
