import React, { useState } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Check,
  ChevronRight,
  ChevronLeft,
  Laptop,
  ShieldAlert
} from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Select from '../ui/Select.jsx';
import { useAssignments } from '../../hooks/useAssignments.js';
import { useTickets } from '../../hooks/useTickets.js';
import { toast } from 'sonner';

export const ReturnAssetModal = ({
  isOpen,
  onClose,
  asset,
  assignmentId
}) => {
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState('Upgrade');
  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState({
    powersOn: true,
    noDamage: true,
    accessoriesIncluded: true,
    dataBackedUp: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { initiateReturn } = useAssignments();
  const { createTicket } = useTickets();

  const resetForm = () => {
    setStep(1);
    setReason('Upgrade');
    setNotes('');
    setChecklist({
      powersOn: true,
      noDamage: true,
      accessoriesIncluded: true,
      dataBackedUp: true
    });
  };

  const handleCheckbox = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const targetId = assignmentId || asset?._id;
      if (targetId) {
        await initiateReturn({
          assignmentId: targetId,
          reason: `${reason} - ${notes || 'Standard return request'}`
        });
      }

      toast.success('Return request registered. Status changed to Return Pending.');
      resetForm();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit return request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!asset) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title={`Initiate Equipment Return — ${asset.name}`}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Step {step} of 3</span>
          </div>

          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button
                variant="secondary"
                icon={ChevronLeft}
                onClick={() => setStep(step - 1)}
                disabled={isSubmitting}
              >
                Back
              </Button>
            )}

            {step < 3 ? (
              <Button
                variant="primary"
                onClick={() => setStep(step + 1)}
              >
                Next Step
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={Check}
                onClick={handleSubmit}
                loading={isSubmitting}
              >
                Submit Return Request
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Step Indicator Pills */}
        <div className="flex items-center gap-2">
          {['1. Return Reason', '2. Condition Check', '3. Confirm & Submit'].map((label, idx) => (
            <div
              key={idx}
              className={`flex-1 py-1.5 px-2 rounded-xl text-center font-bold text-[11px] transition-all border ${
                step === idx + 1
                  ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-800'
                  : step > idx + 1
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        {/* STEP 1: REASON & NOTES */}
        {step === 1 && (
          <div className="space-y-4 pt-2">
            <Select
              label="Primary Reason for Return"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              options={[
                { value: 'Upgrade', label: 'Device Upgrade / Replacement' },
                { value: 'Faulty', label: 'Hardware Malfunction / Defect' },
                { value: 'No longer needed', label: 'Project Completed / No Longer Needed' },
                { value: 'Other', label: 'Other Circumstance' }
              ]}
            />

            <div>
              <label className="block font-semibold text-slate-700 dark:text-purple-200 mb-1.5">
                Additional Notes <span className="font-normal text-slate-400">(Optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Mention any specific accessories, packaging details, or drop-off preferences..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-purple-200/90 dark:border-purple-900/60 rounded-xl text-slate-900 dark:text-purple-100 text-xs focus:ring-4 focus:ring-purple-500/15 focus:border-purple-600 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 2: CONDITION CHECKLIST */}
        {step === 2 && (
          <div className="space-y-3 pt-2">
            <p className="text-slate-500 dark:text-slate-400">
              Please verify the device status prior to physical drop-off to expedite warehouse check-in:
            </p>

            <div className="space-y-2.5">
              {[
                { id: 'powersOn', label: 'Powers On & Boots Normally', desc: 'Device turns on without boot-loop or power issues' },
                { id: 'noDamage', label: 'No Severe Physical Damage', desc: 'Chassis, screen, and ports are free of cracks or liquid damage' },
                { id: 'accessoriesIncluded', label: 'All Standard Accessories Included', desc: 'OEM Power adapter, charging cables, and dongles present' },
                { id: 'dataBackedUp', label: 'Personal Data Backed Up & Signed Out', desc: 'Accounts unlinked and critical files saved to cloud' }
              ].map((item) => (
                <label
                  key={item.id}
                  onClick={() => handleCheckbox(item.id)}
                  className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                    checklist[item.id]
                      ? 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checklist[item.id]}
                    onChange={() => {}}
                    className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-slate-900 dark:text-white block">{item.label}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: CONFIRMATION SUMMARY */}
        {step === 3 && (
          <div className="space-y-4 pt-2">
            <div className="p-4 bg-purple-50/60 dark:bg-slate-900/90 rounded-2xl border border-purple-100 dark:border-purple-900/50 space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-purple-100 dark:border-purple-900/40">
                <div className="p-2.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-xl">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{asset.name}</h4>
                  <span className="font-mono text-[11px] text-slate-400">Code: {asset.assetCode}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Return Reason</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{reason}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Inspection Status</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">Return Pending</span>
                </div>
              </div>

              {notes && (
                <div className="pt-2 border-t border-purple-50 dark:border-purple-900/30">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Employee Notes</span>
                  <p className="text-slate-700 dark:text-slate-300 text-xs italic">{notes}</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                Upon submission, a warehouse technician ticket will be queued and custody will transfer upon physical return inspection.
              </span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ReturnAssetModal;
