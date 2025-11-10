'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import {
  PlusIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { FormNotificationConfig, SlackTargetOption } from '@/types/forms';

type QuestionType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'EMAIL'
  | 'PHONE'
  | 'NUMBER'
  | 'DATE'
  | 'SELECT'
  | 'RADIO'
  | 'CHECKBOX'
  | 'FILE'
  | 'BOOLEAN';

type FormQuestion = {
  id: string;
  title: string;
  description: string;
  type: QuestionType;
  required: boolean;
  options: string[];
};

type FormSection = {
  id: string;
  title: string;
  description: string;
  questions: FormQuestion[];
};

type FormRecord = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  isActive?: boolean;
  allowMultiple?: boolean;
  requireAuth?: boolean;
  backgroundColor?: string;
  textColor?: string;
  sections?: FormSection[];
  questions?: FormQuestion[];
  notificationConfig?: FormNotificationConfig;
  notificationEmail?: string;
  notifyOnSubmission?: boolean;
  sendReceiptToSubmitter?: boolean;
  slug: string;
};

type FormDraft = {
  id?: string;
  title: string;
  description: string;
  category: string;
  isActive: boolean;
  allowMultiple: boolean;
  requireAuth: boolean;
  backgroundColor: string;
  textColor: string;
  notificationConfig: FormNotificationConfig;
  sections: FormSection[];
};

type ApplicationResponse = {
  id: string;
  applicantName: string;
  applicantEmail: string;
  submittedAt: string;
  responses: Array<{
    questionId: string;
    question: { title?: string; type?: QuestionType };
    textValue?: string;
    numberValue?: number;
    booleanValue?: boolean;
    dateValue?: string;
    selectedOptions?: string;
    fileName?: string;
  }>;
};

type SlackTargetState = {
  channels: SlackTargetOption[];
  users: SlackTargetOption[];
  needsToken: boolean;
  error?: string;
};

const QUESTION_TYPES: { label: string; value: QuestionType }[] = [
  { label: 'Short answer', value: 'TEXT' },
  { label: 'Paragraph', value: 'TEXTAREA' },
  { label: 'Email', value: 'EMAIL' },
  { label: 'Phone', value: 'PHONE' },
  { label: 'Number', value: 'NUMBER' },
  { label: 'Date', value: 'DATE' },
  { label: 'Multiple choice', value: 'RADIO' },
  { label: 'Checkboxes', value: 'CHECKBOX' },
  { label: 'Dropdown', value: 'SELECT' },
  { label: 'File upload', value: 'FILE' },
  { label: 'Yes / No', value: 'BOOLEAN' },
];

const MULTIPLE_CHOICE: QuestionType[] = ['RADIO', 'CHECKBOX', 'SELECT'];

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 11)}`;
}

function normalizeQuestion(question: any, index: number): FormQuestion {
  const rawOptions = question?.options;
  const options = Array.isArray(rawOptions)
    ? rawOptions
    : typeof rawOptions === 'string'
      ? rawOptions.split('
').map((option: string) => option.trim()).filter(Boolean)
      : [];

  return {
    id: question?.id || makeId(),
    title: question?.title || question?.question || `Question ${index + 1}`,
    description: question?.description || '',
    type: (question?.type || 'TEXT') as QuestionType,
    required: Boolean(question?.required),
    options,
  };
}

function normalizeForm(form: FormRecord): FormDraft {
  const sections = Array.isArray(form.sections) && form.sections.length
    ? form.sections
    : [
        {
          id: makeId(),
          title: form.title || 'Untitled section',
          description: form.description || '',
          questions: form.questions || [],
        },
      ];

  return {
    id: form.id,
    title: form.title || 'Untitled form',
    description: form.description || '',
    category: form.category || 'general',
    isActive: Boolean(form.isActive ?? true),
    allowMultiple: Boolean(form.allowMultiple),
    requireAuth: Boolean(form.requireAuth),
    backgroundColor: form.backgroundColor || '#00274c',
    textColor: form.textColor || '#ffffff',
    notificationConfig: {
      slack: {
        webhookUrl: form.notificationConfig?.slack?.webhookUrl ?? null,
        targets: form.notificationConfig?.slack?.targets ?? [],
      },
      email: {
        notificationEmail: form.notificationConfig?.email?.notificationEmail ?? form.notificationEmail ?? '',
        notifyOnSubmission: form.notificationConfig?.email?.notifyOnSubmission ?? form.notifyOnSubmission ?? true,
        sendReceiptToSubmitter: form.notificationConfig?.email?.sendReceiptToSubmitter ?? form.sendReceiptToSubmitter ?? false,
      },
    },
    sections: sections.map((section: any, index: number) => ({
      id: section?.id || makeId(),
      title: section?.title || `Section ${index + 1}`,
      description: section?.description || '',
      questions: Array.isArray(section?.questions)
        ? section.questions.map((question: any, questionIndex: number) => normalizeQuestion(question, questionIndex))
        : [],
    })),
  };
}

function createEmptyDraft(): FormDraft {
  return {
    title: 'Untitled form',
    description: '',
    category: 'general',
    isActive: true,
    allowMultiple: false,
    requireAuth: false,
    backgroundColor: '#00274c',
    textColor: '#ffffff',
    notificationConfig: {
      slack: { webhookUrl: null, targets: [] },
      email: { notificationEmail: '', notifyOnSubmission: true, sendReceiptToSubmitter: false },
    },
    sections: [
      {
        id: makeId(),
        title: 'Untitled section',
        description: '',
        questions: [
          {
            id: makeId(),
            title: 'Untitled question',
            description: '',
            type: 'TEXT',
            required: true,
            options: [],
          },
        ],
      },
    ],
  };
}

function extractResponseValue(answer: any, type: QuestionType) {
  if (!answer) return null;
  if (answer.textValue !== undefined && answer.textValue !== null) return answer.textValue;
  if (answer.numberValue !== undefined && answer.numberValue !== null) return answer.numberValue;
  if (answer.booleanValue !== undefined && answer.booleanValue !== null) return answer.booleanValue;
  if (answer.dateValue) return new Date(answer.dateValue).toLocaleString();
  if (answer.fileName) return `File: ${answer.fileName}`;
  if (answer.selectedOptions) {
    try {
      const parsed = JSON.parse(answer.selectedOptions);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      return answer.selectedOptions;
    }
  }
  if (type === 'BOOLEAN' && answer.textValue) {
    return answer.textValue === 'true';
  }
  return null;
}

function formatValue(value: any) {
  if (value === null || value === undefined) return '—';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

export default function FormsAdminPage() {
  const { data: session, status } = useSession();
  const [forms, setForms] = useState<FormRecord[]>([]);
  const [formsError, setFormsError] = useState('');
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [draft, setDraft] = useState<FormDraft | null>(null);
  const [responses, setResponses] = useState<ApplicationResponse[]>([]);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [responsesError, setResponsesError] = useState('');
  const [activeTab, setActiveTab] = useState<'questions' | 'responses' | 'settings'>('questions');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [slackTargets, setSlackTargets] = useState<SlackTargetState>({ channels: [], users: [], needsToken: false });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      redirect('/auth/signin');
      return;
    }
    const roles = Array.isArray(session.user.roles) ? session.user.roles : [];
    if (!roles.includes('ADMIN')) {
      redirect('/');
      return;
    }
    void loadForms();
    void loadSlackTargets();
  }, [session, status]);

  useEffect(() => {
    if (!forms.length) {
      setDraft(null);
      return;
    }
    if (!selectedFormId) {
      setSelectedFormId(forms[0].id);
      return;
    }
    if (selectedFormId === 'new') {
      setDraft(createEmptyDraft());
      return;
    }
    const record = forms.find((form) => form.id === selectedFormId);
    if (record) {
      setDraft(normalizeForm(record));
    }
  }, [forms, selectedFormId]);

  useEffect(() => {
    if (activeTab === 'responses' && draft?.id) {
      void loadResponses(draft.id);
    }
  }, [activeTab, draft?.id]);

  const filteredForms = useMemo(() => {
    if (!searchTerm.trim()) return forms;
    const needle = searchTerm.toLowerCase();
    return forms.filter((form) => {
      const haystack = [form.title, form.category, form.slug].join(' ').toLowerCase();
      return haystack.includes(needle);
    });
  }, [forms, searchTerm]);

  const responsesSummary = useMemo(() => {
    if (!draft || !responses.length) {
      return {
        total: responses.length,
        last: null as string | null,
        unique: 0,
        questions: [] as Array<{ id: string; title: string; type: QuestionType; answers: number; distribution: { label: string; count: number }[]; samples: string[] }>,
      };
    }
    const last = responses
      .map((entry) => entry.submittedAt)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || null;
    const unique = new Set(responses.map((entry) => entry.applicantEmail)).size;

    const questions: Array<{ id: string; title: string; type: QuestionType; answers: number; distribution: { label: string; count: number }[]; samples: string[] }> = [];
    draft.sections.forEach((section) => {
      section.questions.forEach((question) => {
        const counts = new Map<string, number>();
        const samples: string[] = [];
        responses.forEach((submission) => {
          const answer = submission.responses.find((entry) => entry.questionId === question.id);
          if (!answer) return;
          const value = extractResponseValue(answer, question.type);
          if (value === null || value === '') return;
          if (Array.isArray(value)) {
            value.forEach((item) => {
              const key = String(item);
              counts.set(key, (counts.get(key) || 0) + 1);
              samples.push(key);
            });
          } else {
            const key = formatValue(value);
            counts.set(key, (counts.get(key) || 0) + 1);
            samples.push(key);
          }
        });
        const distribution = Array.from(counts.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([label, count]) => ({ label, count }));
        questions.push({
          id: question.id,
          title: question.title,
          type: question.type,
          answers: samples.length,
          distribution,
          samples: samples.slice(0, 3),
        });
      });
    });

    return { total: responses.length, last, unique, questions };
  }, [responses, draft]);

  async function loadForms() {
    try {
      setFormsError('');
      const res = await fetch('/api/admin/forms');
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to load forms' }));
        throw new Error(error.error || 'Failed to load forms');
      }
      const data = await res.json();
      setForms(data);
      if (!selectedFormId && data.length) {
        setSelectedFormId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading forms:', error);
      setFormsError('Unable to load forms.');
    }
  }

  async function loadSlackTargets() {
    try {
      const res = await fetch('/api/admin/forms/slack-targets');
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to load Slack data' }));
        throw new Error(error.error || 'Failed to load Slack data');
      }
      const data = await res.json();
      setSlackTargets(data);
    } catch (error) {
      console.error('Failed to fetch Slack targets:', error);
      setSlackTargets({ channels: [], users: [], needsToken: false, error: 'Unable to load Slack options.' });
    }
  }

  async function loadResponses(formId: string) {
    try {
      setResponsesLoading(true);
      setResponsesError('');
      const res = await fetch(`/api/admin/applications?formId=${formId}`);
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to load responses' }));
        throw new Error(error.error || 'Failed to load responses');
      }
      const data = await res.json();
      setResponses(data);
    } catch (error) {
      console.error('Error loading responses:', error);
      setResponsesError('Unable to load responses for this form.');
    } finally {
      setResponsesLoading(false);
    }
  }

  function updateDraft(update: (current: FormDraft) => FormDraft) {
    setDraft((current) => (current ? update(current) : current));
  }

  function updateSection(sectionId: string, updates: Partial<FormSection>) {
    updateDraft((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId ? { ...section, ...updates } : section
      ),
    }));
  }

  function moveSection(sectionId: string, direction: number) {
    updateDraft((current) => {
      const index = current.sections.findIndex((section) => section.id === sectionId);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= current.sections.length) return current;
      const next = [...current.sections];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return { ...current, sections: next };
    });
  }

  function removeSection(sectionId: string) {
    updateDraft((current) => {
      if (current.sections.length === 1) return current;
      return {
        ...current,
        sections: current.sections.filter((section) => section.id !== sectionId),
      };
    });
  }

  function addSection() {
    updateDraft((current) => ({
      ...current,
      sections: [
        ...current.sections,
        {
          id: makeId(),
          title: `Section ${current.sections.length + 1}`,
          description: '',
          questions: [
            {
              id: makeId(),
              title: 'Untitled question',
              description: '',
              type: 'TEXT',
              required: true,
              options: [],
            },
          ],
        },
      ],
    }));
  }

  function updateQuestion(sectionId: string, questionId: string, updates: Partial<FormQuestion>) {
    updateDraft((current) => ({
      ...current,
      sections: current.sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          questions: section.questions.map((question) =>
            question.id === questionId ? { ...question, ...updates } : question
          ),
        };
      }),
    }));
  }

  function moveQuestion(sectionId: string, questionId: string, direction: number) {
    updateDraft((current) => ({
      ...current,
      sections: current.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const index = section.questions.findIndex((question) => question.id === questionId);
        const targetIndex = index + direction;
        if (index < 0 || targetIndex < 0 || targetIndex >= section.questions.length) return section;
        const next = [...section.questions];
        const [item] = next.splice(index, 1);
        next.splice(targetIndex, 0, item);
        return { ...section, questions: next };
      }),
    }));
  }

  function removeQuestion(sectionId: string, questionId: string) {
    updateDraft((current) => ({
      ...current,
      sections: current.sections.map((section) => {
        if (section.id !== sectionId) return section;
        if (section.questions.length === 1) return section;
        return {
          ...section,
          questions: section.questions.filter((question) => question.id !== questionId),
        };
      }),
    }));
  }

  function addQuestion(sectionId: string) {
    updateDraft((current) => ({
      ...current,
      sections: current.sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          questions: [
            ...section.questions,
            {
              id: makeId(),
              title: 'Untitled question',
              description: '',
              type: 'TEXT',
              required: true,
              options: [],
            },
          ],
        };
      }),
    }));
  }

  function toggleSlackTarget(target: SlackTargetOption) {
    updateDraft((current) => {
      const currentTargets = current.notificationConfig.slack?.targets || [];
      const exists = currentTargets.some((entry) => entry.id === target.id && entry.type === target.type);
      const nextTargets = exists
        ? currentTargets.filter((entry) => !(entry.id === target.id && entry.type === target.type))
        : [...currentTargets, target];
      return {
        ...current,
        notificationConfig: {
          ...current.notificationConfig,
          slack: {
            webhookUrl: current.notificationConfig.slack?.webhookUrl ?? null,
            targets: nextTargets,
          },
        },
      };
    });
  }

  async function handleSave() {
    if (!draft) return;
    if (!draft.title.trim()) {
      setSaveError('A form title is required.');
      return;
    }
    setSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    const payload = {
      id: draft.id,
      title: draft.title,
      description: draft.description,
      category: draft.category,
      isActive: draft.isActive,
      allowMultiple: draft.allowMultiple,
      requireAuth: draft.requireAuth,
      backgroundColor: draft.backgroundColor,
      textColor: draft.textColor,
      sections: draft.sections.map((section, sectionIndex) => ({
        id: section.id,
        title: section.title,
        description: section.description,
        order: sectionIndex,
        questions: section.questions.map((question, questionIndex) => ({
          id: question.id,
          title: question.title,
          description: question.description,
          type: question.type,
          required: question.required,
          options: question.options,
          order: questionIndex,
        })),
      })),
      notificationConfig: draft.notificationConfig,
      notifyOnSubmission: draft.notificationConfig.email?.notifyOnSubmission ?? true,
      notificationEmail: draft.notificationConfig.email?.notificationEmail || '',
      sendReceiptToSubmitter: draft.notificationConfig.email?.sendReceiptToSubmitter ?? false,
    };

    try {
      const isUpdate = Boolean(draft.id);
      const res = await fetch(isUpdate ? `/api/admin/forms?id=${draft.id}` : '/api/admin/forms', {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to save form' }));
        throw new Error(error.error || 'Failed to save form');
      }
      const saved = await res.json();
      setSaveMessage(isUpdate ? 'Form updated.' : 'Form created.');
      setSelectedFormId(saved.id);
      await loadForms();
      setActiveTab('questions');
    } catch (error) {
      console.error('Error saving form:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save form.');
    } finally {
      setSaving(false);
      setTimeout(() => {
        setSaveMessage(null);
        setSaveError(null);
      }, 4000);
    }
  }

  async function exportResponses(type: 'summary' | 'detailed') {
    if (!draft?.id) return;
    try {
      const res = await fetch('/api/admin/applications/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId: draft.id, exportType: type }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to export responses' }));
        throw new Error(error.error || 'Failed to export responses');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${draft.title.replace(/[^a-z0-9]+/gi, '-')}-${type}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      setResponsesError('Unable to export responses.');
    }
  }

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-2 text-slate-300">
          <ArrowPathIcon className="h-8 w-8 animate-spin" />
          <span>Loading admin forms…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-900/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Form builder</h1>
            <p className="text-sm text-slate-400">Google Forms–style sections, response insights, and notification controls.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSave}
              disabled={!draft || saving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-500/50"
            >
              {saving ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4" /> Save changes
                </>
              )}
            </button>
            <button
              onClick={() => setSelectedFormId('new')}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              <PlusIcon className="h-4 w-4" /> New form
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[280px,1fr]">
        <aside className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Forms</span>
              <span className="text-xs text-slate-500">{forms.length}</span>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search"
              className="mb-4 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
            <nav className="space-y-2">
              {filteredForms.map((form) => (
                <button
                  key={form.id}
                  onClick={() => setSelectedFormId(form.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    selectedFormId === form.id
                      ? 'bg-blue-500/20 text-white'
                      : 'bg-slate-950 text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{form.title}</span>
                    {!form.isActive && <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] text-red-200">Archived</span>}
                  </div>
                  <p className="text-xs text-slate-500">{form.category || 'general'}</p>
                </button>
              ))}
              <button
                onClick={() => setSelectedFormId('new')}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                  selectedFormId === 'new'
                    ? 'bg-blue-500/20 text-white'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                + Create new form
              </button>
            </nav>
            {formsError && <p className="mt-4 text-xs text-red-300">{formsError}</p>}
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <Cog6ToothIcon className="h-4 w-4" /> Quick tips
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Use sections to create multi-step forms like Google Forms.</li>
              <li>The responses tab groups answers by question with live counts.</li>
              <li>Configure Slack channels or users per form for targeted alerts.</li>
            </ul>
          </div>
        </aside>

        <section className="space-y-6">
          {saveMessage && (
            <div className="flex items-center gap-2 rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-100">
              <CheckCircleIcon className="h-4 w-4" /> {saveMessage}
            </div>
          )}
          {saveError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              <XMarkIcon className="h-4 w-4" /> {saveError}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('questions')}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                activeTab === 'questions' ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              <DocumentTextIcon className="h-4 w-4" /> Questions
            </button>
            <button
              onClick={() => setActiveTab('responses')}
              disabled={!draft?.id}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                activeTab === 'responses' ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-200 hover:bg-white/20'
              } ${!draft?.id ? 'opacity-40' : ''}`}
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" /> Responses
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                activeTab === 'settings' ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              <Cog6ToothIcon className="h-4 w-4" /> Settings
            </button>
          </div>

          {!draft && (
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-12 text-center text-sm text-slate-300">
              Select a form to begin editing or create a new one.
            </div>
          )}

          {draft && activeTab === 'questions' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-200">Form title</label>
                    <input
                      type="text"
                      value={draft.title}
                      onChange={(event) => updateDraft((current) => ({ ...current, title: event.target.value }))}
                      className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-200">Description</label>
                    <textarea
                      value={draft.description}
                      onChange={(event) => updateDraft((current) => ({ ...current, description: event.target.value }))}
                      rows={3}
                      className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {draft.sections.map((section, sectionIndex) => (
                <div key={section.id} className="space-y-4 rounded-xl border border-white/10 bg-slate-900/60 p-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={section.title}
                        onChange={(event) => updateSection(section.id, { title: event.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                        placeholder="Section title"
                      />
                      <textarea
                        value={section.description}
                        onChange={(event) => updateSection(section.id, { description: event.target.value })}
                        rows={2}
                        className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                        placeholder="Description (optional)"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        onClick={() => moveSection(section.id, -1)}
                        disabled={sectionIndex === 0}
                        className="rounded-lg border border-white/10 px-3 py-2 text-slate-200 hover:bg-white/10 disabled:opacity-40"
                      >
                        Move up
                      </button>
                      <button
                        onClick={() => moveSection(section.id, 1)}
                        disabled={sectionIndex === draft.sections.length - 1}
                        className="rounded-lg border border-white/10 px-3 py-2 text-slate-200 hover:bg-white/10 disabled:opacity-40"
                      >
                        Move down
                      </button>
                      <button
                        onClick={() => removeSection(section.id)}
                        disabled={draft.sections.length === 1}
                        className="rounded-lg border border-red-500/30 px-3 py-2 text-red-200 hover:bg-red-500/20 disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {section.questions.map((question, questionIndex) => (
                      <div key={question.id} className="rounded-lg border border-white/10 bg-slate-950 p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="flex-1 space-y-3">
                            <input
                              type="text"
                              value={question.title}
                              onChange={(event) => updateQuestion(section.id, question.id, { title: event.target.value })}
                              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                              placeholder="Question"
                            />
                            <textarea
                              value={question.description}
                              onChange={(event) => updateQuestion(section.id, question.id, { description: event.target.value })}
                              rows={2}
                              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                              placeholder="Description (optional)"
                            />
                            <div className="grid gap-3 md:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Type</label>
                                <select
                                  value={question.type}
                                  onChange={(event) =>
                                    updateQuestion(section.id, question.id, {
                                      type: event.target.value as QuestionType,
                                      options: MULTIPLE_CHOICE.includes(event.target.value as QuestionType)
                                        ? question.options
                                        : [],
                                    })
                                  }
                                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                >
                                  {QUESTION_TYPES.map((type) => (
                                    <option key={type.value} value={type.value} className="text-slate-900">
                                      {type.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <label className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                                <input
                                  type="checkbox"
                                  checked={question.required}
                                  onChange={(event) => updateQuestion(section.id, question.id, { required: event.target.checked })}
                                  className="h-4 w-4 rounded border-white/30 bg-slate-900 text-blue-500 focus:ring-0"
                                />
                                Required
                              </label>
                            </div>
                            {MULTIPLE_CHOICE.includes(question.type) && (
                              <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Options (one per line)</label>
                                <textarea
                                  value={question.options.join('
')}
                                  onChange={(event) =>
                                    updateQuestion(section.id, question.id, {
                                      options: event.target.value.split('
').map((option) => option.trim()).filter(Boolean),
                                    })
                                  }
                                  rows={3}
                                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 text-xs">
                            <button
                              onClick={() => moveQuestion(section.id, question.id, -1)}
                              disabled={questionIndex === 0}
                              className="rounded-lg border border-white/10 px-3 py-2 text-slate-200 hover:bg-white/10 disabled:opacity-40"
                            >
                              Move up
                            </button>
                            <button
                              onClick={() => moveQuestion(section.id, question.id, 1)}
                              disabled={questionIndex === section.questions.length - 1}
                              className="rounded-lg border border-white/10 px-3 py-2 text-slate-200 hover:bg-white/10 disabled:opacity-40"
                            >
                              Move down
                            </button>
                            <button
                              onClick={() => removeQuestion(section.id, question.id)}
                              disabled={section.questions.length === 1}
                              className="rounded-lg border border-red-500/30 px-3 py-2 text-red-200 hover:bg-red-500/20 disabled:opacity-40"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => addQuestion(section.id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
                    >
                      <PlusIcon className="h-4 w-4" /> Add question
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={addSection}
                className="inline-flex items-center gap-2 rounded-lg border border-dashed border-white/20 px-4 py-3 text-sm text-slate-200 hover:bg-white/10"
              >
                <PlusIcon className="h-4 w-4" /> Add section
              </button>
            </div>
          )}

          {draft && activeTab === 'responses' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-white/10 bg-slate-950 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Total responses</p>
                    <p className="mt-2 text-2xl font-semibold">{responsesSummary.total}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-slate-950 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Unique emails</p>
                    <p className="mt-2 text-2xl font-semibold">{responsesSummary.unique}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-slate-950 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Last submission</p>
                    <p className="mt-2 text-sm text-slate-200">
                      {responsesSummary.last ? new Date(responsesSummary.last).toLocaleString() : '—'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => exportResponses('summary')}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/10"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" /> Export summary
                  </button>
                  <button
                    onClick={() => exportResponses('detailed')}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/10"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" /> Export detailed
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-300">Question insights</h3>
                {responsesSummary.questions.length === 0 ? (
                  <p className="text-sm text-slate-400">Responses will appear here once submissions arrive.</p>
                ) : (
                  <div className="space-y-4">
                    {responsesSummary.questions.map((question) => (
                      <div key={question.id} className="rounded-lg border border-white/10 bg-slate-950 p-4">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-slate-100">{question.title}</p>
                          <span className="text-xs text-slate-500">{question.answers} answers</span>
                        </div>
                        {question.distribution.length > 0 ? (
                          <ul className="mt-3 space-y-1 text-sm text-slate-300">
                            {question.distribution.slice(0, 4).map((entry) => (
                              <li key={entry.label} className="flex justify-between">
                                <span>{entry.label}</span>
                                <span className="text-slate-500">{entry.count}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <ul className="mt-3 space-y-1 text-sm text-slate-300">
                            {question.samples.map((sample, index) => (
                              <li key={index} className="truncate text-slate-200">{sample || '—'}</li>
                            ))}
                            {question.samples.length === 0 && <li className="text-slate-500">No responses yet.</li>}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-300">Individual responses</h3>
                {responsesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <ArrowPathIcon className="h-4 w-4 animate-spin" /> Loading responses…
                  </div>
                ) : responsesError ? (
                  <p className="text-sm text-red-300">{responsesError}</p>
                ) : responses.length === 0 ? (
                  <p className="text-sm text-slate-400">No submissions yet.</p>
                ) : (
                  <div className="space-y-3">
                    {responses.map((response) => (
                      <div key={response.id} className="rounded-lg border border-white/10 bg-slate-950 p-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-medium text-slate-100">{response.applicantName || 'Unnamed'}</p>
                            <p className="text-xs text-slate-500">{response.applicantEmail}</p>
                          </div>
                          <div className="text-xs text-slate-400">
                            Submitted {new Date(response.submittedAt).toLocaleString()}
                          </div>
                        </div>
                        <details className="mt-4 text-sm text-slate-200">
                          <summary className="cursor-pointer text-slate-300">View answers</summary>
                          <div className="mt-3 space-y-2 text-xs text-slate-300">
                            {response.responses.map((answer) => (
                              <div key={`${response.id}-${answer.questionId}`} className="rounded border border-white/10 bg-slate-900 p-3">
                                <p className="font-medium text-slate-200">{answer.question?.title || 'Question'}</p>
                                <p className="mt-1 text-slate-400">
                                  {formatValue(extractResponseValue(answer, (answer.question?.type || 'TEXT') as QuestionType))}
                                </p>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {draft && activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-300">Form settings</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex items-center gap-2 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={draft.isActive}
                      onChange={(event) => updateDraft((current) => ({ ...current, isActive: event.target.checked }))}
                      className="h-4 w-4 rounded border-white/30 bg-slate-900 text-blue-500 focus:ring-0"
                    />
                    Form is active
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={draft.requireAuth}
                      onChange={(event) => updateDraft((current) => ({ ...current, requireAuth: event.target.checked }))}
                      className="h-4 w-4 rounded border-white/30 bg-slate-900 text-blue-500 focus:ring-0"
                    />
                    Require UMich login
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={draft.allowMultiple}
                      onChange={(event) => updateDraft((current) => ({ ...current, allowMultiple: event.target.checked }))}
                      className="h-4 w-4 rounded border-white/30 bg-slate-900 text-blue-500 focus:ring-0"
                    />
                    Allow multiple submissions
                  </label>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Category</label>
                    <input
                      type="text"
                      value={draft.category}
                      onChange={(event) => updateDraft((current) => ({ ...current, category: event.target.value }))}
                      className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Notifications</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Notification email</label>
                    <input
                      type="email"
                      value={draft.notificationConfig.email?.notificationEmail || ''}
                      onChange={(event) =>
                        updateDraft((current) => ({
                          ...current,
                          notificationConfig: {
                            ...current.notificationConfig,
                            email: {
                              ...current.notificationConfig.email,
                              notificationEmail: event.target.value,
                            },
                          },
                        }))
                      }
                      className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={draft.notificationConfig.email?.notifyOnSubmission ?? true}
                      onChange={(event) =>
                        updateDraft((current) => ({
                          ...current,
                          notificationConfig: {
                            ...current.notificationConfig,
                            email: {
                              ...current.notificationConfig.email,
                              notifyOnSubmission: event.target.checked,
                            },
                          },
                        }))
                      }
                      className="h-4 w-4 rounded border-white/30 bg-slate-900 text-blue-500 focus:ring-0"
                    />
                    Email on submission
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={draft.notificationConfig.email?.sendReceiptToSubmitter ?? false}
                      onChange={(event) =>
                        updateDraft((current) => ({
                          ...current,
                          notificationConfig: {
                            ...current.notificationConfig,
                            email: {
                              ...current.notificationConfig.email,
                              sendReceiptToSubmitter: event.target.checked,
                            },
                          },
                        }))
                      }
                      className="h-4 w-4 rounded border-white/30 bg-slate-900 text-blue-500 focus:ring-0"
                    />
                    Send receipt to submitter
                  </label>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Override Slack webhook (optional)</label>
                    <input
                      type="url"
                      value={draft.notificationConfig.slack?.webhookUrl || ''}
                      onChange={(event) =>
                        updateDraft((current) => ({
                          ...current,
                          notificationConfig: {
                            ...current.notificationConfig,
                            slack: {
                              webhookUrl: event.target.value || null,
                              targets: current.notificationConfig.slack?.targets || [],
                            },
                          },
                        }))
                      }
                      className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-slate-500">Leave blank to use the global webhook.</p>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Slack recipients</h4>
                  {slackTargets.error ? (
                    <p className="text-xs text-red-300">{slackTargets.error}</p>
                  ) : slackTargets.needsToken ? (
                    <p className="text-xs text-slate-400">Set SLACK_BOT_TOKEN to list Slack channels and users.</p>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-400">Channels</p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {slackTargets.channels.map((channel) => {
                            const selected = draft.notificationConfig.slack?.targets?.some((target) => target.id === channel.id);
                            return (
                              <label key={channel.id} className="flex items-center gap-2 rounded border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-200">
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() => toggleSlackTarget(channel)}
                                  className="h-4 w-4 rounded border-white/30 bg-slate-900 text-blue-500 focus:ring-0"
                                />
                                #{channel.name || channel.id}
                              </label>
                            );
                          })}
                          {!slackTargets.channels.length && (
                            <p className="text-xs text-slate-500">No channels returned.</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400">Users</p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {slackTargets.users.map((user) => {
                            const selected = draft.notificationConfig.slack?.targets?.some((target) => target.id === user.id);
                            return (
                              <label key={user.id} className="flex items-center gap-2 rounded border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-200">
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() => toggleSlackTarget(user)}
                                  className="h-4 w-4 rounded border-white/30 bg-slate-900 text-blue-500 focus:ring-0"
                                />
                                {user.name || user.id}
                              </label>
                            );
                          })}
                          {!slackTargets.users.length && (
                            <p className="text-xs text-slate-500">No users returned.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
