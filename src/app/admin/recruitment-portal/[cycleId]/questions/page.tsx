'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  PlusIcon, 
  TrashIcon,
  Bars3Icon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useAdminApi } from '@/hooks/useAdminApi';
import { useCycle } from '../layout';
import { AdminLoadingState } from '@/components/admin/ui';
import type { ApplicationQuestions, QuestionField, QuestionFieldType, ApplicationTrack } from '@/types/recruitment';

const FIELD_TYPES: { value: QuestionFieldType; label: string }[] = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'select', label: 'Dropdown' },
  { value: 'multiselect', label: 'Multi-Select' },
  { value: 'file', label: 'File Upload' },
  { value: 'url', label: 'URL' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'checkbox', label: 'Checkbox' },
];

const FILE_KINDS = [
  { value: 'resume', label: 'Resume' },
  { value: 'headshot', label: 'Headshot' },
  { value: 'other', label: 'Other' },
];

// Common file type presets
const FILE_TYPE_PRESETS = {
  documents: [
    { ext: '.pdf', label: 'PDF' },
    { ext: '.doc', label: 'DOC' },
    { ext: '.docx', label: 'DOCX' },
    { ext: '.txt', label: 'TXT' },
  ],
  images: [
    { ext: '.jpg', label: 'JPG' },
    { ext: '.jpeg', label: 'JPEG' },
    { ext: '.png', label: 'PNG' },
    { ext: '.gif', label: 'GIF' },
    { ext: '.webp', label: 'WebP' },
    { ext: '.heic', label: 'HEIC' },
  ],
  spreadsheets: [
    { ext: '.xlsx', label: 'XLSX' },
    { ext: '.xls', label: 'XLS' },
    { ext: '.csv', label: 'CSV' },
  ],
};

// Helper to parse accept string into array
function parseAcceptTypes(accept: string): string[] {
  return accept.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

// Helper to toggle a file type in the accept string
function toggleFileType(currentAccept: string, ext: string): string {
  const types = parseAcceptTypes(currentAccept);
  const index = types.indexOf(ext.toLowerCase());
  if (index >= 0) {
    types.splice(index, 1);
  } else {
    types.push(ext.toLowerCase());
  }
  return types.join(',');
}

import { TRACK_QUESTION_OPTIONS } from '@/lib/tracks';

const TRACKS = TRACK_QUESTION_OPTIONS;

function generateKey(label: string, existingKeys: string[] = []): string {
  const baseKey = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 32) || 'field';
  
  // If key doesn't exist, use it
  if (!existingKeys.includes(baseKey)) {
    return baseKey;
  }
  
  // Otherwise, add a numeric suffix
  let counter = 2;
  while (existingKeys.includes(`${baseKey}_${counter}`)) {
    counter++;
  }
  return `${baseKey}_${counter}`;
}

export default function CycleQuestionsPage() {
  const params = useParams();
  const cycleId = params.cycleId as string;
  const { cycle } = useCycle();
  const { get, post } = useAdminApi();
  
  const [selectedTrack, setSelectedTrack] = useState<ApplicationTrack>('business');
  const [questions, setQuestions] = useState<QuestionField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedField, setExpandedField] = useState<number | null>(null);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await get<ApplicationQuestions[]>(`/api/admin/recruitment/questions?cycleId=${cycleId}`);
      const trackQuestions = data.find(q => q.track === selectedTrack);
      setQuestions(trackQuestions?.fields || []);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cycleId) {
      loadQuestions();
    }
  }, [cycleId, selectedTrack]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await post('/api/admin/recruitment/questions', {
        cycleId,
        track: selectedTrack,
        fields: questions,
      }, {
        successMessage: 'Questions saved successfully',
      });
    } catch (error) {
      console.error('Error saving questions:', error);
    } finally {
      setSaving(false);
    }
  };

  const addField = () => {
    const newField: QuestionField = {
      key: `field_${Date.now()}`,
      label: '',
      type: 'text',
      required: false,
      order: questions.length,
    };
    setQuestions([...questions, newField]);
    setExpandedField(questions.length);
  };

  const updateField = (index: number, updates: Partial<QuestionField>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };
    
    // Auto-generate key from label if label changes and key was auto-generated
    if (updates.label && updated[index].key.startsWith('field_')) {
      const otherKeys = updated.filter((_, i) => i !== index).map(f => f.key);
      updated[index].key = generateKey(updates.label, otherKeys);
    }
    
    setQuestions(updated);
  };

  const removeField = (index: number) => {
    if (!confirm('Are you sure you want to remove this field?')) return;
    const updated = questions.filter((_, i) => i !== index);
    // Reorder
    updated.forEach((f, i) => f.order = i);
    setQuestions(updated);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;
    
    const updated = [...questions];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    
    // Update order
    updated.forEach((f, i) => f.order = i);
    setQuestions(updated);
  };

  if (loading) {
    return <AdminLoadingState message="Loading questions..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Application Questions</h2>
          <p className="text-sm text-gray-500 mt-1">
            Build the application form for each track
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value as ApplicationTrack)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {TRACKS.map((track) => (
              <option key={track.value} value={track.value}>{track.label}</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Questions'}
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {questions.map((field, index) => (
          <div
            key={`question-${index}`}
            className="bg-white rounded-xl border overflow-hidden"
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => setExpandedField(expandedField === index ? null : index)}
            >
              <Bars3Icon className="w-5 h-5 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {field.label || '(Untitled Field)'}
                </p>
                <p className="text-sm text-gray-500">
                  {FIELD_TYPES.find(t => t.value === field.type)?.label}
                  {field.required && ' • Required'}
                  {field.type === 'file' && field.accept && (
                    <span className="text-gray-400"> • Accepts: {field.accept}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); moveField(index, 'up'); }}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronUpIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); moveField(index, 'down'); }}
                  disabled={index === questions.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronDownIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); removeField(index); }}
                  className="p-1 text-red-400 hover:text-red-600"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedField === index && (
              <div className="border-t p-4 space-y-4 bg-gray-50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                      placeholder="Question label"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Field Key</label>
                    <input
                      type="text"
                      value={field.key}
                      onChange={(e) => updateField(index, { key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                      placeholder="field_key"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={field.type}
                      onChange={(e) => updateField(index, { type: e.target.value as QuestionFieldType })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {FIELD_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`required-${index}`}
                        checked={field.required}
                        onChange={(e) => updateField(index, { required: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <label htmlFor={`required-${index}`} className="text-sm text-gray-700">Required</label>
                    </div>
                  </div>
                </div>

                {/* Type-specific options */}
                {(field.type === 'text' || field.type === 'textarea') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Word Limit</label>
                      <input
                        type="number"
                        value={field.wordLimit || ''}
                        onChange={(e) => updateField(index, { wordLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                        placeholder="No limit"
                        min="1"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
                      <input
                        type="text"
                        value={field.placeholder || ''}
                        onChange={(e) => updateField(index, { placeholder: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {(field.type === 'select' || field.type === 'multiselect') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Options (one per line)</label>
                    <textarea
                      value={(field.options || []).join('\n')}
                      onChange={(e) => updateField(index, { options: e.target.value.split('\n').filter(Boolean) })}
                      rows={4}
                      placeholder="Option 1&#10;Option 2&#10;Option 3"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    />
                  </div>
                )}

                {field.type === 'file' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">File Kind</label>
                        <select
                          value={field.fileKind || 'other'}
                          onChange={(e) => updateField(index, { fileKind: e.target.value as any })}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {FILE_KINDS.map((kind) => (
                            <option key={kind.value} value={kind.value}>{kind.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max File Size (MB)</label>
                        <input
                          type="number"
                          value={field.maxFileSizeMB || ''}
                          onChange={(e) => updateField(index, { maxFileSizeMB: e.target.value ? parseInt(e.target.value) : undefined })}
                          placeholder="10"
                          min="1"
                          max="50"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Accepted File Types</label>
                      
                      {/* Documents */}
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1.5">Documents</p>
                        <div className="flex flex-wrap gap-2">
                          {FILE_TYPE_PRESETS.documents.map((type) => {
                            const isSelected = parseAcceptTypes(field.accept || '').includes(type.ext.toLowerCase());
                            return (
                              <button
                                key={type.ext}
                                type="button"
                                onClick={() => updateField(index, { accept: toggleFileType(field.accept || '', type.ext) })}
                                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                                  isSelected
                                    ? 'bg-blue-100 border-blue-500 text-blue-700'
                                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                                }`}
                              >
                                {type.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Images */}
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1.5">Images</p>
                        <div className="flex flex-wrap gap-2">
                          {FILE_TYPE_PRESETS.images.map((type) => {
                            const isSelected = parseAcceptTypes(field.accept || '').includes(type.ext.toLowerCase());
                            return (
                              <button
                                key={type.ext}
                                type="button"
                                onClick={() => updateField(index, { accept: toggleFileType(field.accept || '', type.ext) })}
                                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                                  isSelected
                                    ? 'bg-green-100 border-green-500 text-green-700'
                                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                                }`}
                              >
                                {type.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Spreadsheets */}
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1.5">Spreadsheets</p>
                        <div className="flex flex-wrap gap-2">
                          {FILE_TYPE_PRESETS.spreadsheets.map((type) => {
                            const isSelected = parseAcceptTypes(field.accept || '').includes(type.ext.toLowerCase());
                            return (
                              <button
                                key={type.ext}
                                type="button"
                                onClick={() => updateField(index, { accept: toggleFileType(field.accept || '', type.ext) })}
                                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                                  isSelected
                                    ? 'bg-purple-100 border-purple-500 text-purple-700'
                                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                                }`}
                              >
                                {type.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Selected types display */}
                      {field.accept && (
                        <div className="mt-2 p-2 bg-gray-100 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Currently accepting:</p>
                          <p className="text-sm font-mono text-gray-700">{field.accept}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Help Text</label>
                  <input
                    type="text"
                    value={field.helpText || ''}
                    onChange={(e) => updateField(index, { helpText: e.target.value })}
                    placeholder="Additional instructions for applicants"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add Field Button */}
        <button
          onClick={addField}
          className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Question
        </button>
      </div>

      {questions.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Questions'}
          </button>
        </div>
      )}
    </div>
  );
}
