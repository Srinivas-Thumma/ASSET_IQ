import React, { useState } from 'react';
import {
  ClipboardCheck,
  Check,
  Wrench,
  Trash2,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Laptop
} from 'lucide-react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Textarea from '../../components/ui/Textarea.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Breadcrumbs from '../../components/ui/Breadcrumbs.jsx';
import { useAssignments } from '../../hooks/useAssignments.js';
import { formatDate, formatRelative } from '../../utils/formatters.js';
import { toast } from 'sonner';

export const InspectionQueue = () => {
  const { inspections, isLoading, completeInspection } = useAssignments();
  const [selectedInspection, setSelectedInspection] = useState(null);

  // Stepper state
  const [step, setStep] = useState(1); // 1: Condition Assessment | 2: Routing Decision | 3: Notes & Confirm
  const [conditionGrade, setConditionGrade] = useState('grade_a');
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [routingDecision, setRoutingDecision] = useState('pass'); // 'pass' | 'fail_repair' | 'fail_retire'
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openInspectionModal = (item) => {
    setSelectedInspection(item);
    setStep(1);
    setConditionGrade('grade_a');
    setUploadedPhotos([
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&q=80',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=300&q=80'
    ]);
    setRoutingDecision(item.returnReason === 'defective' ? 'fail_repair' : 'pass');
    setInspectionNotes('');
  };

  const closeInspectionModal = () => {
    setSelectedInspection(null);
    setStep(1);
    setInspectionNotes('');
  };

  const handleSimulatePhotoUpload = () => {
    if (uploadedPhotos.length >= 3) {
      toast.warning('Maximum 3 inspection photos allowed');
      return;
    }
    const dummyImgs = [
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=300&q=80',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=300&q=80'
    ];
    setUploadedPhotos((prev) => [...prev, dummyImgs[prev.length % dummyImgs.length]]);
    toast.success('Inspection photo uploaded');
  };

  const handleRemovePhoto = (idx) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCompleteInspection = async () => {
    if (!selectedInspection) return;
    setIsSubmitting(true);
    try {
      await completeInspection({
        assignmentId: selectedInspection._id,
        inspectionData: {
          inspectionResult: routingDecision,
          inspectionNotes: `[Grade: ${conditionGrade.toUpperCase()}] ${inspectionNotes || 'Physical inspection completed'}`
        }
      });
      toast.success(`Inspection completed for ${selectedInspection.assetName || selectedInspection.assetCode}`);
      closeInspectionModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete inspection');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <Breadcrumbs
        items={[
          { label: 'Operations', to: '/dashboard' },
          { label: 'Physical Inspection Queue' }
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight mb-2">
          Physical Inspection Queue
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Perform hardware grading on returned equipment, document physical condition, and route assets to stock, repair, or retirement.
        </p>
      </div>

      {/* Table */}
      {isLoading ? (
        <Card className="p-6 space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </Card>
      ) : inspections.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No pending returns in queue"
          description="All returned devices have undergone physical inspection and grading."
        />
      ) : (
        <Card className="p-0 overflow-hidden" hoverLift={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 text-[11px] uppercase font-bold tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Asset Details</th>
                  <th className="px-5 py-3.5">Employee Custodian</th>
                  <th className="px-5 py-3.5">Return Reason</th>
                  <th className="px-5 py-3.5">Initiated Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {inspections.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {item.assetName || 'Hardware Unit'}
                      </span>
                      <span className="font-mono text-[10px] text-[#6D28D9] dark:text-purple-400 font-bold">
                        {item.assetCode || 'EQ-TAG'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-800 dark:text-slate-200 font-medium">
                      {item.employeeName || 'Staff Member'}
                    </td>
                    <td className="px-5 py-3.5 capitalize text-xs">
                      <Badge variant="warning" dot>
                        {item.returnReason || 'Offboarding / Upgrade'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                      {formatRelative(item.returnInitiatedAt || item.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant="primary"
                        icon={ClipboardCheck}
                        onClick={() => openInspectionModal(item)}
                        className="h-8 text-xs bg-[#6D28D9] hover:bg-purple-700"
                      >
                        Inspect & Grade
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 3-STEP PHYSICAL INSPECTION STEPPER MODAL */}
      <Modal
        isOpen={Boolean(selectedInspection)}
        onClose={closeInspectionModal}
        title={`Hardware Inspection: ${selectedInspection?.assetCode || 'Asset'}`}
        footer={
          <div className="flex items-center justify-between w-full">
            {step > 1 ? (
              <Button
                variant="secondary"
                icon={ArrowLeft}
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </Button>
            ) : (
              <Button variant="secondary" onClick={closeInspectionModal}>
                Cancel
              </Button>
            )}

            {step < 3 ? (
              <Button
                variant="primary"
                onClick={() => setStep((s) => s + 1)}
              >
                Next Step
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={CheckCircle2}
                onClick={handleCompleteInspection}
                loading={isSubmitting}
              >
                Complete Inspection
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Stepper Progress Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            {[
              { num: 1, label: '1. Grading & Photos' },
              { num: 2, label: '2. Routing' },
              { num: 3, label: '3. Notes & Confirm' }
            ].map((s) => (
              <div
                key={s.num}
                className={`flex items-center gap-1.5 font-bold ${
                  step === s.num
                    ? 'text-[#6D28D9] dark:text-purple-400'
                    : step > s.num
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    step === s.num
                      ? 'bg-[#6D28D9] text-white'
                      : step > s.num
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {step > s.num ? <Check className="w-3 h-3" /> : s.num}
                </span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>

          {/* STEP 1: CONDITION ASSESSMENT */}
          {step === 1 && (
            <div className="space-y-3.5">
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Assess the physical and operational integrity of <strong>{selectedInspection?.assetName}</strong>:
              </p>

              {/* Radio Grading Options */}
              <div className="space-y-2">
                {[
                  {
                    val: 'grade_a',
                    label: 'Grade A — Like New',
                    desc: 'Pristine cosmetic condition, zero functional issues, OEM accessories complete.',
                    color: 'text-emerald-600 dark:text-emerald-400'
                  },
                  {
                    val: 'grade_b',
                    label: 'Grade B — Good',
                    desc: 'Minor superficial scuffs or light wear, 100% operational.',
                    color: 'text-blue-600 dark:text-blue-400'
                  },
                  {
                    val: 'grade_c',
                    label: 'Grade C — Fair / Wear',
                    desc: 'Noticeable scratches, heavy keyboard shine or degraded battery capacity.',
                    color: 'text-amber-600 dark:text-amber-400'
                  },
                  {
                    val: 'grade_d',
                    label: 'Grade D — Damaged',
                    desc: 'Cracked screen, liquid contact, physical chassis breakage, or boot failure.',
                    color: 'text-rose-600 dark:text-rose-400'
                  }
                ].map((g) => (
                  <label
                    key={g.val}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      conditionGrade === g.val
                        ? 'border-[#6D28D9] bg-purple-50/70 dark:bg-purple-950/40'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="conditionGrade"
                      value={g.val}
                      checked={conditionGrade === g.val}
                      onChange={(e) => setConditionGrade(e.target.value)}
                      className="mt-0.5 text-[#6D28D9] focus:ring-[#6D28D9]"
                    />
                    <div>
                      <div className={`font-bold ${g.color}`}>{g.label}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {g.desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Photos Section */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Inspection Evidence Photos ({uploadedPhotos.length}/3)
                  </span>
                  <button
                    type="button"
                    onClick={handleSimulatePhotoUpload}
                    className="text-xs text-[#6D28D9] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Photo
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {uploadedPhotos.map((url, idx) => (
                    <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                      <img src={url} alt="Inspection" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ROUTING DECISION */}
          {step === 2 && (
            <div className="space-y-3.5">
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Determine hardware disposition and inventory routing target:
              </p>

              <div className="space-y-2">
                {[
                  {
                    val: 'pass',
                    label: 'Pass Inspection (Return to Stock)',
                    desc: 'Clean and reset device, return to available inventory pool for new assignments.'
                  },
                  {
                    val: 'fail_repair',
                    label: 'Fail — Route to IT Repair Bench',
                    desc: 'Device requires component replacement, battery swap, or diagnostic repair.'
                  },
                  {
                    val: 'fail_retire',
                    label: 'Fail — Propose Hardware Decommission / Retirement',
                    desc: 'Beyond economical repair or at end of lifecycle. Send to admin retirement queue.'
                  }
                ].map((d) => (
                  <label
                    key={d.val}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      routingDecision === d.val
                        ? 'border-[#6D28D9] bg-purple-50/70 dark:bg-purple-950/40'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="routingDecision"
                      value={d.val}
                      checked={routingDecision === d.val}
                      onChange={(e) => setRoutingDecision(e.target.value)}
                      className="mt-0.5 text-[#6D28D9] focus:ring-[#6D28D9]"
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{d.label}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {d.desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: NOTES & CONFIRM */}
          {step === 3 && (
            <div className="space-y-3.5">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Asset:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedInspection?.assetName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Grading:</span>
                  <span className="font-bold uppercase text-[#6D28D9]">{conditionGrade.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Routing Decision:</span>
                  <span className="font-bold text-emerald-600">{routingDecision.replace('_', ' ').toUpperCase()}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Inspection Summary Notes
                </label>
                <Textarea
                  rows={3}
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  placeholder="Optional technician notes, serial verification, cosmetic observations..."
                />
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default InspectionQueue;
