'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
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
  LinkIcon,
  ArrowTopRightOnSquareIcon,
  ArchiveBoxIcon,
  ArchiveBoxXMarkIcon,
  ClipboardDocumentIcon,
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
  | 'BOOLEAN'
  | 'MATRIX';

type FormQuestion = {
  id: string;
  title: string;
  description: string;
  type: QuestionType;
  required: boolean;
  options: string[];
  matrixRows?: string[];
  matrixColumns?: string[];
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
    question: { 
      title?: string; 
      type?: QuestionType;
      matrixRows?: string[];
      matrixColumns?: string[];
    };
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
  { label: 'Matrix / Grid', value: 'MATRIX' },
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
      ? rawOptions.split('\n').map((option: string) => option.trim()).filter(Boolean)
      : [];

  // Filter out empty strings and provide defaults if needed
  let matrixRows = Array.isArray(question?.matrixRows)
    ? question.matrixRows.filter((row: string) => row && row.trim())
    : [];
  
  let matrixColumns = Array.isArray(question?.matrixColumns)
    ? question.matrixColumns.filter((col: string) => col && col.trim())
    : [];

  // If matrix type but no valid rows/columns, provide defaults
  if (question?.type === 'MATRIX') {
    if (matrixRows.length === 0) {
      matrixRows = ['Row 1', 'Row 2', 'Row 3'];
    }
    if (matrixColumns.length === 0) {
      matrixColumns = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];
    }
  }

  const finalMatrixRows = question?.type === 'MATRIX' ? matrixRows : undefined;
  const finalMatrixColumns = question?.type === 'MATRIX' ? matrixColumns : undefined;

  return {
    id: question?.id || makeId(),
    title: question?.title || question?.question || `Question ${index + 1}`,
    description: question?.description || '',
    type: (question?.type || 'TEXT') as QuestionType,
    required: Boolean(question?.required),
    options,
    matrixRows: finalMatrixRows,
    matrixColumns: finalMatrixColumns,
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
        notificationEmails: form.notificationConfig?.email?.notificationEmails ?? 
          (form.notificationConfig?.email?.notificationEmail ? [form.notificationConfig.email.notificationEmail] : 
          (form.notificationEmail ? [form.notificationEmail] : [])),
        notificationEmail: form.notificationConfig?.email?.notificationEmail ?? form.notificationEmail ?? '',
        notifyOnSubmission: form.notificationConfig?.email?.notifyOnSubmission ?? form.notifyOnSubmission ?? true,
        sendReceiptToSubmitter: (() => {
          console.log('🔍 normalizeForm checking sendReceiptToSubmitter for form:', form.title);
          console.log('🔍 Nested value:', form.notificationConfig?.email?.sendReceiptToSubmitter, 'Type:', typeof form.notificationConfig?.email?.sendReceiptToSubmitter);
          console.log('🔍 Top-level value:', form.sendReceiptToSubmitter, 'Type:', typeof form.sendReceiptToSubmitter);
          
          const result = typeof form.notificationConfig?.email?.sendReceiptToSubmitter === 'boolean'
            ? form.notificationConfig.email.sendReceiptToSubmitter
            : typeof form.sendReceiptToSubmitter === 'boolean'
              ? form.sendReceiptToSubmitter
              : false;
          
          console.log('🔍 Final normalized value:', result);
          return result;
        })(),
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
      email: { notificationEmails: [], notificationEmail: '', notifyOnSubmission: true, sendReceiptToSubmitter: false },
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
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const isUpdatingRef = useRef(false);
  const draftRef = useRef<FormDraft | null>(null);
  const [availableUsers, setAvailableUsers] = useState<Array<{ email: string; name?: string }>>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');

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
    void loadUsers();
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
    // Don't overwrite draft if we're currently saving/updating
    if (isUpdatingRef.current) {
      return;
    }
    const record = forms.find((form) => form.id === selectedFormId);
    if (record) {
      setDraft(normalizeForm(record));
    }
  }, [forms, selectedFormId]);

  // Keep draftRef in sync with draft state
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

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

  async function loadUsers() {
    try {
      console.log('Fetching users from /api/admin/forms/users...');
      const res = await fetch('/api/admin/forms/users');
      console.log('Users API response status:', res.status);
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to load users' }));
        console.error('Users API error:', error);
        throw new Error(error.error || 'Failed to load users');
      }
      const data = await res.json();
      console.log('Users loaded:', data.length, 'users');
      setAvailableUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setAvailableUsers([]);
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
    setDraft((current) => {
      const updated = current ? update(current) : current;
      if (updated && updated.id) {
        triggerAutoSave();
      }
      return updated;
    });
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
    
    // Cancel any pending autosave since we're doing a manual save
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    
    setSaving(true);
    setSaveMessage(null);
    setSaveError(null);
    isUpdatingRef.current = true;

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
          matrixRows: question.matrixRows,
          matrixColumns: question.matrixColumns,
          order: questionIndex,
        })),
      })),
      notificationConfig: draft.notificationConfig,
      notifyOnSubmission: draft.notificationConfig.email?.notifyOnSubmission ?? true,
      notificationEmail: draft.notificationConfig.email?.notificationEmail || '',
      notificationEmails: draft.notificationConfig.email?.notificationEmails || [],
      sendReceiptToSubmitter: draft.notificationConfig.email?.sendReceiptToSubmitter ?? false,
    };

    console.log('📧 Frontend sending sendReceiptToSubmitter:', payload.sendReceiptToSubmitter);
    console.log('📧 Frontend draft value:', draft.notificationConfig.email?.sendReceiptToSubmitter);

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
      
      // If creating a new form, update the draft with the saved ID and switch to it
      if (!isUpdate) {
        setDraft((current) => current ? { ...current, id: saved.id } : current);
        setSelectedFormId(saved.id);
        // Reload forms list in background to update sidebar (with small delay to avoid connection pool issues)
        setTimeout(() => {
          loadForms().catch(console.error);
        }, 500);
      }
      
      // Don't switch tabs after saving - stay on current tab
    } catch (error) {
      console.error('Error saving form:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save form.');
    } finally {
      setSaving(false);
      // Keep the flag set for a bit longer to prevent race conditions
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 1000);
      setTimeout(() => {
        setSaveMessage(null);
        setSaveError(null);
      }, 4000);
    }
  }

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    autoSaveTimerRef.current = setTimeout(async () => {
      const currentDraft = draftRef.current;
      if (!currentDraft || !currentDraft.id) return; // Only autosave existing forms
      
      setAutoSaving(true);
      isUpdatingRef.current = true;
      try {
        const payload = {
          id: currentDraft.id,
          title: currentDraft.title,
          description: currentDraft.description,
          category: currentDraft.category,
          isActive: currentDraft.isActive,
          allowMultiple: currentDraft.allowMultiple,
          requireAuth: currentDraft.requireAuth,
          backgroundColor: currentDraft.backgroundColor,
          textColor: currentDraft.textColor,
          sections: currentDraft.sections.map((section, sectionIndex) => ({
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
              matrixRows: question.matrixRows,
              matrixColumns: question.matrixColumns,
              order: questionIndex,
            })),
          })),
          notificationConfig: currentDraft.notificationConfig,
          notifyOnSubmission: currentDraft.notificationConfig.email?.notifyOnSubmission ?? true,
          notificationEmail: currentDraft.notificationConfig.email?.notificationEmail || '',
          notificationEmails: currentDraft.notificationConfig.email?.notificationEmails || [],
          sendReceiptToSubmitter: currentDraft.notificationConfig.email?.sendReceiptToSubmitter ?? false,
        };

        const res = await fetch(`/api/admin/forms?id=${currentDraft.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        if (res.ok) {
          setLastSaved(new Date());
        }
      } catch (error) {
        console.error('Autosave error:', error);
      } finally {
        setAutoSaving(false);
        // Keep the flag set for a bit longer to prevent race conditions
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 1000);
      }
    }, 2000); // Wait 2 seconds after last change
  }, []); // Remove draft from dependencies

  const copyFormLink = useCallback(() => {
    if (!draft?.id) return;
    const form = forms.find(f => f.id === draft.id);
    if (!form?.slug) return;
    
    const link = `${window.location.origin}/forms/${form.slug}`;
    navigator.clipboard.writeText(link);
    setShowCopiedMessage(true);
    setTimeout(() => setShowCopiedMessage(false), 2000);
  }, [draft, forms]);

  const openFormInNewTab = useCallback(() => {
    if (!draft?.id) return;
    const form = forms.find(f => f.id === draft.id);
    if (!form?.slug) return;
    
    window.open(`/forms/${form.slug}`, '_blank');
  }, [draft, forms]);

  const toggleArchiveForm = useCallback(async () => {
    if (!draft?.id) return;
    
    const form = forms.find(f => f.id === draft.id);
    if (!form) return;
    
    const newActiveState = !form.isActive;
    
    try {
      const res = await fetch(`/api/admin/forms?id=${draft.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, isActive: newActiveState }),
      });
      
      if (res.ok) {
        setSaveMessage(newActiveState ? 'Form activated' : 'Form archived');
        await loadForms();
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error toggling archive:', error);
      setSaveError('Failed to update form status');
      setTimeout(() => setSaveError(null), 3000);
    }
  }, [draft, forms]);

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
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-900">
        <div className="flex flex-col items-center gap-2 text-gray-700">
          <ArrowPathIcon className="h-8 w-8 animate-spin" />
          <span>Loading admin forms…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Form builder</h1>
            <p className="text-sm text-gray-600">Sections, response insights, and notification controls.</p>
            {lastSaved && !autoSaving && (
              <p className="text-xs text-gray-500 mt-1">Last saved: {lastSaved.toLocaleTimeString()}</p>
            )}
            {autoSaving && (
              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <ArrowPathIcon className="h-3 w-3 animate-spin" /> Auto-saving...
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {draft?.id && (
              <>
                <button
                  onClick={copyFormLink}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 hover:shadow-md hover:scale-105 transition-all duration-200"
                  title="Copy form link"
                >
                  {showCopiedMessage ? (
                    <>
                      <CheckCircleIcon className="h-4 w-4 text-green-600" /> Copied!
                    </>
                  ) : (
                    <>
                      <ClipboardDocumentIcon className="h-4 w-4" /> Copy Link
                    </>
                  )}
                </button>
                <button
                  onClick={openFormInNewTab}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 hover:shadow-md hover:scale-105 transition-all duration-200"
                  title="Open form in new tab"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" /> Open
                </button>
                <button
                  onClick={toggleArchiveForm}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 ${
                    draft.isActive
                      ? 'border-orange-200 bg-white text-orange-700 hover:bg-orange-50'
                      : 'border-green-200 bg-white text-green-700 hover:bg-green-50'
                  }`}
                  title={draft.isActive ? 'Archive form' : 'Activate form'}
                >
                  {draft.isActive ? (
                    <>
                      <ArchiveBoxIcon className="h-4 w-4" /> Archive
                    </>
                  ) : (
                    <>
                      <ArchiveBoxXMarkIcon className="h-4 w-4" /> Activate
                    </>
                  )}
                </button>
              </>
            )}
            <button
              onClick={handleSave}
              disabled={!draft || saving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-blue-600 hover:shadow-lg hover:scale-105 disabled:cursor-not-allowed disabled:bg-blue-500/50 disabled:hover:scale-100 transition-all duration-200"
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
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 hover:shadow-md hover:scale-105 transition-all duration-200"
            >
              <PlusIcon className="h-4 w-4" /> New form
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl gap-6 px-6 py-8">
        <div className="space-y-6">
          {/* Forms Grid Section */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">Forms</span>
              <span className="text-xs text-gray-500">{forms.length}</span>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search"
              className="mb-4 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {filteredForms.map((form) => (
                <button
                  key={form.id}
                  onClick={() => setSelectedFormId(form.id)}
                  className={`relative rounded-lg px-3 py-2 text-left text-xs transition-all duration-200 ${
                    selectedFormId === form.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md border border-gray-200'
                  }`}
                >
                  <div className="font-medium truncate" title={form.title}>{form.title}</div>
                  <div className="text-[10px] text-gray-500 truncate">{form.category || 'general'}</div>
                  {!form.isActive && (
                    <span className="absolute top-1 right-1 rounded bg-red-100 px-1.5 py-0.5 text-[8px] text-red-700">Archived</span>
                  )}
                </button>
              ))}
              <button
                onClick={() => setSelectedFormId('new')}
                className={`rounded-lg px-3 py-2 text-left text-xs transition-all duration-200 ${
                  selectedFormId === 'new'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white text-gray-900 hover:bg-gray-50 hover:shadow-md border border-dashed border-gray-300'
                }`}
              >
                <div className="font-medium">+ Create new</div>
              </button>
            </div>
            {formsError && <p className="mt-4 text-xs text-red-300">{formsError}</p>}
          </div>

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
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                activeTab === 'questions' ? 'bg-blue-500 text-white shadow-md hover:bg-blue-600 hover:shadow-lg' : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 hover:shadow-md'
              }`}
            >
              <DocumentTextIcon className="h-4 w-4" /> Questions
            </button>
            <button
              onClick={() => setActiveTab('responses')}
              disabled={!draft?.id}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                activeTab === 'responses' ? 'bg-blue-500 text-white shadow-md hover:bg-blue-600 hover:shadow-lg' : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 hover:shadow-md'
              } ${!draft?.id ? 'opacity-40' : ''}`}
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" /> Responses
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                activeTab === 'settings' ? 'bg-blue-500 text-white shadow-md hover:bg-blue-600 hover:shadow-lg' : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 hover:shadow-md'
              }`}
            >
              <Cog6ToothIcon className="h-4 w-4" /> Settings
            </button>
          </div>

          {!draft && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 p-12 text-center text-sm text-gray-700">
              Select a form to begin editing or create a new one.
            </div>
          )}

          {draft && activeTab === 'questions' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-900">Form title</label>
                    <input
                      type="text"
                      value={draft.title}
                      onChange={(event) => updateDraft((current) => ({ ...current, title: event.target.value }))}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-900">Description</label>
                    <textarea
                      value={draft.description}
                      onChange={(event) => updateDraft((current) => ({ ...current, description: event.target.value }))}
                      rows={3}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {draft.sections.map((section, sectionIndex) => (
                <div key={section.id} className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={section.title}
                        onChange={(event) => updateSection(section.id, { title: event.target.value })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
                        placeholder="Section title"
                      />
                      <textarea
                        value={section.description}
                        onChange={(event) => updateSection(section.id, { description: event.target.value })}
                        rows={2}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
                        placeholder="Description (optional)"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        onClick={() => moveSection(section.id, -1)}
                        disabled={sectionIndex === 0}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 hover:bg-gray-50 hover:shadow-md disabled:opacity-40 disabled:hover:shadow-none transition-all duration-200"
                      >
                        Move up
                      </button>
                      <button
                        onClick={() => moveSection(section.id, 1)}
                        disabled={sectionIndex === draft.sections.length - 1}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 hover:bg-gray-50 hover:shadow-md disabled:opacity-40 disabled:hover:shadow-none transition-all duration-200"
                      >
                        Move down
                      </button>
                      <button
                        onClick={() => removeSection(section.id)}
                        disabled={draft.sections.length === 1}
                        className="rounded-lg border border-red-200 bg-white px-3 py-2 text-red-700 hover:bg-red-50 hover:shadow-md disabled:opacity-40 disabled:hover:shadow-none transition-all duration-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {section.questions.map((question, questionIndex) => (
                      <div key={question.id} className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="flex-1 space-y-3">
                            <input
                              type="text"
                              value={question.title}
                              onChange={(event) => updateQuestion(section.id, question.id, { title: event.target.value })}
                              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
                              placeholder="Question"
                            />
                            <textarea
                              value={question.description}
                              onChange={(event) => updateQuestion(section.id, question.id, { description: event.target.value })}
                              rows={2}
                              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
                              placeholder="Description (optional)"
                            />
                            <div className="grid gap-3 md:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">Type</label>
                                <select
                                  value={question.type}
                                  onChange={(event) => {
                                    const newType = event.target.value as QuestionType;
                                    const updates: Partial<FormQuestion> = { type: newType };
                                    
                                    if (MULTIPLE_CHOICE.includes(newType)) {
                                      updates.options = question.options.length ? question.options : [''];
                                    } else {
                                      updates.options = [];
                                    }
                                    
                                    if (newType === 'MATRIX') {
                                      updates.matrixRows = question.matrixRows?.length ? question.matrixRows : ['Row 1', 'Row 2', 'Row 3'];
                                      updates.matrixColumns = question.matrixColumns?.length ? question.matrixColumns : ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];
                                    } else {
                                      updates.matrixRows = undefined;
                                      updates.matrixColumns = undefined;
                                    }
                                    
                                    updateQuestion(section.id, question.id, updates);
                                  }}
                                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                                >
                                  {QUESTION_TYPES.map((type) => (
                                    <option key={type.value} value={type.value} className="text-slate-900">
                                      {type.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <label className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={question.required}
                                  onChange={(event) => updateQuestion(section.id, question.id, { required: event.target.checked })}
                                  className="h-4 w-4 rounded border-gray-300 bg-white hover:bg-gray-100 text-blue-500 focus:ring-0"
                                />
                                Required
                              </label>
                            </div>
                            {MULTIPLE_CHOICE.includes(question.type) && (
                              <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600">Options</label>
                                <div className="space-y-2">
                                  {question.options.map((option, optIndex) => (
                                    <div key={optIndex} className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={option}
                                        onChange={(event) => {
                                          const newOptions = [...question.options];
                                          newOptions[optIndex] = event.target.value;
                                          updateQuestion(section.id, question.id, { options: newOptions });
                                        }}
                                        className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none shadow-sm"
                                        placeholder={`Option ${optIndex + 1}`}
                                      />
                                      <button
                                        onClick={() => {
                                          const newOptions = question.options.filter((_, i) => i !== optIndex);
                                          updateQuestion(section.id, question.id, { options: newOptions.length ? newOptions : [''] });
                                        }}
                                        className="rounded-lg border border-red-200 bg-white px-3 py-2 text-red-700 hover:bg-red-50 hover:shadow-md transition-all duration-200"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    onClick={() => {
                                      const newOptions = [...question.options, ''];
                                      updateQuestion(section.id, question.id, { options: newOptions });
                                    }}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                                  >
                                    <PlusIcon className="h-4 w-4" /> Add option
                                  </button>
                                </div>
                              </div>
                            )}
                            {question.type === 'MATRIX' && (
                              <div className="space-y-4">
                                <div>
                                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600">Rows (Questions)</label>
                                  <div className="space-y-2">
                                    {(question.matrixRows || ['']).map((row, rowIndex) => (
                                      <div key={rowIndex} className="flex items-center gap-2">
                                        <input
                                          type="text"
                                          value={row}
                                          onChange={(event) => {
                                            const newRows = [...(question.matrixRows || [''])];
                                            newRows[rowIndex] = event.target.value;
                                            updateQuestion(section.id, question.id, { matrixRows: newRows });
                                          }}
                                          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none shadow-sm"
                                          placeholder={`Row ${rowIndex + 1}`}
                                        />
                                        <button
                                          onClick={() => {
                                            const newRows = (question.matrixRows || ['']).filter((_, i) => i !== rowIndex);
                                            updateQuestion(section.id, question.id, { matrixRows: newRows.length ? newRows : [''] });
                                          }}
                                          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-red-700 hover:bg-red-50 hover:shadow-md transition-all duration-200"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ))}
                                    <button
                                      onClick={() => {
                                        const newRows = [...(question.matrixRows || ['']), ''];
                                        updateQuestion(section.id, question.id, { matrixRows: newRows });
                                      }}
                                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                                    >
                                      <PlusIcon className="h-4 w-4" /> Add row
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600">Columns (Rating Scale)</label>
                                  <div className="space-y-2">
                                    {(question.matrixColumns || ['']).map((col, colIndex) => (
                                      <div key={colIndex} className="flex items-center gap-2">
                                        <input
                                          type="text"
                                          value={col}
                                          onChange={(event) => {
                                            const newCols = [...(question.matrixColumns || [''])];
                                            newCols[colIndex] = event.target.value;
                                            updateQuestion(section.id, question.id, { matrixColumns: newCols });
                                          }}
                                          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none shadow-sm"
                                          placeholder={`Column ${colIndex + 1} (e.g., "Strongly Disagree")`}
                                        />
                                        <button
                                          onClick={() => {
                                            const newCols = (question.matrixColumns || ['']).filter((_, i) => i !== colIndex);
                                            updateQuestion(section.id, question.id, { matrixColumns: newCols.length ? newCols : [''] });
                                          }}
                                          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-red-700 hover:bg-red-50 hover:shadow-md transition-all duration-200"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ))}
                                    <button
                                      onClick={() => {
                                        const newCols = [...(question.matrixColumns || ['']), ''];
                                        updateQuestion(section.id, question.id, { matrixColumns: newCols });
                                      }}
                                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                                    >
                                      <PlusIcon className="h-4 w-4" /> Add column
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 text-xs">
                            <button
                              onClick={() => moveQuestion(section.id, question.id, -1)}
                              disabled={questionIndex === 0}
                              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 hover:bg-gray-50 hover:shadow-md disabled:opacity-40 disabled:hover:shadow-none transition-all duration-200"
                            >
                              Move up
                            </button>
                            <button
                              onClick={() => moveQuestion(section.id, question.id, 1)}
                              disabled={questionIndex === section.questions.length - 1}
                              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 hover:bg-gray-50 hover:shadow-md disabled:opacity-40 disabled:hover:shadow-none transition-all duration-200"
                            >
                              Move down
                            </button>
                            <button
                              onClick={() => removeQuestion(section.id, question.id)}
                              disabled={section.questions.length === 1}
                              className="rounded-lg border border-red-200 bg-white px-3 py-2 text-red-700 hover:bg-red-50 hover:shadow-md disabled:opacity-40 disabled:hover:shadow-none transition-all duration-200"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => addQuestion(section.id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                    >
                      <PlusIcon className="h-4 w-4" /> Add question
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={addSection}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 hover:bg-blue-50 hover:border-blue-400 hover:shadow-md transition-all duration-200"
              >
                <PlusIcon className="h-4 w-4" /> Add section
              </button>
            </div>
          )}

          {draft && activeTab === 'responses' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-600">Total responses</p>
                    <p className="mt-2 text-2xl font-semibold">{responsesSummary.total}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-600">Unique emails</p>
                    <p className="mt-2 text-2xl font-semibold">{responsesSummary.unique}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-600">Last submission</p>
                    <p className="mt-2 text-sm text-gray-900">
                      {responsesSummary.last ? new Date(responsesSummary.last).toLocaleString() : '—'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => exportResponses('summary')}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" /> Export summary
                  </button>
                  <button
                    onClick={() => exportResponses('detailed')}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" /> Export detailed
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">Question insights</h3>
                {responsesSummary.questions.length === 0 ? (
                  <p className="text-sm text-gray-600">Responses will appear here once submissions arrive.</p>
                ) : (
                  <div className="space-y-4">
                    {responsesSummary.questions.map((question) => (
                      <div key={question.id} className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{question.title}</p>
                          <span className="text-xs text-gray-500">{question.answers} answers</span>
                        </div>
                        {question.distribution.length > 0 ? (
                          <ul className="mt-3 space-y-1 text-sm text-gray-700">
                            {question.distribution.slice(0, 4).map((entry) => (
                              <li key={entry.label} className="flex justify-between">
                                <span>{entry.label}</span>
                                <span className="text-gray-500">{entry.count}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <ul className="mt-3 space-y-1 text-sm text-gray-700">
                            {question.samples.map((sample, index) => (
                              <li key={index} className="truncate text-gray-900">{sample || '—'}</li>
                            ))}
                            {question.samples.length === 0 && <li className="text-gray-500">No responses yet.</li>}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">Individual responses</h3>
                {responsesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <ArrowPathIcon className="h-4 w-4 animate-spin" /> Loading responses…
                  </div>
                ) : responsesError ? (
                  <p className="text-sm text-red-300">{responsesError}</p>
                ) : responses.length === 0 ? (
                  <p className="text-sm text-gray-600">No submissions yet.</p>
                ) : (
                  <div className="space-y-3">
                    {responses.map((response) => (
                      <div key={response.id} className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{response.applicantName || 'Unnamed'}</p>
                            <p className="text-xs text-gray-500">{response.applicantEmail}</p>
                          </div>
                          <div className="text-xs text-gray-600">
                            Submitted {new Date(response.submittedAt).toLocaleString()}
                          </div>
                        </div>
                        <details className="mt-4 text-sm text-gray-900">
                          <summary className="cursor-pointer text-gray-700">View answers</summary>
                          <div className="mt-3 space-y-2 text-xs text-gray-700">
                            {response.responses.map((answer) => {
                              const questionType = (answer.question?.type || 'TEXT') as QuestionType;
                              const value = extractResponseValue(answer, questionType);
                              
                              // Handle Matrix type specially
                              if (questionType === 'MATRIX' && Array.isArray(value)) {
                                // Get matrix rows from the question
                                const matrixRows = answer.question?.matrixRows?.filter((row: string) => row && row.trim()) || [];
                                
                                return (
                                  <div key={`${response.id}-${answer.questionId}`} className="rounded border border-gray-200 bg-white p-3">
                                    <p className="font-medium text-gray-900 mb-2">{answer.question?.title || 'Question'}</p>
                                    <div className="space-y-1">
                                      {value.map((columnSelection: string, index: number) => (
                                        <div key={index} className="flex items-start gap-2 py-1 px-2 bg-gray-50 rounded border-l-2 border-blue-500">
                                          <span className="font-semibold text-gray-900">
                                            {matrixRows[index] || `Row ${index + 1}`}:
                                          </span>
                                          <span className="text-gray-700">{columnSelection || '—'}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }
                              
                              // Regular question display
                              return (
                                <div key={`${response.id}-${answer.questionId}`} className="rounded border border-gray-200 bg-white hover:bg-gray-100 p-3">
                                  <p className="font-medium text-gray-900">{answer.question?.title || 'Question'}</p>
                                  <p className="mt-1 text-gray-600">
                                    {formatValue(value)}
                                  </p>
                                </div>
                              );
                            })}
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
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">Form settings</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex items-center gap-2 text-sm text-gray-900">
                    <input
                      type="checkbox"
                      checked={draft.isActive}
                      onChange={(event) => updateDraft((current) => ({ ...current, isActive: event.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 bg-white hover:bg-gray-100 text-blue-500 focus:ring-0"
                    />
                    Form is active
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-900">
                    <input
                      type="checkbox"
                      checked={draft.requireAuth}
                      onChange={(event) => updateDraft((current) => ({ ...current, requireAuth: event.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 bg-white hover:bg-gray-100 text-blue-500 focus:ring-0"
                    />
                    Require UMich login
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-900">
                    <input
                      type="checkbox"
                      checked={draft.allowMultiple}
                      onChange={(event) => updateDraft((current) => ({ ...current, allowMultiple: event.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 bg-white hover:bg-gray-100 text-blue-500 focus:ring-0"
                    />
                    Allow multiple submissions
                  </label>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">Category</label>
                    <input
                      type="text"
                      value={draft.category}
                      onChange={(event) => updateDraft((current) => ({ ...current, category: event.target.value }))}
                      className="w-full rounded-lg border border-gray-200 bg-white hover:bg-gray-100 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Notifications</h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Notification emails
                    </label>
                    <p className="mb-2 text-xs text-gray-500">Select users to notify when form is submitted</p>
                    
                    {/* Search input */}
                    <input
                      type="text"
                      placeholder="Search admins by name or email..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full mb-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                    />
                    
                    <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg border border-gray-200 bg-white p-3">
                      {availableUsers.length === 0 ? (
                        <p className="text-xs text-gray-500">Loading admin users... If this persists, check console for errors.</p>
                      ) : (
                        availableUsers
                          .filter((user) => {
                            if (!userSearchTerm.trim()) return true;
                            const search = userSearchTerm.toLowerCase();
                            return (
                              user.email.toLowerCase().includes(search) ||
                              (user.name?.toLowerCase() || '').includes(search)
                            );
                          })
                          .map((user) => {
                            const isSelected = draft.notificationConfig.email?.notificationEmails?.includes(user.email) ?? false;
                            return (
                              <label
                                key={user.email}
                                className="flex items-center gap-2 rounded border border-gray-200 bg-white hover:bg-gray-50 px-3 py-2 text-sm text-gray-900 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const emails = draft.notificationConfig.email?.notificationEmails || [];
                                    const newEmails = e.target.checked
                                      ? [...emails, user.email]
                                      : emails.filter((email) => email !== user.email);
                                    updateDraft((current) => ({
                                      ...current,
                                      notificationConfig: {
                                        ...current.notificationConfig,
                                        email: {
                                          ...current.notificationConfig.email,
                                          notificationEmails: newEmails,
                                        },
                                      },
                                    }));
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 bg-white hover:bg-gray-100 text-blue-500 focus:ring-0"
                                />
                                <div className="flex-1">
                                  <div className="font-medium">{user.name || 'Unnamed User'}</div>
                                  <div className="text-xs text-gray-500">{user.email}</div>
                                </div>
                              </label>
                            );
                          })
                      )}
                    </div>
                    {draft.notificationConfig.email?.notificationEmails && draft.notificationConfig.email.notificationEmails.length > 0 && (
                      <p className="mt-2 text-xs text-gray-600">
                        {draft.notificationConfig.email.notificationEmails.length} email(s) selected
                      </p>
                    )}
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex items-center gap-2 text-sm text-gray-900">
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
                        className="h-4 w-4 rounded border-gray-300 bg-white hover:bg-gray-100 text-blue-500 focus:ring-0"
                      />
                      Email on submission
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-900">
                      <input
                        type="checkbox"
                        checked={draft.notificationConfig.email?.sendReceiptToSubmitter ?? false}
                        onChange={(event) => {
                          console.log('📧 Checkbox clicked! New value:', event.target.checked);
                          updateDraft((current) => {
                            const updated = {
                              ...current,
                              notificationConfig: {
                                ...current.notificationConfig,
                                email: {
                                  ...current.notificationConfig.email,
                                  sendReceiptToSubmitter: event.target.checked,
                                },
                              },
                            };
                            console.log('📧 Updated draft sendReceiptToSubmitter:', updated.notificationConfig.email?.sendReceiptToSubmitter);
                            return updated;
                          });
                        }}
                        className="h-4 w-4 rounded border-gray-300 bg-white hover:bg-gray-100 text-blue-500 focus:ring-0"
                      />
                      Send receipt to submitter
                    </label>
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">Override Slack webhook (optional)</label>
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
                      className="w-full rounded-lg border border-gray-200 bg-white hover:bg-gray-100 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">Leave blank to use the global webhook.</p>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">Slack recipients</h4>
                  {slackTargets.error ? (
                    <p className="text-xs text-red-600">{slackTargets.error}</p>
                  ) : slackTargets.needsToken ? (
                    <p className="text-xs text-gray-600">Set SLACK_BOT_TOKEN to list Slack channels and users.</p>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-600">Channels</p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {slackTargets.channels.map((channel) => {
                            const selected = draft.notificationConfig.slack?.targets?.some((target) => target.id === channel.id);
                            return (
                              <label key={channel.id} className="flex items-center gap-2 rounded border border-gray-200 bg-white hover:bg-gray-100 px-3 py-2 text-xs text-gray-900">
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() => toggleSlackTarget(channel)}
                                  className="h-4 w-4 rounded border-gray-300 bg-white hover:bg-gray-100 text-blue-500 focus:ring-0"
                                />
                                #{channel.name || channel.id}
                              </label>
                            );
                          })}
                          {!slackTargets.channels.length && (
                            <p className="text-xs text-gray-500">No channels returned.</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600">Users</p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {slackTargets.users.map((user) => {
                            const selected = draft.notificationConfig.slack?.targets?.some((target) => target.id === user.id);
                            return (
                              <label key={user.id} className="flex items-center gap-2 rounded border border-gray-200 bg-white hover:bg-gray-100 px-3 py-2 text-xs text-gray-900">
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() => toggleSlackTarget(user)}
                                  className="h-4 w-4 rounded border-gray-300 bg-white hover:bg-gray-100 text-blue-500 focus:ring-0"
                                />
                                {user.name || user.id}
                              </label>
                            );
                          })}
                          {!slackTargets.users.length && (
                            <p className="text-xs text-gray-500">No users returned.</p>
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
        </div>
      </main>

      {/* Floating Action Buttons */}
      {draft && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!draft || saving}
            className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-6 py-3 text-sm font-medium text-white shadow-2xl hover:bg-blue-600 hover:shadow-3xl hover:scale-110 disabled:cursor-not-allowed disabled:bg-blue-500/50 disabled:hover:scale-100 transition-all duration-200"
          >
            {saving ? (
              <>
                <ArrowPathIcon className="h-5 w-5 animate-spin" /> Saving…
              </>
            ) : autoSaving ? (
              <>
                <ArrowPathIcon className="h-5 w-5 animate-spin" /> Auto-saving…
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-5 w-5" /> Save
              </>
            )}
          </button>
          
          {/* Copy Link & Open Buttons (only for existing forms) */}
          {draft.id && (
            <div className="flex gap-2">
              <button
                onClick={copyFormLink}
                className="inline-flex items-center justify-center rounded-full bg-gray-700 p-3 text-white shadow-xl hover:bg-gray-600 hover:shadow-2xl hover:scale-110 transition-all duration-200"
                title="Copy form link"
              >
                {showCopiedMessage ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                ) : (
                  <ClipboardDocumentIcon className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={openFormInNewTab}
                className="inline-flex items-center justify-center rounded-full bg-gray-700 p-3 text-white shadow-xl hover:bg-gray-600 hover:shadow-2xl hover:scale-110 transition-all duration-200"
                title="Open form in new tab"
              >
                <ArrowTopRightOnSquareIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
