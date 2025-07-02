import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface CSVUploaderProps {
  endpoint: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  templateFields: string[];
  title: string;
  description: string;
  requiredFields: string[];
  examples: { [key: string]: string };
  specialInstructions?: { [key: string]: string };
}

export default function CSVUploader({
  endpoint,
  onSuccess,
  onError,
  templateFields,
  title,
  description,
  requiredFields,
  examples,
  specialInstructions
}: CSVUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import data');
      }

      toast.success(`Successfully imported ${data.imported} records`);
      
      if (data.errors?.length > 0) {
        console.error('Import errors:', data.errors);
        toast.error(`${data.errors.length} records failed to import. Check console for details.`);
      }

      onSuccess?.(data);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
      onError?.(error);
    } finally {
      setIsUploading(false);
      event.target.value = ''; // Reset file input
    }
  };

  const downloadTemplate = () => {
    const csvContent = templateFields.join(',');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={downloadTemplate}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
        >
          Download Template
        </button>
        
        <div className="relative">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <button
            className={`px-4 py-2 text-sm text-white rounded transition-colors ${
              isUploading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload CSV'}
          </button>
        </div>

        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
        >
          {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
        </button>
      </div>

      {showInstructions && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Required Fields:</h4>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {requiredFields.map((field) => (
                <li key={field} className="mb-1">{field}</li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">All Available Fields:</h4>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {templateFields.map((field) => (
                <li key={field} className="mb-1">
                  {field}
                  {examples[field] && (
                    <span className="text-gray-500"> - Example: {examples[field]}</span>
                  )}
                  {specialInstructions?.[field] && (
                    <span className="text-blue-600 ml-1">({specialInstructions[field]})</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Example Row:</h4>
            <div className="bg-white p-3 rounded border border-gray-200 overflow-x-auto">
              <code className="text-sm text-gray-800">
                {templateFields.map(field => examples[field] || '').join(',')}
              </code>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Instructions:</h4>
            <ol className="list-decimal list-inside text-sm text-gray-600">
              <li className="mb-1">Download the template CSV file using the button above</li>
              <li className="mb-1">Fill in your data following the example format</li>
              <li className="mb-1">Make sure all required fields are filled</li>
              <li className="mb-1">Save your file as CSV</li>
              <li className="mb-1">Upload using the 'Upload CSV' button</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
} 