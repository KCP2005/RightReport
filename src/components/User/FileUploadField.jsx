import { useState } from 'react';
import { fileAPI } from '../../utils/api';

const FileUploadField = ({ field, value, onChange, onUploadStart, onUploadEnd }) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [uploadedFile, setUploadedFile] = useState(value || null);
    const [error, setError] = useState('');

    const allowedTypesFromSettings = field.allowedFileTypes || ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSizeMB = field.maxFileSize || 5;

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!allowedTypesFromSettings.includes(file.type)) {
            setError(`Invalid file type. Allowed: ${allowedTypesFromSettings.map(t => t.split('/')[1].toUpperCase()).join(', ')}`);
            return;
        }

        // Validate file size
        if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`File size exceeds ${maxSizeMB}MB limit.`);
            return;
        }

        setError('');
        setUploading(true);
        if (onUploadStart) onUploadStart();

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fileAPI.uploadFile(formData);
            const fileData = response.data.file;

            setUploadedFile(fileData);
            onChange(field.fieldId, fileData);

            console.log('File uploaded successfully:', fileData);
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.response?.data?.message || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
            if (onUploadEnd) onUploadEnd();
        }
    };

    const handleRemove = async () => {
        if (uploadedFile && uploadedFile.fileId) {
            try {
                // Determine resource type if not explicitly set (fallback for older uploads)
                let resourceType = uploadedFile.resourceType;
                if (!resourceType && uploadedFile.fileType) {
                    resourceType = uploadedFile.fileType.startsWith('image/') ? 'image' : 'raw';
                }

                await fileAPI.deleteFile(uploadedFile.fileId, resourceType);
                setUploadedFile(null);
                onChange(field.fieldId, null);
            } catch (err) {
                console.error('Delete error:', err);
                // Even if delete fails (e.g. already deleted), clear local state
                setUploadedFile(null);
                onChange(field.fieldId, null);
            }
        } else {
            setUploadedFile(null);
            onChange(field.fieldId, null);
        }
    };

    return (
        <div className="file-upload-field">
            {!uploadedFile ? (
                <div className="upload-area p-4 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                        type="file"
                        id={`file-${field.fieldId}`}
                        accept={allowedTypesFromSettings.join(',')}
                        onChange={handleFileSelect}
                        disabled={uploading}
                        className="hidden"
                    />
                    <label htmlFor={`file-${field.fieldId}`} className={`cursor-pointer flex flex-col items-center justify-center gap-2 ${uploading ? 'opacity-50 cursor-wait' : ''}`}>
                        {uploading ? (
                            <>
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-blue-600 font-medium animate-pulse">Uploading file...</span>
                            </>
                        ) : (
                            <>
                                <span className="text-2xl">📎</span>
                                <span className="text-gray-700 font-medium">Click to Upload File</span>
                            </>
                        )}
                        <span className="text-xs text-gray-500">
                            Allowed: {allowedTypesFromSettings.map(t => t.split('/')[1].toUpperCase()).join(', ')} • Max: {maxSizeMB}MB
                        </span>
                    </label>

                    {error && <p className="text-sm text-red-500 mt-2 text-center">{error}</p>}
                </div>
            ) : (
                <div className="uploaded-file-info bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            {uploadedFile.thumbnailUrl ? (
                                <img
                                    src={uploadedFile.thumbnailUrl}
                                    alt="Preview"
                                    className="w-16 h-16 object-cover rounded-md border border-gray-300"
                                />
                            ) : (
                                <span className="text-2xl">
                                    {uploadedFile.fileType?.includes('pdf') ? '📄' : '🖼️'}
                                </span>
                            )}
                            <div>
                                <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]" title={uploadedFile.fileName}>
                                    {uploadedFile.fileName}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {(uploadedFile.compressedSize / 1024).toFixed(1)} KB
                                    {uploadedFile.compressionRatio > 0 && (
                                        <span className="ml-2 text-green-600 font-medium">
                                            ({uploadedFile.compressionRatio}% compressed)
                                        </span>
                                    )}
                                </p>
                                <a
                                    href={uploadedFile.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                                >
                                    View File ↗
                                </a>
                            </div>
                        </div>
                        <button
                            onClick={handleRemove}
                            type="button"
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                            title="Remove file"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUploadField;
