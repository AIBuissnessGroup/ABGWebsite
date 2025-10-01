'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { 
  ChartBarIcon, 
  DocumentChartBarIcon, 
  FunnelIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  UserGroupIcon,
  QuestionMarkCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface FormAnalytics {
  formId: string;
  formTitle: string;
  formSlug: string;
  totalResponses: number;
  completionRate: number;
  averageCompletionTime: number;
  responsesByDate: { [date: string]: number };
  responsesByStatus: { [status: string]: number };
  questionAnalytics: QuestionAnalytics[];
  demographics: { [field: string]: { [value: string]: number } };
}

interface QuestionAnalytics {
  questionId: string;
  questionTitle: string;
  questionType: string;
  responseCount: number;
  uniqueResponses: number;
  responseDistribution: { [value: string]: number };
  averageLength?: number;
  mostCommonResponse?: string;
  skipRate: number;
}

export default function FormAnalyticsPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState<any[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>('all');
  const [analytics, setAnalytics] = useState<FormAnalytics[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0] // today
  });

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
      return;
    }
  }, [session, status]);

  // Load forms
  useEffect(() => {
    loadForms();
  }, []);

  // Load analytics when form or date range changes
  useEffect(() => {
    if (forms.length > 0) {
      loadAnalytics();
    }
  }, [selectedFormId, dateRange, forms]);

  const loadForms = async () => {
    try {
      const res = await fetch('/api/admin/forms');
      if (res.ok) {
        const data = await res.json();
        setForms(data);
      }
    } catch (error) {
      console.error('Error loading forms:', error);
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(selectedFormId !== 'all' && { formId: selectedFormId }),
        startDate: dateRange.start,
        endDate: dateRange.end
      });

      const res = await fetch(`/api/admin/analytics/forms?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
    setLoading(false);
  };

  const exportAnalytics = async () => {
    try {
      const params = new URLSearchParams({
        ...(selectedFormId !== 'all' && { formId: selectedFormId }),
        startDate: dateRange.start,
        endDate: dateRange.end
      });

      const res = await fetch(`/api/admin/analytics/forms/export?${params}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `form-analytics-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
    }
  };

  const renderChart = (data: { [key: string]: number }, title: string, type: 'bar' | 'pie' = 'bar') => {
    // Handle null/undefined data and filter out invalid entries
    const validData = data && typeof data === 'object' ? data : {};
    const entries = Object.entries(validData)
      .filter(([key, value]) => {
        // Filter out null/undefined keys and ensure value is a valid number
        return key !== null && key !== undefined && key !== 'null' && key !== 'undefined' && 
               typeof value === 'number' && !isNaN(value) && value >= 0;
      })
      .sort(([,a], [,b]) => b - a);

    const maxValue = entries.length > 0 ? Math.max(...entries.map(([,value]) => value)) : 0;
    const totalValue = entries.reduce((sum, [,v]) => sum + v, 0);

    return (
      <div className="bg-white p-6 rounded-lg border">
        <h4 className="text-lg font-semibold mb-4">{title}</h4>
        {entries.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No data available</p>
        ) : (
          <div className="space-y-3">
            {entries.map(([key, value]) => {
              const percentage = totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : '0.0';
              const barWidth = maxValue > 0 ? (value / maxValue) * 100 : 0;
              
              return (
                <div key={key || 'unknown'} className="flex items-center">
                  <div className="w-32 text-sm text-gray-600 truncate" title={key || 'Unknown'}>
                    {key || 'Unknown'}
                  </div>
                  <div className="flex-1 mx-3">
                    <div className="bg-gray-200 rounded-full h-4 relative">
                      <div 
                        className="bg-blue-600 h-4 rounded-full flex items-center justify-end pr-2 min-w-0"
                        style={{ width: `${Math.max(barWidth, 0)}%` }}
                      >
                        <span className="text-xs text-white font-medium">
                          {value}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-16 text-sm text-gray-900 text-right font-medium">
                    {percentage}%
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderTimelineChart = (data: { [date: string]: number }) => {
    // Handle null/undefined data and filter out invalid entries
    const validData = data && typeof data === 'object' ? data : {};
    const entries = Object.entries(validData)
      .filter(([date, count]) => {
        // Filter out invalid dates and ensure count is a valid number
        return date && date !== 'null' && date !== 'undefined' && 
               typeof count === 'number' && !isNaN(count) && count >= 0;
      })
      .sort(([a], [b]) => a.localeCompare(b));

    const maxValue = entries.length > 0 ? Math.max(...entries.map(([,value]) => value)) : 0;

    return (
      <div className="bg-white p-6 rounded-lg border">
        <h4 className="text-lg font-semibold mb-4">Response Timeline</h4>
        {entries.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No data available</p>
        ) : (
          <div className="space-y-2">
            {entries.map(([date, count]) => {
              const barWidth = maxValue > 0 ? (count / maxValue) * 100 : 0;
              
              return (
                <div key={date} className="flex items-center">
                  <div className="w-24 text-sm text-gray-600">
                    {new Date(date).toLocaleDateString()}
                  </div>
                  <div className="flex-1 mx-3">
                    <div className="bg-gray-200 rounded-full h-3 relative">
                      <div 
                        className="bg-green-600 h-3 rounded-full"
                        style={{ width: `${Math.max(barWidth, 0)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-12 text-sm text-gray-900 text-right">
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const totalResponses = analytics.reduce((sum, form) => sum + form.totalResponses, 0);
  const averageCompletionRate = analytics.length > 0 
    ? analytics.reduce((sum, form) => sum + form.completionRate, 0) / analytics.length 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Form Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive analysis of form responses and engagement</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg border p-6 mb-8">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Form
              </label>
              <select
                value={selectedFormId}
                onChange={(e) => setSelectedFormId(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm bg-white min-w-48"
              >
                <option value="all">All Forms</option>
                {forms.map((form) => (
                  <option key={form.id} value={form.id}>
                    {form.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <button
              onClick={exportAnalytics}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export Analytics
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Responses</p>
                <p className="text-2xl font-bold text-gray-900">{totalResponses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <DocumentChartBarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Forms</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{averageCompletionRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Date Range</p>
                <p className="text-sm font-bold text-gray-900">
                  {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Analytics */}
        {analytics.map((formAnalytics) => (
          <div key={formAnalytics.formId} className="mb-12">
            <div className="bg-white rounded-lg border overflow-hidden">
              {/* Form Header */}
              <div className="bg-gray-50 px-6 py-4 border-b">
                <h2 className="text-xl font-bold text-gray-900">{formAnalytics.formTitle}</h2>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                  <span><strong>{formAnalytics.totalResponses}</strong> responses</span>
                  <span><strong>{formAnalytics.completionRate.toFixed(1)}%</strong> completion rate</span>
                  {formAnalytics.averageCompletionTime > 0 && (
                    <span><strong>{Math.round(formAnalytics.averageCompletionTime / 60)}</strong> min avg completion</span>
                  )}
                </div>
              </div>

              <div className="p-6">
                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {renderTimelineChart(formAnalytics.responsesByDate)}
                  {renderChart(formAnalytics.responsesByStatus, 'Response Status Distribution')}
                </div>

                {/* Question Analysis */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Question Analysis</h3>
                  {formAnalytics.questionAnalytics && formAnalytics.questionAnalytics.length > 0 ? (
                    formAnalytics.questionAnalytics.map((question) => (
                    <div key={question.questionId} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{question.questionTitle}</h4>
                          <div className="flex gap-4 mt-1 text-sm text-gray-600">
                            <span>Type: {question.questionType}</span>
                            <span>{question.responseCount} responses</span>
                            <span>{question.skipRate.toFixed(1)}% skip rate</span>
                            {question.averageLength && (
                              <span>Avg length: {question.averageLength.toFixed(1)} chars</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Response Distribution */}
                      {Object.keys(question.responseDistribution || {}).length > 0 ? (
                        <div className="mt-4">
                          {question.questionType === 'TEXT' || question.questionType === 'TEXTAREA' ? (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-700">Most Common Response:</p>
                              <p className="text-sm text-gray-600 bg-white p-2 rounded border">
                                {question.mostCommonResponse || 'No responses yet'}
                              </p>
                            </div>
                          ) : (
                            renderChart(question.responseDistribution, 'Response Distribution')
                          )}
                        </div>
                      ) : (
                        <div className="mt-4 bg-white p-4 rounded border text-center">
                          <p className="text-sm text-gray-500">No response data available for this question</p>
                        </div>
                      )}
                    </div>
                    ))
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <p className="text-gray-600">No questions found in this form.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {analytics.length === 0 && (
          <div className="bg-white rounded-lg border p-12 text-center">
            <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
            <p className="text-gray-600">
              No form responses found for the selected criteria. Try adjusting your filters or date range.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}