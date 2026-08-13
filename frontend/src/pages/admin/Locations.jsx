import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Building,
  Layers,
  DoorOpen,
  MapPin,
  Plus,
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  Laptop,
  FolderTree,
  Search
} from 'lucide-react';
import api from '../../api/axios.config.js';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Breadcrumbs from '../../components/ui/Breadcrumbs.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { useToast } from '../../components/ui/ToastProvider.jsx';

export const Locations = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [expandedNodes, setExpandedNodes] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('building'); // 'building' | 'branch' | 'floor' | 'room' | 'zone'
  const [parentId, setParentId] = useState('');
  const [address, setAddress] = useState('');

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await api.get('/locations');
      return response.data?.data || response.data || [];
    }
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const response = await api.get('/assets');
      return response.data?.data || response.data || [];
    }
  });

  // Calculate asset counts per location node
  const assetCountMap = useMemo(() => {
    const map = {};
    assets.forEach((a) => {
      const locId = a.locationId?._id || a.locationId;
      if (locId) {
        map[locId] = (map[locId] || 0) + 1;
      }
    });
    return map;
  }, [assets]);

  // Build hierarchical 3-level tree: Buildings/Branches -> Floors -> Rooms/Zones
  const locationTree = useMemo(() => {
    const rootNodes = [];
    const nodeMap = {};

    locations.forEach((loc) => {
      nodeMap[loc._id] = { ...loc, children: [] };
    });

    locations.forEach((loc) => {
      if (loc.parentId && nodeMap[loc.parentId]) {
        nodeMap[loc.parentId].children.push(nodeMap[loc._id]);
      } else if (!loc.parentId || ['building', 'branch'].includes(loc.type)) {
        rootNodes.push(nodeMap[loc._id]);
      } else {
        rootNodes.push(nodeMap[loc._id]);
      }
    });

    return rootNodes;
  }, [locations]);

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingLocation) {
        return await api.put(`/locations/${editingLocation._id}`, payload);
      }
      return await api.post('/locations', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success(editingLocation ? 'Location updated' : 'Location created in hierarchy');
      setIsModalOpen(false);
      setEditingLocation(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await api.delete(`/locations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Location node removed');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete location');
    }
  });

  const toggleExpand = (id) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenCreate = (parent = null) => {
    setEditingLocation(null);
    setName('');
    setCode('');
    setAddress('');
    if (parent) {
      setParentId(parent._id);
      if (['building', 'branch'].includes(parent.type)) {
        setType('floor');
      } else if (parent.type === 'floor') {
        setType('room');
      } else {
        setType('zone');
      }
    } else {
      setParentId('');
      setType('building');
    }
    setIsModalOpen(true);
  };

  const handleOpenEdit = (loc) => {
    setEditingLocation(loc);
    setName(loc.name || '');
    setCode(loc.code || '');
    setType(loc.type || 'building');
    setParentId(loc.parentId || '');
    setAddress(loc.address || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast.error('Name and Code are required');
      return;
    }
    saveMutation.mutate({
      name: name.trim(),
      code: code.trim(),
      type,
      parentId: parentId || null,
      address: ['building', 'branch'].includes(type) ? address : ''
    });
  };

  // Filter valid parent options based on currently selected type:
  // - Floor: can only belong to Building / Branch
  // - Room/Zone: can only belong to Floor (or Building/Branch fallback)
  // - Building/Branch: top level (no parent required)
  const validParentOptions = useMemo(() => {
    if (type === 'floor') {
      return locations
        .filter((l) => ['building', 'branch'].includes(l.type))
        .map((l) => ({ value: l._id, label: `${l.name} (${l.code}) • Building/HQ` }));
    }
    if (type === 'room' || type === 'zone') {
      return locations
        .filter((l) => l.type === 'floor' || ['building', 'branch'].includes(l.type))
        .map((l) => ({ value: l._id, label: `${l.name} (${l.code}) • ${l.type.toUpperCase()}` }));
    }
    return [];
  }, [locations, type]);

  const getNodeIcon = (nodeType) => {
    switch (nodeType) {
      case 'branch':
        return Building;
      case 'building':
        return Building2;
      case 'floor':
        return Layers;
      case 'room':
        return DoorOpen;
      case 'zone':
      default:
        return MapPin;
    }
  };

  const renderTreeNode = (node, depth = 0) => {
    const isExpanded = expandedNodes[node._id] ?? true;
    const hasChildren = node.children && node.children.length > 0;
    const NodeIcon = getNodeIcon(node.type);
    const assetCount = assetCountMap[node._id] || 0;

    return (
      <div key={node._id} className="space-y-1">
        <div
          className={`flex items-center justify-between p-3 rounded-[12px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-purple-200 dark:hover:border-purple-900 transition-all ${
            depth === 0 ? 'ml-0' : depth === 1 ? 'ml-6' : 'ml-12'
          }`}
        >
          <div className="flex items-center gap-3">
            {/* Expand / Collapse Chevron */}
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(node._id)}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-6" />
            )}

            {/* Type Icon */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                depth === 0
                  ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
                  : depth === 1
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800'
                  : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
              }`}
            >
              <NodeIcon className="w-4 h-4" />
            </div>

            {/* Title & Metadata */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#1E293B] dark:text-white">
                  {node.name}
                </span>
                <span className="text-[10px] font-mono font-bold text-purple-600 bg-purple-50 dark:bg-purple-950 px-1.5 py-0.5 rounded border border-purple-100 dark:border-purple-900">
                  {node.code}
                </span>
                <span className="text-[10px] uppercase font-semibold text-slate-400">
                  {node.type}
                </span>
              </div>
              {node.address && (
                <p className="text-xs text-slate-400 mt-0.5">{node.address}</p>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium inline-flex items-center gap-1">
              <Laptop className="w-3.5 h-3.5 text-slate-400" />
              <strong>{assetCount}</strong> devices
            </span>

            {depth < 2 && (
              <button
                type="button"
                onClick={() => handleOpenCreate(node)}
                className="p-1.5 text-xs text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/60 rounded-md border border-purple-200 dark:border-purple-800 flex items-center gap-1 font-medium cursor-pointer"
                title="Add Sub-Location"
              >
                <Plus className="w-3 h-3" />
                <span className="hidden sm:inline">Add Sub-Location</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleOpenEdit(node)}
              className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer"
              title="Edit Location"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm(`Remove location ${node.name}?`)) {
                  deleteMutation.mutate(node._id);
                }
              }}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md cursor-pointer"
              title="Delete Location"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Children recursive rendering */}
        {hasChildren && isExpanded && (
          <div className="space-y-1.5 pt-1">
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <Breadcrumbs
        items={[
          { label: 'Administration', to: '/dashboard' },
          { label: 'Location Hierarchy' }
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#1E293B] dark:text-white tracking-tight mb-2">
            Location Hierarchy & Facility Maps
          </h1>
          <p className="text-sm text-[#64748B] dark:text-slate-400 mb-6">
            Organize corporate facilities into hierarchical containers (Building / HQ → Floor → Room / Zone).
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => handleOpenCreate(null)}
          className="text-xs"
        >
          Add Building / Site
        </Button>
      </div>

      {/* Tree View Container */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton variant="card" count={3} />
        </div>
      ) : locationTree.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="No Location Hierarchy Defined"
          description="Create your top-level facility or office campus to begin tracking hardware placement."
          actionLabel="Add Main Building / Campus"
          onAction={() => handleOpenCreate(null)}
        />
      ) : (
        <div className="space-y-3">
          {locationTree.map((root) => renderTreeNode(root, 0))}
        </div>
      )}

      {/* Add / Edit Location Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLocation ? `Edit Location: ${editingLocation.name}` : 'Provision Location Node'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={saveMutation.isPending}
            >
              {editingLocation ? 'Save Changes' : 'Create Location'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <Input
            label="Location Name"
            required
            placeholder="e.g. KEPREVOS Tower, Floor 2, Server Room 101"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Location Code"
              required
              placeholder="e.g. BLD-01, FLR-02, RM-205"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />

            <Select
              label="Node Container Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={[
                { value: 'building', label: 'Building / Headquarters (Level 1)' },
                { value: 'branch', label: 'Branch / Regional Office (Level 1)' },
                { value: 'floor', label: 'Floor / Level (Level 2)' },
                { value: 'room', label: 'Room / Suite / Lab (Level 3)' },
                { value: 'zone', label: 'Zone / Open Workspace (Level 3)' }
              ]}
            />
          </div>

          {['floor', 'room', 'zone'].includes(type) && (
            <Select
              label="Parent Location"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              options={[
                { value: '', label: 'None (Top Level Root)' },
                ...validParentOptions
              ]}
            />
          )}

          {['building', 'branch'].includes(type) && (
            <Input
              label="Physical Street Address"
              placeholder="e.g. 100 Innovation Way, Suite 400, Austin TX"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          )}
        </form>
      </Modal>
    </div>
  );
};

export default Locations;
