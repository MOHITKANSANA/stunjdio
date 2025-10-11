
"use client";

import React from 'react';
import { Award, CheckCircle, XCircle } from 'lucide-react';

interface CertificateProps {
  studentName: string;
  courseName: string;
  score: number;
  date: string;
  status?: 'pass' | 'fail' | string;
}

const Certificate: React.FC<CertificateProps> = ({ studentName, courseName, score, date, status }) => {
  const isPass = status === 'pass' || (status === undefined && score >= 40); // Default pass mark is 40% if status is not provided

  return (
    <div id="certificate" className="bg-white text-gray-800 p-6 rounded-lg shadow-2xl border-4 border-yellow-500 w-full max-w-xl mx-auto font-serif">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-yellow-600">{isPass ? 'Certificate of Achievement' : 'Participation Certificate'}</h1>
        
        <p className="text-sm">This is to certify that</p>
        
        <h2 className="text-xl font-semibold text-blue-800 tracking-wider break-words">{studentName}</h2>
        
        <p className="text-sm">has successfully participated in the</p>
        
        <h3 className="text-lg font-medium text-blue-700 break-words">{courseName}</h3>
        
        <p className="text-sm">with a score of</p>

        <p className="text-3xl font-bold text-green-700">{score.toFixed(0)}%</p>

        {status && (
             <div className={`flex items-center justify-center gap-2 text-lg font-bold ${isPass ? 'text-green-600' : 'text-red-600'}`}>
                {isPass ? <CheckCircle /> : <XCircle />}
                <span>Status: {status.charAt(0).toUpperCase() + status.slice(1)}</span>
            </div>
        )}
        
        <div className="flex justify-between items-center pt-4">
            <div>
                <p className="text-xs border-t-2 border-gray-400 px-2 pt-1">Date</p>
                <p className="font-semibold text-xs">{date}</p>
            </div>
            <Award className="h-12 w-12 text-yellow-500" />
            <div>
                <p className="text-xs border-t-2 border-gray-400 px-2 pt-1">Signature</p>
                <p className="font-cursive text-md">Learn with Munedra</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Certificate;
