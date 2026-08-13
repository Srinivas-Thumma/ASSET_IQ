import React, { useState } from 'react';
import { Plus, Edit, Trash2, Users, Building2 } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import Breadcrumbs from '../../components/ui/Breadcrumbs.jsx';
import { useDashboard } from '../../hooks/useDashboard.js';
import { useToast } from '../../components/ui/ToastProvider.jsx';

export const Departments = () => {
  const { departments, createDepartment, updateDepartment, deleteDepartment } = useDashboard();
  const toast = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditingItem(null);
    setName('');
    setCode('');
    setIsOpen(true);
  };

  const openEditModal = (dept) => {
    setEditingItem(dept);
    setName(dept.name);
    setCode(dept.code);
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      await deleteDepartment(id);
      toast.success('Department deleted');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast.error('Name and Code are required');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateDepartment({
          id: editingItem._id,
          data: { name: name.trim(), code: code.trim() }
        });
        toast.success('Department updated successfully');
      } else {
        await createDepartment({ name: name.trim(), code: code.trim() });
        toast.success('Department created successfully');
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
      header: 'Code',
      accessor: 'code',
      className: 'w-32',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded-[6px] border border-purple-200 dark:border-purple-800">
          {row.code}
        </span>
      )
    },
    {
      header: 'Department / Business Unit',
      accessor: 'name',
      className: 'font-semibold text-slate-900 dark:text-white',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center border border-purple-200 dark:border-purple-800">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="font-bold text-[#1E293B] dark:text-white">{row.name}</span>
        </div>
      )
    },
    {
      header: 'Active Staff Allocation',
      accessor: 'employeeCount',
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-medium">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.employeeCount || 0} employees</span>
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <Breadcrumbs
        items={[
          { label: 'Administration', to: '/dashboard' },
          { label: 'Departments' }
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#1E293B] dark:text-white tracking-tight mb-2">
            Departments & Cost Centers
          </h1>
          <p className="text-sm text-[#64748B] dark:text-slate-400 mb-6">
            Manage corporate business units, organizational divisions, and departmental asset assignment pools.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={openCreateModal}>
          Add New Department
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={departments}
        searchPlaceholder="Search departments..."
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
        title={editingItem ? 'Edit Department' : 'Provision Department'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} loading={isSubmitting}>
              {editingItem ? 'Update Department' : 'Save Department'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <Input
            label="Department Name"
            required
            placeholder="e.g. Engineering, Sales & Marketing, Human Resources"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Department Code"
            required
            placeholder="e.g. ENG, MKTG, HR, FIN"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
};

export default Departments;
