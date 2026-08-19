import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LifeBuoy, Send, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import ticketApi from '../../api/ticket.api.js';
import { toast } from 'sonner';

export const ContactPlatformSupportModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [category, setCategory] = useState('billing');
  const [priority, setPriority] = useState('p2');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMutation = useMutation({
    mutationFn: (ticketData) => ticketApi.createTicket(ticketData),
    onSuccess: (newTicket) => {
      toast.success('Platform support request submitted to AssetOwl SuperAdmin');
      queryClient.invalidateQueries({ queryKey: ['platform-support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      onClose();
      resetForm();
      const ticketId = newTicket._id || newTicket.data?._id || newTicket.id;
      if (ticketId) {
        navigate(`/ticket/${ticketId}`);
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit platform support request');
    },
    onSettled: () => setIsSubmitting(false)
  });

  const resetForm = () => {
    setCategory('billing');
    setPriority('p2');
    setTitle('');
    setDescription('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Please provide a subject and detailed description');
      return;
    }

    setIsSubmitting(true);
    createMutation.mutate({
      type: 'admin_support',
      issueType: category,
      priority,
      title: title.trim(),
      description: description.trim()
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Contact Platform Support"
      subtitle="Direct formal communication with AssetOwl Platform Administration (SuperAdmin)"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Support Category */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Request Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600"
          >
            <option value="billing">Subscription, Billing & Invoices</option>
            <option value="plan_upgrade">Plan Upgrade / Quota Limit Increase</option>
            <option value="policy">Organization Configuration & Access</option>
            <option value="technical">Platform Technical Bug / Issue</option>
            <option value="other">Feature Request & General Inquiry</option>
          </select>
        </div>

        {/* Priority Level */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Urgency / Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600"
          >
            <option value="p1">P1 Critical — Platform outage or major blocker</option>
            <option value="p2">P2 High — Time-sensitive business impact</option>
            <option value="p3">P3 Medium — Standard administrative inquiry</option>
            <option value="p4">P4 Low — Non-urgent question or suggestion</option>
          </select>
        </div>

        {/* Subject */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Request Subject
          </label>
          <Input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Increase employee seat quota for Q3 onboarding"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Detailed Description
          </label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain the background, specific requirement, or issue you would like SuperAdmin to address..."
            className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>

        <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/60 rounded-xl text-[11px] text-purple-800 dark:text-purple-300 flex items-start gap-2">
          <LifeBuoy className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            This request will be routed directly to the AssetOwl SuperAdmin queue. You will be able to discuss and track progress in the dedicated platform support portal.
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            icon={Send}
            loading={isSubmitting}
          >
            Submit Support Request
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ContactPlatformSupportModal;
