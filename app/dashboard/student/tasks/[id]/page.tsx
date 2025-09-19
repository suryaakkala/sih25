
"use client";
import { useRouter } from 'next/navigation';
import React from 'react';

export default function StudentTaskPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  // You can fetch the task details using the id from params.id
  // For now, just display the id
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Student Task Details</h1>
      <div className="bg-white rounded shadow p-4">
        <p className="text-gray-700">Task ID: <span className="font-mono">{params.id}</span></p>
        {/* TODO: Render task details here */}
      </div>
      <button
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={() => router.back()}
      >
        Back
      </button>
    </div>
  );
}
