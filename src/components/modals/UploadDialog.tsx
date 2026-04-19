'use client';

import { useState, useRef } from 'react';
import { Loader2, Upload, FileSpreadsheet, CheckCircle2, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AVAILABLE_YEARS } from '@/lib/constants';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('year', selectedYear.toString());

      const response = await fetch('/api/super-admin/colleges/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upload-history'] });
      queryClient.invalidateQueries({ queryKey: ['college-years'] });
      queryClient.invalidateQueries({ queryKey: ['colleges', selectedYear] });
      // Reset state and close dialog after successful upload
      setTimeout(() => {
        setSelectedFile(null);
        onOpenChange(false);
      }, 2000);
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Please upload an Excel file (.xlsx or .xls)');
      return;
    }
    setSelectedFile(file);
  };

  const handleStartUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleClose = () => {
    if (!uploadMutation.isPending) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Upload College Data</DialogTitle>
            <DialogDescription className="sr-only">
              Upload an Excel file containing hospital and college data.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Year Selection */}
          <div className="space-y-2">
            <Label htmlFor="year">Select Year</Label>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_YEARS.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Upload Area */}
          <div
            className={`
              border-2 border-dashed rounded-xl p-12 text-center transition-colors
              ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}
              ${uploadMutation.isPending ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleChange}
              className="hidden"
            />

            {uploadMutation.isPending ? (
              <div className="space-y-4">
                <Loader2 className="h-12 w-12 text-indigo-600 mx-auto animate-spin" />
                <p className="text-lg font-medium text-slate-900">Uploading...</p>
                <p className="text-sm text-slate-500">Please wait while we process your file</p>
              </div>
            ) : uploadMutation.isSuccess ? (
              <div className="space-y-4">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
                <p className="text-lg font-medium text-green-900">Upload Successful!</p>
                <p className="text-sm text-green-700">Processing data in background...</p>
              </div>
            ) : selectedFile ? (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-medium text-slate-900">{selectedFile.name}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready to upload
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                  >
                    Change file
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto">
                  <Upload className="h-8 w-8 text-indigo-600" />
                </div>
                <div>
                  <p className="text-lg font-medium text-slate-900">
                    Drop your Excel file here
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    or click to browse files (.xlsx, .xls)
                  </p>
                </div>
              </div>
            )}
          </div>

          {uploadMutation.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {uploadMutation.error.message}
            </div>
          )}

          {/* Expected Format */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <h4 className="font-medium text-slate-900 mb-2">Expected Excel Format</h4>
            <p className="text-sm text-slate-600 mb-3">
              Your Excel file should contain the following columns:
            </p>
            <div className="flex flex-wrap gap-2">
              {['College Name', 'Category', 'Course Name', 'Rank', 'Fee'].map((col) => (
                <Badge key={col} variant="secondary" className="text-xs">
                  {col}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-3">
              <strong>Optional columns:</strong> Location, Type
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploadMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={selectedFile ? handleStartUpload : () => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending || (!selectedFile && uploadMutation.isSuccess)}
              className={selectedFile ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""}
            >
              {uploadMutation.isPending ? "Uploading..." : selectedFile ? "Confirm & Upload" : "Select File"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
