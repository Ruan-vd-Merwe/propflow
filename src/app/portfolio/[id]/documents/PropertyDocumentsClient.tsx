"use client";

import { useState } from "react";
import { SecureDocumentUploader } from "@/components/documents/SecureDocumentUploader";
import { PropertyDocumentsList } from "@/components/documents/PropertyDocumentsList";

type Props = {
  propertyId: string;
  ownerId: string;
};

export function PropertyDocumentsClient({ propertyId, ownerId }: Props) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-8">
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Upload document</h2>
          <button
            onClick={() => setUploadOpen((v) => !v)}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            {uploadOpen ? "Hide" : "Add document"}
          </button>
        </div>

        {uploadOpen && (
          <SecureDocumentUploader
            ownerId={ownerId}
            propertyId={propertyId}
            onSuccess={() => {
              setUploadOpen(false);
              setRefreshKey((k) => k + 1);
            }}
          />
        )}
      </div>

      <div>
        <h2 className="mb-4 font-semibold text-slate-900">Uploaded documents</h2>
        <PropertyDocumentsList
          propertyId={propertyId}
          ownerId={ownerId}
          refreshKey={refreshKey}
        />
      </div>
    </div>
  );
}
